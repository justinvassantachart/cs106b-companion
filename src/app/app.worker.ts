/// <reference lib="webworker" />

// @ts-ignore
import { API } from '@eduoj/wasm-clang';
import { STANFORD_SHIM } from './stanford-shim';

let api: any = null;

async function bootstrap() {
  if (api) return;

  console.log('[Worker] Initializing API...');
  postMessage({ type: 'log', text: '[Worker] Initializing Compiler...\n' });

  api = new API({
    hostWrite: (s: string) => {
      postMessage({ type: 'log', text: s });
    },
    cdnUrl: '/wasm/',
    memfs: 'memfs.wasm',
    clang: 'clang.wasm',
    lld: 'lld.wasm',
    compileStreaming: async (filename: string) => {
      postMessage({ type: 'log', text: `[Worker] Fetching ${filename}...\n` });
      const response = await fetch(filename);
      if (!response.ok) throw new Error(`Fetch failed: ${filename}`);
      return WebAssembly.compile(await response.arrayBuffer());
    },
    readBuffer: async (filename: string) => {
      postMessage({ type: 'log', text: `[Worker] Reading ${filename}...\n` });
      const response = await fetch(filename);
      if (!response.ok) throw new Error(`Fetch failed: ${filename}`);
      return response.arrayBuffer();
    }
  });

  postMessage({ type: 'log', text: '[Worker] Downloading resources...\n' });
  await api.ready;
  postMessage({ type: 'log', text: '[Worker] Ready.\n' });

  // Pre-load shim
  api.memfs.addFile('stanford.h', STANFORD_SHIM);
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
  }
  return originalInstantiate(moduleObject, importObject);
};

addEventListener('message', async ({ data }) => {
  if (data.command === 'configure-debug') {
    sharedBuffer = new Int32Array(data.buffer);
  } else if (data.command === 'update-breakpoints') {
    breakpoints = new Set(data.breakpoints);
  } else if (data.command === 'compile') {
    try {
      await bootstrap();

      postMessage({ type: 'log', text: '[Worker] Compiling...\n' });

      const input = `test.cc`;
      const obj = `test.o`;
      const wasm = `test.wasm`;
      const source = `#include "stanford.h"\n\n${data.code}`;

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
      await api.run(testMod, wasm);

      postMessage({ type: 'finished' });
    } catch (e: any) {
      postMessage({ type: 'log', text: `\n[Worker Error] ${e.message || e}\n` });
      postMessage({ type: 'finished' }); // Unblock UI
    }
  }
});

// Force rebuild timestamp: 3
