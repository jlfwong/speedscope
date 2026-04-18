import {exportProfileGroup, importSpeedscopeProfiles} from '../lib/file-format'
import {FileFormat} from '../lib/file-format-spec'
import {Profile, ProfileGroup} from '../lib/profile'
import {
  importFromChromeCPUProfile,
  importFromChromeTimeline,
  importFromOldV8CPUProfile,
  isChromeTimeline,
  isChromeTimelineObject,
} from '../import/chrome'
import {importFromStackprof} from '../import/stackprof'
import {importFromInstrumentsDeepCopy, importFromInstrumentsTrace} from '../import/instruments'
import {importFromBGFlameGraph} from '../import/bg-flamegraph'
import {importFromFirefox} from '../import/firefox'
import {importFromV8ProfLog} from '../import/v8proflog'
import {importFromLinuxPerf} from '../import/linux-tools-perf'
import {importFromHaskell} from '../import/haskell'
import {importFromSafari} from '../import/safari'
import {ProfileDataSource, TextFileContent} from '../import/utils'
import {importAsPprofProfile} from '../import/pprof'
import {importFromChromeHeapProfile} from '../import/v8heapalloc'
import {importTraceEvents, isTraceEventFormatted} from '../import/trace-event'
import {importFromCallgrind} from '../import/callgrind'
import {importFromPapyrus} from '../import/papyrus'
import {importFromPMCStatCallGraph} from '../import/pmcstat-callgraph'
import {
  DEFAULT_IMPORT_ENGINE,
  ImportComparisonMode,
  ImportComparisonResult,
  ImportEngine,
  ImportProfileOptions,
} from './contracts'

interface ExperimentalImportContext {
  buffer: ArrayBuffer
  contents: TextFileContent
  dataSource: ProfileDataSource
  fileName: string
  parsed: any
}

interface ResolvedImportOptions {
  compareAgainst: ImportEngine | null
  comparisonMode: ImportComparisonMode
  engine: ImportEngine
  onComparison?: (result: ImportComparisonResult) => void
}

type CanonicalScalar = boolean | number | string | null
type CanonicalValue = CanonicalScalar | CanonicalValue[] | {[key: string]: CanonicalValue}

export interface CanonicalDiffEntry {
  path: string
  primary: string
  secondary: string
}

export interface DetailedImportComparisonResult extends ImportComparisonResult {
  primarySummary?: string
  secondarySummary?: string
  canonicalDiff?: CanonicalDiffEntry[]
  canonicalDiffTruncated?: boolean
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
  const {importFromJfr} = await import('../import/java-flight-recorder')
  return importFromJfr(fileName, buffer)
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

function tryParseJSON(contents: TextFileContent): any {
  try {
    return contents.parseAsJSON()
  } catch (error) {
    return null
  }
}

function logAndReturn(label: string, profileGroup: ProfileGroup | null): ProfileGroup | null {
  if (profileGroup) {
    console.log(label)
  }
  return profileGroup
}

function importSpeedscopeFormat(fileName: string, parsed: any): ProfileGroup | null {
  if (fileName.endsWith('.speedscope.json')) {
    return logAndReturn('Importing as speedscope json file', importSpeedscopeProfiles(parsed))
  }
  if (parsed && parsed['$schema'] === 'https://www.speedscope.app/file-format-schema.json') {
    return logAndReturn('Importing as speedscope json file', importSpeedscopeProfiles(parsed))
  }
  return null
}

function importChromeTraceV8FamilyByFileName({
  buffer,
  contents,
  fileName,
}: ExperimentalImportContext): ProfileGroup | null {
  if (/Trace-\d{8}T\d{6}/.exec(fileName)) {
    return logAndReturn(
      'Importing as Chrome Timeline Object',
      importFromChromeTimeline(contents.parseAsJSON().traceEvents, fileName),
    )
  }
  if (fileName.endsWith('.chrome.json') || /Profile-\d{8}T\d{6}/.exec(fileName)) {
    return logAndReturn(
      'Importing as Chrome Timeline',
      importFromChromeTimeline(contents.parseAsJSON(), fileName),
    )
  }
  if (fileName.endsWith('.v8log.json')) {
    return logAndReturn(
      'Importing as --prof-process v8 log',
      toGroup(importFromV8ProfLog(contents.parseAsJSON())),
    )
  }
  if (fileName.endsWith('.heapprofile')) {
    return logAndReturn(
      'Importing as Chrome Heap Profile',
      toGroup(importFromChromeHeapProfile(contents.parseAsJSON())),
    )
  }
  if (fileName.endsWith('.jfr')) {
    return logAndReturn('Importing as Java Flight Recorder profile', null)
  }
  if (looksLikeJfrRecording(buffer)) {
    return null
  }
  return null
}

function importChromeTraceV8FamilyByStructure({
  fileName,
  parsed,
}: ExperimentalImportContext): ProfileGroup | null {
  if (!parsed) {
    return null
  }
  if (isChromeTimeline(parsed)) {
    return logAndReturn('Importing as Chrome Timeline', importFromChromeTimeline(parsed, fileName))
  }
  if (isChromeTimelineObject(parsed)) {
    return logAndReturn(
      'Importing as Chrome Timeline Object',
      importFromChromeTimeline(parsed.traceEvents, fileName),
    )
  }
  if ('nodes' in parsed && 'samples' in parsed && 'timeDeltas' in parsed) {
    return logAndReturn(
      'Importing as Chrome CPU Profile',
      toGroup(importFromChromeCPUProfile(parsed)),
    )
  }
  if (isTraceEventFormatted(parsed)) {
    return logAndReturn('Importing as Trace Event Format profile', importTraceEvents(parsed))
  }
  if ('head' in parsed && 'samples' in parsed && 'timestamps' in parsed) {
    return logAndReturn(
      'Importing as Chrome CPU Profile (old format)',
      toGroup(importFromOldV8CPUProfile(parsed)),
    )
  }
  if ('code' in parsed && 'functions' in parsed && 'ticks' in parsed) {
    return logAndReturn('Importing as --prof-process v8 log', toGroup(importFromV8ProfLog(parsed)))
  }
  if ('head' in parsed && 'selfSize' in parsed['head']) {
    return logAndReturn(
      'Importing as Chrome Heap Profile',
      toGroup(importFromChromeHeapProfile(parsed)),
    )
  }
  return null
}

function importTextFamilyByFileName({
  contents,
  fileName,
}: ExperimentalImportContext): ProfileGroup | null {
  if (fileName.endsWith('.stackprof.json')) {
    return logAndReturn('Importing as stackprof profile', toGroup(importFromStackprof(contents.parseAsJSON())))
  }
  if (fileName.endsWith('.linux-perf.txt')) {
    return logAndReturn('Importing as output of linux perf script', importFromLinuxPerf(contents))
  }
  if (fileName.endsWith('.collapsedstack.txt')) {
    return logAndReturn('Importing as collapsed stack format', toGroup(importFromBGFlameGraph(contents)))
  }
  if (fileName.endsWith('.pmcstat.graph')) {
    return logAndReturn(
      'Importing as pmcstat callgraph format',
      toGroup(importFromPMCStatCallGraph(contents)),
    )
  }
  return null
}

function importTextFamilyByStructure({contents, parsed}: ExperimentalImportContext): ProfileGroup | null {
  if (parsed && 'mode' in parsed && 'frames' in parsed && 'raw_timestamp_deltas' in parsed) {
    return logAndReturn('Importing as stackprof profile', toGroup(importFromStackprof(parsed)))
  }
  if (!parsed) {
    const firstChunk = contents.firstChunk()
    if (/^(Stack_|Script_|Obj_)\S+ log opened \(PC\)\n/.exec(firstChunk)) {
      return logAndReturn('Importing as Papyrus profile', toGroup(importFromPapyrus(contents)))
    }
    const fromLinuxPerf = importFromLinuxPerf(contents)
    if (fromLinuxPerf) {
      return logAndReturn('Importing from linux perf script output', fromLinuxPerf)
    }
    const fromBGFlameGraph = importFromBGFlameGraph(contents)
    if (fromBGFlameGraph) {
      return logAndReturn('Importing as collapsed stack format', toGroup(fromBGFlameGraph))
    }
    const fromPMCStatCallGraph = importFromPMCStatCallGraph(contents)
    if (fromPMCStatCallGraph) {
      return logAndReturn('Importing as pmcstat callgraph format', toGroup(fromPMCStatCallGraph))
    }
  }
  return null
}

function importBinaryFamilyByBuffer({buffer, fileName}: ExperimentalImportContext): ProfileGroup | null {
  const pprofProfile = importAsPprofProfile(buffer)
  if (pprofProfile) {
    return logAndReturn('Importing as protobuf encoded pprof file', toGroup(pprofProfile))
  }
  if (fileName.endsWith('.jfr') || looksLikeJfrRecording(buffer)) {
    return null
  }
  return null
}

async function importBinaryFamilyByStructure(
  context: ExperimentalImportContext,
): Promise<ProfileGroup | null> {
  if (context.fileName.endsWith('.jfr') || (!context.parsed && looksLikeJfrRecording(context.buffer))) {
    return logAndReturn(
      'Importing as Java Flight Recorder profile',
      await importJfrProfileGroup(context.fileName, context.buffer),
    )
  }
  return null
}

function importLegacyComplexFamilyByFileName({
  contents,
  fileName,
}: ExperimentalImportContext): ProfileGroup | null {
  if (fileName.endsWith('.instruments.txt')) {
    return logAndReturn(
      'Importing as Instruments.app deep copy',
      toGroup(importFromInstrumentsDeepCopy(contents)),
    )
  }
  if (fileName.endsWith('-recording.json')) {
    return logAndReturn('Importing as Safari profile', toGroup(importFromSafari(contents.parseAsJSON())))
  }
  if (fileName.startsWith('callgrind.')) {
    return logAndReturn('Importing as Callgrind profile', importFromCallgrind(contents, fileName))
  }
  return null
}

function importLegacyComplexFamilyByStructure({
  contents,
  fileName,
  parsed,
}: ExperimentalImportContext): ProfileGroup | null {
  if (parsed) {
    if (parsed['systemHost'] && parsed['systemHost']['name'] === 'Firefox') {
      return logAndReturn('Importing as Firefox profile', toGroup(importFromFirefox(parsed)))
    }
    if ('rts_arguments' in parsed && 'initial_capabilities' in parsed) {
      return logAndReturn('Importing as Haskell GHC JSON Profile', importFromHaskell(parsed))
    }
    if ('recording' in parsed && 'sampleStackTraces' in parsed.recording) {
      return logAndReturn('Importing as Safari profile', toGroup(importFromSafari(parsed)))
    }
    return null
  }

  const firstChunk = contents.firstChunk()
  if (
    /^# callgrind format/.exec(firstChunk) ||
    (/^events:/m.exec(firstChunk) && /^fn=/m.exec(firstChunk))
  ) {
    return logAndReturn('Importing as Callgrind profile', importFromCallgrind(contents, fileName))
  }
  if (/^[\w \t\(\)]*\tSymbol Name/.exec(firstChunk)) {
    return logAndReturn(
      'Importing as Instruments.app deep copy',
      toGroup(importFromInstrumentsDeepCopy(contents)),
    )
  }
  return null
}

export function canonicalizeProfileGroup(profileGroup: ProfileGroup): FileFormat.File {
  // Sort object keys recursively so legacy and future experimental exporters
  // compare by structure rather than construction order.
  return normalizeCanonicalValue(exportProfileGroup(profileGroup)) as unknown as FileFormat.File
}

function summarizeCanonicalFile(file: FileFormat.File): string {
  return [
    `profiles=${file.profiles.length}`,
    `frames=${file.shared.frames.length}`,
    `active=${file.activeProfileIndex}`,
    `names=${file.profiles.map(profile => profile.name).join('|')}`,
  ].join(', ')
}

function normalizeCanonicalValue(value: unknown): CanonicalValue {
  if (value == null) {
    return null
  }

  if (typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string') {
    return value
  }

  if (Array.isArray(value)) {
    return value.map(item => normalizeCanonicalValue(item))
  }

  if (typeof value === 'object') {
    const normalized: {[key: string]: CanonicalValue} = {}
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      const nestedValue = (value as Record<string, unknown>)[key]
      if (nestedValue === undefined) {
        continue
      }
      normalized[key] = normalizeCanonicalValue(nestedValue)
    }
    return normalized
  }

  return String(value)
}

function formatCanonicalPreview(value: unknown): string {
  const json = JSON.stringify(value)
  if (json != null && json.length <= 120) {
    return json
  }

  if (Array.isArray(value)) {
    return `Array(len=${value.length})`
  }

  if (value != null && typeof value === 'object') {
    const keys = Object.keys(value as Record<string, unknown>)
    const preview = keys.slice(0, 4).join(', ')
    return `Object(keys=${preview}${keys.length > 4 ? ', ...' : ''})`
  }

  return String(value)
}

function appendObjectPath(path: string, key: string): string {
  return `${path}.${key}`
}

function appendArrayPath(path: string, index: number): string {
  return `${path}[${index}]`
}

function collectCanonicalDiff(
  primary: unknown,
  secondary: unknown,
  limit = 4,
): {entries: CanonicalDiffEntry[]; truncated: boolean} {
  const entries: CanonicalDiffEntry[] = []
  let truncated = false

  const pushPreview = (path: string, primaryValue: unknown, secondaryValue: unknown) => {
    if (entries.length >= limit) {
      truncated = true
      return
    }

    entries.push({
      path,
      primary: formatCanonicalPreview(primaryValue),
      secondary: formatCanonicalPreview(secondaryValue),
    })
  }

  const pushLabel = (path: string, primaryValue: string, secondaryValue: string) => {
    if (entries.length >= limit) {
      truncated = true
      return
    }

    entries.push({
      path,
      primary: primaryValue,
      secondary: secondaryValue,
    })
  }

  const walk = (primaryValue: unknown, secondaryValue: unknown, path: string) => {
    if (entries.length >= limit) {
      truncated = true
      return
    }

    if (primaryValue === secondaryValue) {
      return
    }

    const primaryIsArray = Array.isArray(primaryValue)
    const secondaryIsArray = Array.isArray(secondaryValue)
    if (primaryIsArray || secondaryIsArray) {
      if (!primaryIsArray || !secondaryIsArray) {
        pushPreview(path, primaryValue, secondaryValue)
        return
      }

      if (primaryValue.length !== secondaryValue.length) {
        pushPreview(`${path}.length`, primaryValue.length, secondaryValue.length)
      }

      const maxLength = Math.max(primaryValue.length, secondaryValue.length)
      for (let index = 0; index < maxLength; index++) {
        const hasPrimary = index < primaryValue.length
        const hasSecondary = index < secondaryValue.length
        const nextPath = appendArrayPath(path, index)

        if (!hasPrimary || !hasSecondary) {
          pushLabel(
            nextPath,
            hasPrimary ? formatCanonicalPreview(primaryValue[index]) : '(missing)',
            hasSecondary ? formatCanonicalPreview(secondaryValue[index]) : '(missing)',
          )
          continue
        }

        walk(primaryValue[index], secondaryValue[index], nextPath)
      }
      return
    }

    const primaryIsObject = primaryValue != null && typeof primaryValue === 'object'
    const secondaryIsObject = secondaryValue != null && typeof secondaryValue === 'object'
    if (primaryIsObject || secondaryIsObject) {
      if (!primaryIsObject || !secondaryIsObject) {
        pushPreview(path, primaryValue, secondaryValue)
        return
      }

      const primaryObject = primaryValue as {[key: string]: CanonicalValue}
      const secondaryObject = secondaryValue as {[key: string]: CanonicalValue}
      const keys = [...new Set([...Object.keys(primaryObject), ...Object.keys(secondaryObject)])].sort()

      for (const key of keys) {
        const hasPrimary = Object.prototype.hasOwnProperty.call(primaryObject, key)
        const hasSecondary = Object.prototype.hasOwnProperty.call(secondaryObject, key)
        const nextPath = appendObjectPath(path, key)

        if (!hasPrimary || !hasSecondary) {
          pushLabel(
            nextPath,
            hasPrimary ? formatCanonicalPreview(primaryObject[key]) : '(missing)',
            hasSecondary ? formatCanonicalPreview(secondaryObject[key]) : '(missing)',
          )
          continue
        }

        walk(primaryObject[key], secondaryObject[key], nextPath)
      }
      return
    }

    pushPreview(path, primaryValue, secondaryValue)
  }

  walk(primary, secondary, '$')
  return {entries, truncated}
}

function summarizeCanonicalDiff(result: {entries: CanonicalDiffEntry[]; truncated: boolean}): string {
  if (result.entries.length === 0) {
    return ''
  }

  const entries = result.entries.map(entry => `${entry.path}: ${entry.primary} !== ${entry.secondary}`)
  return ` First differences: ${entries.join('; ')}${result.truncated ? '; ...' : ''}.`
}

function createComparisonResult(
  fileName: string,
  primaryEngine: ImportEngine,
  secondaryEngine: ImportEngine,
  primaryResult: ProfileGroup | null,
  secondaryResult: ProfileGroup | null,
): DetailedImportComparisonResult {
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
      summary: `${primaryEngine} returned ${primaryResult == null ? 'null' : 'a profile group'} while ${secondaryEngine} returned ${
        secondaryResult == null ? 'null' : 'a profile group'
      } for ${fileName}.`,
    }
  }

  const primaryCanonical = canonicalizeProfileGroup(primaryResult)
  const secondaryCanonical = canonicalizeProfileGroup(secondaryResult)
  const primarySummary = summarizeCanonicalFile(primaryCanonical)
  const secondarySummary = summarizeCanonicalFile(secondaryCanonical)
  const primaryJSON = JSON.stringify(primaryCanonical)
  const secondaryJSON = JSON.stringify(secondaryCanonical)

  if (primaryJSON === secondaryJSON) {
    return {
      fileName,
      primaryEngine,
      secondaryEngine,
      equal: true,
      primarySummary,
      secondarySummary,
      summary: `${primaryEngine} matched ${secondaryEngine} for ${fileName} (${primarySummary}).`,
    }
  }

  const canonicalDiff = collectCanonicalDiff(primaryCanonical, secondaryCanonical)
  return {
    fileName,
    primaryEngine,
    secondaryEngine,
    equal: false,
    primarySummary,
    secondarySummary,
    canonicalDiff: canonicalDiff.entries,
    canonicalDiffTruncated: canonicalDiff.truncated,
    summary: `${primaryEngine} diverged from ${secondaryEngine} for ${fileName}. ${primaryEngine}: ${primarySummary}. ${secondaryEngine}: ${secondarySummary}.${summarizeCanonicalDiff(
      canonicalDiff,
    )}`,
  }
}

function resolveImportOptions(options?: ImportProfileOptions): ResolvedImportOptions {
  return {
    engine: options?.engine ?? DEFAULT_IMPORT_ENGINE,
    compareAgainst: options?.compareAgainst ?? null,
    comparisonMode: options?.comparisonMode ?? 'off',
    onComparison: options?.onComparison,
  }
}

function handleComparisonResult(
  result: DetailedImportComparisonResult,
  options: ResolvedImportOptions,
): void {
  if (options.compareAgainst == null) {
    return
  }
  options.onComparison?.(result)
  if (result.equal || options.comparisonMode === 'off') {
    return
  }
  if (options.comparisonMode === 'warn') {
    if (options.onComparison == null) {
      console.warn(result.summary)
    }
    return
  }
  throw new Error(result.summary)
}

export async function importExperimentalProfileGroup(
  dataSource: ProfileDataSource,
): Promise<ProfileGroup | null> {
  const fileName = await dataSource.name()
  const buffer = await dataSource.readAsArrayBuffer()
  const contents = await dataSource.readAsText()
  const parsed = tryParseJSON(contents)
  const context: ExperimentalImportContext = {buffer, contents, dataSource, fileName, parsed}

  const passes: Array<() => Promise<ProfileGroup | null> | ProfileGroup | null> = [
    () => importBinaryFamilyByBuffer(context),
    () => importSpeedscopeFormat(fileName, parsed),
    () => importChromeTraceV8FamilyByFileName(context),
    () => importTextFamilyByFileName(context),
    () => importLegacyComplexFamilyByFileName(context),
    async () => importBinaryFamilyByStructure(context),
    () => importChromeTraceV8FamilyByStructure(context),
    () => importTextFamilyByStructure(context),
    () => importLegacyComplexFamilyByStructure(context),
  ]

  for (const pass of passes) {
    const profileGroup = await pass()
    if (profileGroup) {
      return profileGroup
    }
  }

  return null
}

export async function importExperimentalFromDirectoryEntry(
  entry: FileSystemDirectoryEntry,
): Promise<ProfileGroup | null> {
  return importFromInstrumentsTrace(entry)
}

export async function runImportEngine(
  dataSource: ProfileDataSource,
  legacyImporter: (dataSource: ProfileDataSource) => Promise<ProfileGroup | null>,
  options?: ImportProfileOptions,
): Promise<ProfileGroup | null> {
  const resolvedOptions = resolveImportOptions(options)
  const fileName = await dataSource.name()

  const primaryRaw =
    resolvedOptions.engine === 'experimental'
      ? await importExperimentalProfileGroup(dataSource)
      : await legacyImporter(dataSource)

  const primaryResult = finalizeImportedProfileGroup(fileName, primaryRaw)

  if (resolvedOptions.compareAgainst == null) {
    return primaryResult
  }

  const comparisonRaw =
    resolvedOptions.compareAgainst === 'experimental'
      ? await importExperimentalProfileGroup(dataSource)
      : await legacyImporter(dataSource)
  const comparisonResult = finalizeImportedProfileGroup(fileName, comparisonRaw)

  handleComparisonResult(
    createComparisonResult(
      fileName,
      resolvedOptions.engine,
      resolvedOptions.compareAgainst,
      primaryResult,
      comparisonResult,
    ),
    resolvedOptions,
  )

  return primaryResult
}
