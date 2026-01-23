import { Injectable } from '@angular/core';

/**
 * Preload service to warm caches for heavy resources in the background.
 * This ensures the compiler and WASM files are ready when the user clicks Run.
 */
@Injectable({
    providedIn: 'root'
})
export class PreloadService {
    private preloadStarted = false;

    /**
     * Start preloading compiler and WASM files in the background.
     * Uses requestIdleCallback to avoid blocking initial render.
     */
    preloadCompiler(): void {
        if (this.preloadStarted) return;
        this.preloadStarted = true;

        // Use requestIdleCallback if available, otherwise setTimeout
        const schedulePreload = (window as any).requestIdleCallback ||
            ((cb: () => void) => setTimeout(cb, 1000));

        schedulePreload(() => {
            console.log('[Preload] Starting background preload of compiler...');

            // Trigger dynamic import of wasm-clang module (this caches the JS chunk)
            import('@eduoj/wasm-clang')
                .then(() => console.log('[Preload] Compiler module cached'))
                .catch(err => console.warn('[Preload] Compiler preload failed:', err));

            // Prefetch WASM files (these are fetched by the worker but we can warm the cache)
            this.prefetchWasm();
        });
    }

    /**
     * Prefetch WASM files to warm the browser cache.
     * When the worker later fetches these, they'll be served from cache.
     */
    /**
     * Prefetch WASM files to warm the browser cache.
     * Uses Cache Storage API to persist files regardless of server headers.
     */
    private async prefetchWasm(): Promise<void> {
        const wasmFiles = [
            '/wasm/clang.wasm',
            '/wasm/lld.wasm',
            '/wasm/memfs.wasm',
            '/wasm/sysroot.tar'
        ];

        try {
            const cache = await caches.open('wasm-cache-v1');
            console.log('[Preload] Opened cache, checking files...');

            // Check what's missing
            const requests = wasmFiles.map(url => new Request(url));
            const promises = requests.map(async req => {
                const existing = await cache.match(req);
                if (!existing) {
                    console.log(`[Preload] Caching ${req.url}`);
                    await cache.add(req);
                } else {
                    console.log(`[Preload] Already cached: ${req.url}`);
                }
            });

            await Promise.all(promises);
            console.log('[Preload] All WASM files verified in cache');
        } catch (e) {
            console.warn('[Preload] Cache storage failed:', e);
            // Fallback to basic fetch if cache API fails (e.g. non-secure context)
            wasmFiles.forEach(file => fetch(file).catch(() => { }));
        }
    }
}
