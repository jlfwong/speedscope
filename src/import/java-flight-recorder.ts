import {FrameInfo, Profile, ProfileGroup, StackListProfileBuilder} from '../lib/profile'
import init, {Frame, interpret_jfr} from 'jfrview'

let initPromise: Promise<void> | null = null

function isNodeCliRuntime() {
  return typeof process !== 'undefined' && process.versions?.node != null && typeof window === 'undefined'
}

async function runtimeImport<T>(specifier: string): Promise<T> {
  const importer = Function('specifier', 'return import(specifier)') as (
    specifier: string,
  ) => Promise<T>
  return importer(specifier)
}

async function resolveWasmModuleOrPath(): Promise<unknown> {
  if (isNodeCliRuntime()) {
    // Node's fetch implementation does not support the file:// URL that jfrview
    // falls back to by default, so load the bytes directly for local CLI runs.
    const fs = await runtimeImport<{readFile(path: string): Promise<Uint8Array>}>('node:fs/promises')
    const path = await runtimeImport<{join(...parts: string[]): string}>('node:path')
    return fs.readFile(path.join(process.cwd(), 'node_modules', 'jfrview', 'jfrview_bg.wasm'))
  }

  const wasmModule = (await import('jfrview/jfrview_bg.wasm')) as {default?: unknown}
  return wasmModule.default ?? wasmModule
}

async function ensureJfrRuntimeInitialized(): Promise<void> {
  if (initPromise == null) {
    initPromise = (async () => {
      const module_or_path = await resolveWasmModuleOrPath()
      await init({module_or_path})
    })().catch(error => {
      initPromise = null
      throw error
    })
  }
  await initPromise
}

export async function importFromJfr(fileName: string, data: ArrayBuffer): Promise<ProfileGroup> {
  await ensureJfrRuntimeInitialized()
  const withoutNative = create_profile(data, false)
  const withNative = create_profile(data, true)

  return {
    indexToView: 0,
    name: fileName,
    profiles: [withoutNative, withNative],
  }
}

export function isJfrRecording(buffer: ArrayBuffer) {
  const b = buffer.slice(0, 3)
  const bytes = new Uint8Array(b)
  return bytes[0] === 0x46 && bytes[1] === 0x4c && bytes[2] === 0x52
}

function create_profile(data: ArrayBuffer, includeNative: boolean): Profile {
  const result = interpret_jfr(new Uint8Array(data), includeNative)

  const builder = new StackListProfileBuilder(result.length)
  if (includeNative) {
    builder.setName('With native calls')
  } else {
    builder.setName('Without native calls')
  }

  function to_fi(input: Frame): FrameInfo {
    return {
      name: input.name,
      key: input.name,
    }
  }

  for (const sample of result) {
    builder.appendSampleWithWeight(sample.frames.map(to_fi), 1)
  }

  return builder.build()
}
