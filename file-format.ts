import {Profile, CallTreeNode, Frame, CallTreeProfileBuilder, FrameInfo} from './profile'
import {TimeFormatter, ByteFormatter, RawValueFormatter} from './value-formatters'
import {lastOf} from './utils'
import {
  SerializedSpeedscopeFile,
  SerializedSamplingProfile,
  SerializedFrame,
  SerializedNode,
} from './file-format-spec'

export interface InMemorySpeedscopeFile {
  version: string
  profile: Profile[]
}

export function exportProfile(profile: Profile): SerializedSpeedscopeFile {
  const serialized: SerializedSamplingProfile = {
    type: 'SamplingProfile',
    name: profile.getName(),
    frames: [],
    nodes: [],
    samples: [],
    weights: [],
    weightUnit: profile.getWeightUnit(),
  }
  const {frames, nodes, samples, weights} = serialized

  const indexForFrame = new Map<Frame, number>()
  const indexForNode = new Map<CallTreeNode, number>()

  function getIndexForFrame(frame: Frame): number {
    let index = indexForFrame.get(frame)
    if (index == null) {
      const serializedFrame: SerializedFrame = {
        name: frame.name,
      }
      if (frame.file != null) serializedFrame.file = frame.file
      if (frame.line != null) serializedFrame.line = frame.line
      if (frame.col != null) serializedFrame.col = frame.col

      index = frames.length
      indexForFrame.set(frame, index)
      frames.push(serializedFrame)
    }
    return index
  }

  function getIndexForNode(node: CallTreeNode): number {
    if (node.isRoot()) {
      return -1
    }
    let index = indexForNode.get(node)
    if (index == null) {
      const serializedNode: SerializedNode = {
        frame: getIndexForFrame(node.frame),
      }
      if (node.parent && !node.parent.isRoot()) {
        serializedNode.parent = getIndexForNode(node.parent)
      }

      index = nodes.length
      indexForNode.set(node, index)
      nodes.push(serializedNode)
    }
    return index
  }

  profile.forEachSample((sample, weight) => {
    samples.push(getIndexForNode(sample))
    weights.push(weight)
  })

  return {
    version: '0.0.1',
    exporter: 'https://www.speedscope.app',
    profiles: [serialized],
  }
}

function importSpeedscopeProfile(serialized: SerializedSamplingProfile): Profile {
  const profile = new CallTreeProfileBuilder()

  switch (serialized.weightUnit) {
    case 'nanoseconds':
    case 'microseconds':
    case 'milliseconds':
    case 'seconds':
      profile.setValueFormatter(new TimeFormatter(serialized.weightUnit))
      break

    case 'bytes':
      profile.setValueFormatter(new ByteFormatter())
      break

    case 'none':
      profile.setValueFormatter(new RawValueFormatter())
      break
  }

  let prevStack: SerializedNode[] = []

  const {samples, weights, nodes, frames} = serialized
  if (samples.length !== weights.length) {
    throw new Error(
      `Expected equal count of samples and weights. samples.length=${
        samples.length
      }, weights.length=${weights.length}`,
    )
  }

  const frameInfos: FrameInfo[] = frames.map((frame, i) => ({key: i, ...frame}))

  let value = 0
  for (let i = 0; i < samples.length; i++) {
    const weight = weights[i]
    const nodeIndex = samples[i]

    let stackTop: SerializedNode | null = nodes[nodeIndex]
    if (nodeIndex === -1) {
      stackTop = null
    }

    // Find lowest common ancestor of the current stack and the previous one
    let lca: SerializedNode | null = null

    // This is O(n^2), but n should be relatively small here (stack height),
    // so hopefully this isn't much of a problem
    for (
      lca = stackTop;
      lca != null && prevStack.indexOf(lca) === -1;
      lca = lca.parent != null ? nodes[lca.parent] : null
    ) {}

    // Close frames that are no longer open
    while (prevStack.length > 0 && lastOf(prevStack) != lca) {
      const closingNode = prevStack.pop()!
      profile.leaveFrame(frameInfos[closingNode.frame], value)
    }

    // Open frames that are now becoming open
    const toOpen: SerializedNode[] = []
    for (
      let node: SerializedNode | null = stackTop;
      node != null && node != lca;
      node = node.parent != null ? nodes[node.parent] : null
    ) {
      toOpen.push(node)
    }
    toOpen.reverse()

    for (let node of toOpen) {
      profile.enterFrame(frameInfos[node.frame], value)
    }

    prevStack = prevStack.concat(toOpen)
    value += weight
  }

  // Close frames that are open at the end of the trace
  for (let i = prevStack.length - 1; i >= 0; i--) {
    profile.leaveFrame(frameInfos[prevStack[i].frame], value)
  }

  return profile.build()
}

export function importSingleSpeedscopeProfile(serialized: SerializedSpeedscopeFile): Profile {
  if (serialized.profiles.length !== 1) {
    throw new Error(`Unexpected profiles length ${serialized.profiles}`)
  }
  return importSpeedscopeProfile(serialized.profiles[0])
}

export function saveToFile(profile: Profile): void {
  const blob = new Blob([JSON.stringify(exportProfile(profile))], {type: 'text/json'})

  const nameWithoutExt = profile.getName().split('.')[0]!
  const filename = `${nameWithoutExt.replace(/\W+/g, '_')}.speedscope.json`

  console.log('Saving', filename)

  const a = document.createElement('a')
  a.download = filename
  a.href = window.URL.createObjectURL(blob)
  a.dataset.downloadurl = ['text/json', a.download, a.href].join(':')

  // For this to work in Firefox, the <a> must be in the DOM
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
