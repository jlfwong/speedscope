// https://github.com/brendangregg/FlameGraph#2-fold-stacks

import {Profile, FrameInfo} from '../profile'

interface BGSample {
  stack: FrameInfo[]
  duration: number
}

function parseBGFoldedStacks(contents: string): BGSample[] {
  const samples: BGSample[] = []
  contents.replace(/^(.*) (\d+)$/mg, (match: string, stack: string, n: string) => {
    samples.push({
      stack: stack.split(';').map(name => ({key: name, name: name})),
      duration: parseInt(n, 10)
    })
    return match
  })
  return samples
}

export function importFromBGFlameGraph(contents: string): Profile {
  const parsed = parseBGFoldedStacks(contents)
  const duration = parsed.reduce((prev: number, cur: BGSample) => prev + cur.duration, 0)
  const profile = new Profile(duration)
  for (let sample of parsed) {
    profile.appendSample(sample.stack, sample.duration)
  }
  return profile
}