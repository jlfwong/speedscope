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
  frameIndex: number
  parentIndex: number
  selfWeight: number
  totalWeight: number
}

interface WasmImportedProfile {
  name: string
  unit: FileFormat.ValueUnit
  totalWeight: number
  frames: WasmImportedFrame[]
  appendNodes: WasmImportedNode[]
  groupedNodes: WasmImportedNode[]
  samples: number[]
  weights: number[]
}

interface WasmImportedProfileGroup {
  name: string
  indexToView: number
  profiles: WasmImportedProfile[]
}

type RustImportFunction = (buffer: Uint8Array) => WasmImportedProfileGroup | null

let rustImportFunctionPromise: Promise<RustImportFunction> | null = null

declare const __SPEEDSCOPE_BROWSER_BUILD__: boolean | undefined

function isNodeRuntime() {
  return typeof process !== 'undefined' && process.versions != null && process.versions.node != null
}

function isBrowserBuild() {
  return typeof __SPEEDSCOPE_BROWSER_BUILD__ === 'boolean' ? __SPEEDSCOPE_BROWSER_BUILD__ : false
}

async function loadBrowserRustImporterModule() {
  const module = await import('./rust-importer/pkg-web/speedscope_importer.js')
  if (typeof (module as any).default === 'function') {
    await (module as any).default()
  }
  return module
}

async function loadNodeRustImporterModule() {
  const modulePath = './rust-importer/pkg-node/' + 'speedscope_importer.js'
  return import(modulePath)
}

async function loadRustImportFunction(): Promise<RustImportFunction> {
  if (rustImportFunctionPromise == null) {
    rustImportFunctionPromise = (async () => {
      const module = isBrowserBuild()
        ? await loadBrowserRustImporterModule()
        : isNodeRuntime()
        ? await loadNodeRustImporterModule()
        : await loadBrowserRustImporterModule()

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
  private readonly appendNodeData: WasmImportedNode[]
  private readonly groupedNodeData: WasmImportedNode[]
  private readonly rawSamples: number[]
  private readonly rawWeights: number[]
  private materializedFrames: Frame[] | null = null
  private appendMaterialized = false
  private groupedMaterialized = false

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
    nodes: WasmImportedNode[],
    frames: Frame[],
  ): CallTreeNode[] {
    const materialized: CallTreeNode[] = []
    for (const nodeData of nodes) {
      const frame = frames[nodeData.frameIndex]
      if (frame == null) {
        throw new Error(`Rust importer referenced missing frame ${nodeData.frameIndex}`)
      }

      const parent =
        nodeData.parentIndex < 0 ? root : materialized[nodeData.parentIndex] || null
      if (parent == null) {
        throw new Error(`Rust importer referenced missing parent node ${nodeData.parentIndex}`)
      }

      const node = new CallTreeNode(frame, parent)
      node.addToSelfWeight(nodeData.selfWeight)
      node.addToTotalWeight(nodeData.totalWeight)
      parent.children.push(node)
      materialized.push(node)
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
    this.samples = this.rawSamples.map(sampleIndex => {
      if (sampleIndex < 0) {
        return this.appendOrderCalltreeRoot
      }

      const node = appendNodes[sampleIndex]
      if (node == null) {
        throw new Error(`Rust importer referenced missing append node ${sampleIndex}`)
      }
      return node
    })
    this.weights = this.rawWeights
    this.appendMaterialized = true
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
    this.ensureAppendMaterialized()
    return super.forEachCall(openFrame, closeFrame)
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
    } else {
      this.ensureAppendMaterialized()
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

  const importFunction = await loadRustImportFunction()
  const imported = importFunction(new Uint8Array(buffer))
  if (imported == null) {
    return null
  }

  return materializeProfileGroup(imported)
}
