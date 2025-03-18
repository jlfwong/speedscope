import {Profile, FrameInfo, StackListProfileBuilder} from '../lib/profile'
import {TextFileContent} from './utils'

export function importFromPMCStatCallGraph(contents: TextFileContent): Profile | null {
  const profile = new StackListProfileBuilder()
  const stack: FrameInfo[] = []
  let file: string | undefined
  let prevDuration = '0'
  let prevIndent = -1
  for (const line of contents.splitLines()) {
    const match = /^( *)[\d.]+%  \[(\d+)\]\s*(\S+)(?: @ (.*))?$/gm.exec(line)
    if (!match) continue
    const indent = match[1].length
    if (indent <= prevIndent) {
      const frames = stack.slice(0, prevIndent + 1).reverse()
      const duration = parseInt(prevDuration, 10)
      profile.appendSampleWithWeight(frames, duration)
    }
    const name = match[3]
    file = match[4] || file
    stack[indent] = {key: name, name: name, file: file}
    prevDuration = match[2]
    prevIndent = indent
  }
  if (prevIndent == -1) return null
  const frames = stack.slice(0, prevIndent + 1).reverse()
  const duration = parseInt(prevDuration, 10)
  profile.appendSampleWithWeight(frames, duration)
  return profile.build()
}
