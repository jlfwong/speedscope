// https://github.com/tmm1/stackprof

import {Profile, FrameInfo, StackListProfileBuilder} from '../lib/profile'
import {TimeFormatter} from '../lib/value-formatters'

interface StackprofFrame {
  name: string
  file?: string
  line?: number
}

export interface StackprofProfile {
  frames: {[number: string]: StackprofFrame}
  mode: string
  raw: number[]
  raw_timestamp_deltas: number[]
  samples: number
}

export function importFromStackprof(stackprofProfile: StackprofProfile): Profile {
  const {frames, mode, raw, raw_timestamp_deltas, samples} = stackprofProfile
  const objectMode = mode == 'object'

  const size = objectMode ? samples : stackprofProfile.raw_timestamp_deltas.reduce((a, b) => a + b, 0)
  const profile = new StackListProfileBuilder(size)

  let sampleIndex = 0

  let prevStack: FrameInfo[] = []

  for (let i = 0; i < raw.length; ) {
    const stackHeight = raw[i++]

    let stack: FrameInfo[] = []
    for (let j = 0; j < stackHeight; j++) {
      const id = raw[i++]
      stack.push({
        key: id,
        ...frames[id],
      })
    }
    if (stack.length === 1 && stack[0].name === '(garbage collection)') {
      stack = prevStack.concat(stack)
    }
    const nSamples = raw[i++]

    if (objectMode) {
      profile.appendSampleWithWeight(stack, nSamples)
    } else {
      let sampleDuration = 0
      for (let j = 0; j < nSamples; j++) {
        sampleDuration += raw_timestamp_deltas[sampleIndex++]
      }

      profile.appendSampleWithWeight(stack, sampleDuration)
    }

    prevStack = stack
  }

  if (!objectMode) {
    profile.setValueFormatter(new TimeFormatter('microseconds'))
  }

  return profile.build()
}
