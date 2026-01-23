declare module '@eduoj/wasm-clang' {
    export class API {
        constructor(options: any);
        ready: Promise<void>;
        memfs: {
            addFile(name: string, content: string | Uint8Array): void;
            getFileContents(name: string): Uint8Array;
        };
        compile(options: any): Promise<any>;
        run(module: WebAssembly.Module, ...args: any[]): Promise<any>;
        getModule(url: string): Promise<WebAssembly.Module>;
        cdnUrl: string;
        lldFilename: string;
    }
}
