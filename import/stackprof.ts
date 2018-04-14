// https://github.com/tmm1/stackprof

import { Profile, TimeFormatter, FrameInfo } from '../profile'

interface StackprofFrame {
  name: string
  file?: string
  line?: number
}

export interface StackprofProfile {
  frames: { [number: string]: StackprofFrame }
  raw: number[]
  raw_timestamp_deltas: number[]
}

export function importFromStackprof(stackprofProfile: StackprofProfile): Profile {
  const duration = stackprofProfile.raw_timestamp_deltas.reduce((a, b) => a + b, 0)
  const profile = new Profile(duration)

  const { frames, raw, raw_timestamp_deltas } = stackprofProfile
  let sampleIndex = 0
  for (let i = 0; i < raw.length; ) {
    const stackHeight = raw[i++]

    const stack: FrameInfo[] = []
    for (let j = 0; j < stackHeight; j++) {
      const id = raw[i++]
      stack.push({
        key: id,
        ...frames[id],
      })
    }
    const nSamples = raw[i++]

    let sampleDuration = 0
    for (let j = 0; j < nSamples; j++) {
      sampleDuration += raw_timestamp_deltas[sampleIndex++]
    }

    profile.appendSample(stack, sampleDuration)
  }

  profile.setValueFormatter(new TimeFormatter('microseconds'))
  return profile
}
