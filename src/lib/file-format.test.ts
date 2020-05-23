import {checkProfileSnapshot, expectImportFailure} from './test-utils'

describe('importSpeedscopeProfiles', () => {
  test('0.0.1 evented profile', async () => {
    await checkProfileSnapshot('./sample/profiles/speedscope/0.0.1/simple.speedscope.json')
  })

  test('0.1.2 sampled profile', async () => {
    await checkProfileSnapshot('./sample/profiles/speedscope/0.1.2/simple-sampled.speedscope.json')
  })

  test('0.6.0 multiple profiles', async () => {
    await checkProfileSnapshot('./sample/profiles/speedscope/0.6.0/two-sampled.speedscope.json')
  })

  test('invalid due to out of order events', async () => {
    // See: https://github.com/jlfwong/speedscope/issues/272
    await expectImportFailure('./sample/profiles/speedscope/invalid/out-of-order-events.json')
  })

  test('invalid due to incomplete trace', async () => {
    await expectImportFailure('./sample/profiles/speedscope/invalid/incomplete-trace.json')
  })
})
