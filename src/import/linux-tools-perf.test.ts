import {checkProfileSnapshot} from '../lib/test-utils'
import {withMockedFileChunkSizeForTests} from './utils'

describe('importFromLinuxPerf', () => {
  test('simple.linux-perf.txt', async () => {
    await checkProfileSnapshot('./sample/profiles/linux-perf/simple.linux-perf.txt')
  })
  test('one-sample.linux-perf.txt', async () => {
    await checkProfileSnapshot('./sample/profiles/linux-perf/one-sample.linux-perf.txt')
  })
  test('forks.linux-perf.txt', async () => {
    await checkProfileSnapshot('./sample/profiles/linux-perf/forks.linux-perf.txt')
  })
  test('simple-with-header.linux-perf.txt', async () => {
    await checkProfileSnapshot('./sample/profiles/linux-perf/simple-with-header.linux-perf.txt')
  })
  test('simple-with-pids.linux-perf.txt', async () => {
    await checkProfileSnapshot('./sample/profiles/linux-perf/simple-with-pid.linux-perf.txt')
  })
  test('system-wide.linux-perf.txt', async () => {
    await checkProfileSnapshot('./sample/profiles/linux-perf/system-wide.linux-perf.txt')
  })
  test('system-wide.linux-perf.txt chunked', async () => {
    await withMockedFileChunkSizeForTests(100, async () => {
      await checkProfileSnapshot('./sample/profiles/linux-perf/system-wide.linux-perf.txt')
    })
  })
})
