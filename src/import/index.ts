import {Profile, ProfileGroup} from '../lib/profile'

import {
  importFromChromeCPUProfile,
  importFromChromeTimeline,
  isChromeTimeline,
  importFromOldV8CPUProfile,
  isChromeTimelineObject,
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
import {importFromPapyrus} from './papyrus'
import {importFromPMCStatCallGraph} from './pmcstat-callgraph'
import {
  DEFAULT_IMPORT_ENGINE,
  ImportComparisonMode,
  ImportComparisonResult,
  ImportEngine,
  ImportProfileOptions,
} from '../experimental/contracts'
import {
  canonicalizeProfileGroup,
  importExperimentalFromDirectoryEntry,
  importExperimentalProfileGroup,
  runImportEngine,
} from '../experimental/engine'

interface ResolvedImportOptions {
  compareAgainst: ImportEngine | null
  comparisonMode: ImportComparisonMode
  engine: ImportEngine
  onComparison?: (result: ImportComparisonResult) => void
}

function resolveImportOptions(options?: ImportProfileOptions): ResolvedImportOptions {
  return {
    engine: options?.engine ?? DEFAULT_IMPORT_ENGINE,
    compareAgainst: options?.compareAgainst ?? null,
    comparisonMode: options?.comparisonMode ?? 'off',
    onComparison: options?.onComparison,
  }
}

function finalizeImportedProfileGroup(
  fileName: string,
  profileGroup: ProfileGroup | null,
): ProfileGroup | null {
  if (!profileGroup) {
    return null
  }
  if (!profileGroup.name) {
    profileGroup.name = fileName
  }
  for (const profile of profileGroup.profiles) {
    if (!profile.getName()) {
      profile.setName(fileName)
    }
  }
  return profileGroup
}

function summarizeCanonicalProfileGroup(profileGroup: ProfileGroup): string {
  const canonical = canonicalizeProfileGroup(profileGroup)
  return [
    `profiles=${canonical.profiles.length}`,
    `frames=${canonical.shared.frames.length}`,
    `active=${canonical.activeProfileIndex}`,
    `names=${canonical.profiles.map(profile => profile.name).join('|')}`,
  ].join(', ')
}

function createComparisonResult(
  fileName: string,
  primaryEngine: ImportEngine,
  secondaryEngine: ImportEngine,
  primaryResult: ProfileGroup | null,
  secondaryResult: ProfileGroup | null,
): ImportComparisonResult {
  if (primaryResult == null && secondaryResult == null) {
    return {
      fileName,
      primaryEngine,
      secondaryEngine,
      equal: true,
      summary: `Both ${primaryEngine} and ${secondaryEngine} rejected ${fileName} as unsupported.`,
    }
  }

  if (primaryResult == null || secondaryResult == null) {
    return {
      fileName,
      primaryEngine,
      secondaryEngine,
      equal: false,
      summary: `${primaryEngine} returned ${
        primaryResult == null ? 'null' : 'a profile group'
      } while ${secondaryEngine} returned ${
        secondaryResult == null ? 'null' : 'a profile group'
      } for ${fileName}.`,
    }
  }

  const primaryJSON = JSON.stringify(canonicalizeProfileGroup(primaryResult))
  const secondaryJSON = JSON.stringify(canonicalizeProfileGroup(secondaryResult))
  if (primaryJSON === secondaryJSON) {
    return {
      fileName,
      primaryEngine,
      secondaryEngine,
      equal: true,
      summary: `${primaryEngine} matched ${secondaryEngine} for ${fileName} (${summarizeCanonicalProfileGroup(
        primaryResult,
      )}).`,
    }
  }

  return {
    fileName,
    primaryEngine,
    secondaryEngine,
    equal: false,
    summary: `${primaryEngine} diverged from ${secondaryEngine} for ${fileName}. ${primaryEngine}: ${summarizeCanonicalProfileGroup(
      primaryResult,
    )}. ${secondaryEngine}: ${summarizeCanonicalProfileGroup(secondaryResult)}.`,
  }
}

function createComparisonFailureResult(
  fileName: string,
  primaryEngine: ImportEngine,
  secondaryEngine: ImportEngine,
  primaryResult: ProfileGroup | null,
  error: unknown,
): ImportComparisonResult {
  const errorMessage = error instanceof Error ? error.message : String(error)
  return {
    fileName,
    primaryEngine,
    secondaryEngine,
    equal: false,
    summary: `${secondaryEngine} threw while comparing ${fileName}: ${errorMessage}. ${primaryEngine} returned ${
      primaryResult == null ? 'null' : 'a profile group'
    }.`,
  }
}

function handleComparisonResult(
  result: ImportComparisonResult,
  options: ResolvedImportOptions,
  comparisonError?: unknown,
): void {
  if (options.compareAgainst == null) {
    return
  }
  options.onComparison?.(result)
  if (result.equal || options.comparisonMode === 'off') {
    return
  }
  if (options.comparisonMode === 'warn') {
    console.warn(result.summary)
    return
  }
  if (comparisonError instanceof Error) {
    throw comparisonError
  }
  throw new Error(result.summary)
}

async function importWithEngine(
  engine: ImportEngine,
  dataSource: ProfileDataSource,
): Promise<ProfileGroup | null> {
  return engine === 'experimental'
    ? importExperimentalProfileGroup(dataSource)
    : importLegacyProfileGroup(dataSource)
}

async function compareImportedProfileGroup(
  fileName: string,
  options: ResolvedImportOptions,
  primaryResult: ProfileGroup | null,
  loadComparison: () => Promise<ProfileGroup | null>,
): Promise<void> {
  if (options.compareAgainst == null) {
    return
  }
  try {
    const comparisonResult = finalizeImportedProfileGroup(fileName, await loadComparison())
    handleComparisonResult(
      createComparisonResult(
        fileName,
        options.engine,
        options.compareAgainst,
        primaryResult,
        comparisonResult,
      ),
      options,
    )
  } catch (error) {
    handleComparisonResult(
      createComparisonFailureResult(
        fileName,
        options.engine,
        options.compareAgainst,
        primaryResult,
        error,
      ),
      options,
      error,
    )
  }
}

async function importLegacyFromDirectoryEntry(
  entry: FileSystemDirectoryEntry,
): Promise<ProfileGroup | null> {
  return importFromInstrumentsTrace(entry)
}

export async function importProfileGroupFromText(
  fileName: string,
  contents: string,
  options?: ImportProfileOptions,
): Promise<ProfileGroup | null> {
  return await importProfileGroup(new TextProfileDataSource(fileName, contents), options)
}

export async function importProfileGroupFromBase64(
  fileName: string,
  b64contents: string,
  options?: ImportProfileOptions,
): Promise<ProfileGroup | null> {
  return await importProfileGroup(
    MaybeCompressedDataReader.fromArrayBuffer(
      fileName,
      decodeBase64(b64contents).buffer as ArrayBuffer,
    ),
    options,
  )
}

export async function importProfilesFromFile(
  file: File,
  options?: ImportProfileOptions,
): Promise<ProfileGroup | null> {
  return importProfileGroup(MaybeCompressedDataReader.fromFile(file), options)
}

export async function importProfilesFromArrayBuffer(
  fileName: string,
  buffer: ArrayBuffer,
  options?: ImportProfileOptions,
): Promise<ProfileGroup | null> {
  return importProfileGroup(MaybeCompressedDataReader.fromArrayBuffer(fileName, buffer), options)
}

/** Public import entry: delegates to `runImportEngine` with legacy as the oracle importer. */
async function importProfileGroup(
  dataSource: ProfileDataSource,
  options?: ImportProfileOptions,
): Promise<ProfileGroup | null> {
  const resolvedOptions = resolveImportOptions(options)
  if (resolvedOptions.compareAgainst != null) {
    const fileName = await dataSource.name()
    const primaryResult = finalizeImportedProfileGroup(
      fileName,
      await importWithEngine(resolvedOptions.engine, dataSource),
    )
    await compareImportedProfileGroup(fileName, resolvedOptions, primaryResult, () =>
      importWithEngine(resolvedOptions.compareAgainst!, dataSource),
    )
    return primaryResult
  }
  return runImportEngine(dataSource, importLegacyProfileGroup, options)
}

function toGroup(profile: Profile | null): ProfileGroup | null {
  if (!profile) return null
  return {name: profile.getName(), indexToView: 0, profiles: [profile]}
}

function looksLikeJfrRecording(buffer: ArrayBuffer) {
  const header = new Uint8Array(buffer.slice(0, 3))
  return header[0] === 0x46 && header[1] === 0x4c && header[2] === 0x52
}

async function importJfrProfileGroup(fileName: string, buffer: ArrayBuffer) {
  const {importFromJfr} = await import('./java-flight-recorder')
  return importFromJfr(fileName, buffer)
}

async function importLegacyProfileGroup(
  dataSource: ProfileDataSource,
): Promise<ProfileGroup | null> {
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
    return importSpeedscopeProfiles(contents.parseAsJSON())
  } else if (/Trace-\d{8}T\d{6}/.exec(fileName)) {
    console.log('Importing as Chrome Timeline Object')
    return importFromChromeTimeline(contents.parseAsJSON().traceEvents, fileName)
  } else if (fileName.endsWith('.chrome.json') || /Profile-\d{8}T\d{6}/.exec(fileName)) {
    console.log('Importing as Chrome Timeline')
    return importFromChromeTimeline(contents.parseAsJSON(), fileName)
  } else if (fileName.endsWith('.stackprof.json')) {
    console.log('Importing as stackprof profile')
    return toGroup(importFromStackprof(contents.parseAsJSON()))
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
    return toGroup(importFromV8ProfLog(contents.parseAsJSON()))
  } else if (fileName.endsWith('.heapprofile')) {
    console.log('Importing as Chrome Heap Profile')
    return toGroup(importFromChromeHeapProfile(contents.parseAsJSON()))
  } else if (fileName.endsWith('-recording.json')) {
    console.log('Importing as Safari profile')
    return toGroup(importFromSafari(contents.parseAsJSON()))
  } else if (fileName.startsWith('callgrind.')) {
    console.log('Importing as Callgrind profile')
    return importFromCallgrind(contents, fileName)
  } else if (fileName.endsWith('.pmcstat.graph')) {
    console.log('Importing as pmcstat callgraph format')
    return toGroup(importFromPMCStatCallGraph(contents))
  } else if (fileName.endsWith('.jfr')) {
    console.log('Importing as Java Flight Recorder profile')
    return await importJfrProfileGroup(fileName, buffer)
  }

  // Second pass: Try to guess what file format it is based on structure
  let parsed: any
  try {
    parsed = contents.parseAsJSON()
  } catch (e) {}
  if (parsed) {
    if (parsed['$schema'] === 'https://www.speedscope.app/file-format-schema.json') {
      console.log('Importing as speedscope json file')
      return importSpeedscopeProfiles(parsed)
    } else if (parsed['systemHost'] && parsed['systemHost']['name'] == 'Firefox') {
      console.log('Importing as Firefox profile')
      return toGroup(importFromFirefox(parsed))
    } else if (isChromeTimeline(parsed)) {
      console.log('Importing as Chrome Timeline')
      return importFromChromeTimeline(parsed, fileName)
    } else if (isChromeTimelineObject(parsed)) {
      console.log('Importing as Chrome Timeline Object')
      return importFromChromeTimeline(parsed.traceEvents, fileName)
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
      return toGroup(importFromChromeHeapProfile(parsed))
    } else if ('rts_arguments' in parsed && 'initial_capabilities' in parsed) {
      console.log('Importing as Haskell GHC JSON Profile')
      return importFromHaskell(parsed)
    } else if ('recording' in parsed && 'sampleStackTraces' in parsed.recording) {
      console.log('Importing as Safari profile')
      return toGroup(importFromSafari(parsed))
    }
  } else {
    // Format is not JSON

    // If the first line is "# callgrind format", it's probably in Callgrind
    // Profile Format.
    if (
      /^# callgrind format/.exec(contents.firstChunk()) ||
      (/^events:/m.exec(contents.firstChunk()) && /^fn=/m.exec(contents.firstChunk()))
    ) {
      console.log('Importing as Callgrind profile')
      return importFromCallgrind(contents, fileName)
    }

    // If the first line contains "Symbol Name", preceded by a tab, it's probably
    // a deep copy from OS X Instruments.app
    if (/^[\w \t\(\)]*\tSymbol Name/.exec(contents.firstChunk())) {
      console.log('Importing as Instruments.app deep copy')
      return toGroup(importFromInstrumentsDeepCopy(contents))
    }

    if (/^(Stack_|Script_|Obj_)\S+ log opened \(PC\)\n/.exec(contents.firstChunk())) {
      console.log('Importing as Papyrus profile')
      return toGroup(importFromPapyrus(contents))
    }

    if (looksLikeJfrRecording(buffer)) {
      console.log('Importing as Java Flight Recorder profile')
      return importJfrProfileGroup(fileName, buffer)
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

    const fromPMCStatCallGraph = importFromPMCStatCallGraph(contents)
    if (fromPMCStatCallGraph) {
      console.log('Importing as pmcstat callgraph format')
      return toGroup(fromPMCStatCallGraph)
    }
  }

  // Unrecognized format
  return null
}

export async function importFromFileSystemDirectoryEntry(
  entry: FileSystemDirectoryEntry,
  options?: ImportProfileOptions,
) {
  const resolvedOptions = resolveImportOptions(options)
  const primaryResult = finalizeImportedProfileGroup(
    entry.name,
    await (resolvedOptions.engine === 'experimental'
      ? importExperimentalFromDirectoryEntry(entry)
      : importLegacyFromDirectoryEntry(entry)),
  )
  await compareImportedProfileGroup(entry.name, resolvedOptions, primaryResult, () =>
    resolvedOptions.compareAgainst === 'experimental'
      ? importExperimentalFromDirectoryEntry(entry)
      : importLegacyFromDirectoryEntry(entry),
  )
  return primaryResult
}
