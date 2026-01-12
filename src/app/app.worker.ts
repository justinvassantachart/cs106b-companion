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

// Override allow injecting imports (monkey-patch)
// @ts-ignore
WebAssembly.instantiate = (moduleObject: WebAssembly.Module | BufferSource, importObject?: WebAssembly.Imports) => {
  // Inject debug_wait
  if (importObject && importObject['env']) {
    // @ts-ignore
    importObject['env']._debug_wait = (line: number) => {
      if (!sharedBuffer) return;

      // Check if we are in RUN mode (2)
      if (Atomics.load(sharedBuffer, 0) === 2) {
        // Optional: Rate limit updates to avoid UI flooding
        // postMessage({ type: 'debug-line', line }); 
        return;
      }

      // Otherwise, we pause.
      // 1. Reset state to PAUSED (0) - effectively consuming the previous 'step' token
      Atomics.store(sharedBuffer, 0, 0);

      // 2. Notify main thread we are paused
      postMessage({ type: 'debug-paused', line });

      // 3. Wait until state becomes != 0
      Atomics.wait(sharedBuffer, 0, 0);
    };
  }
  return originalInstantiate(moduleObject, importObject);
};

addEventListener('message', async ({ data }) => {
  if (data.command === 'configure-debug') {
    sharedBuffer = new Int32Array(data.buffer);
  } else if (data.command === 'compile') {
    try {
      await bootstrap();

      postMessage({ type: 'log', text: '[Worker] Compiling...\n' });

      const source = `#include "stanford.h"\n\n${data.code}`;
      await api.compileLinkRun(source, { clangFlags: [] });

      postMessage({ type: 'finished' });
    } catch (e: any) {
      postMessage({ type: 'log', text: `\n[Worker Error] ${e.message || e}\n` });
      postMessage({ type: 'finished' }); // Unblock UI
    }
  }
});
