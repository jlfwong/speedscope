import {
  INTEGRATION_CUTOVER_PROBE_FIXTURES,
  IntegrationCutoverProbeOutcome,
  evaluateIntegrationCutoverSummary,
  getIntegrationCutoverBenchmarkSnapshot,
  getIntegrationCutoverProbeFixtures,
  probeIntegrationCutoverFixture,
  routeModel,
} from './cloud-control-plane'

const models = {
  orchestratorDefaultModel: 'gpt-5.4-xhigh-fast',
  deepReasoningModel: 'claude-opus-4-7-thinking-max',
  executorModel: 'composer-2',
}

const ROLLBACK_PLAN = 'Hold cutover and leave experimental mode opt-in only.'

function makeProbe(
  fixture: string,
  equal: boolean,
  overrides: Partial<IntegrationCutoverProbeOutcome> = {},
): IntegrationCutoverProbeOutcome {
  return {
    fixture,
    primaryEngine: 'experimental',
    comparisonEngine: 'legacy',
    equal,
    comparisonMode: 'warn',
    summary: equal ? `Matched ${fixture}` : `Diverged ${fixture}`,
    ...overrides,
  }
}

test('routes clear worker tasks to the executor model', () => {
  const result = routeModel(
    {
      kind: 'worker',
      specCompleteness: 'high',
      crossPackageScope: 'single-package',
      ambiguity: 'low',
      blastRadius: 'low',
      failureHistory: 0,
    },
    models,
  )

  expect(result.policy).toBe('executorModel')
  expect(result.modelId).toBe(models.executorModel)
})

test('routes ambiguous or failing work to the deep reasoning model', () => {
  const result = routeModel(
    {
      kind: 'worker',
      specCompleteness: 'medium',
      crossPackageScope: 'single-lane',
      ambiguity: 'high',
      blastRadius: 'high',
      failureHistory: 2,
    },
    models,
  )

  expect(result.policy).toBe('deepReasoningModel')
  expect(result.modelId).toBe(models.deepReasoningModel)
})

test('routes coordination-heavy lead work to the orchestrator model', () => {
  const result = routeModel(
    {
      kind: 'lead',
      specCompleteness: 'medium',
      crossPackageScope: 'single-lane',
      ambiguity: 'medium',
      blastRadius: 'medium',
      failureHistory: 0,
    },
    models,
  )

  expect(result.policy).toBe('orchestratorDefaultModel')
  expect(result.modelId).toBe(models.orchestratorDefaultModel)
})

test('integration cutover stays held when worker packages are not green', () => {
  const summary = evaluateIntegrationCutoverSummary({
    workers: [
      {id: 'dual-run-compare-mode', status: 'queued'},
      {id: 'view-bridge', status: 'green'},
    ],
    upstreamLeads: [
      {id: 'engine-lead', status: 'green'},
      {id: 'import-lead', status: 'green'},
    ],
    probes: [makeProbe('sample/profiles/Chrome/69/simple.json', true)],
    benchmarkSnapshot: null,
    rollbackPlan: ROLLBACK_PLAN,
  })

  expect(summary.cutoverReady).toBe(false)
  expect(summary.recommendation).toBe('hold')
  expect(summary.reasonCode).toBe('workers-blocked')
  expect(summary.blockers.join(';')).toContain('dual-run-compare-mode=queued')
  expect(summary.rollbackPlan).toBe(ROLLBACK_PLAN)
})

test('integration cutover stays held when an upstream lane lead is not green', () => {
  const summary = evaluateIntegrationCutoverSummary({
    workers: [
      {id: 'dual-run-compare-mode', status: 'green'},
      {id: 'view-bridge', status: 'green'},
    ],
    upstreamLeads: [
      {id: 'engine-lead', status: 'green'},
      {id: 'import-lead', status: 'failed'},
    ],
    probes: [makeProbe('sample/profiles/Chrome/69/simple.json', true)],
    benchmarkSnapshot: null,
    rollbackPlan: ROLLBACK_PLAN,
  })

  expect(summary.cutoverReady).toBe(false)
  expect(summary.recommendation).toBe('hold')
  expect(summary.reasonCode).toBe('upstream-leads-blocked')
  expect(summary.blockers.join(';')).toContain('import-lead=failed')
})

test('integration cutover stays held when the dual-run seam diverges from the legacy oracle', () => {
  const summary = evaluateIntegrationCutoverSummary({
    workers: [
      {id: 'dual-run-compare-mode', status: 'green'},
      {id: 'view-bridge', status: 'green'},
    ],
    upstreamLeads: [
      {id: 'engine-lead', status: 'green'},
      {id: 'import-lead', status: 'green'},
    ],
    probes: [
      makeProbe('sample/profiles/Chrome/69/simple.json', true),
      makeProbe('sample/profiles/stackcollapse/simple.txt', false),
    ],
    benchmarkSnapshot: null,
    rollbackPlan: ROLLBACK_PLAN,
  })

  expect(summary.cutoverReady).toBe(false)
  expect(summary.recommendation).toBe('hold')
  expect(summary.reasonCode).toBe('parity-divergence')
  expect(summary.blockers.join(';')).toContain(
    'cutover-probes:sample/profiles/stackcollapse/simple.txt',
  )
})

test('integration cutover clears when workers, upstream leads, and dual-run probes all pass', () => {
  const summary = evaluateIntegrationCutoverSummary({
    workers: [
      {id: 'dual-run-compare-mode', status: 'green'},
      {id: 'view-bridge', status: 'green'},
    ],
    upstreamLeads: [
      {id: 'engine-lead', status: 'green'},
      {id: 'import-lead', status: 'green'},
    ],
    probes: [
      makeProbe('sample/profiles/Chrome/69/simple.json', true),
      makeProbe('sample/profiles/stackcollapse/simple.txt', true),
    ],
    benchmarkSnapshot: {
      fixtureCount: 2,
      faster: 1,
      slower: 1,
      tied: 0,
      worstSlowdownRatio: 1.1,
      worstSlowdownFixture: 'sample/profiles/stackcollapse/simple.txt',
    },
    rollbackPlan: ROLLBACK_PLAN,
  })

  expect(summary.cutoverReady).toBe(true)
  expect(summary.recommendation).toBe('cutover')
  expect(summary.reasonCode).toBe('cleared')
  expect(summary.blockers).toHaveLength(0)
})

test('integration cutover holds when no fixtures are runnable in this environment', () => {
  const summary = evaluateIntegrationCutoverSummary({
    workers: [
      {id: 'dual-run-compare-mode', status: 'green'},
      {id: 'view-bridge', status: 'green'},
    ],
    upstreamLeads: [
      {id: 'engine-lead', status: 'green'},
      {id: 'import-lead', status: 'green'},
    ],
    probes: [],
    benchmarkSnapshot: null,
    rollbackPlan: ROLLBACK_PLAN,
  })

  expect(summary.cutoverReady).toBe(false)
  expect(summary.reasonCode).toBe('no-runnable-fixtures')
})

test('benchmark snapshot reports per-bucket counts and the worst slowdown ratio', () => {
  const snapshot = getIntegrationCutoverBenchmarkSnapshot(
    [
      {
        fixture: 'sample/profiles/Chrome/69/simple.json',
        legacy: [
          {elapsedMs: 10, heapUsedBytes: 0},
          {elapsedMs: 12, heapUsedBytes: 0},
          {elapsedMs: 14, heapUsedBytes: 0},
        ],
        experimental: [
          {elapsedMs: 18, heapUsedBytes: 0},
          {elapsedMs: 20, heapUsedBytes: 0},
          {elapsedMs: 22, heapUsedBytes: 0},
        ],
      },
      {
        fixture: 'sample/profiles/stackcollapse/simple.txt',
        legacy: [
          {elapsedMs: 10, heapUsedBytes: 0},
          {elapsedMs: 11, heapUsedBytes: 0},
          {elapsedMs: 12, heapUsedBytes: 0},
        ],
        experimental: [
          {elapsedMs: 5, heapUsedBytes: 0},
          {elapsedMs: 6, heapUsedBytes: 0},
          {elapsedMs: 7, heapUsedBytes: 0},
        ],
      },
    ],
    ['sample/profiles/Chrome/69/simple.json', 'sample/profiles/stackcollapse/simple.txt'],
  )

  expect(snapshot).not.toBeNull()
  expect(snapshot!.fixtureCount).toBe(2)
  expect(snapshot!.faster).toBe(1)
  expect(snapshot!.slower).toBe(1)
  expect(snapshot!.tied).toBe(0)
  expect(snapshot!.worstSlowdownFixture).toBe('sample/profiles/Chrome/69/simple.json')
  expect(snapshot!.worstSlowdownRatio).toBeGreaterThan(1)
})

test('benchmark snapshot is null when no relevant fixtures intersect the active set', () => {
  const snapshot = getIntegrationCutoverBenchmarkSnapshot(
    [
      {
        fixture: 'sample/profiles/Chrome/69/simple.json',
        legacy: [{elapsedMs: 10, heapUsedBytes: 0}],
        experimental: [{elapsedMs: 12, heapUsedBytes: 0}],
      },
    ],
    ['sample/profiles/stackcollapse/simple.txt'],
  )

  expect(snapshot).toBeNull()
})

test('cutover probe fixture set intersects the curated list with the active set', () => {
  const probeFixtures = getIntegrationCutoverProbeFixtures([
    'sample/profiles/Chrome/69/simple.json',
    'sample/profiles/stackcollapse/simple.txt',
    'sample/profiles/some-other-fixture-not-in-the-curated-list.txt',
  ])

  expect(probeFixtures).toContain('sample/profiles/Chrome/69/simple.json')
  expect(probeFixtures).toContain('sample/profiles/stackcollapse/simple.txt')
  expect(probeFixtures).not.toContain(
    'sample/profiles/some-other-fixture-not-in-the-curated-list.txt',
  )
  for (const fixture of probeFixtures) {
    expect(INTEGRATION_CUTOVER_PROBE_FIXTURES as readonly string[]).toContain(fixture)
  }
})

test('probeIntegrationCutoverFixture exercises the dual-run seam and matches the legacy oracle', async () => {
  const outcome = await probeIntegrationCutoverFixture('sample/profiles/Chrome/69/simple.json')
  expect(outcome.equal).toBe(true)
  expect(outcome.primaryEngine).toBe('experimental')
  expect(outcome.comparisonEngine).toBe('legacy')
  expect(outcome.error).toBeUndefined()
})
