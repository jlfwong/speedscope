import type {SDKAgent, SDKArtifact} from '@cursor/february'
import {importProfilesFromArrayBuffer} from '../src/import'
import {canonicalizeProfileGroup} from '../src/experimental/engine'
import {ImportComparisonResult, ImportEngine} from '../src/experimental/contracts'
import * as fs from 'fs/promises'
import * as path from 'path'
import {performance} from 'perf_hooks'

type PackageStatus =
  | 'queued'
  | 'running'
  | 'waiting_on_children'
  | 'needs_review'
  | 'needs_benchmark'
  | 'green'
  | 'failed'
  | 'archived'

type PackageKind = 'lead' | 'worker'

type ModelPolicy = 'orchestratorDefaultModel' | 'deepReasoningModel' | 'executorModel'

type ScopeLevel = 'single-package' | 'single-lane' | 'multi-lane'
type HeuristicLevel = 'low' | 'medium' | 'high'

interface PackageDefinition {
  id: string
  lane: string
  kind: PackageKind
  title: string
  description: string
  branchName: string
  ownedPaths: string[]
  dependsOn: string[]
  fixtureList: string[]
  benchmarkTarget: string
  acceptanceCommands: string[]
  rollbackPlan: string
  specCompleteness: HeuristicLevel
  crossPackageScope: ScopeLevel
  ambiguity: HeuristicLevel
  blastRadius: HeuristicLevel
}

interface PackageRecord {
  packageId: string
  agentId?: string
  latestRunId?: string
  branchName: string
  status: PackageStatus
  selectedModelPolicy?: ModelPolicy
  selectedModelId?: string
  routingReason?: string
  dependsOn: string[]
  attemptCount: number
  artifactPaths: string[]
  lastEventId?: string
  lastResult?: string
  lastError?: string
  updatedAt: string
}

interface RegistryFile {
  packages: Record<string, PackageRecord>
}

interface ModelConfig {
  orchestratorDefaultModel: string
  deepReasoningModel: string
  executorModel: string
}

interface ControlPlaneConfig {
  apiBaseUrl: string
  apiKey: string
  artifactRoot: string
  baseBranch: string
  comparisonReportPath: string
  benchmarkReportPath: string
  cloudEnvName?: string
  cloudEnvType: 'cloud' | 'pool' | 'machine'
  gateReportPath: string
  maxParallelPackages: number
  models: ModelConfig
  registryPath: string
  repositoryUrl: string
}

interface RouteRequest {
  kind: PackageKind
  specCompleteness: HeuristicLevel
  crossPackageScope: ScopeLevel
  ambiguity: HeuristicLevel
  blastRadius: HeuristicLevel
  failureHistory: number
}

interface RouteResult {
  policy: ModelPolicy
  modelId: string
  reason: string
}

interface BenchmarkSample {
  elapsedMs: number
  heapUsedBytes: number
}

interface BenchmarkResult {
  fixture: string
  legacy: BenchmarkSample[]
  experimental: BenchmarkSample[]
}

interface GateReport {
  mode?: 'cloud-status' | 'compare-only'
  ok: boolean
  comparison: ComparisonOutcome[]
  benchmarks: BenchmarkResult[]
  packageStatuses: Array<{
    id: string
    status: string
  }>
  blockingPackages: string[]
  cutover?: IntegrationCutoverSummary
}

interface EngineSeamProbeOutcome {
  fixture: string
  equal: boolean
  legacyImported: boolean
  experimentalImported: boolean
  summary: string
  error?: string
}

interface EngineLaneSynthesis {
  leadStatus: string
  workers: Array<{id: string; status: string}>
  blockingDependencies: string[]
  seamReady: boolean
  fanOutReady: boolean
  blockers: string[]
  probes: EngineSeamProbeOutcome[]
  benchmarkSnapshot: {
    fixtureCount: number
    faster: number
    slower: number
    tied: number
  } | null
}

interface ImporterFamilyProbeOutcome {
  fixture: string
  equal: boolean
  legacyImported: boolean
  experimentalImported: boolean
  summary: string
  error?: string
}

interface ImporterFamilySynthesis {
  packageId: string
  status: string
  workerStatus: string
  probes: ImporterFamilyProbeOutcome[]
  parityReady: boolean
  hasRunnableFixtures: boolean
}

interface ImporterLaneSynthesis {
  leadStatus: string
  families: ImporterFamilySynthesis[]
  blockingFamilies: string[]
  fanOutReady: boolean
}

export interface IntegrationCutoverProbeOutcome {
  fixture: string
  primaryEngine: ImportEngine
  comparisonEngine: ImportEngine
  equal: boolean
  comparisonMode: 'warn' | 'error' | 'off'
  summary: string
  error?: string
}

export interface IntegrationBenchmarkSnapshot {
  fixtureCount: number
  faster: number
  slower: number
  tied: number
  worstSlowdownRatio: number | null
  worstSlowdownFixture: string | null
}

export interface IntegrationCutoverSummary {
  cutoverReady: boolean
  recommendation: 'cutover' | 'hold'
  reasonCode:
    | 'workers-blocked'
    | 'upstream-leads-blocked'
    | 'no-runnable-fixtures'
    | 'parity-divergence'
    | 'cleared'
  blockers: string[]
  workers: Array<{id: string; status: string}>
  upstreamLeads: Array<{id: string; status: string}>
  probes: IntegrationCutoverProbeOutcome[]
  benchmarkSnapshot: IntegrationBenchmarkSnapshot | null
  rollbackPlan: string
}

interface RestAgentListItem {
  id: string
  name?: string
  branchName?: string
  latestRunId?: string
  repos?: Array<{url?: string}>
}

interface RestRunRecord {
  id: string
  agentId: string
  status: string
  createdAt?: string
  updatedAt?: string
  model?: string
  result?: string
  git?: {
    branchName?: string
    prUrl?: string
  }
}

interface ComparisonOutcome {
  equal: boolean
  fixture: string
  summary: string
}

interface ComparisonReport {
  generatedAt: string
  fixtures: string[]
  comparison: ComparisonOutcome[]
}

interface FixtureSkip {
  fixture: string
  reason: string
}

interface FixtureInventory {
  defaultFixtures: string[]
  localLargeFixtures: string[]
  activeFixtures: string[]
  skippedFixtures: FixtureSkip[]
}

const REPO_ROOT = process.cwd()
const SCRIPT_PATH = path.resolve(REPO_ROOT, 'scripts', 'cloud-control-plane.ts')
const CACHE_DIR = path.join(REPO_ROOT, '.cache', 'cloud-agent-control-plane')
const DEFAULT_REGISTRY_PATH = path.join(CACHE_DIR, 'registry.json')
const DEFAULT_COMPARISON_REPORT_PATH = path.join(CACHE_DIR, 'comparison-report.json')
const DEFAULT_BENCHMARK_REPORT_PATH = path.join(CACHE_DIR, 'benchmark-report.json')
const DEFAULT_GATE_REPORT_PATH = path.join(CACHE_DIR, 'gate-report.json')
const DEFAULT_ARTIFACT_ROOT = path.join(CACHE_DIR, 'artifacts')

const DEFAULT_FIXTURES = [
  'sample/profiles/Chrome/69/simple.json',
  'sample/profiles/Chrome/116/Trace-20230603T221323.json',
  'sample/profiles/trace-event/simple.json',
  'sample/profiles/trace-event/simple-hermes.json',
  'sample/profiles/stackcollapse/simple.txt',
  'sample/profiles/stackprof/ruby-stackprof.json',
  'sample/profiles/linux-perf/system-wide.linux-perf.txt',
  'sample/profiles/pmcstat/simple.txt',
  'sample/profiles/papyrus/stack.log',
  'sample/profiles/callgrind/callgrind.example.log',
  'sample/profiles/Instruments/16.0/simple-time-profile-deep-copy.txt',
  'sample/profiles/Firefox/63/simple-firefox.json',
  'sample/profiles/Safari/13.1/simple.html-recording.json',
  'sample/profiles/pprof/simple.prof',
  'sample/profiles/java-flight-recorder/heavy.jfr',
  'sample/profiles/speedscope/0.6.0/two-sampled.speedscope.json',
  'sample/profiles/haskell/simple.prof',
]

const IMPORTER_FAMILY_PROBES: Array<{packageId: string; fixtures: string[]}> = [
  {
    packageId: 'chrome-trace-family',
    fixtures: [
      'sample/profiles/Chrome/69/simple.json',
      'sample/profiles/Chrome/116/Trace-20230603T221323.json',
      'sample/profiles/trace-event/simple.json',
      'sample/profiles/trace-event/simple-hermes.json',
    ],
  },
  {
    packageId: 'text-formats-family',
    fixtures: [
      'sample/profiles/stackcollapse/simple.txt',
      'sample/profiles/stackprof/ruby-stackprof.json',
      'sample/profiles/linux-perf/system-wide.linux-perf.txt',
      'sample/profiles/pmcstat/simple.txt',
      'sample/profiles/papyrus/stack.log',
    ],
  },
  {
    packageId: 'binary-formats-family',
    fixtures: [
      'sample/profiles/pprof/simple.prof',
      'sample/profiles/java-flight-recorder/heavy.jfr',
    ],
  },
  {
    packageId: 'legacy-complex-family',
    fixtures: [
      'sample/profiles/callgrind/callgrind.example.log',
      'sample/profiles/Instruments/16.0/simple-time-profile-deep-copy.txt',
      'sample/profiles/Firefox/63/simple-firefox.json',
      'sample/profiles/Safari/13.1/simple.html-recording.json',
      'sample/profiles/haskell/simple.prof',
    ],
  },
]

const INTEGRATION_LEAD_PACKAGE_ID = 'integration-lead'
const INTEGRATION_WORKER_PACKAGE_IDS = ['dual-run-compare-mode', 'view-bridge'] as const
const INTEGRATION_UPSTREAM_LEAD_PACKAGE_IDS = ['engine-lead', 'import-lead'] as const
const INTEGRATION_CUTOVER_PROBE_FIXTURES = [
  'sample/profiles/Chrome/69/simple.json',
  'sample/profiles/trace-event/simple.json',
  'sample/profiles/stackcollapse/simple.txt',
  'sample/profiles/stackprof/ruby-stackprof.json',
  'sample/profiles/speedscope/0.6.0/two-sampled.speedscope.json',
  'sample/profiles/Instruments/16.0/simple-time-profile-deep-copy.txt',
] as const

const HELPER_AGENTS = {
  reviewer: {
    description: 'Parity reviewer',
    prompt:
      'Review the package output for correctness, regression risk, and missing validation. Focus on fixture parity, benchmark integrity, and rollback safety.',
    model: 'inherit' as const,
  },
  benchmarker: {
    description: 'Benchmark runner',
    prompt:
      'Run the package benchmark target, summarize the before/after story, and call out whether the result is trustworthy or needs larger fixtures.',
    model: 'inherit' as const,
  },
  'test-writer': {
    description: 'Test writer',
    prompt:
      'Add or tighten focused tests for the owned package without adding low-value coverage. Prefer parity fixtures and benchmark assertions.',
    model: 'inherit' as const,
  },
}

async function getCursorSdk() {
  return import('@cursor/february')
}

const PACKAGE_DEFINITIONS: PackageDefinition[] = [
  {
    id: 'golden-oracle',
    lane: 'harness',
    kind: 'worker',
    title: 'Golden oracle harness',
    description: 'Owns parity snapshots and canonical export diffing.',
    branchName: 'exp/harness/golden-oracle',
    ownedPaths: [
      'src/lib/test-utils.ts',
      'src/import/__snapshots__',
      'src/import/*.test.ts',
      'sample/profiles',
    ],
    dependsOn: [],
    fixtureList: DEFAULT_FIXTURES,
    benchmarkTarget: 'npm run experiment:compare',
    acceptanceCommands: ['npm run experiment:compare'],
    rollbackPlan:
      'Fall back to legacy snapshot expectations and disable experimental compare mode.',
    specCompleteness: 'high',
    crossPackageScope: 'single-lane',
    ambiguity: 'low',
    blastRadius: 'medium',
  },
  {
    id: 'large-fixtures',
    lane: 'harness',
    kind: 'worker',
    title: 'Large fixture intake',
    description: 'Curates large local benchmark fixtures and benchmark metadata.',
    branchName: 'exp/harness/large-fixtures',
    ownedPaths: ['sample/profiles', '.cache/cloud-agent-control-plane'],
    dependsOn: [],
    fixtureList: DEFAULT_FIXTURES,
    benchmarkTarget: 'npm run experiment:benchmark',
    acceptanceCommands: ['npm run experiment:benchmark'],
    rollbackPlan: 'Run only the built-in fixture set when large local fixtures are unavailable.',
    specCompleteness: 'medium',
    crossPackageScope: 'single-lane',
    ambiguity: 'medium',
    blastRadius: 'medium',
  },
  {
    id: 'bench-runner',
    lane: 'harness',
    kind: 'worker',
    title: 'Benchmark runner',
    description: 'Produces benchmark and gate reports for legacy vs experimental paths.',
    branchName: 'exp/harness/bench-runner',
    ownedPaths: ['scripts/cloud-control-plane.ts', 'src/experimental/engine.ts'],
    dependsOn: ['golden-oracle', 'large-fixtures'],
    fixtureList: DEFAULT_FIXTURES,
    benchmarkTarget: 'npm run experiment:gate',
    acceptanceCommands: ['npm run experiment:benchmark', 'npm run experiment:gate'],
    rollbackPlan: 'Use compare-only gates until benchmark output is trustworthy again.',
    specCompleteness: 'high',
    crossPackageScope: 'single-lane',
    ambiguity: 'low',
    blastRadius: 'high',
  },
  {
    id: 'harness-lead',
    lane: 'harness',
    kind: 'lead',
    title: 'Harness lane lead',
    description: 'Synthesizes oracle, fixtures, and benchmark results for the harness lane.',
    branchName: 'exp/harness/lead',
    ownedPaths: ['scripts/cloud-control-plane.ts'],
    dependsOn: ['golden-oracle', 'large-fixtures', 'bench-runner'],
    fixtureList: DEFAULT_FIXTURES,
    benchmarkTarget: 'npm run experiment:report',
    acceptanceCommands: ['npm run experiment:report'],
    rollbackPlan: 'Pause fan-out until the harness lane is green again.',
    specCompleteness: 'medium',
    crossPackageScope: 'single-lane',
    ambiguity: 'medium',
    blastRadius: 'high',
  },
  {
    id: 'engine-interface',
    lane: 'contracts',
    kind: 'worker',
    title: 'Engine interface seam',
    description: 'Defines import engine contracts and the legacy-vs-experimental seam.',
    branchName: 'exp/contracts/engine-interface',
    ownedPaths: ['src/experimental/contracts.ts', 'src/import/index.ts', 'src/lib/hash-params.ts'],
    dependsOn: ['golden-oracle'],
    fixtureList: DEFAULT_FIXTURES,
    benchmarkTarget: 'npm run experiment:compare',
    acceptanceCommands: ['npm run typecheck', 'npm run experiment:compare'],
    rollbackPlan: 'Default the app back to the legacy import engine only.',
    specCompleteness: 'high',
    crossPackageScope: 'single-package',
    ambiguity: 'low',
    blastRadius: 'high',
  },
  {
    id: 'legacy-adapter',
    lane: 'contracts',
    kind: 'worker',
    title: 'Legacy adapter',
    description: 'Keeps the current JS implementation as the oracle-backed adapter.',
    branchName: 'exp/contracts/legacy-adapter',
    ownedPaths: ['src/import/index.ts', 'src/views/application.tsx'],
    dependsOn: ['engine-interface'],
    fixtureList: DEFAULT_FIXTURES,
    benchmarkTarget: 'npm run experiment:compare',
    acceptanceCommands: ['npm run experiment:compare'],
    rollbackPlan: 'Bypass adapter logic and call legacy importers directly again.',
    specCompleteness: 'high',
    crossPackageScope: 'single-package',
    ambiguity: 'low',
    blastRadius: 'medium',
  },
  {
    id: 'wasm-adapter',
    lane: 'contracts',
    kind: 'worker',
    title: 'Experimental adapter',
    description: 'Owns the experimental compatibility bridge and canonical diffing hooks.',
    branchName: 'exp/contracts/experimental-adapter',
    ownedPaths: ['src/experimental/engine.ts', 'src/views/application.tsx'],
    dependsOn: ['engine-interface', 'legacy-adapter'],
    fixtureList: DEFAULT_FIXTURES,
    benchmarkTarget: 'npm run experiment:compare',
    acceptanceCommands: ['npm run typecheck', 'npm run experiment:compare'],
    rollbackPlan: 'Route experimental requests back through the legacy adapter.',
    specCompleteness: 'high',
    crossPackageScope: 'single-lane',
    ambiguity: 'medium',
    blastRadius: 'high',
  },
  {
    id: 'contract-lead',
    lane: 'contracts',
    kind: 'lead',
    title: 'Contracts lane lead',
    description: 'Synthesizes the contract and adapter lane before broad fan-out.',
    branchName: 'exp/contracts/lead',
    ownedPaths: ['scripts/cloud-control-plane.ts'],
    dependsOn: ['engine-interface', 'legacy-adapter', 'wasm-adapter'],
    fixtureList: DEFAULT_FIXTURES,
    benchmarkTarget: 'npm run experiment:report',
    acceptanceCommands: ['npm run experiment:report'],
    rollbackPlan: 'Freeze downstream packages until the contract seam is restabilized.',
    specCompleteness: 'medium',
    crossPackageScope: 'single-lane',
    ambiguity: 'medium',
    blastRadius: 'high',
  },
  {
    id: 'profile-core',
    lane: 'engine',
    kind: 'worker',
    title: 'Profile core',
    description: 'Owns the experimental core profile surface and flatten-recursion seam.',
    branchName: 'exp/engine/profile-core',
    ownedPaths: ['src/experimental/core.ts', 'src/app-state/getters.ts', 'src/lib/profile.ts'],
    dependsOn: ['engine-interface', 'legacy-adapter'],
    fixtureList: DEFAULT_FIXTURES,
    benchmarkTarget: 'npm run experiment:compare',
    acceptanceCommands: ['npm run typecheck', 'npm run experiment:compare'],
    rollbackPlan:
      'Route all core profile operations back through the existing profile methods only.',
    specCompleteness: 'medium',
    crossPackageScope: 'single-package',
    ambiguity: 'medium',
    blastRadius: 'high',
  },
  {
    id: 'flamechart-core',
    lane: 'engine',
    kind: 'worker',
    title: 'Flamechart core',
    description: 'Owns the experimental flamechart constructors for chrono and grouped layouts.',
    branchName: 'exp/engine/flamechart-core',
    ownedPaths: ['src/experimental/core.ts', 'src/views/flamechart-view-container.tsx'],
    dependsOn: ['profile-core'],
    fixtureList: DEFAULT_FIXTURES,
    benchmarkTarget: 'npm run experiment:compare',
    acceptanceCommands: ['npm run typecheck', 'npm run experiment:compare'],
    rollbackPlan: 'Revert view construction to the direct Flamechart constructors.',
    specCompleteness: 'high',
    crossPackageScope: 'single-package',
    ambiguity: 'low',
    blastRadius: 'medium',
  },
  {
    id: 'derived-ops',
    lane: 'engine',
    kind: 'worker',
    title: 'Derived operations',
    description: 'Owns callers, callees, flatten recursion, and search seams.',
    branchName: 'exp/engine/derived-ops',
    ownedPaths: [
      'src/experimental/core.ts',
      'src/views/callee-flamegraph-view.tsx',
      'src/views/inverted-caller-flamegraph-view.tsx',
      'src/views/search-view.tsx',
      'src/views/flamechart-search-view.tsx',
    ],
    dependsOn: ['profile-core', 'flamechart-core'],
    fixtureList: DEFAULT_FIXTURES,
    benchmarkTarget: 'npm run experiment:compare',
    acceptanceCommands: ['npm run typecheck', 'npm run experiment:compare'],
    rollbackPlan: 'Use legacy search and caller/callee profile derivation everywhere again.',
    specCompleteness: 'medium',
    crossPackageScope: 'single-lane',
    ambiguity: 'medium',
    blastRadius: 'high',
  },
  {
    id: 'engine-lead',
    lane: 'engine',
    kind: 'lead',
    title: 'Core engine lead',
    description: 'Synthesizes the core engine lane before importer fan-out.',
    branchName: 'exp/engine/lead',
    ownedPaths: ['scripts/cloud-control-plane.ts'],
    dependsOn: ['profile-core', 'flamechart-core', 'derived-ops'],
    fixtureList: DEFAULT_FIXTURES,
    benchmarkTarget: 'npm run experiment:report',
    acceptanceCommands: ['npm run experiment:report'],
    rollbackPlan: 'Pause importer and integration work until the core lane is green.',
    specCompleteness: 'medium',
    crossPackageScope: 'single-lane',
    ambiguity: 'high',
    blastRadius: 'high',
  },
  {
    id: 'chrome-trace-family',
    lane: 'importers',
    kind: 'worker',
    title: 'Chrome trace family',
    description: 'Owns the experimental Chrome, trace-event, and V8 family entry points.',
    branchName: 'exp/importers/chrome-trace-family',
    ownedPaths: ['src/experimental/engine.ts', 'src/import/chrome.ts', 'src/import/trace-event.ts'],
    dependsOn: ['engine-interface', 'profile-core', 'flamechart-core'],
    fixtureList: [
      'sample/profiles/Chrome/69/simple.json',
      'sample/profiles/Chrome/116/Trace-20230603T221323.json',
      'sample/profiles/trace-event/simple.json',
      'sample/profiles/trace-event/simple-hermes.json',
    ],
    benchmarkTarget: 'npm run experiment:benchmark',
    acceptanceCommands: ['npm run experiment:compare', 'npm run experiment:benchmark'],
    rollbackPlan: 'Send all Chrome/trace traffic back through the legacy importer chain.',
    specCompleteness: 'high',
    crossPackageScope: 'single-package',
    ambiguity: 'low',
    blastRadius: 'high',
  },
  {
    id: 'text-formats-family',
    lane: 'importers',
    kind: 'worker',
    title: 'Text formats family',
    description: 'Owns collapsed stacks, linux-perf, stackprof, papyrus, and pmcstat routing.',
    branchName: 'exp/importers/text-formats-family',
    ownedPaths: [
      'src/experimental/engine.ts',
      'src/import/bg-flamegraph.ts',
      'src/import/linux-tools-perf.ts',
      'src/import/stackprof.ts',
      'src/import/papyrus.ts',
      'src/import/pmcstat-callgraph.ts',
    ],
    dependsOn: ['engine-interface', 'profile-core'],
    fixtureList: [
      'sample/profiles/stackcollapse/simple.txt',
      'sample/profiles/stackprof/ruby-stackprof.json',
      'sample/profiles/linux-perf/system-wide.linux-perf.txt',
      'sample/profiles/pmcstat/simple.txt',
      'sample/profiles/papyrus/stack.log',
    ],
    benchmarkTarget: 'npm run experiment:benchmark',
    acceptanceCommands: ['npm run experiment:compare', 'npm run experiment:benchmark'],
    rollbackPlan: 'Route text-family formats back through the existing detection chain.',
    specCompleteness: 'high',
    crossPackageScope: 'single-package',
    ambiguity: 'low',
    blastRadius: 'medium',
  },
  {
    id: 'binary-formats-family',
    lane: 'importers',
    kind: 'worker',
    title: 'Binary formats family',
    description: 'Owns pprof and JFR experimental routing.',
    branchName: 'exp/importers/binary-formats-family',
    ownedPaths: [
      'src/experimental/engine.ts',
      'src/import/pprof.ts',
      'src/import/java-flight-recorder.ts',
    ],
    dependsOn: ['engine-interface', 'profile-core'],
    fixtureList: DEFAULT_FIXTURES,
    benchmarkTarget: 'npm run experiment:benchmark',
    acceptanceCommands: ['npm run experiment:compare', 'npm run experiment:benchmark'],
    rollbackPlan: 'Keep binary formats on the legacy importer path only.',
    specCompleteness: 'medium',
    crossPackageScope: 'single-package',
    ambiguity: 'medium',
    blastRadius: 'medium',
  },
  {
    id: 'legacy-complex-family',
    lane: 'importers',
    kind: 'worker',
    title: 'Legacy complex family',
    description: 'Owns Firefox, Safari, Haskell, Callgrind, and Instruments routing.',
    branchName: 'exp/importers/legacy-complex-family',
    ownedPaths: [
      'src/experimental/engine.ts',
      'src/import/firefox.ts',
      'src/import/safari.ts',
      'src/import/haskell.ts',
      'src/import/callgrind.ts',
      'src/import/instruments.ts',
    ],
    dependsOn: ['engine-interface', 'profile-core'],
    fixtureList: [
      'sample/profiles/callgrind/callgrind.example.log',
      'sample/profiles/Instruments/16.0/simple-time-profile-deep-copy.txt',
      'sample/profiles/haskell/simple.prof',
    ],
    benchmarkTarget: 'npm run experiment:benchmark',
    acceptanceCommands: ['npm run experiment:compare', 'npm run experiment:benchmark'],
    rollbackPlan: 'Limit experimental routing to the simpler importer families again.',
    specCompleteness: 'medium',
    crossPackageScope: 'single-package',
    ambiguity: 'medium',
    blastRadius: 'high',
  },
  {
    id: 'import-lead',
    lane: 'importers',
    kind: 'lead',
    title: 'Importer lead',
    description: 'Synthesizes importer-family status and controls fan-out.',
    branchName: 'exp/importers/lead',
    ownedPaths: ['scripts/cloud-control-plane.ts'],
    dependsOn: [
      'chrome-trace-family',
      'text-formats-family',
      'binary-formats-family',
      'legacy-complex-family',
    ],
    fixtureList: DEFAULT_FIXTURES,
    benchmarkTarget: 'npm run experiment:report',
    acceptanceCommands: ['npm run experiment:report'],
    rollbackPlan: 'Freeze new importer fan-out and keep the seam pinned to the legacy path.',
    specCompleteness: 'medium',
    crossPackageScope: 'single-lane',
    ambiguity: 'high',
    blastRadius: 'high',
  },
  {
    id: 'dual-run-compare-mode',
    lane: 'integration',
    kind: 'worker',
    title: 'Dual run compare mode',
    description: 'Owns the user-facing dual-run import mode and compare warnings.',
    branchName: 'exp/integration/dual-run-compare-mode',
    ownedPaths: ['src/views/application.tsx', 'src/lib/hash-params.ts', 'src/import/index.ts'],
    dependsOn: ['engine-interface', 'wasm-adapter', 'golden-oracle'],
    fixtureList: DEFAULT_FIXTURES,
    benchmarkTarget: 'npm run experiment:gate',
    acceptanceCommands: ['npm run experiment:compare', 'npm run experiment:gate'],
    rollbackPlan: 'Disable compareImport in the UI and retain the CLI compare harness only.',
    specCompleteness: 'high',
    crossPackageScope: 'single-lane',
    ambiguity: 'low',
    blastRadius: 'medium',
  },
  {
    id: 'view-bridge',
    lane: 'integration',
    kind: 'worker',
    title: 'View bridge',
    description: 'Owns the app and view wiring for experimental core seams.',
    branchName: 'exp/integration/view-bridge',
    ownedPaths: [
      'src/views/application.tsx',
      'src/views/flamechart-view-container.tsx',
      'src/views/callee-flamegraph-view.tsx',
      'src/views/inverted-caller-flamegraph-view.tsx',
      'src/views/search-view.tsx',
      'src/views/flamechart-search-view.tsx',
    ],
    dependsOn: ['flamechart-core', 'derived-ops', 'dual-run-compare-mode'],
    fixtureList: DEFAULT_FIXTURES,
    benchmarkTarget: 'npm run experiment:gate',
    acceptanceCommands: ['npm run typecheck', 'npm run experiment:gate'],
    rollbackPlan: 'Bridge views directly to legacy constructors again.',
    specCompleteness: 'medium',
    crossPackageScope: 'single-lane',
    ambiguity: 'medium',
    blastRadius: 'high',
  },
  {
    id: 'integration-lead',
    lane: 'integration',
    kind: 'lead',
    title: 'Integration lead',
    description: 'Owns the UI integration lane and cutover readiness synthesis.',
    branchName: 'exp/integration/lead',
    ownedPaths: ['scripts/cloud-control-plane.ts'],
    dependsOn: ['dual-run-compare-mode', 'view-bridge', 'import-lead', 'engine-lead'],
    fixtureList: DEFAULT_FIXTURES,
    benchmarkTarget: 'npm run experiment:gate',
    acceptanceCommands: ['npm run experiment:report', 'npm run experiment:gate'],
    rollbackPlan: 'Hold cutover and leave experimental mode opt-in only.',
    specCompleteness: 'medium',
    crossPackageScope: 'multi-lane',
    ambiguity: 'high',
    blastRadius: 'high',
  },
]

function clampString(value: string, maxLength = 240): string {
  if (value.length <= maxLength) {
    return value
  }
  return `${value.slice(0, maxLength - 3)}...`
}

function compareHeuristicLevel(level: HeuristicLevel): number {
  switch (level) {
    case 'low':
      return 0
    case 'medium':
      return 1
    case 'high':
      return 2
  }
}

function compareScope(scope: ScopeLevel): number {
  switch (scope) {
    case 'single-package':
      return 0
    case 'single-lane':
      return 1
    case 'multi-lane':
      return 2
  }
}

function routeModel(request: RouteRequest, models: ModelConfig): RouteResult {
  const deepReasoningScore =
    compareHeuristicLevel(request.ambiguity) +
    compareHeuristicLevel(request.blastRadius) +
    compareScope(request.crossPackageScope) +
    Math.min(request.failureHistory, 2)

  if (request.failureHistory >= 2 || deepReasoningScore >= 5) {
    return {
      policy: 'deepReasoningModel',
      modelId: models.deepReasoningModel,
      reason:
        'Escalated to the deep reasoning slot because the package is ambiguous, high-blast-radius, or has failed repeatedly.',
    }
  }

  if (
    request.kind === 'worker' &&
    request.specCompleteness === 'high' &&
    request.crossPackageScope === 'single-package' &&
    request.ambiguity === 'low'
  ) {
    return {
      policy: 'executorModel',
      modelId: models.executorModel,
      reason:
        'Routed to the bounded executor slot because the task is local, specific, and execution-heavy.',
    }
  }

  return {
    policy: 'orchestratorDefaultModel',
    modelId: models.orchestratorDefaultModel,
    reason:
      'Routed to the orchestration slot because the package still needs synthesis or cross-package coordination.',
  }
}

function parseSimpleDotEnv(contents: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (line.length === 0 || line.startsWith('#')) {
      continue
    }
    const separatorIndex = line.indexOf('=')
    if (separatorIndex === -1) {
      continue
    }
    const key = line.slice(0, separatorIndex).trim()
    const value = line
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^['"]|['"]$/g, '')
    if (key.length > 0 && result[key] == null) {
      result[key] = value
    }
  }
  return result
}

async function loadLocalEnvIfNeeded(): Promise<void> {
  if (process.env.CURSOR_API_KEY) {
    return
  }

  try {
    const envPath = path.join(REPO_ROOT, '.env')
    const envContents = await fs.readFile(envPath, 'utf8')
    const parsed = parseSimpleDotEnv(envContents)
    for (const [key, value] of Object.entries(parsed)) {
      if (process.env[key] == null) {
        process.env[key] = value
      }
    }
  } catch (error) {
    // Missing .env is fine here. The caller will fail with a clearer message.
  }
}

async function resolveRepositoryUrl(): Promise<string> {
  const explicit = process.env.CURSOR_REPOSITORY_URL
  if (explicit) {
    return explicit
  }

  const packageJson = JSON.parse(
    await fs.readFile(path.join(REPO_ROOT, 'package.json'), 'utf8'),
  ) as {
    repository?: string | {url?: string}
  }
  const repository = packageJson.repository as string | {url?: string}
  if (typeof repository === 'string') {
    if (repository.startsWith('http://') || repository.startsWith('https://')) {
      return repository
    }
    return `https://github.com/${repository.replace(/\.git$/, '')}`
  }
  if (repository && repository.url) {
    return repository.url.replace(/^git\+/, '').replace(/\.git$/, '')
  }
  throw new Error('Could not resolve repository URL. Set CURSOR_REPOSITORY_URL explicitly.')
}

async function resolveConfig(options: {requireApiKey?: boolean} = {}): Promise<ControlPlaneConfig> {
  await loadLocalEnvIfNeeded()

  const apiKey = process.env.CURSOR_API_KEY || ''
  if (options.requireApiKey !== false && !apiKey) {
    throw new Error('CURSOR_API_KEY is required for the cloud control plane.')
  }

  return {
    apiBaseUrl: process.env.CURSOR_CLOUD_AGENT_API_BASE_URL || 'https://api.cursor.com/v1',
    apiKey: apiKey || '',
    artifactRoot: process.env.CURSOR_ARTIFACT_ROOT || DEFAULT_ARTIFACT_ROOT,
    baseBranch: process.env.CURSOR_BASE_BRANCH || 'main',
    comparisonReportPath:
      process.env.CURSOR_COMPARISON_REPORT_PATH || DEFAULT_COMPARISON_REPORT_PATH,
    benchmarkReportPath: process.env.CURSOR_BENCHMARK_REPORT_PATH || DEFAULT_BENCHMARK_REPORT_PATH,
    cloudEnvName: process.env.CURSOR_CLOUD_ENV_NAME,
    cloudEnvType:
      (process.env.CURSOR_CLOUD_ENV_TYPE as ControlPlaneConfig['cloudEnvType']) || 'cloud',
    gateReportPath: process.env.CURSOR_GATE_REPORT_PATH || DEFAULT_GATE_REPORT_PATH,
    maxParallelPackages: Number(process.env.CURSOR_MAX_PARALLEL_PACKAGES || '4'),
    models: {
      orchestratorDefaultModel: process.env.CURSOR_ORCHESTRATOR_MODEL || 'gpt-5.4-xhigh-fast',
      deepReasoningModel:
        process.env.CURSOR_DEEP_REASONING_MODEL ||
        process.env.CURSOR_OPUS_MODEL ||
        'claude-opus-4-7-thinking-max',
      executorModel: process.env.CURSOR_EXECUTOR_MODEL || 'composer-2',
    },
    registryPath: process.env.CURSOR_PACKAGE_REGISTRY_PATH || DEFAULT_REGISTRY_PATH,
    repositoryUrl: await resolveRepositoryUrl(),
  }
}

async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, {recursive: true})
}

async function sleep(ms: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, ms))
}

function normalizeRepoUrl(url: string): string {
  return url
    .replace(/^https?:\/\//, '')
    .replace(/\.git$/, '')
    .toLowerCase()
}

async function listAgentsForRepository(
  rest: RestClient,
  repositoryUrl: string,
): Promise<RestAgentListItem[]> {
  const normalizedRepositoryUrl = normalizeRepoUrl(repositoryUrl)
  const items: RestAgentListItem[] = []
  let cursor: string | undefined

  for (let page = 0; page < 10; page++) {
    const response = await rest.listAgents(cursor)
    for (const item of response.items) {
      const repos = item.repos || []
      if (repos.some(repo => repo.url && normalizeRepoUrl(repo.url) === normalizedRepositoryUrl)) {
        items.push(item)
      }
    }
    if (!response.nextCursor) {
      break
    }
    cursor = response.nextCursor
  }

  return items
}

async function readRegistry(config: ControlPlaneConfig): Promise<RegistryFile> {
  await ensureDir(path.dirname(config.registryPath))
  try {
    const raw = await fs.readFile(config.registryPath, 'utf8')
    return JSON.parse(raw) as RegistryFile
  } catch (error) {
    return {packages: {}}
  }
}

async function writeRegistry(config: ControlPlaneConfig, registry: RegistryFile): Promise<void> {
  await ensureDir(path.dirname(config.registryPath))
  await fs.writeFile(config.registryPath, `${JSON.stringify(registry, null, 2)}\n`, 'utf8')
}

async function ensureRegistrySeeded(config: ControlPlaneConfig): Promise<RegistryFile> {
  const registry = await readRegistry(config)
  let changed = false
  for (const def of PACKAGE_DEFINITIONS) {
    if (registry.packages[def.id] == null) {
      registry.packages[def.id] = {
        packageId: def.id,
        branchName: def.branchName,
        status: def.kind === 'lead' ? 'waiting_on_children' : 'queued',
        dependsOn: [...def.dependsOn],
        attemptCount: 0,
        artifactPaths: [],
        updatedAt: new Date().toISOString(),
      }
      changed = true
    }
  }
  if (changed) {
    await writeRegistry(config, registry)
  }
  return registry
}

function getPackageDefinition(packageId: string): PackageDefinition {
  const definition = PACKAGE_DEFINITIONS.find(def => def.id === packageId)
  if (!definition) {
    throw new Error(`Unknown package id: ${packageId}`)
  }
  return definition
}

function areDependenciesGreen(registry: RegistryFile, packageId: string): boolean {
  const definition = getPackageDefinition(packageId)
  return definition.dependsOn.every(depId => {
    const dep = registry.packages[depId]
    return dep && (dep.status === 'green' || dep.status === 'archived')
  })
}

function getReadyPackages(registry: RegistryFile): PackageDefinition[] {
  return PACKAGE_DEFINITIONS.filter(def => {
    const record = registry.packages[def.id]
    if (!record) {
      return false
    }
    if (record.status !== 'queued' && record.status !== 'failed') {
      return false
    }
    return areDependenciesGreen(registry, def.id)
  })
}

function buildPackagePrompt(definition: PackageDefinition): string {
  const dependencyLine = definition.dependsOn.length > 0 ? definition.dependsOn.join(', ') : 'none'

  return [
    `You own the Speedscope migration package "${definition.title}" (${definition.id}).`,
    '',
    definition.description,
    '',
    'Treat this as a durable branch-owning workspace. Stay inside the owned paths and preserve the legacy path as the oracle.',
    '',
    `Lane: ${definition.lane}`,
    `Kind: ${definition.kind}`,
    `Owned paths: ${definition.ownedPaths.join(', ')}`,
    `Dependencies: ${dependencyLine}`,
    `Fixtures: ${definition.fixtureList.join(', ')}`,
    `Benchmark target: ${definition.benchmarkTarget}`,
    `Acceptance commands: ${definition.acceptanceCommands.join(' && ')}`,
    `Rollback plan: ${definition.rollbackPlan}`,
    '',
    'Required workflow:',
    '1. Restate the contract and list the concrete files you will touch.',
    '2. Implement only the work needed for this package.',
    '3. Run the package acceptance commands.',
    '4. Summarize parity/benchmark status and any remaining risks.',
    '5. Do not create a PR automatically; leave the branch ready for lane synthesis.',
  ].join('\n')
}

function getCloudOptions(config: ControlPlaneConfig, definition: PackageDefinition) {
  return {
    env: {
      type: config.cloudEnvType,
      name: config.cloudEnvName,
    } as const,
    repos: [
      {
        url: config.repositoryUrl,
        startingRef: config.baseBranch,
      },
    ],
    branchName: definition.branchName,
    autoGenerateBranch: false,
    autoCreatePR: false,
    skipReviewerRequest: true,
  }
}

function getAgentOptions(
  config: ControlPlaneConfig,
  definition: PackageDefinition,
  route: RouteResult,
) {
  return {
    apiKey: config.apiKey,
    model: {id: route.modelId},
    cloud: getCloudOptions(config, definition),
    agents: HELPER_AGENTS,
  }
}

async function ensurePackageAgent(
  config: ControlPlaneConfig,
  registry: RegistryFile,
  definition: PackageDefinition,
  route: RouteResult,
): Promise<{agent: SDKAgent; record: PackageRecord}> {
  const {Agent} = await getCursorSdk()
  const record = registry.packages[definition.id]
  if (!record) {
    throw new Error(`Package ${definition.id} is missing from the registry.`)
  }

  const options = getAgentOptions(config, definition, route)
  if (record.agentId) {
    return {
      agent: Agent.resume(record.agentId, {
        ...options,
        agentId: record.agentId,
      }),
      record,
    }
  }

  const agent = Agent.create(options)
  record.selectedModelPolicy = route.policy
  record.selectedModelId = route.modelId
  record.routingReason = route.reason
  record.updatedAt = new Date().toISOString()
  await writeRegistry(config, registry)
  return {agent, record}
}

async function runPackage(
  config: ControlPlaneConfig,
  packageId: string,
  force = false,
): Promise<PackageRecord> {
  const registry = await ensureRegistrySeeded(config)
  const rest = new RestClient(config)
  const definition = getPackageDefinition(packageId)
  const record = registry.packages[packageId]

  if (!areDependenciesGreen(registry, packageId)) {
    throw new Error(
      `Package ${packageId} is blocked on dependencies: ${definition.dependsOn.join(', ')}`,
    )
  }

  const route = routeModel(
    {
      kind: definition.kind,
      specCompleteness: definition.specCompleteness,
      crossPackageScope: definition.crossPackageScope,
      ambiguity: definition.ambiguity,
      blastRadius: definition.blastRadius,
      failureHistory: record.attemptCount,
    },
    config.models,
  )

  record.status = 'running'
  record.attemptCount += 1
  record.selectedModelPolicy = route.policy
  record.selectedModelId = route.modelId
  record.routingReason = route.reason
  record.updatedAt = new Date().toISOString()
  await writeRegistry(config, registry)

  let agent: SDKAgent | null = null
  try {
    if (record.agentId) {
      const ensured = await ensurePackageAgent(config, registry, definition, route)
      agent = ensured.agent
      const run = await agent.send(buildPackagePrompt(definition), {
        force,
        model: {id: route.modelId},
      })
      record.agentId = agent.agentId || record.agentId
      record.latestRunId = run.id
      await writeRegistry(config, registry)

      const result = await run.wait()
      record.latestRunId = result.id
      record.lastResult = clampString(result.result || '')
      record.updatedAt = new Date().toISOString()
      record.status = result.status === 'finished' ? 'green' : 'failed'
      record.lastError =
        result.status === 'finished' ? undefined : clampString(result.result || 'run failed')
      await writeRegistry(config, registry)
    } else {
      const createdAgent = await rest.createLegacyAgent({
        promptText: buildPackagePrompt(definition),
        modelId: route.modelId,
        branchName: definition.branchName,
      })
      record.agentId = createdAgent.id

      const initialRun = await rest.waitForInitialRun(createdAgent.id)
      record.latestRunId = initialRun.id
      record.updatedAt = new Date().toISOString()
      await writeRegistry(config, registry)

      const result = await rest.waitForRun(createdAgent.id, initialRun.id)
      record.latestRunId = result.id
      record.lastResult = clampString(result.result || '')
      record.updatedAt = new Date().toISOString()
      record.status = result.status === 'FINISHED' ? 'green' : 'failed'
      record.lastError =
        result.status === 'FINISHED'
          ? undefined
          : clampString(result.result || `run ended with status ${result.status}`)
      await writeRegistry(config, registry)
    }
  } catch (error) {
    record.status = 'failed'
    record.lastError = clampString(error instanceof Error ? error.message : String(error))
    record.updatedAt = new Date().toISOString()
    await writeRegistry(config, registry)
    throw error
  } finally {
    agent?.close()
  }

  return record
}

async function syncPackageStatuses(config: ControlPlaneConfig): Promise<RegistryFile> {
  const rest = new RestClient(config)
  const registry = await ensureRegistrySeeded(config)
  const cloudAgents = await listAgentsForRepository(rest, config.repositoryUrl)
  const runIdToAgentId = new Map<string, string>()
  for (const agent of cloudAgents) {
    if (agent.latestRunId) {
      runIdToAgentId.set(agent.latestRunId, agent.id)
    }
  }

  for (const definition of PACKAGE_DEFINITIONS) {
    const record = registry.packages[definition.id]
    if (!record) {
      continue
    }
    if (
      (!record.agentId || !record.agentId.startsWith('bc-')) &&
      record.latestRunId &&
      runIdToAgentId.has(record.latestRunId)
    ) {
      record.agentId = runIdToAgentId.get(record.latestRunId)
    }
    if (!record.agentId || !record.latestRunId) {
      if (definition.kind === 'lead' && areDependenciesGreen(registry, definition.id)) {
        record.status = record.status === 'green' ? 'green' : 'queued'
      }
      continue
    }

    const latestRun = await rest.getRun(record.agentId, record.latestRunId)
    if (!latestRun) {
      continue
    }

    if (latestRun.status === 'RUNNING' || latestRun.status === 'CREATING') {
      record.status = 'running'
    } else if (latestRun.status === 'FINISHED') {
      record.status = 'green'
      record.lastResult = clampString(latestRun.result || '')
    } else if (latestRun.status === 'CANCELLED') {
      record.status = 'failed'
      record.lastError = 'Run was cancelled.'
    } else {
      record.status = 'failed'
      record.lastError = clampString(latestRun.result || 'Run ended with an error.')
    }

    if (definition.kind === 'lead' && record.status !== 'green') {
      record.status = areDependenciesGreen(registry, definition.id)
        ? 'queued'
        : 'waiting_on_children'
    }

    record.updatedAt = new Date().toISOString()
  }

  await writeRegistry(config, registry)
  return registry
}

class RestClient {
  constructor(private readonly config: ControlPlaneConfig) {}

  private legacyApiBaseUrl(): string {
    return this.config.apiBaseUrl.replace(/\/v1$/, '/v0')
  }

  private async request(pathname: string, init?: RequestInit, baseUrl?: string): Promise<Response> {
    const auth = Buffer.from(`${this.config.apiKey}:`).toString('base64')
    return fetch(`${baseUrl || this.config.apiBaseUrl}${pathname}`, {
      ...init,
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
    })
  }

  async getMe(): Promise<unknown> {
    const response = await this.request('/me')
    if (!response.ok) {
      throw new Error(`GET /me failed with ${response.status}`)
    }
    return response.json()
  }

  async listModels(): Promise<Array<{id: string; name?: string}>> {
    const response = await this.request('/models')
    if (!response.ok) {
      throw new Error(`GET /models failed with ${response.status}`)
    }
    const json = await response.json()
    if (Array.isArray(json)) {
      return json as Array<{id: string; name?: string}>
    }
    if (json && Array.isArray((json as {items?: unknown[]}).items)) {
      return (json as {items: Array<{id: string; name?: string}>}).items
    }
    return []
  }

  async listAgents(cursor?: string): Promise<{items: RestAgentListItem[]; nextCursor?: string}> {
    const params = cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''
    const response = await this.request(`/agents${params}`)
    if (!response.ok) {
      throw new Error(`GET /agents failed with ${response.status}`)
    }
    return (await response.json()) as {items: RestAgentListItem[]; nextCursor?: string}
  }

  async createLegacyAgent(args: {
    promptText: string
    modelId: string
    branchName: string
  }): Promise<{id: string; status: string}> {
    const response = await this.request(
      '/agents',
      {
        method: 'POST',
        body: JSON.stringify({
          prompt: {
            text: args.promptText,
          },
          model: args.modelId,
          source: {
            repository: this.config.repositoryUrl,
            ref: this.config.baseBranch,
          },
          target: {
            branchName: args.branchName,
            autoCreatePr: false,
            skipReviewerRequest: true,
          },
        }),
      },
      this.legacyApiBaseUrl(),
    )
    if (!response.ok) {
      throw new Error(`POST /v0/agents failed with ${response.status}: ${await response.text()}`)
    }
    return (await response.json()) as {id: string; status: string}
  }

  async listRuns(
    agentId: string,
    limit = 1,
  ): Promise<{items: RestRunRecord[]; nextCursor?: string}> {
    const response = await this.request(`/agents/${agentId}/runs?limit=${limit}`)
    if (!response.ok) {
      throw new Error(`GET /agents/${agentId}/runs failed with ${response.status}`)
    }
    return (await response.json()) as {items: RestRunRecord[]; nextCursor?: string}
  }

  async getRun(agentId: string, runId: string): Promise<RestRunRecord | null> {
    const response = await this.request(`/agents/${agentId}/runs/${runId}`)
    if (response.status === 404) {
      return null
    }
    if (!response.ok) {
      throw new Error(`GET /agents/${agentId}/runs/${runId} failed with ${response.status}`)
    }
    return (await response.json()) as RestRunRecord
  }

  async cancelRun(agentId: string, runId: string): Promise<void> {
    const response = await this.request(`/agents/${agentId}/runs/${runId}/cancel`, {
      method: 'POST',
    })
    if (!response.ok) {
      throw new Error(`POST /agents/${agentId}/runs/${runId}/cancel failed with ${response.status}`)
    }
  }

  async waitForInitialRun(agentId: string): Promise<RestRunRecord> {
    for (let attempt = 0; attempt < 20; attempt++) {
      const runs = await this.listRuns(agentId, 1)
      const run = runs.items[0]
      if (run) {
        return run
      }
      await sleep(1000)
    }
    throw new Error(`Timed out waiting for initial run on ${agentId}`)
  }

  async waitForRun(agentId: string, runId: string): Promise<RestRunRecord> {
    while (true) {
      const run = await this.getRun(agentId, runId)
      if (!run) {
        throw new Error(`Run ${runId} for agent ${agentId} disappeared while waiting.`)
      }
      if (run.status === 'FINISHED' || run.status === 'CANCELLED' || run.status === 'ERROR') {
        return run
      }
      await sleep(3000)
    }
  }
}

async function collectArtifacts(
  config: ControlPlaneConfig,
  packageId?: string,
): Promise<Record<string, string[]>> {
  const {Agent} = await getCursorSdk()
  const registry = await ensureRegistrySeeded(config)
  const packageIds = packageId ? [packageId] : PACKAGE_DEFINITIONS.map(def => def.id)
  const downloaded: Record<string, string[]> = {}

  for (const id of packageIds) {
    const record = registry.packages[id]
    if (!record?.agentId) {
      continue
    }
    const agent = Agent.resume(record.agentId, {
      apiKey: config.apiKey,
      cloud: getCloudOptions(config, getPackageDefinition(id)),
      model: {
        id: record.selectedModelId || config.models.orchestratorDefaultModel,
      },
      agents: HELPER_AGENTS,
    })

    const artifacts = await agent.listArtifacts()
    const outputDir = path.join(config.artifactRoot, id)
    await ensureDir(outputDir)

    downloaded[id] = []
    for (const artifact of artifacts) {
      const artifactPath = sanitizeArtifactPath(outputDir, artifact)
      const buffer = await agent.downloadArtifact(artifact.path)
      await ensureDir(path.dirname(artifactPath))
      await fs.writeFile(artifactPath, buffer)
      downloaded[id].push(path.relative(REPO_ROOT, artifactPath))
    }

    record.artifactPaths = downloaded[id]
    record.updatedAt = new Date().toISOString()
    await writeRegistry(config, registry)
    agent.close()
  }

  return downloaded
}

function sanitizeArtifactPath(outputDir: string, artifact: SDKArtifact): string {
  const safeRelative = artifact.path.replace(/^(\.\.(\/|\\|$))+/, '')
  const resolved = path.resolve(outputDir, safeRelative)
  const normalizedRoot = path.resolve(outputDir)
  if (!resolved.startsWith(normalizedRoot)) {
    throw new Error(`Artifact path escaped output root: ${artifact.path}`)
  }
  return resolved
}

async function readFixture(filePath: string): Promise<{buffer: ArrayBuffer; fileName: string}> {
  const buffer = await fs.readFile(path.join(REPO_ROOT, filePath))
  const arrayBuffer = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  ) as ArrayBuffer
  return {buffer: arrayBuffer, fileName: path.basename(filePath)}
}

async function importFixtureWithEngine(
  fixture: string,
  engine: ImportEngine,
): Promise<ReturnType<typeof canonicalizeProfileGroup> | null> {
  const {buffer, fileName} = await readFixture(fixture)
  const profileGroup = await importProfilesFromArrayBuffer(fileName, buffer, {engine})
  return profileGroup ? canonicalizeProfileGroup(profileGroup) : null
}

async function compareFixtures(fixtures: string[]): Promise<ComparisonOutcome[]> {
  const outcomes: ComparisonOutcome[] = []
  for (const fixture of fixtures) {
    const legacy = await importFixtureWithEngine(fixture, 'legacy')
    const experimental = await importFixtureWithEngine(fixture, 'experimental')
    const legacyJSON = legacy == null ? null : JSON.stringify(legacy)
    const experimentalJSON = experimental == null ? null : JSON.stringify(experimental)
    const equal = legacyJSON === experimentalJSON
    outcomes.push({
      equal,
      fixture,
      summary: equal
        ? `Parity matched for ${fixture}`
        : `Parity diverged for ${fixture}: legacy=${
            legacy == null ? 'null' : 'profile group'
          }, experimental=${experimental == null ? 'null' : 'profile group'}`,
    })
  }
  return outcomes
}

async function benchmarkFixture(fixture: string, engine: ImportEngine): Promise<BenchmarkSample[]> {
  const {buffer, fileName} = await readFixture(fixture)
  const samples: BenchmarkSample[] = []
  for (let attempt = 0; attempt < 3; attempt++) {
    const startHeap = process.memoryUsage().heapUsed
    const startTime = performance.now()
    const profileGroup = await importProfilesFromArrayBuffer(fileName, buffer.slice(0), {engine})
    const endTime = performance.now()
    const endHeap = process.memoryUsage().heapUsed
    if (!profileGroup) {
      throw new Error(`Could not import ${fixture} with engine=${engine}`)
    }
    samples.push({
      elapsedMs: Math.round((endTime - startTime) * 100) / 100,
      heapUsedBytes: Math.max(0, endHeap - startHeap),
    })
  }
  return samples
}

async function runBenchmarkSuite(
  config: ControlPlaneConfig,
  fixtures: string[],
): Promise<BenchmarkResult[]> {
  const results: BenchmarkResult[] = []
  for (const fixture of fixtures) {
    results.push({
      fixture,
      legacy: await benchmarkFixture(fixture, 'legacy'),
      experimental: await benchmarkFixture(fixture, 'experimental'),
    })
  }
  await ensureDir(path.dirname(config.benchmarkReportPath))
  await fs.writeFile(config.benchmarkReportPath, `${JSON.stringify(results, null, 2)}\n`, 'utf8')
  return results
}

async function writeComparisonReport(
  config: ControlPlaneConfig,
  fixtures: string[],
  comparison: ComparisonOutcome[],
): Promise<void> {
  const report: ComparisonReport = {
    generatedAt: new Date().toISOString(),
    fixtures,
    comparison,
  }
  await ensureDir(path.dirname(config.comparisonReportPath))
  await fs.writeFile(config.comparisonReportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
}

async function readJsonFileIfExists<T>(filePath: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8')) as T
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null
    }
    throw error
  }
}

async function listLargeLocalFixtures(): Promise<string[]> {
  const fixtureRoot = process.env.SPEEDSCOPE_BENCH_FIXTURE_DIR
  if (!fixtureRoot) {
    return []
  }

  const absoluteRoot = path.isAbsolute(fixtureRoot)
    ? fixtureRoot
    : path.join(REPO_ROOT, fixtureRoot)
  const results: string[] = []

  async function walk(dirPath: string): Promise<void> {
    const entries = await fs.readdir(dirPath, {withFileTypes: true})
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name)
      if (entry.isDirectory()) {
        await walk(fullPath)
      } else if (entry.isFile()) {
        const relative = path.relative(REPO_ROOT, fullPath)
        results.push(relative)
      }
    }
  }

  try {
    await walk(absoluteRoot)
  } catch (error) {
    console.warn(
      `Skipping local large fixtures: ${error instanceof Error ? error.message : String(error)}`,
    )
  }

  return results
}

function shouldSkipFixtureForNodeRuntime(fixture: string): string | null {
  if (fixture.endsWith('.jfr') && process.env.SPEEDSCOPE_ENABLE_JFR_NODE_IMPORT !== '1') {
    return 'JFR fixtures require the browser/jest WASM loader path; set SPEEDSCOPE_ENABLE_JFR_NODE_IMPORT=1 to force them into the local CLI run.'
  }
  return null
}

async function getFixtureInventory(): Promise<FixtureInventory> {
  const localLargeFixtures = await listLargeLocalFixtures()
  const combined = [...new Set([...DEFAULT_FIXTURES, ...localLargeFixtures])]
  const activeFixtures: string[] = []
  const skippedFixtures: FixtureSkip[] = []

  for (const fixture of combined) {
    const skipReason = shouldSkipFixtureForNodeRuntime(fixture)
    if (skipReason) {
      skippedFixtures.push({fixture, reason: skipReason})
      continue
    }
    activeFixtures.push(fixture)
  }

  return {
    defaultFixtures: [...DEFAULT_FIXTURES],
    localLargeFixtures,
    activeFixtures,
    skippedFixtures,
  }
}

async function getFixtureSet(): Promise<string[]> {
  const inventory = await getFixtureInventory()
  for (const {fixture, reason} of inventory.skippedFixtures) {
    console.warn(`Skipping ${fixture}: ${reason}`)
  }
  return inventory.activeFixtures
}

async function runGate(config: ControlPlaneConfig): Promise<void> {
  const hasCloudApiKey = config.apiKey.length > 0
  const registry = hasCloudApiKey
    ? await syncPackageStatuses(config)
    : await ensureRegistrySeeded(config)
  if (!hasCloudApiKey) {
    console.warn(
      'Running gate without CURSOR_API_KEY; package status checks are informational only and the report uses compare-only local mode.',
    )
  }
  const fixtures = await getFixtureSet()
  const comparison = await compareFixtures(fixtures)
  const benchmarks = await runBenchmarkSuite(config, fixtures)

  const notGreen = hasCloudApiKey
    ? PACKAGE_DEFINITIONS.filter(def => {
        const record = registry.packages[def.id]
        if (!record) {
          return false
        }
        if (!record.agentId && record.attemptCount === 0) {
          return false
        }
        const status = record.status
        return status !== 'green' && status !== 'archived'
      }).map(def => `${def.id}:${registry.packages[def.id]?.status || 'missing'}`)
    : []

  const cutover = await synthesizeIntegrationLane(config, registry, {benchmarkResults: benchmarks})

  const gateResult: GateReport = {
    mode: hasCloudApiKey ? 'cloud-status' : 'compare-only',
    ok: comparison.every(result => result.equal) && notGreen.length === 0 && cutover.cutoverReady,
    comparison,
    benchmarks,
    packageStatuses: PACKAGE_DEFINITIONS.map(def => ({
      id: def.id,
      status: registry.packages[def.id]?.status || 'missing',
    })),
    blockingPackages: notGreen,
    cutover,
  }

  await ensureDir(path.dirname(config.gateReportPath))
  await fs.writeFile(config.gateReportPath, `${JSON.stringify(gateResult, null, 2)}\n`, 'utf8')

  if (!gateResult.ok) {
    const cutoverFragment = cutover.cutoverReady
      ? ''
      : `, cutover=hold(${cutover.reasonCode}; ${cutover.blockers.join('; ')})`
    throw new Error(
      `Cutover gate failed. Parity mismatches=${
        comparison.filter(result => !result.equal).length
      }, non-green packages=${notGreen.join(', ')}${cutoverFragment}`,
    )
  }
}

function formatSampleSummary(samples: BenchmarkSample[]): string {
  const sorted = [...samples].sort((a, b) => a.elapsedMs - b.elapsedMs)
  const median = sorted[Math.floor(sorted.length / 2)]?.elapsedMs || 0
  const min = sorted[0]?.elapsedMs || 0
  const max = sorted[sorted.length - 1]?.elapsedMs || 0
  return `median=${median}ms min=${min}ms max=${max}ms`
}

function getPackageStatusDisplay(registry: RegistryFile, packageId: string): string {
  return registry.packages[packageId]?.status || 'missing'
}

function summarizeLaneReadiness(
  registry: RegistryFile,
  definition: PackageDefinition,
): {
  blockingDependencies: string[]
  readyDependencies: number
  totalDependencies: number
} {
  const statuses = definition.dependsOn.map(depId => ({
    id: depId,
    status: getPackageStatusDisplay(registry, depId),
  }))

  return {
    blockingDependencies: statuses
      .filter(dep => dep.status !== 'green' && dep.status !== 'archived')
      .map(dep => `${dep.id}=${dep.status}`),
    readyDependencies: statuses.filter(dep => dep.status === 'green' || dep.status === 'archived')
      .length,
    totalDependencies: statuses.length,
  }
}

async function readJsonReport<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, 'utf8')
    return JSON.parse(raw) as T
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
      return null
    }
    throw error
  }
}
function getMedianElapsedMs(samples: BenchmarkSample[]): number {
  const sorted = [...samples].sort((a, b) => a.elapsedMs - b.elapsedMs)
  return sorted[Math.floor(sorted.length / 2)]?.elapsedMs || 0
}

function getEngineSeamProbeFixtures(activeFixtures: string[]): string[] {
  const preferred = [
    'sample/profiles/Chrome/69/simple.json',
    'sample/profiles/stackcollapse/simple.txt',
    'sample/profiles/stackprof/ruby-stackprof.json',
    'sample/profiles/speedscope/0.6.0/two-sampled.speedscope.json',
  ]
  const active = new Set(activeFixtures)
  return preferred.filter(fixture => active.has(fixture))
}

async function probeEngineSeam(fixture: string): Promise<EngineSeamProbeOutcome> {
  try {
    const legacy = await importFixtureWithEngine(fixture, 'legacy')
    const experimental = await importFixtureWithEngine(fixture, 'experimental')
    const legacyImported = legacy != null
    const experimentalImported = experimental != null
    const legacyJSON = legacy == null ? null : JSON.stringify(legacy)
    const experimentalJSON = experimental == null ? null : JSON.stringify(experimental)
    const equal = legacyJSON === experimentalJSON
    const summary = equal
      ? `Engine seam parity matched for ${fixture}.`
      : `Engine seam parity diverged for ${fixture}: legacy=${
          legacyImported ? 'profile group' : 'null'
        }, experimental=${experimentalImported ? 'profile group' : 'null'}.`
    return {fixture, equal, legacyImported, experimentalImported, summary}
  } catch (error) {
    return {
      fixture,
      equal: false,
      legacyImported: false,
      experimentalImported: false,
      summary: `Engine seam probe threw for ${fixture}.`,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

function getEngineLaneBenchmarkSnapshot(
  benchmarkResults: BenchmarkResult[] | null,
  activeFixtures: string[],
): EngineLaneSynthesis['benchmarkSnapshot'] {
  if (!benchmarkResults || benchmarkResults.length === 0) {
    return null
  }
  const active = new Set(activeFixtures)
  const relevant = benchmarkResults.filter(result => active.has(result.fixture))
  if (relevant.length === 0) {
    return null
  }
  let faster = 0
  let slower = 0
  let tied = 0
  for (const result of relevant) {
    const legacyMedian = getMedianElapsedMs(result.legacy)
    const experimentalMedian = getMedianElapsedMs(result.experimental)
    if (legacyMedian === experimentalMedian) {
      tied += 1
    } else if (experimentalMedian < legacyMedian) {
      faster += 1
    } else {
      slower += 1
    }
  }
  return {fixtureCount: relevant.length, faster, slower, tied}
}

async function synthesizeEngineLane(
  config: ControlPlaneConfig,
  registry: RegistryFile,
): Promise<EngineLaneSynthesis> {
  const leadDefinition = getPackageDefinition('engine-lead')
  const leadRecord = registry.packages[leadDefinition.id]
  const workers = leadDefinition.dependsOn.map(depId => ({
    id: depId,
    status: getPackageStatusDisplay(registry, depId),
  }))
  const blockingDependencies = workers
    .filter(worker => worker.status !== 'green' && worker.status !== 'archived')
    .map(worker => `${worker.id}=${worker.status}`)

  const activeFixtures = await getFixtureSet()
  const probeFixtures = getEngineSeamProbeFixtures(activeFixtures)
  const probes: EngineSeamProbeOutcome[] = []
  for (const fixture of probeFixtures) {
    probes.push(await probeEngineSeam(fixture))
  }

  const seamReady = probes.length > 0 && probes.every(probe => probe.equal)
  const blockers: string[] = []
  if (blockingDependencies.length > 0) {
    blockers.push(`workers:${blockingDependencies.join(',')}`)
  }
  if (probes.length === 0) {
    blockers.push('seam-probes:no-runnable-fixtures')
  } else if (!seamReady) {
    const failing = probes.filter(probe => !probe.equal).map(probe => probe.fixture)
    blockers.push(`seam-probes:${failing.join(',')}`)
  }

  const benchmarkResults = await readJsonReport<BenchmarkResult[]>(config.benchmarkReportPath)
  return {
    leadStatus: leadRecord?.status || 'missing',
    workers,
    blockingDependencies,
    seamReady,
    fanOutReady: blockers.length === 0,
    blockers,
    probes,
    benchmarkSnapshot: getEngineLaneBenchmarkSnapshot(benchmarkResults, activeFixtures),
  }
}

function formatEngineLaneSeamProbe(probe: EngineSeamProbeOutcome): string {
  if (probe.equal) {
    return `  PASS ${probe.fixture}`
  }
  if (probe.error) {
    return `  FAIL ${probe.fixture} (${probe.error})`
  }
  return `  FAIL ${probe.fixture}`
}

async function printEngineLaneSynthesis(
  config: ControlPlaneConfig,
  registry: RegistryFile,
): Promise<void> {
  const synthesis = await synthesizeEngineLane(config, registry)
  console.log('')
  console.log('Engine lane synthesis')
  console.log(
    `  lead: engine-lead status=${synthesis.leadStatus} fan_out_ready=${
      synthesis.fanOutReady ? 'yes' : 'no'
    }`,
  )
  console.log(
    `  workers: ${synthesis.workers.map(worker => `${worker.id}=${worker.status}`).join(', ')}`,
  )
  console.log(
    `  seam probes: ${synthesis.probes.filter(probe => probe.equal).length}/${
      synthesis.probes.length
    } matched (legacy oracle preserved)`,
  )
  for (const probe of synthesis.probes) {
    console.log(formatEngineLaneSeamProbe(probe))
  }
  if (synthesis.benchmarkSnapshot) {
    const snapshot = synthesis.benchmarkSnapshot
    console.log(
      `  benchmark snapshot: ${snapshot.fixtureCount} fixtures (experimental faster=${snapshot.faster} slower=${snapshot.slower} tied=${snapshot.tied})`,
    )
  } else {
    console.log(
      `  benchmark snapshot: pending (run ${path.relative(
        REPO_ROOT,
        config.benchmarkReportPath,
      )} via npm run experiment:benchmark)`,
    )
  }
  if (synthesis.blockers.length === 0) {
    console.log('  importer fan-out: cleared by core engine lane')
  } else {
    console.log(`  importer fan-out: blocked (${synthesis.blockers.join('; ')})`)
    console.log(`  rollback plan: ${getPackageDefinition('engine-lead').rollbackPlan}`)
  }
}

function getImporterFamilyProbeFixtures(packageId: string): string[] {
  const entry = IMPORTER_FAMILY_PROBES.find(item => item.packageId === packageId)
  if (!entry) {
    return []
  }
  return entry.fixtures.filter(fixture => shouldSkipFixtureForNodeRuntime(fixture) == null)
}

async function probeImporterFamilyFixture(fixture: string): Promise<ImporterFamilyProbeOutcome> {
  try {
    const legacy = await importFixtureWithEngine(fixture, 'legacy')
    const experimental = await importFixtureWithEngine(fixture, 'experimental')
    const legacyImported = legacy != null
    const experimentalImported = experimental != null
    const legacyJSON = legacy == null ? null : JSON.stringify(legacy)
    const experimentalJSON = experimental == null ? null : JSON.stringify(experimental)
    const equal = legacyJSON === experimentalJSON
    const summary = equal
      ? `Importer parity matched for ${fixture}.`
      : `Importer parity diverged for ${fixture}: legacy=${
          legacyImported ? 'profile group' : 'null'
        }, experimental=${experimentalImported ? 'profile group' : 'null'}.`
    return {fixture, equal, legacyImported, experimentalImported, summary}
  } catch (error) {
    return {
      fixture,
      equal: false,
      legacyImported: false,
      experimentalImported: false,
      summary: `Importer probe threw for ${fixture}.`,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

async function synthesizeImporterLane(registry: RegistryFile): Promise<ImporterLaneSynthesis> {
  const leadDefinition = getPackageDefinition('import-lead')
  const leadRecord = registry.packages[leadDefinition.id]
  const families: ImporterFamilySynthesis[] = []

  for (const entry of IMPORTER_FAMILY_PROBES) {
    const workerStatus = getPackageStatusDisplay(registry, entry.packageId)
    const probeFixtures = getImporterFamilyProbeFixtures(entry.packageId)
    const probes: ImporterFamilyProbeOutcome[] = []
    for (const fixture of probeFixtures) {
      probes.push(await probeImporterFamilyFixture(fixture))
    }
    const hasRunnableFixtures = probes.length > 0
    const parityReady = hasRunnableFixtures && probes.every(probe => probe.equal)
    families.push({
      packageId: entry.packageId,
      status: workerStatus,
      workerStatus,
      probes,
      parityReady,
      hasRunnableFixtures,
    })
  }

  const blockingFamilies: string[] = []
  for (const family of families) {
    const workerBlocked = family.workerStatus !== 'green' && family.workerStatus !== 'archived'
    if (workerBlocked) {
      blockingFamilies.push(`${family.packageId}=worker:${family.workerStatus}`)
    } else if (!family.hasRunnableFixtures) {
      blockingFamilies.push(`${family.packageId}=parity:no-runnable-fixtures`)
    } else if (!family.parityReady) {
      const failures = family.probes.filter(probe => !probe.equal).map(probe => probe.fixture)
      blockingFamilies.push(`${family.packageId}=parity:${failures.join(',')}`)
    }
  }

  return {
    leadStatus: leadRecord?.status || 'missing',
    families,
    blockingFamilies,
    fanOutReady: blockingFamilies.length === 0,
  }
}

function formatImporterFamilyProbe(probe: ImporterFamilyProbeOutcome): string {
  if (probe.equal) {
    return `    PASS ${probe.fixture}`
  }
  if (probe.error) {
    return `    FAIL ${probe.fixture} (${probe.error})`
  }
  return `    FAIL ${probe.fixture}`
}

async function printImporterLaneSynthesis(registry: RegistryFile): Promise<void> {
  const synthesis = await synthesizeImporterLane(registry)
  const leadDefinition = getPackageDefinition('import-lead')

  console.log('')
  console.log('Importer lane synthesis')
  console.log(
    `  lead: ${leadDefinition.id} status=${synthesis.leadStatus} fan_out_ready=${
      synthesis.fanOutReady ? 'yes' : 'no'
    }`,
  )
  for (const family of synthesis.families) {
    const matched = family.probes.filter(probe => probe.equal).length
    const total = family.probes.length
    const parityLabel = family.hasRunnableFixtures
      ? `${matched}/${total} parity matched`
      : 'parity skipped (no runnable fixtures in this runtime)'
    console.log(`  ${family.packageId}: worker=${family.workerStatus}, ${parityLabel}`)
    for (const probe of family.probes) {
      console.log(formatImporterFamilyProbe(probe))
    }
  }

  if (synthesis.fanOutReady) {
    console.log('  importer fan-out: cleared (legacy oracle preserved across families)')
  } else {
    console.log(`  importer fan-out: blocked (${synthesis.blockingFamilies.join('; ')})`)
    console.log(`  rollback plan: ${leadDefinition.rollbackPlan}`)
  }
}

function getIntegrationCutoverProbeFixtures(activeFixtures: string[]): string[] {
  const active = new Set(activeFixtures)
  return INTEGRATION_CUTOVER_PROBE_FIXTURES.filter(fixture => active.has(fixture))
}

async function probeIntegrationCutoverFixture(
  fixture: string,
): Promise<IntegrationCutoverProbeOutcome> {
  let comparisonResult: ImportComparisonResult | null = null
  try {
    const {buffer, fileName} = await readFixture(fixture)
    await importProfilesFromArrayBuffer(fileName, buffer, {
      engine: 'experimental',
      compareAgainst: 'legacy',
      comparisonMode: 'warn',
      onComparison: result => {
        comparisonResult = result
      },
    })
  } catch (error) {
    return {
      fixture,
      primaryEngine: 'experimental',
      comparisonEngine: 'legacy',
      equal: false,
      comparisonMode: 'warn',
      summary: `Dual-run seam threw for ${fixture}.`,
      error: error instanceof Error ? error.message : String(error),
    }
  }

  const result = comparisonResult as ImportComparisonResult | null

  if (!result) {
    return {
      fixture,
      primaryEngine: 'experimental',
      comparisonEngine: 'legacy',
      equal: false,
      comparisonMode: 'warn',
      summary: `Dual-run seam did not emit a comparison result for ${fixture}.`,
    }
  }

  return {
    fixture,
    primaryEngine: result.primaryEngine,
    comparisonEngine: result.secondaryEngine,
    equal: result.equal,
    comparisonMode: 'warn',
    summary: result.summary,
  }
}

function getIntegrationCutoverBenchmarkSnapshot(
  benchmarkResults: BenchmarkResult[] | null,
  activeFixtures: string[],
): IntegrationBenchmarkSnapshot | null {
  if (!benchmarkResults || benchmarkResults.length === 0) {
    return null
  }
  const active = new Set(activeFixtures)
  const relevant = benchmarkResults.filter(result => active.has(result.fixture))
  if (relevant.length === 0) {
    return null
  }

  let faster = 0
  let slower = 0
  let tied = 0
  let worstSlowdownRatio: number | null = null
  let worstSlowdownFixture: string | null = null

  for (const result of relevant) {
    const legacyMedian = getMedianElapsedMs(result.legacy)
    const experimentalMedian = getMedianElapsedMs(result.experimental)
    if (legacyMedian === experimentalMedian) {
      tied += 1
      continue
    }
    if (experimentalMedian < legacyMedian) {
      faster += 1
      continue
    }
    slower += 1
    if (legacyMedian > 0) {
      const ratio = experimentalMedian / legacyMedian
      if (worstSlowdownRatio == null || ratio > worstSlowdownRatio) {
        worstSlowdownRatio = ratio
        worstSlowdownFixture = result.fixture
      }
    }
  }

  return {
    fixtureCount: relevant.length,
    faster,
    slower,
    tied,
    worstSlowdownRatio,
    worstSlowdownFixture,
  }
}

function evaluateIntegrationCutoverSummary(input: {
  workers: Array<{id: string; status: string}>
  upstreamLeads: Array<{id: string; status: string}>
  probes: IntegrationCutoverProbeOutcome[]
  benchmarkSnapshot: IntegrationBenchmarkSnapshot | null
  rollbackPlan: string
}): IntegrationCutoverSummary {
  const workerBlockers = input.workers
    .filter(worker => worker.status !== 'green' && worker.status !== 'archived')
    .map(worker => `${worker.id}=${worker.status}`)
  const upstreamLeadBlockers = input.upstreamLeads
    .filter(lead => lead.status !== 'green' && lead.status !== 'archived')
    .map(lead => `${lead.id}=${lead.status}`)
  const failingProbes = input.probes.filter(probe => !probe.equal).map(probe => probe.fixture)

  let reasonCode: IntegrationCutoverSummary['reasonCode']
  let blockers: string[]

  if (workerBlockers.length > 0) {
    reasonCode = 'workers-blocked'
    blockers = workerBlockers
  } else if (upstreamLeadBlockers.length > 0) {
    reasonCode = 'upstream-leads-blocked'
    blockers = upstreamLeadBlockers
  } else if (input.probes.length === 0) {
    reasonCode = 'no-runnable-fixtures'
    blockers = ['cutover-probes:no-runnable-fixtures']
  } else if (failingProbes.length > 0) {
    reasonCode = 'parity-divergence'
    blockers = failingProbes.map(fixture => `cutover-probes:${fixture}`)
  } else {
    reasonCode = 'cleared'
    blockers = []
  }

  return {
    cutoverReady: reasonCode === 'cleared',
    recommendation: reasonCode === 'cleared' ? 'cutover' : 'hold',
    reasonCode,
    blockers,
    workers: input.workers,
    upstreamLeads: input.upstreamLeads,
    probes: input.probes,
    benchmarkSnapshot: input.benchmarkSnapshot,
    rollbackPlan: input.rollbackPlan,
  }
}

async function synthesizeIntegrationLane(
  config: ControlPlaneConfig,
  registry: RegistryFile,
  options?: {benchmarkResults?: BenchmarkResult[] | null},
): Promise<IntegrationCutoverSummary> {
  const leadDefinition = getPackageDefinition(INTEGRATION_LEAD_PACKAGE_ID)
  const workers = INTEGRATION_WORKER_PACKAGE_IDS.map(id => ({
    id,
    status: getPackageStatusDisplay(registry, id),
  }))
  const upstreamLeads = INTEGRATION_UPSTREAM_LEAD_PACKAGE_IDS.map(id => ({
    id,
    status: getPackageStatusDisplay(registry, id),
  }))

  const activeFixtures = await getFixtureSet()
  const probeFixtures = getIntegrationCutoverProbeFixtures(activeFixtures)
  const probes: IntegrationCutoverProbeOutcome[] = []
  for (const fixture of probeFixtures) {
    probes.push(await probeIntegrationCutoverFixture(fixture))
  }

  const benchmarkResults =
    options?.benchmarkResults !== undefined
      ? options.benchmarkResults
      : await readJsonReport<BenchmarkResult[]>(config.benchmarkReportPath)

  return evaluateIntegrationCutoverSummary({
    workers,
    upstreamLeads,
    probes,
    benchmarkSnapshot: getIntegrationCutoverBenchmarkSnapshot(
      benchmarkResults || null,
      activeFixtures,
    ),
    rollbackPlan: leadDefinition.rollbackPlan,
  })
}

function formatIntegrationCutoverProbe(probe: IntegrationCutoverProbeOutcome): string {
  if (probe.equal) {
    return `    PASS ${probe.fixture} (${probe.primaryEngine} matched ${probe.comparisonEngine})`
  }
  if (probe.error) {
    return `    FAIL ${probe.fixture} (${probe.error})`
  }
  return `    FAIL ${probe.fixture} (${probe.summary})`
}

async function printIntegrationLaneSynthesis(
  config: ControlPlaneConfig,
  registry: RegistryFile,
  options?: {benchmarkResults?: BenchmarkResult[] | null},
): Promise<IntegrationCutoverSummary> {
  const summary = await synthesizeIntegrationLane(config, registry, options)

  console.log('')
  console.log('Integration lane synthesis')
  console.log(
    `  lead: ${INTEGRATION_LEAD_PACKAGE_ID} status=${getPackageStatusDisplay(
      registry,
      INTEGRATION_LEAD_PACKAGE_ID,
    )} cutover_ready=${summary.cutoverReady ? 'yes' : 'no'} recommendation=${
      summary.recommendation
    }`,
  )
  console.log(
    `  workers: ${summary.workers.map(worker => `${worker.id}=${worker.status}`).join(', ')}`,
  )
  console.log(
    `  upstream leads: ${summary.upstreamLeads
      .map(lead => `${lead.id}=${lead.status}`)
      .join(', ')}`,
  )

  const matched = summary.probes.filter(probe => probe.equal).length
  const total = summary.probes.length
  const probeLabel =
    total === 0
      ? 'cutover probes: skipped (no runnable fixtures in this runtime)'
      : `cutover probes: ${matched}/${total} matched (legacy oracle preserved through dual-run seam)`
  console.log(`  ${probeLabel}`)
  for (const probe of summary.probes) {
    console.log(formatIntegrationCutoverProbe(probe))
  }

  if (summary.benchmarkSnapshot) {
    const snapshot = summary.benchmarkSnapshot
    const worst =
      snapshot.worstSlowdownRatio != null && snapshot.worstSlowdownFixture
        ? ` worst-slowdown=${snapshot.worstSlowdownRatio.toFixed(2)}x@${
            snapshot.worstSlowdownFixture
          }`
        : ''
    console.log(
      `  benchmark snapshot: ${snapshot.fixtureCount} fixtures (experimental faster=${snapshot.faster} slower=${snapshot.slower} tied=${snapshot.tied})${worst}`,
    )
  } else {
    console.log(
      `  benchmark snapshot: pending (run npm run experiment:benchmark to populate ${path.relative(
        REPO_ROOT,
        config.benchmarkReportPath,
      )})`,
    )
  }

  if (summary.cutoverReady) {
    console.log('  cutover: cleared (legacy oracle preserved across the integration boundary)')
  } else {
    console.log(
      `  cutover: hold (reason=${summary.reasonCode}; blockers=${summary.blockers.join('; ')})`,
    )
    console.log(`  rollback plan: ${summary.rollbackPlan}`)
  }

  return summary
}

function summarizeFixtureList(fixtures: string[]): string {
  if (fixtures.length === 0) {
    return 'none'
  }
  if (fixtures.length <= 2) {
    return fixtures.join(', ')
  }
  return `${fixtures.slice(0, 2).join(', ')}, +${fixtures.length - 2} more`
}

function getFixtureCoverage(reportFixtures: string[], activeFixtures: string[]) {
  const reported = new Set(reportFixtures)
  const active = new Set(activeFixtures)
  return {
    missing: activeFixtures.filter(fixture => !reported.has(fixture)),
    stale: reportFixtures.filter(fixture => !active.has(fixture)),
  }
}

function formatFixtureCoverage(reportFixtures: string[], activeFixtures: string[]): string {
  const coverage = getFixtureCoverage(reportFixtures, activeFixtures)
  if (coverage.missing.length === 0 && coverage.stale.length === 0) {
    return 'coverage=complete'
  }

  const details: string[] = []
  if (coverage.missing.length > 0) {
    details.push(`missing=${coverage.missing.length} (${summarizeFixtureList(coverage.missing)})`)
  }
  if (coverage.stale.length > 0) {
    details.push(`stale=${coverage.stale.length} (${summarizeFixtureList(coverage.stale)})`)
  }
  return `coverage=partial ${details.join(', ')}`
}

function formatPercentDelta(deltaPercent: number): string {
  const rounded = Math.round(deltaPercent * 10) / 10
  return `${rounded > 0 ? '+' : ''}${rounded}%`
}

function summarizeBenchmarkResults(results: BenchmarkResult[]) {
  let faster = 0
  let slower = 0
  let tied = 0
  let bestImprovement: {
    fixture: string
    legacyMedianMs: number
    experimentalMedianMs: number
    deltaPercent: number
  } | null = null
  let worstRegression: {
    fixture: string
    legacyMedianMs: number
    experimentalMedianMs: number
    deltaPercent: number
  } | null = null

  for (const result of results) {
    const legacyMedianMs = getMedianElapsedMs(result.legacy)
    const experimentalMedianMs = getMedianElapsedMs(result.experimental)
    if (experimentalMedianMs < legacyMedianMs) {
      faster += 1
    } else if (experimentalMedianMs > legacyMedianMs) {
      slower += 1
    } else {
      tied += 1
    }

    if (legacyMedianMs <= 0) {
      continue
    }
    const deltaPercent = ((experimentalMedianMs - legacyMedianMs) / legacyMedianMs) * 100
    const delta = {
      fixture: result.fixture,
      legacyMedianMs,
      experimentalMedianMs,
      deltaPercent,
    }
    if (!bestImprovement || deltaPercent < bestImprovement.deltaPercent) {
      bestImprovement = delta
    }
    if (!worstRegression || deltaPercent > worstRegression.deltaPercent) {
      worstRegression = delta
    }
  }

  return {faster, slower, tied, bestImprovement, worstRegression}
}

async function printHarnessLaneSynthesis(
  config: ControlPlaneConfig,
  registry: RegistryFile,
): Promise<void> {
  const leadDefinition = getPackageDefinition('harness-lead')
  const leadRecord = registry.packages[leadDefinition.id]
  const dependencySummary = leadDefinition.dependsOn.map(depId => {
    const depRecord = registry.packages[depId]
    return `${depId}=${depRecord?.status || 'missing'}`
  })
  const [fixtureInventory, comparisonReport, benchmarkResults] = await Promise.all([
    getFixtureInventory(),
    readJsonFileIfExists<ComparisonReport>(config.comparisonReportPath),
    readJsonFileIfExists<BenchmarkResult[]>(config.benchmarkReportPath),
  ])

  console.log('')
  console.log('Harness lane synthesis')
  console.log(
    `  lead: ${leadDefinition.id} status=${leadRecord?.status || 'missing'} readiness=${
      areDependenciesGreen(registry, leadDefinition.id) ? 'dependencies-green' : 'blocked'
    }`,
  )
  console.log(`  workers: ${dependencySummary.join(', ')}`)
  console.log(
    `  fixtures: builtin=${fixtureInventory.defaultFixtures.length} local_large=${fixtureInventory.localLargeFixtures.length} active_node=${fixtureInventory.activeFixtures.length} skipped=${fixtureInventory.skippedFixtures.length}`,
  )
  if (fixtureInventory.skippedFixtures.length > 0) {
    console.log(
      `  skipped fixtures: ${summarizeFixtureList(
        fixtureInventory.skippedFixtures.map(item => item.fixture),
      )}`,
    )
  }

  if (comparisonReport) {
    const mismatches = comparisonReport.comparison.filter(result => !result.equal)
    const matches = comparisonReport.comparison.length - mismatches.length
    console.log(
      `  oracle parity: ${matches}/${
        comparisonReport.comparison.length
      } matched (${formatFixtureCoverage(
        comparisonReport.fixtures,
        fixtureInventory.activeFixtures,
      )})`,
    )
  } else {
    console.log(
      `  oracle parity: pending (${
        registry.packages['golden-oracle']?.status || 'missing'
      }; missing ${path.relative(REPO_ROOT, config.comparisonReportPath)})`,
    )
  }

  if (benchmarkResults) {
    const summary = summarizeBenchmarkResults(benchmarkResults)
    console.log(
      `  benchmark: ${benchmarkResults.length} fixtures, experimental faster=${
        summary.faster
      } slower=${summary.slower} tied=${summary.tied} (${formatFixtureCoverage(
        benchmarkResults.map(result => result.fixture),
        fixtureInventory.activeFixtures,
      )})`,
    )
    if (summary.bestImprovement) {
      console.log(
        `  best improvement: ${summary.bestImprovement.fixture} ${formatPercentDelta(
          summary.bestImprovement.deltaPercent,
        )} (${summary.bestImprovement.legacyMedianMs}ms -> ${
          summary.bestImprovement.experimentalMedianMs
        }ms median)`,
      )
    }
    if (summary.worstRegression) {
      console.log(
        `  worst regression: ${summary.worstRegression.fixture} ${formatPercentDelta(
          summary.worstRegression.deltaPercent,
        )} (${summary.worstRegression.legacyMedianMs}ms -> ${
          summary.worstRegression.experimentalMedianMs
        }ms median)`,
      )
    }
  } else {
    console.log(
      `  benchmark: pending (${
        registry.packages['bench-runner']?.status || 'missing'
      }; missing ${path.relative(REPO_ROOT, config.benchmarkReportPath)})`,
    )
  }
}

function summarizeBenchmarkReport(results: BenchmarkResult[]): string {
  let experimentalFaster = 0
  let experimentalSlower = 0
  let tied = 0

  for (const result of results) {
    const legacyMedian = getMedianElapsedMs(result.legacy)
    const experimentalMedian = getMedianElapsedMs(result.experimental)
    if (legacyMedian === experimentalMedian) {
      tied += 1
    } else if (experimentalMedian < legacyMedian) {
      experimentalFaster += 1
    } else {
      experimentalSlower += 1
    }
  }

  return `${results.length} fixtures; experimental faster on ${experimentalFaster}, slower on ${experimentalSlower}, tied on ${tied}`
}

function summarizeGateReport(report: GateReport): string {
  const parityMismatches = report.comparison.filter(result => !result.equal).length
  const cutover = report.cutover
    ? `, cutover=${report.cutover.cutoverReady ? 'cleared' : `hold(${report.cutover.reasonCode})`}`
    : ''
  return `${report.ok ? 'PASS' : 'FAIL'} parity mismatches=${parityMismatches}, blocking packages=${
    report.blockingPackages.length
  }, benchmark fixtures=${report.benchmarks.length}${cutover}`
}

async function printReport(config: ControlPlaneConfig): Promise<void> {
  const registry = config.apiKey
    ? await syncPackageStatuses(config)
    : await ensureRegistrySeeded(config)
  const benchmarkReport = await readJsonReport<BenchmarkResult[]>(config.benchmarkReportPath)
  const gateReport = await readJsonReport<GateReport>(config.gateReportPath)

  console.log(
    config.apiKey
      ? 'Cloud sync: enabled'
      : 'Cloud sync: skipped (CURSOR_API_KEY not set; reporting from the local registry only)',
  )
  console.log('')
  console.log('Lane readiness:')
  for (const definition of PACKAGE_DEFINITIONS.filter(def => def.kind === 'lead')) {
    const leadStatus = getPackageStatusDisplay(registry, definition.id)
    const laneSummary = summarizeLaneReadiness(registry, definition)
    console.log(
      `${definition.lane.padEnd(12)} ${definition.id.padEnd(24)} ${leadStatus.padEnd(
        18,
      )} deps ${String(laneSummary.readyDependencies).padStart(1)}/${
        laneSummary.totalDependencies
      }`,
    )
    if (laneSummary.blockingDependencies.length > 0) {
      console.log(`  blockers: ${laneSummary.blockingDependencies.join(', ')}`)
    }
  }

  console.log('')
  console.log('Local reports:')
  console.log(
    benchmarkReport
      ? `benchmark: ${summarizeBenchmarkReport(benchmarkReport)}`
      : `benchmark: missing (${path.relative(REPO_ROOT, config.benchmarkReportPath)})`,
  )
  console.log(
    gateReport
      ? `gate: ${summarizeGateReport(gateReport)}`
      : `gate: missing (${path.relative(REPO_ROOT, config.gateReportPath)})`,
  )
  console.log('')
  console.log('Package status:')
  for (const definition of PACKAGE_DEFINITIONS) {
    console.log(
      `${definition.id.padEnd(24)} ${getPackageStatusDisplay(registry, definition.id).padEnd(18)} ${
        registry.packages[definition.id]?.selectedModelId || '-'
      }`,
    )
  }
  await printHarnessLaneSynthesis(config, registry)
  await printEngineLaneSynthesis(config, registry)
  await printImporterLaneSynthesis(registry)
  await printIntegrationLaneSynthesis(config, registry, {benchmarkResults: benchmarkReport})
}

async function printGraph(): Promise<void> {
  for (const definition of PACKAGE_DEFINITIONS) {
    console.log(
      `${definition.id} -> ${
        definition.dependsOn.length ? definition.dependsOn.join(', ') : '(root)'
      }`,
    )
  }
}

async function runReadyPackages(config: ControlPlaneConfig, force = false): Promise<void> {
  const registry = await syncPackageStatuses(config)
  const ready = getReadyPackages(registry).slice(0, config.maxParallelPackages)
  if (ready.length === 0) {
    console.log('No packages are ready to run.')
    return
  }

  // Package runs can take place in parallel in the cloud, but the local registry
  // needs serialized writes so agent/run IDs are not lost when multiple packages
  // start at the same time.
  for (const definition of ready) {
    console.log(`Running ${definition.id} on ${definition.branchName}`)
    await runPackage(config, definition.id, force)
  }
}

async function runDoctor(config: ControlPlaneConfig): Promise<void> {
  const rest = new RestClient(config)
  const me = await rest.getMe()
  const models = await rest.listModels()
  const configured = new Set(Object.values(config.models))
  const available = new Set(models.map(model => model.id))
  const missing = [...configured].filter(modelId => available.size > 0 && !available.has(modelId))

  console.log(`Repository: ${config.repositoryUrl}`)
  console.log(`Base branch: ${config.baseBranch}`)
  console.log(
    `Cloud env: ${config.cloudEnvType}${config.cloudEnvName ? `/${config.cloudEnvName}` : ''}`,
  )
  console.log(`Registry: ${path.relative(REPO_ROOT, config.registryPath)}`)
  console.log(`Authenticated as: ${JSON.stringify(me)}`)
  console.log(
    `Models: orchestrator=${config.models.orchestratorDefaultModel}, deep=${config.models.deepReasoningModel}, executor=${config.models.executorModel}`,
  )
  if (missing.length > 0) {
    console.warn(`Configured model ids were not returned by /models: ${missing.join(', ')}`)
  }
}

async function runCompareCommand(config: ControlPlaneConfig): Promise<void> {
  const fixtures = await getFixtureSet()
  const comparison = await compareFixtures(fixtures)
  await writeComparisonReport(config, fixtures, comparison)
  for (const result of comparison) {
    console.log(result.equal ? `PASS ${result.fixture}` : `FAIL ${result.fixture}`)
  }
  const failures = comparison.filter(result => !result.equal)
  if (failures.length > 0) {
    throw new Error(
      `${failures.length} fixtures diverged between legacy and experimental import paths.`,
    )
  }
}

async function runBenchmarkCommand(config: ControlPlaneConfig): Promise<void> {
  const fixtures = await getFixtureSet()
  const results = await runBenchmarkSuite(config, fixtures)
  for (const result of results) {
    console.log(
      `${result.fixture}\n  legacy: ${formatSampleSummary(
        result.legacy,
      )}\n  experimental: ${formatSampleSummary(result.experimental)}`,
    )
  }
}

async function main(): Promise<void> {
  const [command, ...args] = process.argv.slice(2)
  if (command === 'graph') {
    await printGraph()
    return
  }

  const config = await resolveConfig({
    requireApiKey: !['report', 'compare', 'benchmark', 'gate'].includes(command || ''),
  })
  if (command !== 'compare' && command !== 'benchmark') {
    await ensureRegistrySeeded(config)
  }

  switch (command) {
    case 'doctor':
      await runDoctor(config)
      return
    case 'graph':
    case 'report':
      await printReport(config)
      return
    case 'run-package': {
      const packageId = args[0]
      if (!packageId) {
        throw new Error('Usage: npm run experiment:run-package -- <package-id> [--force]')
      }
      await runPackage(config, packageId, args.includes('--force'))
      return
    }
    case 'run-ready':
      await runReadyPackages(config, args.includes('--force'))
      return
    case 'sync':
      await syncPackageStatuses(config)
      await printReport(config)
      return
    case 'collect-artifacts': {
      const packageId = args[0]
      const downloaded = await collectArtifacts(config, packageId)
      console.log(JSON.stringify(downloaded, null, 2))
      return
    }
    case 'compare':
      await runCompareCommand(config)
      return
    case 'benchmark':
      await runBenchmarkCommand(config)
      return
    case 'gate':
      await runGate(config)
      console.log(`Gate report written to ${path.relative(REPO_ROOT, config.gateReportPath)}`)
      return
    default:
      throw new Error(
        `Unknown command "${
          command || ''
        }". Expected one of: doctor, graph, report, run-package, run-ready, sync, collect-artifacts, compare, benchmark, gate`,
      )
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  main().catch(error => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}

export {
  DEFAULT_FIXTURES,
  INTEGRATION_CUTOVER_PROBE_FIXTURES,
  INTEGRATION_LEAD_PACKAGE_ID,
  INTEGRATION_UPSTREAM_LEAD_PACKAGE_IDS,
  INTEGRATION_WORKER_PACKAGE_IDS,
  PACKAGE_DEFINITIONS,
  buildPackagePrompt,
  compareFixtures,
  evaluateIntegrationCutoverSummary,
  ensureRegistrySeeded,
  getFixtureSet,
  getIntegrationCutoverBenchmarkSnapshot,
  getIntegrationCutoverProbeFixtures,
  getReadyPackages,
  probeEngineSeam,
  probeIntegrationCutoverFixture,
  resolveConfig,
  routeModel,
  runBenchmarkSuite,
  synthesizeEngineLane,
}
