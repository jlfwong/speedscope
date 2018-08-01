import {Profile, FrameInfo, CallTreeProfileBuilder} from '../lib/profile'
import {getOrInsert, lastOf} from '../lib/utils'
import {TimeFormatter} from '../lib/value-formatters'

interface Allocations {
  frames: any[]
  sites: any[]
  sizes: any[]
  timestamps: any[]
}

interface Configuration {
  allocationsMaxLogLength: number
  allocationsSampleProbability: number
  bufferSize: number
  sampleFrequency: number
  withAllocations: boolean
  withMarkers: boolean
  withMemory: boolean
  withTicks: boolean
}

interface Lib {
  arch: string
  breakpadId: string
  debugName: string
  debugPath: string
  end: any
  name: string
  offset: number
  path: string
  start: any
}

interface Meta {
  abi: string
  asyncstack: number
  debug: number
  gcpoison: number
  interval: number
  misc: string
  oscpu: string
  platform: string
  processType: number
  product: string
  shutdownTime?: any
  stackwalk: number
  startTime: number
  toolkit: string
  version: number
}

interface PausedRange {
  endTime: number
  reason: string
  startTime: number
}

type Frame = [number] | [number, number | null, number | null, number, number]

interface FrameTable {
  data: Frame[]
  /*
  schema: {
    location: 0
    implementation: 1
    optimizations: 2
    line: 3
    category: 4
  }
  */
}

interface MarkerMeta {
  category: string
  interval: string
  type: string
}
type Marker = [number, number] | [number, number, MarkerMeta]

interface Markers {
  data: Marker[]
  /*
  schema: {
    name: 0
    time: 1
    data: 2
  }
  */
}

type Sample = [number, number, number] | [number, number, number, number, number]

interface Samples {
  data: Sample[]
  /*
  schema: {
    stack: 0
    time: 1
    responsiveness: 2
    rss: 3
    uss: 4
  }
  */
}

export interface StackTable {
  data: [number | null, number][]
  /*
  schema: {
    prefix: 0
    frame: 1
  }
  */
}

export interface Thread {
  frameTable: FrameTable
  markers: Markers
  name: string
  pid: number
  processType: string
  registerTime: number
  samples: Samples
  stackTable: StackTable
  stringTable: string[]
  tid: number
  unregisterTime?: any
}

export interface FirefoxCPUProfile {
  libs: Lib[]
  meta: Meta
  pausedRanges: PausedRange[]
  processes: any[]
  threads: Thread[]
}

export interface FirefoxProfile {
  allocations: Allocations
  configuration: Configuration
  duration: number
  fileType: string
  frames: any[]
  label: string
  markers: any[]
  memory: any[]
  profile: FirefoxCPUProfile
  ticks: any[]
  version: number
}

export function importFromFirefox(firefoxProfile: FirefoxProfile): Profile {
  const cpuProfile = firefoxProfile.profile

  const thread =
    cpuProfile.threads.length === 1
      ? cpuProfile.threads[0]
      : cpuProfile.threads.filter(t => t.name === 'GeckoMain')[0]

  const frameIdToFrameInfo = new Map<number, FrameInfo>()

  function extractStack(sample: Sample): FrameInfo[] {
    let stackFrameId: number | null = sample[0]
    const ret: number[] = []

    while (stackFrameId != null) {
      const nextStackFrame: [number | null, number] = thread.stackTable.data[stackFrameId]
      const [nextStackId, frameId] = nextStackFrame
      ret.push(frameId)
      stackFrameId = nextStackId
    }
    ret.reverse()
    return ret
      .map(f => {
        const frameData = thread.frameTable.data[f]
        const location = thread.stringTable[frameData[0]]

        const match = /(.*)\s+\((.*?):?(\d+)?\)$/.exec(location)

        if (!match) return null

        if (match[2].startsWith('resource:') || match[2] === 'self-hosted') {
          // Ignore Firefox-internals stuff
          return null
        }

        return getOrInsert(frameIdToFrameInfo, f, () => ({
          key: location,
          name: match[1]!,
          file: match[2]!,
          line: match[3] ? parseInt(match[3]) : undefined,
        }))
      })
      .filter(f => f != null) as FrameInfo[]
  }

  const profile = new CallTreeProfileBuilder(firefoxProfile.duration)

  let prevStack: FrameInfo[] = []
  for (let sample of thread.samples.data) {
    const stack = extractStack(sample)
    const value = sample[1]

    // Find lowest common ancestor of the current stack and the previous one
    let lca: FrameInfo | null = null

    // This is O(n^2), but n should be relatively small here (stack height),
    // so hopefully this isn't much of a problem
    for (let i = stack.length - 1; i >= 0 && prevStack.indexOf(stack[i]) === -1; i--) {}

    // Close frames that are no longer open
    while (prevStack.length > 0 && lastOf(prevStack) != lca) {
      const closingFrame = prevStack.pop()!
      profile.leaveFrame(closingFrame, value)
    }

    // Open frames that are now becoming open
    const toOpen: FrameInfo[] = []
    for (let i = stack.length - 1; i >= 0 && stack[i] != lca; i--) {
      toOpen.push(stack[i])
    }
    toOpen.reverse()

    for (let frame of toOpen) {
      profile.enterFrame(frame, value)
    }

    prevStack = stack
  }

  profile.setValueFormatter(new TimeFormatter('milliseconds'))
  return profile.build()
}
