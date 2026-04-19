export interface BrowserBenchmarkLoadRecord {
  id: number
  fileName: string
  engine: string | null
  startedAt: number
  importFinishedAt: number | null
  profileAppliedAt: number | null
  firstFlamechartPaintAt: number | null
  errorAt: number | null
  errorMessage: string | null
}

export interface BrowserBenchmarkState {
  currentLoadId: number | null
  loads: BrowserBenchmarkLoadRecord[]
  nextLoadId: number
}

declare global {
  interface Window {
    __SPEEDSCOPE_BENCHMARK__?: BrowserBenchmarkState
  }
}

function canUseWindow() {
  return typeof window !== 'undefined'
}

function createState(): BrowserBenchmarkState {
  return {
    currentLoadId: null,
    loads: [],
    nextLoadId: 1,
  }
}

function getState(): BrowserBenchmarkState | null {
  if (!canUseWindow()) {
    return null
  }
  if (window.__SPEEDSCOPE_BENCHMARK__ == null) {
    window.__SPEEDSCOPE_BENCHMARK__ = createState()
  }
  return window.__SPEEDSCOPE_BENCHMARK__
}

function getCurrentLoad(state: BrowserBenchmarkState): BrowserBenchmarkLoadRecord | null {
  if (state.currentLoadId == null) {
    return null
  }
  const last = state.loads[state.loads.length - 1]
  if (last != null && last.id === state.currentLoadId) {
    return last
  }
  return state.loads.find(load => load.id === state.currentLoadId) || null
}

export function beginBrowserBenchmarkLoad({
  fileName,
  engine,
}: {
  fileName: string
  engine: string | null | undefined
}) {
  const state = getState()
  if (state == null) {
    return
  }

  const load: BrowserBenchmarkLoadRecord = {
    id: state.nextLoadId++,
    fileName,
    engine: engine ?? null,
    startedAt: performance.now(),
    importFinishedAt: null,
    profileAppliedAt: null,
    firstFlamechartPaintAt: null,
    errorAt: null,
    errorMessage: null,
  }
  state.currentLoadId = load.id
  state.loads.push(load)
}

export function markBrowserBenchmarkImportFinished() {
  const state = getState()
  if (state == null) {
    return
  }
  const load = getCurrentLoad(state)
  if (load != null && load.importFinishedAt == null) {
    load.importFinishedAt = performance.now()
  }
}

export function markBrowserBenchmarkProfileApplied() {
  const state = getState()
  if (state == null) {
    return
  }
  const load = getCurrentLoad(state)
  if (load != null && load.profileAppliedAt == null) {
    load.profileAppliedAt = performance.now()
  }
}

export function markBrowserBenchmarkFlamechartPaint() {
  const state = getState()
  if (state == null) {
    return
  }
  const load = getCurrentLoad(state)
  if (load != null && load.firstFlamechartPaintAt == null) {
    load.firstFlamechartPaintAt = performance.now()
    state.currentLoadId = null
  }
}

export function markBrowserBenchmarkError(message: string) {
  const state = getState()
  if (state == null) {
    return
  }
  const load = getCurrentLoad(state)
  if (load != null) {
    if (load.errorAt == null) {
      load.errorAt = performance.now()
    }
    load.errorMessage = message
    state.currentLoadId = null
  }
}
