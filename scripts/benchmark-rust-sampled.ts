import * as fs from 'fs/promises'
import * as path from 'path'
import {performance} from 'perf_hooks'
import {importProfilesFromArrayBuffer} from '../src/import'
import {canonicalizeProfileGroup} from '../src/experimental/engine'

interface BenchmarkConfig {
  sampleCount: number
  runs: number
  depth: number
  frameCount: number
  distinctStacks: number
  skipParity: boolean
  engineMode: 'both' | 'legacy' | 'experimental'
  writeFilePath: string | null
}

interface BenchmarkSample {
  elapsedMs: number
  heapUsedBytes: number
}

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

function getBooleanArg(name: string): boolean {
  const prefix = `--${name}=`
  const entry = process.argv.slice(2).find(arg => arg.startsWith(prefix))
  if (entry == null) {
    return false
  }

  const value = entry.slice(prefix.length)
  return value === '1' || value === 'true' || value === 'yes'
}

function getStringArg(name: string): string | null {
  const prefix = `--${name}=`
  const entry = process.argv.slice(2).find(arg => arg.startsWith(prefix))
  return entry == null ? null : entry.slice(prefix.length)
}

function getConfig(): BenchmarkConfig {
  const engineMode = getStringArg('engine') || 'both'
  if (engineMode !== 'both' && engineMode !== 'legacy' && engineMode !== 'experimental') {
    throw new Error(`Expected --engine=both|legacy|experimental, received ${engineMode}`)
  }

  return {
    sampleCount: getNumericArg('samples', 100000),
    runs: getNumericArg('runs', 5),
    depth: getNumericArg('depth', 24),
    frameCount: getNumericArg('frames', 4096),
    distinctStacks: getNumericArg('distinct-stacks', 2048),
    skipParity: getBooleanArg('skip-parity'),
    engineMode,
    writeFilePath: getStringArg('write-file'),
  }
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle]
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`
}

function formatPct(delta: number): string {
  return `${delta > 0 ? '+' : ''}${delta.toFixed(1)}%`
}

function buildStack(pattern: number, depth: number, frameCount: number): number[] {
  const maxBase = Math.max(1, frameCount - depth)
  const base = (pattern * 17) % maxBase
  const stack: number[] = []
  for (let i = 0; i < depth; i++) {
    stack.push((base + i * 13) % frameCount)
  }
  return stack
}

function buildRepeatedSection(
  sampleCount: number,
  depth: number,
  frameCount: number,
  distinctStacks: number,
): {samples: string; weights: string} {
  const sampleChunks: string[] = []
  const weightChunks: string[] = []
  const pendingSamples: string[] = []
  const pendingWeights: string[] = []
  const flushEvery = 4096

  for (let i = 0; i < sampleCount; i++) {
    const stack = buildStack(i % distinctStacks, depth, frameCount)
    pendingSamples.push(`[${stack.join(',')}]`)
    pendingWeights.push('1')

    if (pendingSamples.length >= flushEvery) {
      sampleChunks.push(pendingSamples.join(','))
      weightChunks.push(pendingWeights.join(','))
      pendingSamples.length = 0
      pendingWeights.length = 0
    }
  }

  if (pendingSamples.length > 0) {
    sampleChunks.push(pendingSamples.join(','))
    weightChunks.push(pendingWeights.join(','))
  }

  return {
    samples: sampleChunks.join(','),
    weights: weightChunks.join(','),
  }
}

function buildSyntheticProfileJSON(config: BenchmarkConfig): string {
  const frames = Array.from({length: config.frameCount}, (_, index) => `{"name":"frame_${index}"}`).join(',')
  const repeated = buildRepeatedSection(
    config.sampleCount,
    config.depth,
    config.frameCount,
    config.distinctStacks,
  )

  return `{"$schema":"https://www.speedscope.app/file-format-schema.json","shared":{"frames":[${frames}]},"profiles":[{"type":"sampled","name":"synthetic-sampled","unit":"none","startValue":0,"endValue":${config.sampleCount},"samples":[${repeated.samples}],"weights":[${repeated.weights}]}],"activeProfileIndex":0,"name":"synthetic-sampled"}` // prettier-ignore
}

async function benchmarkEngine(
  engine: 'legacy' | 'experimental',
  buffer: ArrayBuffer,
  runs: number,
): Promise<BenchmarkSample[]> {
  const samples: BenchmarkSample[] = []
  const gc = (globalThis as typeof globalThis & {gc?: () => void}).gc

  for (let run = 0; run < runs; run++) {
    gc?.()
    const startedAt = performance.now()
    const imported = await importProfilesFromArrayBuffer('synthetic.speedscope.json', buffer, {engine})
    const elapsedMs = performance.now() - startedAt
    if (imported == null) {
      throw new Error(`${engine} importer returned null for synthetic benchmark`)
    }
    samples.push({elapsedMs, heapUsedBytes: process.memoryUsage().heapUsed})
  }

  return samples
}

async function main() {
  const config = getConfig()
  const profileJSON = buildSyntheticProfileJSON(config)
  const encoded = new TextEncoder().encode(profileJSON)
  const arrayBuffer = encoded.buffer.slice(
    encoded.byteOffset,
    encoded.byteOffset + encoded.byteLength,
  ) as ArrayBuffer

  if (config.writeFilePath) {
    const outputPath = path.isAbsolute(config.writeFilePath)
      ? config.writeFilePath
      : path.join(process.cwd(), config.writeFilePath)
    await fs.mkdir(path.dirname(outputPath), {recursive: true})
    await fs.writeFile(outputPath, encoded)
  }

  let parityMatched: boolean | null = null

  if (!config.skipParity) {
    const legacyParity = await importProfilesFromArrayBuffer('synthetic.speedscope.json', arrayBuffer, {
      engine: 'legacy',
    })
    const experimentalParity = await importProfilesFromArrayBuffer('synthetic.speedscope.json', arrayBuffer, {
      engine: 'experimental',
    })

    if (legacyParity == null || experimentalParity == null) {
      throw new Error('Expected both engines to import the synthetic profile')
    }

    parityMatched =
      JSON.stringify(canonicalizeProfileGroup(legacyParity)) ===
      JSON.stringify(canonicalizeProfileGroup(experimentalParity))
  }

  const legacy =
    config.engineMode === 'experimental'
      ? null
      : await benchmarkEngine('legacy', arrayBuffer, config.runs)
  const experimental =
    config.engineMode === 'legacy'
      ? null
      : await benchmarkEngine('experimental', arrayBuffer, config.runs)

  const result: Record<string, unknown> = {
    config,
    parityMatched,
    sizeBytes: encoded.byteLength,
    sizeHuman: formatBytes(encoded.byteLength),
    ...(config.writeFilePath ? {writeFilePath: config.writeFilePath} : {}),
  }

  if (legacy != null) {
    result.legacyMedianMs = Number(median(legacy.map(sample => sample.elapsedMs)).toFixed(2))
    result.legacyHeapUsed = formatBytes(median(legacy.map(sample => sample.heapUsedBytes)))
  }

  if (experimental != null) {
    result.experimentalMedianMs = Number(
      median(experimental.map(sample => sample.elapsedMs)).toFixed(2),
    )
    result.experimentalHeapUsed = formatBytes(
      median(experimental.map(sample => sample.heapUsedBytes)),
    )
  }

  if (legacy != null && experimental != null) {
    const legacyMedian = median(legacy.map(sample => sample.elapsedMs))
    const experimentalMedian = median(experimental.map(sample => sample.elapsedMs))
    const deltaMs = experimentalMedian - legacyMedian
    const deltaPct = (deltaMs / legacyMedian) * 100
    result.deltaMs = Number(deltaMs.toFixed(2))
    result.deltaPct = formatPct(deltaPct)
  }

  console.log(JSON.stringify(result, null, 2))
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
