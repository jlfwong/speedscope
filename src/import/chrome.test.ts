import {checkProfileSnapshot} from '../lib/test-utils'

test('importFromChromeCPUProfile', async () => {
  await checkProfileSnapshot('./sample/profiles/Chrome/65/simple.cpuprofile')
})

test('importFromChromeTimeline', async () => {
  await checkProfileSnapshot('./sample/profiles/Chrome/65/simple-timeline.json')
})
