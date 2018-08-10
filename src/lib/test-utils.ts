import * as fs from 'fs'
import * as path from 'path'
import {Profile, CallTreeNode, Frame} from './profile'
import {importProfiles} from '../import'
import {exportProfile, importSpeedscopeProfiles} from './file-format'

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

  const profiles = await importProfiles(path.basename(filepath), input)
  if (profiles) {
    for (let profile of profiles.profiles) {
      expect(dumpProfile(profile)).toMatchSnapshot()
    }
  } else {
    fail('Failed to extract profile')
    return
  }

  const profilesWithoutFilename = await importProfiles('unknown', input)
  if (profilesWithoutFilename) {
    expect(profilesWithoutFilename.profiles.length).toEqual(profiles.profiles.length)
    for (let i = 0; i < profiles.profiles.length; i++) {
      const a = profiles.profiles[i]
      const b = profilesWithoutFilename.profiles[i]
      b.setName(a.getName())
      expect(exportProfile(a)).toEqual(exportProfile(b))
    }
  } else {
    fail('Failed to extract profile when filename was "unknown"')
    return
  }

  for (let profile of profiles.profiles) {
    const exported = exportProfile(profile)
    const reimported = importSpeedscopeProfiles(exported)[0]

    expect(reimported.getName()).toEqual(profile.getName())
    expect(reimported.getTotalWeight()).toEqual(profile.getTotalWeight())
    expect(dumpProfile(reimported).stacks.join('\n')).toEqual(
      dumpProfile(profile).stacks.join('\n'),
    )

    const reexported = exportProfile(reimported)
    expect(exported).toEqual(reexported)
  }
}
