// https://github.com/tmm1/stackprof

import {Profile, FrameInfo, StackListProfileBuilder} from '../lib/profile'
import {RawValueFormatter, TimeFormatter} from '../lib/value-formatters'

interface StackprofFrame {
  name?: string
  file?: string
  line?: number
}

export interface StackprofProfile {
  frames: {[number: string]: StackprofFrame}
  mode: string
  raw: number[]
  raw_timestamp_deltas: number[]
  samples: number
  interval: number
}

export function importFromStackprof(stackprofProfile: StackprofProfile): Profile {
  const {frames, mode, raw, raw_timestamp_deltas, interval} = stackprofProfile
  const profile = new StackListProfileBuilder()
  profile.setValueFormatter(new TimeFormatter('microseconds')) // default to time format unless we're in object mode

  let sampleIndex = 0

  let prevStack: FrameInfo[] = []

  for (let i = 0; i < raw.length; ) {
    const stackHeight = raw[i++]

    let stack: FrameInfo[] = []
    for (let j = 0; j < stackHeight; j++) {
      const id = raw[i++]
      let frameName = frames[id].name
      if (frameName == null) {
        frameName = '(unknown)'
      }
      const frame = {
        key: id,
        ...frames[id],
        name: frameName,
      }
      stack.push(frame)
    }
    if (stack.length === 1 && stack[0].name === '(garbage collection)') {
      stack = prevStack.concat(stack)
    }
    const nSamples = raw[i++]

    switch (mode) {
      case 'object':
        profile.appendSampleWithWeight(stack, nSamples)
        profile.setValueFormatter(new RawValueFormatter())
        break
      case 'cpu':
        profile.appendSampleWithWeight(stack, nSamples * interval)
        break
      default:
        let sampleDuration = 0
        for (let j = 0; j < nSamples; j++) {
          sampleDuration += raw_timestamp_deltas[sampleIndex++]
        }
        profile.appendSampleWithWeight(stack, sampleDuration)
    }

    prevStack = stack
  }

  return profile.build()
}
