import createWasmDemangleModule from './demangle.wasm'

const wasmDemangleModulePromise = createWasmDemangleModule().then((module) => module)

const cache = new Map<string, string>()

export async function loadDemangling(): Promise<(name: string) => string> {
  // This function converts a mangled C++ name such as "__ZNK7Support6ColorFeqERKS0_"
  // into a human-readable symbol (in this case "Support::ColorF::==(Support::ColorF&)")
  const wasmDemangleModule = await wasmDemangleModulePromise
  return cached(wasmDemangleModule.wasm_demangle)
}

function cached(demangle: (name: string) => string): (name: string) => string {
  return (name: string): string => {
    let result = cache.get(name)
    if (result !== undefined) {
      name = result
    } else {
      result = demangle(name)
      result = result === '' ? name : result
      cache.set(name, result)
      name = result
    }
    return name
  }
}
