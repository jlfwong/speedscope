import {Profile, TimeFormatter, FrameInfo} from '../profile'

interface TimelineEvent {
  pid: number,
  tid: number,
  ts: number,
  ph: string,
  cat: string,
  name: string,
  dur: number,
  tdur: number,
  tts: number,
  args: { [key: string]: any }
}

interface PositionTickInfo {
  line: number,
  ticks: number
}

interface CPUProfileNode {
  callFrame: {
    columnNumber: number,
    functionName: string,
    lineNumber: number,
    scriptId: string,
    url: string
  },
  hitCount: number
  id: number
  children?: number[]
  positionTicks?: PositionTickInfo[]
  parent?: CPUProfileNode
}

interface CPUProfile {
  startTime: number,
  endTime: number,
  nodes: CPUProfileNode[],
  samples: number[],
  timeDeltas: number[]
}

export function importFromChrome(events: TimelineEvent[]) {
  const profileEvent = events[events.length - 1]
  const chromeProfile = profileEvent.args.data.cpuProfile as CPUProfile
  const profile = new Profile(chromeProfile.endTime - chromeProfile.startTime)

  const nodeById = new Map<number, CPUProfileNode>()
  for (let node of chromeProfile.nodes) {
    nodeById.set(node.id, node)
  }
  for (let node of chromeProfile.nodes) {
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

    elapsed += chromeProfile.timeDeltas[i]
    lastNodeId = nodeId
  }
  if (!isNaN(lastNodeId)) {
    samples.push(lastNodeId)
    timeDeltas.push(elapsed)
  }

  for (let i = 0; i < samples.length; i++) {
    const timeDelta = timeDeltas[i+1] || 0
    const nodeId = samples[i]
    let node = nodeById.get(nodeId)
    if (!node) continue

    // TODO(jlfwong): This is silly and slow, but good enough for now
    const stack: FrameInfo[] = []
    for (let node = nodeById.get(nodeId); node; node = node.parent) {
      if (node.callFrame.functionName === '(root)') continue
      if (node.callFrame.functionName === '(idle)') continue

      const name = node.callFrame.functionName || "(anonymous)"
      const file = node.callFrame.url
      const line = node.callFrame.lineNumber
      const col = node.callFrame.columnNumber

      stack.push({
        key: `${name}:${file}:${line}:${col}`,
        name,
        file,
        line,
        col
      })
    }
    stack.reverse()

    profile.appendSample(stack, timeDelta)
  }

  profile.setValueFormatter(new TimeFormatter('microseconds'))
  return profile
}