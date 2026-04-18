import {routeModel} from './cloud-control-plane'

const models = {
  orchestratorDefaultModel: 'gpt-5.4-xhigh-fast',
  deepReasoningModel: 'claude-opus-4-7-thinking-max',
  executorModel: 'composer-2',
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
