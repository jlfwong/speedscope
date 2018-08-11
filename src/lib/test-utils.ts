import * as fs from 'fs'
import * as path from 'path'
import {Profile, CallTreeNode, Frame} from './profile'
import {importProfileGroup} from '../import'
import {exportProfileGroup, importSpeedscopeProfiles} from './file-format'

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

  const profileGroup = await importProfileGroup(path.basename(filepath), input)
  if (profileGroup) {
    for (let profile of profileGroup.profiles) {
      expect(dumpProfile(profile)).toMatchSnapshot()
    }
  } else {
    fail('Failed to extract profile')
    return
  }

  const profilesWithoutFilename = await importProfileGroup('unknown', input)
  if (profilesWithoutFilename) {
    expect(profilesWithoutFilename.profiles.length).toEqual(profileGroup.profiles.length)
    profilesWithoutFilename.name = profileGroup.name
    for (let i = 0; i < profileGroup.profiles.length; i++) {
      const a = profileGroup.profiles[i]
      const b = profilesWithoutFilename.profiles[i]
      b.setName(a.getName())
    }
    expect(exportProfileGroup(profileGroup)).toEqual(exportProfileGroup(profilesWithoutFilename))
  } else {
    fail('Failed to extract profile when filename was "unknown"')
    return
  }

  const exported = exportProfileGroup(profileGroup)
  const reimportedGroup = importSpeedscopeProfiles(exported)

  expect(reimportedGroup.name).toEqual(profileGroup.name)
  expect(reimportedGroup.profiles.length).toEqual(profileGroup.profiles.length)

  for (let i = 0; i < profileGroup.profiles.length; i++) {
    const profile = profileGroup.profiles[i]
    const reimported = reimportedGroup.profiles[i]

    expect(reimported.getTotalWeight()).toEqual(profile.getTotalWeight())
    expect(dumpProfile(reimported).stacks.join('\n')).toEqual(
      dumpProfile(profile).stacks.join('\n'),
    )
  }

  const reexported = exportProfileGroup(reimportedGroup)
  expect(exported).toEqual(reexported)
}
