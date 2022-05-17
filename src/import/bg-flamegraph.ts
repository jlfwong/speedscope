// https://github.com/brendangregg/FlameGraph#2-fold-stacks

import {Profile, FrameInfo, StackListProfileBuilder} from '../lib/profile'
import {TextFileContent} from './utils'

interface BGSample {
  stack: FrameInfo[]
  duration: number
}

function parseBGFoldedStacks(contents: TextFileContent): BGSample[] {
  const samples: BGSample[] = []
  for (const line of contents.splitLines()) {
    const match = /^(.*) (\d+)$/gm.exec(line)
    if (!match) continue
    const stack = match[1]
    const n = match[2]

    samples.push({
      stack: stack.split(';').map(name => ({key: name, name: name})),
      duration: parseInt(n, 10),
    })
  }

  return samples
}

export function importFromBGFlameGraph(contents: TextFileContent): Profile | null {
  const parsed = parseBGFoldedStacks(contents)
  const duration = parsed.reduce((prev: number, cur: BGSample) => prev + cur.duration, 0)
  const profile = new StackListProfileBuilder(duration)
  if (parsed.length === 0) {
    return null
  }
  for (let sample of parsed) {
    profile.appendSampleWithWeight(sample.stack, sample.duration)
  }
  return profile.build()
}
