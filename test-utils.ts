import * as fs from 'fs'
import * as path from 'path'
import {Profile, CallTreeNode, Frame} from './profile'
import {importProfile} from './import'

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
      dump.stacks.push(
        curStack.map(k => `${k}`).join(';') + ` ${profile.formatValue(value - lastValue)}`,
      )
      lastValue = value
    }
  }

  function openFrame(node: CallTreeNode, value: number) {
    maybeEmit(value)
    curStack.push(node.frame.name)
  }

  function closeFrame(node: CallTreeNode, value: number) {
    maybeEmit(value)
    curStack.pop()
  }

  profile.forEachCall(openFrame, closeFrame)

  return dump
}

export async function checkProfileSnapshot(filepath: string) {
  const input = fs.readFileSync(filepath, 'utf8')
  const profile = await importProfile(path.basename(filepath), input)
  if (profile) {
    expect(dumpProfile(profile)).toMatchSnapshot()
  } else {
    fail('Failed to extract profile')
  }
}
