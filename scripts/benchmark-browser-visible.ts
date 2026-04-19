import {ChildProcess, spawn} from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import {performance} from 'perf_hooks'
import {chromium, type Browser} from 'playwright'

type Engine = 'legacy' | 'experimental'

interface BrowserBenchmarkOptions {
  filePath: string
  headless: boolean
  host: string
  legacyPort: number
  experimentalPort: number
  runs: number
  startServers: boolean
  timeoutMs: number
}

interface BrowserBenchmarkLoadRecord {
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

interface BrowserBenchmarkRunResult {
  engine: Engine
  run: number
  fileName: string
  importMs: number | null
  profileAppliedMs: number | null
  firstFlamechartPaintMs: number | null
  uiOverheadMs: number | null
  wallClockMs: number
  errorMessage: string | null
}

const REPO_ROOT = process.cwd()
const TSX_PATH = path.resolve(
  REPO_ROOT,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'tsx.cmd' : 'tsx',
)

function getNumericArg(name: string, fallback: number): number {
  const prefix = `--${name}=`
  const entry = process.argv.slice(2).find(arg => arg.startsWith(prefix))
  if (entry == null) {
    return fallback
  }

  const value = Number(entry.slice(prefix.length))
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Expected --${name}=<positive number>, received ${entry}`)
  }

  return Math.floor(value)
}

function getBooleanArg(name: string, fallback: boolean): boolean {
  const prefix = `--${name}=`
  const entry = process.argv.slice(2).find(arg => arg.startsWith(prefix))
  if (entry == null) {
    return fallback
  }

  const value = entry.slice(prefix.length)
  return value === '1' || value === 'true' || value === 'yes'
}

function getStringArg(name: string, fallback: string): string {
  const prefix = `--${name}=`
  const entry = process.argv.slice(2).find(arg => arg.startsWith(prefix))
  return entry == null ? fallback : entry.slice(prefix.length)
}

function getOptions(): BrowserBenchmarkOptions {
  const filePath = getStringArg(
    'file',
    'demo/fixtures/generated/synthetic-sampled-2m-balanced-crossover.speedscope.json',
  )
  return {
    filePath: path.isAbsolute(filePath) ? filePath : path.resolve(REPO_ROOT, filePath),
    headless: getBooleanArg('headless', true),
    host: getStringArg('host', '127.0.0.1'),
    legacyPort: getNumericArg('legacy-port', 8000),
    experimentalPort: getNumericArg('experimental-port', 8001),
    runs: getNumericArg('runs', 1),
    startServers: getBooleanArg('start-servers', true),
    timeoutMs: getNumericArg('timeout-ms', 600000),
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function isHealthy(url: string): Promise<boolean> {
  try {
    const response = await fetch(url)
    return response.ok
  } catch (error) {
    return false
  }
}

async function waitForHealthy(url: string, timeoutMs: number) {
  const startedAt = Date.now()
  while (Date.now() - startedAt < timeoutMs) {
    if (await isHealthy(url)) {
      return
    }
    await sleep(250)
  }
  throw new Error(`Timed out waiting for ${url}`)
}

function startSideBySideServers(options: BrowserBenchmarkOptions): ChildProcess {
  return spawn(
    TSX_PATH,
    [
      'scripts/serve-side-by-side.ts',
      `--host=${options.host}`,
      `--legacy-port=${options.legacyPort}`,
      `--experimental-port=${options.experimentalPort}`,
    ],
    {
      cwd: REPO_ROOT,
      detached: process.platform !== 'win32',
      env: process.env,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  )
}

function stopChildProcess(child: ChildProcess | null) {
  if (child == null) {
    return
  }
  if (child.exitCode != null || child.signalCode != null) {
    return
  }

  if (process.platform !== 'win32' && child.pid != null) {
    try {
      process.kill(-child.pid, 'SIGTERM')
      return
    } catch (error) {
      // Fall through to direct kill if the process group is already gone.
    }
  }

  child.kill('SIGTERM')
}

async function ensureServers(options: BrowserBenchmarkOptions): Promise<ChildProcess | null> {
  const legacyUrl = `http://${options.host}:${options.legacyPort}/`
  const experimentalUrl = `http://${options.host}:${options.experimentalPort}/`

  const [legacyHealthy, experimentalHealthy] = await Promise.all([
    isHealthy(legacyUrl),
    isHealthy(experimentalUrl),
  ])

  if (legacyHealthy && experimentalHealthy) {
    return null
  }

  if (!options.startServers) {
    throw new Error(
      `Expected both benchmark servers to be running at ${legacyUrl} and ${experimentalUrl}`,
    )
  }

  const child = startSideBySideServers(options)
  await Promise.all([
    waitForHealthy(legacyUrl, options.timeoutMs),
    waitForHealthy(experimentalUrl, options.timeoutMs),
  ])
  return child
}

function toRelativePath(filePath: string) {
  return path.relative(REPO_ROOT, filePath) || filePath
}

function toElapsed(end: number | null, start: number): number | null {
  return end == null ? null : Number((end - start).toFixed(2))
}

function median(values: number[]): number | null {
  if (values.length === 0) {
    return null
  }
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? Number((((sorted[middle - 1] + sorted[middle]) / 2)).toFixed(2))
    : Number(sorted[middle].toFixed(2))
}

function collectNumbers(
  results: BrowserBenchmarkRunResult[],
  select: (result: BrowserBenchmarkRunResult) => number | null,
): number[] {
  const collected: number[] = []
  for (const result of results) {
    const value = select(result)
    if (value != null) {
      collected.push(value)
    }
  }
  return collected
}

function collectErrors(results: BrowserBenchmarkRunResult[]): string[] {
  const errors: string[] = []
  for (const result of results) {
    if (result.errorMessage != null) {
      errors.push(result.errorMessage)
    }
  }
  return errors
}

function summarize(results: BrowserBenchmarkRunResult[]) {
  const grouped = new Map<Engine, BrowserBenchmarkRunResult[]>()
  for (const result of results) {
    const existing = grouped.get(result.engine) || []
    existing.push(result)
    grouped.set(result.engine, existing)
  }

  return Array.from(grouped.entries()).map(([engine, engineResults]) => {
    const successful = engineResults.filter(result => result.errorMessage == null)
    return {
      engine,
      runs: engineResults.length,
      successfulRuns: successful.length,
      importMedianMs: median(collectNumbers(successful, result => result.importMs)),
      profileAppliedMedianMs: median(collectNumbers(successful, result => result.profileAppliedMs)),
      firstFlamechartPaintMedianMs: median(
        collectNumbers(successful, result => result.firstFlamechartPaintMs),
      ),
      uiOverheadMedianMs: median(collectNumbers(successful, result => result.uiOverheadMs)),
      wallClockMedianMs: median(collectNumbers(successful, result => result.wallClockMs)),
      errorMessages: collectErrors(engineResults).slice(0, 5),
    }
  })
}

async function runBrowserBenchmark(
  browser: Browser,
  engine: Engine,
  run: number,
  url: string,
  filePath: string,
  timeoutMs: number,
): Promise<BrowserBenchmarkRunResult> {
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    await page.goto(url, {waitUntil: 'domcontentloaded'})
    await page.waitForSelector('input[type="file"]', {state: 'attached', timeout: timeoutMs})

    const benchmarkStateBefore = await page.evaluate(() => {
      return (window as any).__SPEEDSCOPE_BENCHMARK__?.loads?.length || 0
    })

    const wallClockStartedAt = performance.now()
    await page.locator('input[type="file"]').setInputFiles(filePath)

    await page.waitForFunction(
      previousLoadCount => {
        const state = (window as any).__SPEEDSCOPE_BENCHMARK__
        if (state == null || !Array.isArray(state.loads) || state.loads.length <= previousLoadCount) {
          return false
        }
        const load = state.loads[state.loads.length - 1]
        return load.firstFlamechartPaintAt != null || load.errorAt != null
      },
      benchmarkStateBefore,
      {timeout: timeoutMs},
    )

    const load = (await page.evaluate(() => {
      const state = (window as any).__SPEEDSCOPE_BENCHMARK__
      return state.loads[state.loads.length - 1]
    })) as BrowserBenchmarkLoadRecord

    return {
      engine,
      run,
      fileName: load.fileName,
      importMs: toElapsed(load.importFinishedAt, load.startedAt),
      profileAppliedMs: toElapsed(load.profileAppliedAt, load.startedAt),
      firstFlamechartPaintMs: toElapsed(load.firstFlamechartPaintAt, load.startedAt),
      uiOverheadMs:
        load.firstFlamechartPaintAt == null || load.importFinishedAt == null
          ? null
          : Number((load.firstFlamechartPaintAt - load.importFinishedAt).toFixed(2)),
      wallClockMs: Number((performance.now() - wallClockStartedAt).toFixed(2)),
      errorMessage: load.errorMessage,
    }
  } finally {
    await context.close()
  }
}

async function main() {
  const options = getOptions()
  if (!fs.existsSync(options.filePath)) {
    throw new Error(`Benchmark file not found: ${options.filePath}`)
  }

  const child = await ensureServers(options)
  const cleanup = () => stopChildProcess(child)
  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)
  process.on('exit', cleanup)

  try {
    const browser = await chromium.launch({headless: options.headless})
    try {
      const urls: Record<Engine, string> = {
        legacy: `http://${options.host}:${options.legacyPort}/`,
        experimental: `http://${options.host}:${options.experimentalPort}/`,
      }

      const results: BrowserBenchmarkRunResult[] = []
      for (let run = 1; run <= options.runs; run++) {
        for (const engine of ['legacy', 'experimental'] as const) {
          results.push(
            await runBrowserBenchmark(
              browser,
              engine,
              run,
              urls[engine],
              options.filePath,
              options.timeoutMs,
            ),
          )
        }
      }

      const output = {
        config: {
          filePath: toRelativePath(options.filePath),
          host: options.host,
          legacyPort: options.legacyPort,
          experimentalPort: options.experimentalPort,
          runs: options.runs,
          headless: options.headless,
          startServers: options.startServers,
          timeoutMs: options.timeoutMs,
        },
        results,
        summary: summarize(results),
      }

      console.log(JSON.stringify(output, null, 2))
    } finally {
      await browser.close()
    }
  } finally {
    cleanup()
    process.off('SIGINT', cleanup)
    process.off('SIGTERM', cleanup)
    process.off('exit', cleanup)
  }
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
