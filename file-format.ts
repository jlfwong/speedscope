import {Profile, CallTreeNode, Frame, CallTreeProfileBuilder, FrameInfo} from './profile'
import {TimeFormatter, ByteFormatter, RawValueFormatter} from './value-formatters'
import {lastOf} from './utils'

interface SerializedFrame {
  name: string
  file?: string
  line?: number
  col?: number
}

interface SerializedNode {
  // Index into the frames array on the SerializedProfile
  frame: number

  // Index into the nodes array on the SerializedProfile
  parent?: number
}

export type WeightUnit =
  | 'none'
  | 'nanoseconds'
  | 'microseconds'
  | 'milliseconds'
  | 'seconds'
  | 'bytes'

interface SerializedSamplingProfile {
  // Type of profile. This will future proof the file format to allow many
  // different kinds of profiles to be contained and each type to be part of
  // a discriminate union.
  type: 'SamplingProfile'

  // Name of the profile. Typically a filename for the source of the profile.
  name: string

  // List of all call frames
  frames: SerializedFrame[]

  // List of nodes in the call tree
  nodes: SerializedNode[]

  // List of indices into nodes, with -1 indicating that the call-stack
  // was empty at the time of the sample
  samples: number[]

  // The weight of the sample at the given index. Should have
  // the same length as the samples array.
  weights: number[]

  // Unit of the weights provided in the profile. If none provided,
  // the weights are assumed to be unit-less.
  weightUnit: WeightUnit
}

export interface SerializedSpeedscopeFile {
  version: string
  profiles: SerializedSamplingProfile[]
}

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
        serializedNode.parent = getIndexForNode(node)
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
      lca && prevStack.indexOf(lca) === -1;
      lca = lca.parent ? nodes[lca.parent] : null
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
      node && node != lca;
      node = node.parent ? nodes[node.parent] : null
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
