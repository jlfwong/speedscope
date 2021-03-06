import {Profile, ProfileGroup} from '../lib/profile'
import {FileSystemDirectoryEntry} from './file-system-entry'

import {
  importFromChromeCPUProfile,
  importFromChromeTimeline,
  isChromeTimeline,
  importFromOldV8CPUProfile,
} from './chrome'
import {importFromStackprof} from './stackprof'
import {importFromInstrumentsDeepCopy, importFromInstrumentsTrace} from './instruments'
import {importFromBGFlameGraph} from './bg-flamegraph'
import {importFromFirefox} from './firefox'
import {importSpeedscopeProfiles} from '../lib/file-format'
import {importFromV8ProfLog} from './v8proflog'
import {importFromLinuxPerf} from './linux-tools-perf'
import {importFromHaskell} from './haskell'
import {importFromSafari} from './safari'
import {ProfileDataSource, TextProfileDataSource, MaybeCompressedDataReader} from './utils'
import {importAsPprofProfile} from './pprof'
import {decodeBase64} from '../lib/utils'
import {importFromChromeHeapProfile} from './v8heapalloc'
import {isTraceEventFormatted, importTraceEvents} from './trace-event'
import {importFromCallgrind} from './callgrind'

export async function importProfileGroupFromText(
  fileName: string,
  contents: string,
): Promise<ProfileGroup | null> {
  return await importProfileGroup(new TextProfileDataSource(fileName, contents))
}

export async function importProfileGroupFromBase64(
  fileName: string,
  b64contents: string,
): Promise<ProfileGroup | null> {
  return await importProfileGroup(
    MaybeCompressedDataReader.fromArrayBuffer(fileName, decodeBase64(b64contents).buffer),
  )
}

export async function importProfilesFromFile(file: File): Promise<ProfileGroup | null> {
  return importProfileGroup(MaybeCompressedDataReader.fromFile(file))
}

export async function importProfilesFromArrayBuffer(
  fileName: string,
  buffer: ArrayBuffer,
): Promise<ProfileGroup | null> {
  return importProfileGroup(MaybeCompressedDataReader.fromArrayBuffer(fileName, buffer))
}

async function importProfileGroup(dataSource: ProfileDataSource): Promise<ProfileGroup | null> {
  const fileName = await dataSource.name()

  const profileGroup = await _importProfileGroup(dataSource)
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

function fixUpJSON(content: string): string {
  // This code is similar to the code from here:
  // https://github.com/catapult-project/catapult/blob/27e047e0494df162022be6aa8a8862742a270232/tracing/tracing/extras/importer/trace_event_importer.html#L197-L208
  //
  //   If the event data begins with a [, then we know it should end with a ]. The
  //   reason we check for this is because some tracing implementations cannot
  //   guarantee that a ']' gets written to the trace file. So, we are forgiving
  //   and if this is obviously the case, we fix it up before throwing the string
  //   at JSON.parse.
  //
  content = content.trim()
  if (content[0] === '[') {
    content = content.replace(/,\s*$/, '')
    if (content[content.length - 1] !== ']') {
      content += ']'
    }
  }
  return content
}

async function _importProfileGroup(dataSource: ProfileDataSource): Promise<ProfileGroup | null> {
  const fileName = await dataSource.name()

  const buffer = await dataSource.readAsArrayBuffer()

  {
    const profile = importAsPprofProfile(buffer)
    if (profile) {
      console.log('Importing as protobuf encoded pprof file')
      return toGroup(profile)
    }
  }

  const contents = await dataSource.readAsText()

  // First pass: Check known file format names to infer the file type
  if (fileName.endsWith('.speedscope.json')) {
    console.log('Importing as speedscope json file')
    return importSpeedscopeProfiles(JSON.parse(contents))
  } else if (fileName.endsWith('.chrome.json') || /Profile-\d{8}T\d{6}/.exec(fileName)) {
    console.log('Importing as Chrome Timeline')
    return importFromChromeTimeline(JSON.parse(contents), fileName)
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
  } else if (fileName.endsWith('.heapprofile')) {
    console.log('Importing as Chrome Heap Profile')
    return toGroup(importFromChromeHeapProfile(JSON.parse(contents)))
  } else if (fileName.endsWith('-recording.json')) {
    console.log('Importing as Safari profile')
    return toGroup(importFromSafari(JSON.parse(contents)))
  } else if (fileName.startsWith('callgrind.')) {
    console.log('Importing as Callgrind profile')
    return importFromCallgrind(contents, fileName)
  }

  // Second pass: Try to guess what file format it is based on structure
  let parsed: any
  try {
    parsed = JSON.parse(fixUpJSON(contents))
  } catch (e) {}
  if (parsed) {
    if (parsed['$schema'] === 'https://www.speedscope.app/file-format-schema.json') {
      console.log('Importing as speedscope json file')
      return importSpeedscopeProfiles(JSON.parse(contents))
    } else if (parsed['systemHost'] && parsed['systemHost']['name'] == 'Firefox') {
      console.log('Importing as Firefox profile')
      return toGroup(importFromFirefox(parsed))
    } else if (isChromeTimeline(parsed)) {
      console.log('Importing as Chrome Timeline')
      return importFromChromeTimeline(parsed, fileName)
    } else if ('nodes' in parsed && 'samples' in parsed && 'timeDeltas' in parsed) {
      console.log('Importing as Chrome CPU Profile')
      return toGroup(importFromChromeCPUProfile(parsed))
    } else if (isTraceEventFormatted(parsed)) {
      console.log('Importing as Trace Event Format profile')
      return importTraceEvents(parsed)
    } else if ('head' in parsed && 'samples' in parsed && 'timestamps' in parsed) {
      console.log('Importing as Chrome CPU Profile (old format)')
      return toGroup(importFromOldV8CPUProfile(parsed))
    } else if ('mode' in parsed && 'frames' in parsed && 'raw_timestamp_deltas' in parsed) {
      console.log('Importing as stackprof profile')
      return toGroup(importFromStackprof(parsed))
    } else if ('code' in parsed && 'functions' in parsed && 'ticks' in parsed) {
      console.log('Importing as --prof-process v8 log')
      return toGroup(importFromV8ProfLog(parsed))
    } else if ('head' in parsed && 'selfSize' in parsed['head']) {
      console.log('Importing as Chrome Heap Profile')
      return toGroup(importFromChromeHeapProfile(JSON.parse(contents)))
    } else if ('rts_arguments' in parsed && 'initial_capabilities' in parsed) {
      console.log('Importing as Haskell GHC JSON Profile')
      return importFromHaskell(parsed)
    } else if ('recording' in parsed && 'sampleStackTraces' in parsed.recording) {
      console.log('Importing as Safari profile')
      return toGroup(importFromSafari(JSON.parse(contents)))
    }
  } else {
    // Format is not JSON

    // If the first line is "# callgrind format", it's probably in Callgrind
    // Profile Format.
    if (
      /^# callgrind format/.exec(contents) ||
      (/^events:/m.exec(contents) && /^fn=/m.exec(contents))
    ) {
      console.log('Importing as Callgrind profile')
      return importFromCallgrind(contents, fileName)
    }

    // If the first line contains "Symbol Name", preceded by a tab, it's probably
    // a deep copy from OS X Instruments.app
    if (/^[\w \t\(\)]*\tSymbol Name/.exec(contents)) {
      console.log('Importing as Instruments.app deep copy')
      return toGroup(importFromInstrumentsDeepCopy(contents))
    }

    const fromLinuxPerf = importFromLinuxPerf(contents)
    if (fromLinuxPerf) {
      console.log('Importing from linux perf script output')
      return fromLinuxPerf
    }

    const fromBGFlameGraph = importFromBGFlameGraph(contents)
    if (fromBGFlameGraph) {
      console.log('Importing as collapsed stack format')
      return toGroup(fromBGFlameGraph)
    }
  }

  // Unrecognized format
  return null
}

export async function importFromFileSystemDirectoryEntry(entry: FileSystemDirectoryEntry) {
  return importFromInstrumentsTrace(entry)
}
