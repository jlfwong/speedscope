import {CallTreeNode, Frame, Profile, ProfileGroup} from '../lib/profile'
import {FileFormat} from '../lib/file-format-spec'
import {ByteFormatter, RawValueFormatter, TimeFormatter, ValueFormatter} from '../lib/value-formatters'

interface WasmImportedFrame {
  name: string
  file?: string
  line?: number
  col?: number
  selfWeight: number
  totalWeight: number
}

interface WasmImportedNode {
  frameIndices: ArrayLike<number>
  parentIndices: ArrayLike<number>
  selfWeights: ArrayLike<number>
  totalWeights: ArrayLike<number>
}

interface WasmImportedProfile {
  name: string
  unit: FileFormat.ValueUnit
  totalWeight: number
  frames: WasmImportedFrame[]
  appendNodes: WasmImportedNode
  groupedNodes: WasmImportedNode
  samples: ArrayLike<number>
  weights: ArrayLike<number>
}

interface WasmImportedProfileGroup {
  name: string
  indexToView: number
  profiles: WasmImportedProfile[]
}

type RustImportFunction = (buffer: Uint8Array) => WasmImportedProfileGroup | null
type RustParsedImportFunction = (parsed: unknown) => WasmImportedProfileGroup | null
type RustFlattenedImportFunction = (flattened: unknown) => WasmImportedProfileGroup | null
type RustImporterModule = Record<string, unknown>

let rustImportModulePromise: Promise<RustImporterModule> | null = null
let rustImportFunctionPromise: Promise<RustImportFunction> | null = null
let rustParsedImportFunctionPromise: Promise<RustParsedImportFunction | null> | null = null
let rustFlattenedImportFunctionPromise: Promise<RustFlattenedImportFunction | null> | null = null
let rustImportWarmupPromise: Promise<void> | null = null

const RUST_IMPORTER_WARMUP_PROFILE = JSON.stringify({
  $schema: 'https://www.speedscope.app/file-format-schema.json',
  shared: {
    frames: [{name: 'main'}, {name: 'parseProfile'}, {name: 'renderFlamegraph'}],
  },
  profiles: [
    {
      type: 'sampled',
      name: 'warmup',
      unit: 'none',
      startValue: 0,
      endValue: 4,
      samples: [
        [0, 1],
        [0, 1, 2],
        [0, 1, 2],
        [0, 1],
      ],
      weights: [1, 1, 1, 1],
    },
  ],
  activeProfileIndex: 0,
  name: 'warmup',
})

declare const __SPEEDSCOPE_BROWSER_BUILD__: boolean | undefined

function isNodeRuntime() {
  return typeof process !== 'undefined' && process.versions != null && process.versions.node != null
}

function isBrowserBuild() {
  return typeof __SPEEDSCOPE_BROWSER_BUILD__ === 'boolean' ? __SPEEDSCOPE_BROWSER_BUILD__ : false
}

async function loadBrowserRustImporterModule() {
  const [module, wasmModule] = await Promise.all([
    import('./rust-importer/pkg-web/speedscope_importer.js'),
    import('./rust-importer/pkg-web/speedscope_importer_bg.wasm'),
  ])
  if (typeof (module as any).default === 'function') {
    const wasmUrl = (wasmModule as any).default || wasmModule
    await (module as any).default(wasmUrl)
  }
  return module
}

async function loadNodeRustImporterModule() {
  const modulePath = './rust-importer/pkg-node/' + 'speedscope_importer.js'
  return import(modulePath)
}

async function loadRustImporterModule(): Promise<RustImporterModule> {
  if (rustImportModulePromise == null) {
    rustImportModulePromise = (async () => {
      const module = isBrowserBuild()
        ? await loadBrowserRustImporterModule()
        : isNodeRuntime()
        ? await loadNodeRustImporterModule()
        : await loadBrowserRustImporterModule()
      return module as RustImporterModule
    })()
  }

  return rustImportModulePromise
}

async function loadRustImportFunction(): Promise<RustImportFunction> {
  if (rustImportFunctionPromise == null) {
    rustImportFunctionPromise = (async () => {
      const module = await loadRustImporterModule()
      const importFunction =
        (module as any).import_speedscope_sampled_profile_group ||
        (module as any).default?.import_speedscope_sampled_profile_group ||
        (module as any)['module.exports']?.import_speedscope_sampled_profile_group

      if (typeof importFunction !== 'function') {
        throw new Error('Rust importer module did not expose import_speedscope_sampled_profile_group')
      }

      return importFunction as RustImportFunction
    })()
  }

  return rustImportFunctionPromise
}

async function loadRustParsedImportFunction(): Promise<RustParsedImportFunction | null> {
  if (rustParsedImportFunctionPromise == null) {
    rustParsedImportFunctionPromise = (async () => {
      const module = await loadRustImporterModule()
      const importFunction =
        (module as any).import_speedscope_sampled_profile_group_from_parsed ||
        (module as any).default?.import_speedscope_sampled_profile_group_from_parsed ||
        (module as any)['module.exports']?.import_speedscope_sampled_profile_group_from_parsed

      if (importFunction == null) {
        return null
      }
      if (typeof importFunction !== 'function') {
        throw new Error(
          'Rust importer module exposed a non-function import_speedscope_sampled_profile_group_from_parsed',
        )
      }

      return importFunction as RustParsedImportFunction
    })()
  }

  return rustParsedImportFunctionPromise
}

export async function prewarmRustImporter(): Promise<void> {
  if (rustImportWarmupPromise == null) {
    rustImportWarmupPromise = (async () => {
      const flattenedImportFunction = isBrowserBuild()
        ? await loadRustFlattenedImportFunction()
        : null
      const parsedImportFunction =
        flattenedImportFunction == null && isBrowserBuild()
          ? await loadRustParsedImportFunction()
          : null
      const imported =
        flattenedImportFunction != null
          ? flattenedImportFunction(flattenParsedSampledSpeedscopeFile(JSON.parse(RUST_IMPORTER_WARMUP_PROFILE)))
          : parsedImportFunction != null
          ? parsedImportFunction(JSON.parse(RUST_IMPORTER_WARMUP_PROFILE))
          : await (async () => {
              const importFunction = await loadRustImportFunction()
              const warmupBuffer = new TextEncoder().encode(RUST_IMPORTER_WARMUP_PROFILE)
              return importFunction(warmupBuffer)
            })()
      if (imported == null) {
        throw new Error('Rust importer warmup returned null')
      }
    })().catch(error => {
      rustImportWarmupPromise = null
      throw error
    })
  }

  return rustImportWarmupPromise
}

async function loadRustFlattenedImportFunction(): Promise<RustFlattenedImportFunction | null> {
  if (rustFlattenedImportFunctionPromise == null) {
    rustFlattenedImportFunctionPromise = (async () => {
      const module = await loadRustImporterModule()
      const importFunction =
        (module as any).import_speedscope_sampled_profile_group_from_flattened ||
        (module as any).default?.import_speedscope_sampled_profile_group_from_flattened ||
        (module as any)['module.exports']?.import_speedscope_sampled_profile_group_from_flattened

      if (importFunction == null) {
        return null
      }
      if (typeof importFunction !== 'function') {
        throw new Error(
          'Rust importer module exposed a non-function import_speedscope_sampled_profile_group_from_flattened',
        )
      }

      return importFunction as RustFlattenedImportFunction
    })()
  }

  return rustFlattenedImportFunctionPromise
}

function flattenParsedSampledProfileForRust(profile: any) {
  if (profile == null || profile.type !== 'sampled') {
    return profile
  }
  if (!Array.isArray(profile.samples) || !Array.isArray(profile.weights)) {
    return profile
  }

  const sampleCount = profile.samples.length
  const sampleOffsets = new Uint32Array(sampleCount + 1)
  let totalFrames = 0
  for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex++) {
    const sample = profile.samples[sampleIndex]
    if (!Array.isArray(sample)) {
      return profile
    }
    sampleOffsets[sampleIndex] = totalFrames
    totalFrames += sample.length
  }
  sampleOffsets[sampleCount] = totalFrames

  const sampleFrames = new Uint32Array(totalFrames)
  let offset = 0
  for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex++) {
    const sample = profile.samples[sampleIndex] as ArrayLike<number>
    sampleFrames.set(sample, offset)
    offset += sample.length
  }

  return {
    type: 'sampled',
    name: profile.name,
    unit: profile.unit,
    startValue: profile.startValue,
    endValue: profile.endValue,
    sampleOffsets,
    sampleFrames,
    weights: Float64Array.from(profile.weights as ArrayLike<number>),
  }
}

function flattenParsedSampledSpeedscopeFile(parsed: any) {
  if (parsed == null || typeof parsed !== 'object' || !Array.isArray(parsed.profiles)) {
    return parsed
  }

  return {
    $schema: parsed.$schema,
    shared: parsed.shared,
    activeProfileIndex: parsed.activeProfileIndex,
    name: parsed.name,
    profiles: parsed.profiles.map((profile: any) => flattenParsedSampledProfileForRust(profile)),
  }
}

function createValueFormatter(unit: FileFormat.ValueUnit): ValueFormatter {
  switch (unit) {
    case 'nanoseconds':
    case 'microseconds':
    case 'milliseconds':
    case 'seconds':
      return new TimeFormatter(unit)
    case 'bytes':
      return new ByteFormatter()
    case 'none':
    default:
      return new RawValueFormatter()
  }
}

class RustImportedProfileAdapter extends Profile {
  private readonly frameData: WasmImportedFrame[]
  private readonly appendNodeData: WasmImportedNode
  private readonly groupedNodeData: WasmImportedNode
  private readonly rawSamples: ArrayLike<number>
  private readonly rawWeights: ArrayLike<number>
  private materializedFrames: Frame[] | null = null
  private appendMaterialized = false
  private groupedMaterialized = false
  private appendNodeWrappers: Array<CallTreeNode | undefined> | null = null

  constructor(data: WasmImportedProfile) {
    super(data.totalWeight)
    this.name = data.name
    this.valueFormatter = createValueFormatter(data.unit)
    this.frameData = data.frames
    this.appendNodeData = data.appendNodes
    this.groupedNodeData = data.groupedNodes
    this.rawSamples = data.samples
    this.rawWeights = data.weights
  }

  private materializeTree(
    root: CallTreeNode,
    nodes: WasmImportedNode,
    frames: Frame[],
  ): CallTreeNode[] {
    const frameIndices = nodes.frameIndices
    const parentIndices = nodes.parentIndices
    const selfWeights = nodes.selfWeights
    const totalWeights = nodes.totalWeights
    const materialized = new Array<CallTreeNode>(frameIndices.length)

    for (let nodeIndex = 0; nodeIndex < frameIndices.length; nodeIndex++) {
      const frame = frames[frameIndices[nodeIndex]]
      if (frame == null) {
        throw new Error(`Rust importer referenced missing frame ${frameIndices[nodeIndex]}`)
      }

      const parent =
        parentIndices[nodeIndex] < 0 ? root : materialized[parentIndices[nodeIndex]] || null
      if (parent == null) {
        throw new Error(`Rust importer referenced missing parent node ${parentIndices[nodeIndex]}`)
      }

      const node = new CallTreeNode(frame, parent)
      node.addToSelfWeight(selfWeights[nodeIndex])
      node.addToTotalWeight(totalWeights[nodeIndex])
      parent.children.push(node)
      materialized[nodeIndex] = node
    }
    return materialized
  }

  private ensureFramesMaterialized(): Frame[] {
    if (this.materializedFrames != null) {
      return this.materializedFrames
    }

    this.materializedFrames = this.frameData.map((frame, frameIndex) => {
      const materialized = Frame.getOrInsert(this.frames, {
        key: frameIndex,
        name: frame.name,
        file: frame.file,
        line: frame.line,
        col: frame.col,
      })
      materialized.addToSelfWeight(frame.selfWeight)
      materialized.addToTotalWeight(frame.totalWeight)
      return materialized
    })

    return this.materializedFrames
  }

  private ensureAppendMaterialized() {
    if (this.appendMaterialized) {
      return
    }

    const appendNodes = this.materializeTree(
      this.appendOrderCalltreeRoot,
      this.appendNodeData,
      this.ensureFramesMaterialized(),
    )
    const materializedSamples = new Array<CallTreeNode>(this.rawSamples.length)
    for (let sampleOffset = 0; sampleOffset < this.rawSamples.length; sampleOffset++) {
      const sampleIndex = this.rawSamples[sampleOffset]
      if (sampleIndex < 0) {
        materializedSamples[sampleOffset] = this.appendOrderCalltreeRoot
        continue
      }

      const node = appendNodes[sampleIndex]
      if (node == null) {
        throw new Error(`Rust importer referenced missing append node ${sampleIndex}`)
      }
      materializedSamples[sampleOffset] = node
    }
    this.samples = materializedSamples
    this.weights = this.rawWeights as unknown as number[]
    this.appendMaterialized = true
  }

  private getAppendNodeWrapper(nodeIndex: number, frames: Frame[]): CallTreeNode {
    if (this.appendNodeWrappers == null) {
      this.appendNodeWrappers = new Array(this.appendNodeData.frameIndices.length)
    }

    const cached = this.appendNodeWrappers[nodeIndex]
    if (cached != null) {
      return cached
    }

    const frameIndex = this.appendNodeData.frameIndices[nodeIndex]
    const frame = frames[frameIndex]
    if (frame == null) {
      throw new Error(`Rust importer referenced missing frame ${frameIndex}`)
    }

    const parentIndex = this.appendNodeData.parentIndices[nodeIndex]
    const parent =
      parentIndex < 0 ? this.appendOrderCalltreeRoot : this.getAppendNodeWrapper(parentIndex, frames)

    const node = new CallTreeNode(frame, parent)
    node.addToSelfWeight(this.appendNodeData.selfWeights[nodeIndex])
    node.addToTotalWeight(this.appendNodeData.totalWeights[nodeIndex])
    this.appendNodeWrappers[nodeIndex] = node
    return node
  }

  private forEachCallFromRawSamples(
    openFrame: (node: CallTreeNode, value: number) => void,
    closeFrame: (node: CallTreeNode, value: number) => void,
  ) {
    const frames = this.ensureFramesMaterialized()
    let prevStack: CallTreeNode[] = []
    let value = 0

    for (let sampleIndex = 0; sampleIndex < this.rawSamples.length; sampleIndex++) {
      const rawSampleIndex = this.rawSamples[sampleIndex]
      const stackTop =
        rawSampleIndex < 0
          ? this.appendOrderCalltreeRoot
          : this.getAppendNodeWrapper(rawSampleIndex, frames)

      let lca: CallTreeNode | null = null
      for (
        lca = stackTop;
        lca != null && lca.frame !== Frame.root && prevStack.indexOf(lca) === -1;
        lca = lca.parent
      ) {}

      while (prevStack.length > 0 && prevStack[prevStack.length - 1] !== lca) {
        const node = prevStack.pop()!
        closeFrame(node, value)
      }

      const toOpen: CallTreeNode[] = []
      for (
        let node: CallTreeNode | null = stackTop;
        node != null && node.frame !== Frame.root && node !== lca;
        node = node.parent
      ) {
        toOpen.push(node)
      }
      toOpen.reverse()

      for (const node of toOpen) {
        openFrame(node, value)
      }

      prevStack = prevStack.concat(toOpen)
      value += this.rawWeights[sampleIndex]
    }

    for (let i = prevStack.length - 1; i >= 0; i--) {
      closeFrame(prevStack[i], value)
    }
  }

  private ensureGroupedMaterialized() {
    if (this.groupedMaterialized) {
      return
    }

    this.materializeTree(this.groupedCalltreeRoot, this.groupedNodeData, this.ensureFramesMaterialized())
    this.sortGroupedCallTree()
    this.groupedMaterialized = true
  }

  public getAppendOrderCalltreeRoot() {
    this.ensureAppendMaterialized()
    return super.getAppendOrderCalltreeRoot()
  }

  public getGroupedCalltreeRoot() {
    this.ensureGroupedMaterialized()
    return super.getGroupedCalltreeRoot()
  }

  forEachCall(
    openFrame: (node: CallTreeNode, value: number) => void,
    closeFrame: (node: CallTreeNode, value: number) => void,
  ) {
    return this.forEachCallFromRawSamples(openFrame, closeFrame)
  }

  forEachCallGrouped(
    openFrame: (node: CallTreeNode, value: number) => void,
    closeFrame: (node: CallTreeNode, value: number) => void,
  ) {
    this.ensureGroupedMaterialized()
    return super.forEachCallGrouped(openFrame, closeFrame)
  }

  forEachFrame(fn: (frame: Frame) => void) {
    this.ensureFramesMaterialized()
    return super.forEachFrame(fn)
  }

  getTotalNonIdleWeight() {
    this.ensureGroupedMaterialized()
    return super.getTotalNonIdleWeight()
  }

  getProfileForCallersView(focalFrameInfo: Frame, flattenRecursion: boolean): Profile {
    this.ensureAppendMaterialized()
    return super.getProfileForCallersView(focalFrameInfo, flattenRecursion)
  }

  getProfileForCalleesView(focalFrameInfo: Frame, flattenRecursion: boolean): Profile {
    this.ensureAppendMaterialized()
    return super.getProfileForCalleesView(focalFrameInfo, flattenRecursion)
  }

  createFlamechartDataSource(options: {
    getColorBucketForFrame: (frame: Frame) => number
    order: 'append-order' | 'grouped'
    weight: 'total' | 'non-idle'
  }) {
    if (options.order === 'grouped' || options.weight === 'non-idle') {
      this.ensureGroupedMaterialized()
    }
    return super.createFlamechartDataSource(options)
  }
}

function materializeProfileGroup(data: WasmImportedProfileGroup): ProfileGroup {
  return {
    name: data.name,
    indexToView: data.indexToView,
    profiles: data.profiles.map(profile => new RustImportedProfileAdapter(profile)),
  }
}

function shouldTryRustSampledSpeedscope(fileName: string, buffer: ArrayBuffer): boolean {
  return buffer.byteLength > 0 && fileName.endsWith('.speedscope.json')
}

export async function importSampledSpeedscopeProfileGroupFromRust(
  fileName: string,
  buffer: ArrayBuffer,
): Promise<ProfileGroup | null> {
  if (!shouldTryRustSampledSpeedscope(fileName, buffer)) {
    return null
  }

  if (isBrowserBuild()) {
    let parsedInput: any
    const getParsedInput = () => {
      if (parsedInput === undefined) {
        parsedInput = JSON.parse(new TextDecoder().decode(new Uint8Array(buffer)))
      }
      return parsedInput
    }

    const flattenedImportFunction = await loadRustFlattenedImportFunction()
    if (flattenedImportFunction != null) {
      try {
        const imported = flattenedImportFunction(flattenParsedSampledSpeedscopeFile(getParsedInput()))
        if (imported == null) {
          return null
        }
        return materializeProfileGroup(imported)
      } catch (error) {
        console.warn('Rust flattened import path failed, falling back to parsed import path', error)
      }
    }

    const parsedImportFunction = await loadRustParsedImportFunction()
    if (parsedImportFunction != null) {
      try {
        const imported = parsedImportFunction(getParsedInput())
        if (imported == null) {
          return null
        }
        return materializeProfileGroup(imported)
      } catch (error) {
        console.warn('Rust parsed import path failed, falling back to byte import path', error)
      }
    }
  }

  const importFunction = await loadRustImportFunction()
  const imported = importFunction(new Uint8Array(buffer))
  if (imported == null) {
    return null
  }

  return materializeProfileGroup(imported)
}
