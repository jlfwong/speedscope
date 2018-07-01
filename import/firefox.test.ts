import {checkProfileSnapshot} from '../test-utils'

test('importFromFirefox', async () => {
  await checkProfileSnapshot('./sample/profiles/Firefox/59/simple-firefox.json')
})
