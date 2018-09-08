import {Profile, FrameInfo, CallTreeProfileBuilder} from '../lib/profile'
import {getOrInsert, lastOf, sortBy} from '../lib/utils'
import {TimeFormatter} from '../lib/value-formatters'

interface TimelineEvent {
  pid: number
  tid: number
  ts: number
  ph: string
  cat: string
  name: string
  dur: number
  tdur: number
  tts: number
  args: {[key: string]: any}
}

interface PositionTickInfo {
  line: number
  ticks: number
}

interface CPUProfileCallFrame {
  columnNumber: number
  functionName: string
  lineNumber: number
  scriptId: string
  url: string
}

interface CPUProfileNode {
  callFrame: CPUProfileCallFrame
  hitCount: number
  id: number
  children?: number[]
  positionTicks?: PositionTickInfo[]
  parent?: CPUProfileNode
}

interface CPUProfile {
  startTime: number
  endTime: number
  nodes: CPUProfileNode[]
  samples: number[]
  timeDeltas: number[]
}

export function isChromeTimeline(rawProfile: any): boolean {
  if (!Array.isArray(rawProfile)) return false
  if (rawProfile.length < 1) return false
  const first = rawProfile[0]
  if (!('pid' in first && 'tid' in first && 'ph' in first && 'cat' in first)) return false
  if (!rawProfile.find(e => e.name === 'CpuProfile' || e.name === 'ProfileChunk')) return false
  return true
}

export function importFromChromeTimeline(events: TimelineEvent[]): Profile {
  // It seems like sometimes Chrome timeline files contain multiple CpuProfiles?
  // For now, choose the first one in the list.

  let cpuProfile: CPUProfile | null = null

  // The events aren't necessarily recorded in chronological order. Sort them so
  // that they are.
  sortBy(events, e => e.ts)

  for (let event of events) {
    if (event.name == 'CpuProfile') {
      cpuProfile = event.args.data.cpuProfile as CPUProfile
      break
    }

    if (event.name == 'Profile') {
      cpuProfile = {
        startTime: 0,
        endTime: 0,
        nodes: [],
        samples: [],
        timeDeltas: [],
        ...event.args.data,
      }
    }

    if (event.name == 'ProfileChunk') {
      if (cpuProfile) {
        const chunk = event.args.data
        if (chunk.cpuProfile) {
          if (chunk.cpuProfile.nodes) {
            cpuProfile.nodes = cpuProfile.nodes.concat(chunk.cpuProfile.nodes)
          }
          if (chunk.cpuProfile.samples) {
            cpuProfile.samples = cpuProfile.samples.concat(chunk.cpuProfile.samples)
          }
        }
        if (chunk.timeDeltas) {
          cpuProfile.timeDeltas = cpuProfile.timeDeltas.concat(chunk.timeDeltas)
        }
        if (chunk.startTime != null) {
          cpuProfile.startTime = chunk.startTime
        }
        if (chunk.endTime != null) {
          cpuProfile.endTime = chunk.endTime
        }
      } else {
        console.log('Ignoring ProfileChunk when no Profile is active')
      }
    }
  }

  if (cpuProfile) {
    return importFromChromeCPUProfile(cpuProfile as CPUProfile)
  } else {
    throw new Error('Could not find CPU profile in Timeline')
  }
}

const callFrameToFrameInfo = new Map<CPUProfileCallFrame, FrameInfo>()
function frameInfoForCallFrame(callFrame: CPUProfileCallFrame) {
  return getOrInsert(callFrameToFrameInfo, callFrame, callFrame => {
    const name = callFrame.functionName || '(anonymous)'
    const file = callFrame.url
    const line = callFrame.lineNumber
    const col = callFrame.columnNumber
    return {
      key: `${name}:${file}:${line}:${col}`,
      name,
      file,
      line,
      col,
    }
  })
}

function shouldIgnoreFunction(functionName: string) {
  return functionName === '(root)' || functionName === '(idle)'
}

function shouldPlaceOnTopOfPreviousStack(functionName: string) {
  return functionName === '(garbage collector)' || functionName === '(program)'
}

export function importFromChromeCPUProfile(chromeProfile: CPUProfile): Profile {
  const profile = new CallTreeProfileBuilder(chromeProfile.endTime - chromeProfile.startTime)

  const nodeById = new Map<number, CPUProfileNode>()
  for (let node of chromeProfile.nodes) {
    nodeById.set(node.id, node)
  }
  for (let node of chromeProfile.nodes) {
    if (typeof node.parent === 'number') {
      node.parent = nodeById.get(node.parent)
    }

    if (!node.children) continue
    for (let childId of node.children) {
      const child = nodeById.get(childId)
      if (!child) continue
      child.parent = node
    }
  }

  const samples: number[] = []
  const timeDeltas: number[] = []

  let elapsed = 0
  let lastNodeId = NaN

  // The chrome CPU profile format doesn't collapse identical samples. We'll do that
  // here to save a ton of work later doing mergers.
  for (let i = 0; i < chromeProfile.samples.length; i++) {
    const nodeId = chromeProfile.samples[i]
    if (nodeId != lastNodeId) {
      samples.push(nodeId)
      timeDeltas.push(elapsed)
      elapsed = 0
    }

    let timeDelta = chromeProfile.timeDeltas[i]
    if (timeDelta < 0) {
      console.warn('Substituting zero for unexpected time delta:', timeDelta, 'at index', i)
      timeDelta = 0
    }

    elapsed += timeDelta
    lastNodeId = nodeId
  }
  if (!isNaN(lastNodeId)) {
    samples.push(lastNodeId)
    timeDeltas.push(elapsed)
  }

  let prevStack: CPUProfileNode[] = []

  let value = 0
  for (let i = 0; i < samples.length; i++) {
    const timeDelta = timeDeltas[i + 1] || 0
    const nodeId = samples[i]
    let stackTop = nodeById.get(nodeId)
    if (!stackTop) continue

    // Find lowest common ancestor of the current stack and the previous one
    let lca: CPUProfileNode | null = null

    // This is O(n^2), but n should be relatively small here (stack height),
    // so hopefully this isn't much of a problem
    for (
      lca = stackTop;
      lca && prevStack.indexOf(lca) === -1;
      lca = shouldPlaceOnTopOfPreviousStack(lca.callFrame.functionName)
        ? lastOf(prevStack)
        : lca.parent || null
    ) {}

    // Close frames that are no longer open
    while (prevStack.length > 0 && lastOf(prevStack) != lca) {
      const closingNode = prevStack.pop()!
      const frame = frameInfoForCallFrame(closingNode.callFrame)
      profile.leaveFrame(frame, value)
    }

    // Open frames that are now becoming open
    const toOpen: CPUProfileNode[] = []
    for (
      let node: CPUProfileNode | null = stackTop;
      node && node != lca && !shouldIgnoreFunction(node.callFrame.functionName);
      // Place Chrome internal functions on top of the previous call stack
      node = shouldPlaceOnTopOfPreviousStack(node.callFrame.functionName)
        ? lastOf(prevStack)
        : node.parent || null
    ) {
      toOpen.push(node)
    }
    toOpen.reverse()

    for (let node of toOpen) {
      profile.enterFrame(frameInfoForCallFrame(node.callFrame), value)
    }

    prevStack = prevStack.concat(toOpen)
    value += timeDelta
  }

  // Close frames that are open at the end of the trace
  for (let i = prevStack.length - 1; i >= 0; i--) {
    profile.leaveFrame(frameInfoForCallFrame(prevStack[i].callFrame), value)
  }

  profile.setValueFormatter(new TimeFormatter('microseconds'))
  return profile.build()
}
