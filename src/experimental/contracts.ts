export type ImportEngine = 'legacy' | 'experimental'

export type ImportComparisonMode = 'off' | 'warn' | 'error'

export interface ImportComparisonResult {
  fileName: string
  primaryEngine: ImportEngine
  secondaryEngine: ImportEngine
  equal: boolean
  summary: string
}

export interface ImportProfileOptions {
  engine?: ImportEngine
  compareAgainst?: ImportEngine | null
  comparisonMode?: ImportComparisonMode
  onComparison?: (result: ImportComparisonResult) => void
}

export const DEFAULT_IMPORT_ENGINE: ImportEngine = 'legacy'

export function normalizeImportEngine(value: string | null | undefined): ImportEngine | undefined {
  if (value === 'legacy' || value === 'experimental') {
    return value
  }
  return undefined
}

export function shouldCompareImport(value: string | null | undefined): boolean {
  if (value == null) return false
  return value === '1' || value === 'true' || value === 'yes'
}

export function getComparisonTarget(engine: ImportEngine, compareImport: boolean): ImportEngine | null {
  if (!compareImport) {
    return null
  }
  return engine === 'experimental' ? 'legacy' : 'experimental'
}
