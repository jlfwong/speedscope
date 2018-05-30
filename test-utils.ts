import {Profile, CallTreeNode, Frame} from './profile'

interface DumpedProfile {
  stacks: string[]
  frames: Frame[]
}

export function dumpProfile(profile: Profile): any {
  const dump: DumpedProfile = {
    stacks: [],
    frames: [],
  }

  profile.forEachFrame(f => dump.frames.push(f))

  let lastValue = 0
  const curStack: (number | string)[] = []

  function maybeEmit(value: number) {
    if (lastValue != value) {
      dump.stacks.push(curStack.map(k => `${k}`).join(';') + ` ${value - lastValue}`)
      lastValue = value
    }
  }

  function openFrame(node: CallTreeNode, value: number) {
    maybeEmit(value)
    curStack.push(node.frame.key)
  }

  function closeFrame(value: number) {
    maybeEmit(value)
    curStack.pop()
  }

  profile.forEachCall(openFrame, closeFrame)

  return dump
}
