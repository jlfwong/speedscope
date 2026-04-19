/**
 * Import engine contracts and URL/hash parsing helpers for the legacy-vs-experimental seam.
 *
 * **Oracle:** `legacy` is the canonical importer (`importLegacyProfileGroup` in `src/import/index.ts`).
 * **Experimental:** `experimental` routes through `importExperimentalProfileGroup` in `src/experimental/engine.ts`.
 * Dual-run parity uses `compareAgainst` + `comparisonMode`; defaults keep production on legacy only.
 */

export type ImportEngine = 'legacy' | 'experimental'

export type ImportComparisonMode = 'off' | 'warn' | 'error'

export interface ImportComparisonResult {
  fileName: string
  primaryEngine: ImportEngine
  secondaryEngine: ImportEngine
  equal: boolean
  summary: string
}

/** Options passed into `runImportEngine` / `importProfileGroup*` entry points. */
export interface ImportProfileOptions {
  /** Primary importer; omitted means {@link DEFAULT_IMPORT_ENGINE}. */
  engine?: ImportEngine
  /** Secondary engine for dual-run comparison; `null` disables comparison. */
  compareAgainst?: ImportEngine | null
  /** How to react when canonical snapshots differ (`off` = ignore). */
  comparisonMode?: ImportComparisonMode
  onComparison?: (result: ImportComparisonResult) => void
}

/** Production default: legacy path remains authoritative until cutover. */
export const DEFAULT_IMPORT_ENGINE: ImportEngine = 'legacy'

/** Normalized engine choice, or `undefined` when the string is not a known engine (caller may treat as invalid). */
export function normalizeImportEngine(value: string | null | undefined): ImportEngine | undefined {
  if (value === 'legacy' || value === 'experimental') {
    return value
  }
  return undefined
}

/** Resolve an optional engine to a concrete primary engine. */
export function resolveImportEngine(engine?: ImportEngine): ImportEngine {
  return engine ?? DEFAULT_IMPORT_ENGINE
}

export function shouldCompareImport(value: string | null | undefined): boolean {
  if (value == null) return false
  return value === '1' || value === 'true' || value === 'yes'
}

/**
 * When `compareImport` is enabled, returns the opposite engine so the secondary path can be checked
 * against the primary (legacy oracle vs experimental).
 */
export function getComparisonTarget(engine: ImportEngine, compareImport: boolean): ImportEngine | null {
  if (!compareImport) {
    return null
  }
  return engine === 'experimental' ? 'legacy' : 'experimental'
}
