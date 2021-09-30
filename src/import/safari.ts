import {Profile, FrameInfo, StackListProfileBuilder} from '../lib/profile'
import {TimeFormatter} from '../lib/value-formatters'

interface Record {
  type: string
  eventType?: string
  startTime?: number
  endTime?: number
  // timeline-record-type-cpu
  timestamp?: number
  usage?: number
  threads?: any[]
  // timeline-record-type-script
  details?: number | string | any
  extraDetails?: null | any
  // timeline-record-type-network
  archiveStartTime?: number
  entry?: any
  // timeline-record-type-layout
  quad?: number[]
}

interface ExprLocation {
  line: number
  column: number
}

interface StackFrame {
  sourceID: string
  name: string
  line: number
  column: number
  url: string
  expressionLocation?: ExprLocation
}

interface Sample {
  timestamp: number
  stackFrames: StackFrame[]
}

interface Recording {
  displayName: string
  startTime: number
  endTime: number
  discontinuities: any[]
  instrumentTypes: string[]
  records: Record[]
  markers: any[]
  memoryPressureEvents: any[]
  sampleStackTraces: Sample[]
  sampleDurations: number[]
}

interface Overview {
  secondsPerPixel: number
  scrollStartTime: number
  selectionStartTime: number
  selectionDuration: number
}

interface SafariProfile {
  version: number
  recording: Recording
  overview: Overview
}

function makeStack(frames: StackFrame[]): FrameInfo[] {
  return frames
    .map(({name, url, line, column}) => ({
      key: `${name}:${url}:${line}:${column}`,
      file: url,
      line,
      col: column,
      name: name || (url ? `(anonymous ${url.split('/').pop()}:${line})` : '(anonymous)'),
    }))
    .reverse()
}

export function importFromSafari(contents: SafariProfile): Profile | null {
  if (contents.version !== 1) {
    console.warn(`Unknown Safari profile version ${contents.version}... Might be incompatible.`)
  }

  const {recording} = contents
  const {sampleStackTraces, sampleDurations} = recording

  const count = sampleStackTraces.length
  if (count < 1) {
    console.warn('Empty profile')
    return null
  }

  const profileDuration =
    sampleStackTraces[count - 1].timestamp - sampleStackTraces[0].timestamp + sampleDurations[0]
  const profile = new StackListProfileBuilder(profileDuration)

  let previousEndTime = Number.MAX_VALUE

  sampleStackTraces.forEach((sample, i) => {
    const endTime = sample.timestamp
    const duration = sampleDurations[i]
    const startTime = endTime - duration
    const idleDurationBefore = startTime - previousEndTime

    // FIXME: 2ms is a lot, but Safari's timestamps and durations don't line up very well and will create
    // phantom idle time
    if (idleDurationBefore > 0.002) {
      profile.appendSampleWithWeight([], idleDurationBefore)
    }

    profile.appendSampleWithWeight(makeStack(sample.stackFrames), duration)

    previousEndTime = endTime
  })

  profile.setValueFormatter(new TimeFormatter('seconds'))
  profile.setName(recording.displayName)
  return profile.build()
}
