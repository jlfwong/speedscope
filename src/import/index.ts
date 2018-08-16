import {Profile, ProfileGroup} from '../lib/profile'
import {FileSystemDirectoryEntry} from './file-system-entry'

import {importFromChromeCPUProfile, importFromChromeTimeline} from './chrome'
import {importFromStackprof} from './stackprof'
import {importFromInstrumentsDeepCopy, importFromInstrumentsTrace} from './instruments'
import {importFromBGFlameGraph} from './bg-flamegraph'
import {importFromFirefox} from './firefox'
import {importSpeedscopeProfiles} from '../lib/file-format'
import {importFromV8ProfLog} from './v8proflog'
import {importFromLinuxPerf} from './linux-tools-perf'

export async function importProfileGroup(
  fileName: string,
  contents: string,
): Promise<ProfileGroup | null> {
  const profileGroup = await _importProfileGroup(fileName, contents)
  if (profileGroup) {
    if (!profileGroup.name) {
      profileGroup.name = fileName
    }
    for (let profile of profileGroup.profiles) {
      if (profile && !profile.getName()) {
        profile.setName(fileName)
      }
    }
    return profileGroup
  }
  return null
}

function toGroup(profile: Profile | null): ProfileGroup | null {
  if (!profile) return null
  return {name: profile.getName(), indexToView: 0, profiles: [profile]}
}

async function _importProfileGroup(
  fileName: string,
  contents: string,
): Promise<ProfileGroup | null> {
  // First pass: Check known file format names to infer the file type
  if (fileName.endsWith('.speedscope.json')) {
    console.log('Importing as speedscope json file')
    return importSpeedscopeProfiles(JSON.parse(contents))
  } else if (fileName.endsWith('.cpuprofile')) {
    console.log('Importing as Chrome CPU Profile')
    return toGroup(importFromChromeCPUProfile(JSON.parse(contents)))
  } else if (fileName.endsWith('.chrome.json') || /Profile-\d{8}T\d{6}/.exec(fileName)) {
    console.log('Importing as Chrome Timeline')
    return toGroup(importFromChromeTimeline(JSON.parse(contents)))
  } else if (fileName.endsWith('.stackprof.json')) {
    console.log('Importing as stackprof profile')
    return toGroup(importFromStackprof(JSON.parse(contents)))
  } else if (fileName.endsWith('.instruments.txt')) {
    console.log('Importing as Instruments.app deep copy')
    return toGroup(importFromInstrumentsDeepCopy(contents))
  } else if (fileName.endsWith('.linux-perf.txt')) {
    console.log('Importing as output of linux perf script')
    return importFromLinuxPerf(contents)
  } else if (fileName.endsWith('.collapsedstack.txt')) {
    console.log('Importing as collapsed stack format')
    return toGroup(importFromBGFlameGraph(contents))
  } else if (fileName.endsWith('.v8log.json')) {
    console.log('Importing as --prof-process v8 log')
    return toGroup(importFromV8ProfLog(JSON.parse(contents)))
  }

  // Second pass: Try to guess what file format it is based on structure
  let parsed: any
  try {
    parsed = JSON.parse(contents)
  } catch (e) {}
  if (parsed) {
    if (parsed['$schema'] === 'https://www.speedscope.app/file-format-schema.json') {
      console.log('Importing as speedscope json file')
      return importSpeedscopeProfiles(JSON.parse(contents))
    } else if (parsed['systemHost'] && parsed['systemHost']['name'] == 'Firefox') {
      console.log('Importing as Firefox profile')
      return toGroup(importFromFirefox(parsed))
    } else if (Array.isArray(parsed) && parsed[parsed.length - 1].name === 'CpuProfile') {
      console.log('Importing as Chrome CPU Profile')
      return toGroup(importFromChromeTimeline(parsed))
    } else if ('nodes' in parsed && 'samples' in parsed && 'timeDeltas' in parsed) {
      console.log('Importing as Chrome Timeline')
      return toGroup(importFromChromeCPUProfile(parsed))
    } else if ('mode' in parsed && 'frames' in parsed) {
      console.log('Importing as stackprof profile')
      return toGroup(importFromStackprof(parsed))
    } else if ('code' in parsed && 'functions' in parsed && 'ticks' in parsed) {
      console.log('Importing as --prof-process v8 log')
      return toGroup(importFromV8ProfLog(parsed))
    }
  } else {
    // Format is not JSON

    // If the first line contains "Symbol Name", preceded by a tab, it's probably
    // a deep copy from OS X Instruments.app
    if (/^[\w \t\(\)]*\tSymbol Name/.exec(contents)) {
      console.log('Importing as Instruments.app deep copy')
      return toGroup(importFromInstrumentsDeepCopy(contents))
    }

    // If every line ends with a space followed by a number, it's probably
    // the collapsed stack format.
    const lineCount = contents.split(/\n/).length
    if (lineCount >= 1 && lineCount === contents.split(/ \d+\n/).length) {
      console.log('Importing as collapsed stack format')
      return toGroup(importFromBGFlameGraph(contents))
    }

    const fromLinuxPerf = importFromLinuxPerf(contents)
    if (fromLinuxPerf) {
      console.log('Importing from linux perf script output')
      return fromLinuxPerf
    }
  }

  // Unrecognized format
  return null
}

export async function importFromFileSystemDirectoryEntry(entry: FileSystemDirectoryEntry) {
  return importFromInstrumentsTrace(entry)
}
