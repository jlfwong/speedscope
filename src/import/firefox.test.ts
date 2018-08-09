import {checkProfileSnapshot} from '../lib/test-utils'

test('importFromFirefox', async () => {
  await checkProfileSnapshot('./sample/profiles/Firefox/59/simple-firefox.json')
})

test('importFromFirefox recursion', async () => {
  await checkProfileSnapshot('./sample/profiles/Firefox/61/recursion.json')
})
