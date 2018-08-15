import {checkProfileSnapshot} from '../lib/test-utils'

describe('importFromLinuxPerf', async () => {
  test('simple.txt', async () => {
    await checkProfileSnapshot('./sample/profiles/linux-perf/simple.txt')
  })
  test('forks.txt', async () => {
    await checkProfileSnapshot('./sample/profiles/linux-perf/forks.txt')
  })
  test('simple-with-header.txt', async () => {
    await checkProfileSnapshot('./sample/profiles/linux-perf/simple-with-header.txt')
  })
  test('simple-with-pids.txt', async () => {
    await checkProfileSnapshot('./sample/profiles/linux-perf/simple-with-pid.txt')
  })
  test('system-wide.txt', async () => {
    await checkProfileSnapshot('./sample/profiles/linux-perf/system-wide.txt')
  })
})
