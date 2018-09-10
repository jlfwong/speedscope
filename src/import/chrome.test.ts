import {checkProfileSnapshot} from '../lib/test-utils'

test('importFromChromeCPUProfile', async () => {
  await checkProfileSnapshot('./sample/profiles/Chrome/65/simple.cpuprofile')
})

test('importFromChromeTimeline', async () => {
  await checkProfileSnapshot('./sample/profiles/Chrome/65/simple-timeline.json')
})

test('importFromChromeTimeline Chrome 69', async () => {
  await checkProfileSnapshot('./sample/profiles/Chrome/69/simple.json')
})
