interface WasmDemangleModule {
    wasm_demangle(mangled: string): string
}

export default function ModuleFactory(options?: unknown): Promise<WasmDemangleModule>;
