import {ImportEngine, normalizeImportEngine} from './contracts'

declare const __SPEEDSCOPE_DEFAULT_IMPORT_ENGINE__: string | undefined

export function resolveConfiguredImportEngine(
  value: string | undefined | null,
): ImportEngine | undefined {
  return normalizeImportEngine(value)
}

export function getConfiguredDefaultImportEngine(): ImportEngine | undefined {
  return resolveConfiguredImportEngine(
    typeof __SPEEDSCOPE_DEFAULT_IMPORT_ENGINE__ === 'string'
      ? __SPEEDSCOPE_DEFAULT_IMPORT_ENGINE__
      : undefined,
  )
}
