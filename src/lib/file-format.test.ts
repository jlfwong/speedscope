import {checkProfileSnapshot} from './test-utils'

describe('importSpeedscopeProfiles', async () => {
  test('0.0.1 evented profile', async () => {
    await checkProfileSnapshot('./sample/profiles/speedscope/0.0.1/simple.speedscope.json')
  })

  test('0.1.2 sampled profile', async () => {
    await checkProfileSnapshot('./sample/profiles/speedscope/0.1.2/simple-sampled.speedscope.json')
  })

  test('0.6.0 multiple profiles', async () => {
    await checkProfileSnapshot('./sample/profiles/speedscope/0.6.0/two-sampled.speedscope.json')
  })
})
