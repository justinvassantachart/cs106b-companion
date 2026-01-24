/// <reference lib="webworker" />

// Stanford library headers to load at runtime (instead of bundled constant)
const STANFORD_HEADERS = [
  'debug_core.h', 'common.h', 'strlib.h', 'vector.h', 'grid.h',
  'set.h', 'map.h', 'stack.h', 'queue.h',
  'hashmap.h', 'hashset.h', 'priorityqueue.h',  // New collections
  'stanford.h'
];

const HEADER_CACHE_NAME = 'stanford-headers-v2';  // Bumped to re-fetch with new headers

async function loadHeaders(): Promise<{ name: string; content: string }[]> {
  const cache = await caches.open(HEADER_CACHE_NAME);

  const headers = await Promise.all(
    STANFORD_HEADERS.map(async (name) => {
      const url = `/stanford-lib/${name}`;

      // Try cache first
      const cached = await cache.match(url);
      if (cached) {
        console.log(`[Worker] Header cache hit: ${name}`);
        return { name, content: await cached.text() };
      }

      // Fetch and cache
      console.log(`[Worker] Fetching header: ${name}`);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to load Stanford header: ${name}`);

      // Clone response before caching (response can only be read once)
      await cache.put(url, response.clone());

      return { name, content: await response.text() };
    })
  );
  return headers;
}

// Lazy load wasm-clang to reduce initial bundle size
let API: any = null;
let api: any = null;

async function bootstrap() {
  if (api) return;

  // Dynamically import the large wasm-clang module (3.65MB)
  if (!API) {
    const module = await import('@eduoj/wasm-clang');
    API = module.API;
  }

  console.log('[Worker] Initializing API...');
  // postMessage({ type: 'log', text: '[Worker] Initializing Compiler...\n' });

  api = new API({
    hostWrite: (s: string) => {
      postMessage({ type: 'log', text: s });
    },
    cdnUrl: '/wasm/',
    memfs: 'memfs.wasm',
    clang: 'clang.wasm',
    lld: 'lld.wasm',
    compileStreaming: async (filename: string) => {
      // postMessage({ type: 'log', text: `[Worker] Fetching ${filename}...\n` });
      const response = await fetch(filename);
      if (!response.ok) throw new Error(`Fetch failed: ${filename}`);
      return WebAssembly.compile(await response.arrayBuffer());
    },
    readBuffer: async (filename: string) => {
      // Try Cache Storage first
      try {
        const cache = await caches.open('wasm-cache-v1');
        const cached = await cache.match(filename);
        if (cached) {
          console.log(`[Worker] Cache hit for ${filename}`);
          return cached.arrayBuffer();
        }
      } catch (e) {
        console.warn(`[Worker] Cache check failed for ${filename}:`, e);
      }

      // postMessage({ type: 'log', text: `[Worker] Reading ${filename}...\n` });
      const response = await fetch(filename);
      if (!response.ok) throw new Error(`Fetch failed: ${filename}`);
      return response.arrayBuffer();
    }
  });

  // postMessage({ type: 'log', text: '[Worker] Downloading resources...\n' });
  await api.ready;
  postMessage({ type: 'log', text: '[Worker] Ready.\n' });

  // Load modular Stanford headers from static assets
  const headers = await loadHeaders();
  for (const { name, content } of headers) {
    api.memfs.addFile(name, content);
  }
}

const originalInstantiate = WebAssembly.instantiate;
let sharedBuffer: Int32Array | null = null;
let breakpoints = new Set<number>();


// Override allow injecting imports (monkey-patch)
// @ts-ignore
WebAssembly.instantiate = (moduleObject: WebAssembly.Module | BufferSource, importObject?: WebAssembly.Imports) => {
  // Inject debug_wait
  if (importObject && importObject['env']) {
    // @ts-ignore
    importObject['env']._debug_wait = (line: number) => {
      if (!sharedBuffer) return;

      const state = Atomics.load(sharedBuffer, 0);
      const shouldPause = (state === 0) || (state === 1) || breakpoints.has(line);

      if (shouldPause) {
        // Enforce PAUSED state
        Atomics.store(sharedBuffer, 0, 0);
        postMessage({ type: 'debug-paused', line });
        Atomics.wait(sharedBuffer, 0, 0);
      }
    };

    // @ts-ignore
    importObject['env']._debug_update_line = (line: number) => {
      // Just notify the main thread that the line changed, but do NOT pause
      // This is useful for keeping call stack line numbers accurate during recursion
      postMessage({ type: 'debug-line-update', line });
    };
  }
  return originalInstantiate(moduleObject, importObject);
};

addEventListener('message', async ({ data }) => {
  if (data.command === 'configure-debug') {
    sharedBuffer = new Int32Array(data.buffer);
  } else if (data.command === 'update-breakpoints') {
    breakpoints = new Set(data.breakpoints);
  } else if (data.command === 'write-file') {
    if (!api) await bootstrap();
    console.log(`[Worker] Writing file: ${data.filename}`);
    api.memfs.addFile(data.filename, data.content);
    postMessage({ type: 'log', text: `[FS] Wrote ${data.filename}\n` });
  } else if (data.command === 'read-file') {
    if (!api) await bootstrap();
    try {
      const content = api.memfs.getFileContents(data.filename);
      const text = new TextDecoder().decode(content);
      postMessage({ type: 'file-content', filename: data.filename, content: text });
    } catch (e) {
      postMessage({ type: 'error', text: `File not found: ${data.filename}` });
    }
  } else if (data.command === 'compile') {
    try {
      await bootstrap();

      postMessage({ type: 'log', text: '[Worker] Compiling...\n' });

      const input = `test.cc`;
      const obj = `test.o`;
      const wasm = `test.wasm`;
      const source = `#include "debug_core.h"\n${data.code}`; // Always prepend debug macros

      // 1. Compile (Source -> Object)
      await api.compile({
        input,
        contents: source,
        obj,
        clangFlags: ['-std=c++17', '-Wno-deprecated-declarations']
      });

      // 2. Link (Object -> WASM)
      // We need to construct the linker command manually to add --allow-undefined
      const stackSize = 1024 * 1024;
      const libdir = 'lib/wasm32-wasi';
      const crt1 = `${libdir}/crt1.o`;
      const lld = await api.getModule(api.cdnUrl + api.lldFilename);

      await api.run(
        lld, 'wasm-ld',
        '--no-threads',
        '--export-dynamic',
        '--allow-undefined',
        '-z', `stack-size=${stackSize}`,
        `-L${libdir}`, crt1, obj,
        '-lc', '-lc++', '-lc++abi', '-lcanvas',
        '-o', wasm
      );

      // 3. Run (Load WASM and execute)
      const buffer = api.memfs.getFileContents(wasm);
      const testMod = await WebAssembly.compile(buffer);

      // Notify main thread that compilation is done
      postMessage({ type: 'compiled' });
      postMessage({ type: 'log', text: '\n[Worker] Compilation successful. Starting execution...\n' });

      await api.run(testMod, wasm);

      postMessage({ type: 'finished' });
    } catch (e: any) {
      postMessage({ type: 'log', text: `\n[Worker Error] ${e.message || e}\n` });
      postMessage({ type: 'finished' }); // Unblock UI
    }
  }
});

// Force rebuild timestamp: 3
