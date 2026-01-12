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

addEventListener('message', async ({ data }) => {
  if (data.command === 'compile') {
    try {
      await bootstrap();

      postMessage({ type: 'log', text: '[Worker] Compiling...\n' });

      const source = `#include "stanford.h"\n\n${data.code}`;
      await api.compileLinkRun(source, {});

      postMessage({ type: 'finished' });
    } catch (e: any) {
      postMessage({ type: 'log', text: `\n[Worker Error] ${e.message || e}\n` });
      postMessage({ type: 'finished' }); // Unblock UI
    }
  }
});
