import {checkProfileSnapshot} from '../lib/test-utils'

test('importFromBGFlameGraph', async () => {
  await checkProfileSnapshot('./sample/profiles/stackcollapse/simple.txt')
})

test('importFromBGFlameGraph with CRLF', async () => {
  await checkProfileSnapshot('./sample/profiles/stackcollapse/simple-crlf.txt')
})
