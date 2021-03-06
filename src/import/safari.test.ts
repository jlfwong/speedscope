import {checkProfileSnapshot} from '../lib/test-utils'

test('importFromSafari', async () => {
  await checkProfileSnapshot('./sample/profiles/Safari/13.1/simple.html-recording.json')
})
