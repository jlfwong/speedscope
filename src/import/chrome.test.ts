import {checkProfileSnapshot} from '../lib/test-utils'
import {withMockedFileChunkSizeForTests} from './utils'

test('importFromChromeCPUProfile', async () => {
  await checkProfileSnapshot('./sample/profiles/Chrome/65/simple.cpuprofile')
})

test('importFromChromeTimeline', async () => {
  await checkProfileSnapshot('./sample/profiles/Chrome/65/simple-timeline.json')
})

test('importFromChromeTimeline chunked', async () => {
  await withMockedFileChunkSizeForTests(100, async () => {
    await checkProfileSnapshot('./sample/profiles/Chrome/65/simple-timeline.json')
  })
})

test('importFromChromeTimeline Chrome 69', async () => {
  await checkProfileSnapshot('./sample/profiles/Chrome/69/simple.json')
})

test('importFromV8Profiler Node 10', async () => {
  await checkProfileSnapshot('./sample/profiles/node/10.11.0/example.cpuprofile')
})

test('importFromChromeTimeline Workers Chrome 66', async () => {
  await checkProfileSnapshot('./sample/profiles/Chrome/66/worker.json')
})

test('importFromChromeTimeline Workers Chrome 70', async () => {
  await checkProfileSnapshot('./sample/profiles/Chrome/70/worker.json')
})
