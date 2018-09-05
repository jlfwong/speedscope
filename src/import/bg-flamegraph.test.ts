import {checkProfileSnapshot} from '../lib/test-utils'

test('importFromBGFlameGraph', async () => {
  await checkProfileSnapshot('./sample/profiles/stackcollapse/simple.txt')
})

test('importFromBGFlameGraphWithCRLF', async () => {
  await checkProfileSnapshot('./sample/profiles/stackcollapse/simple-crlf.txt')
})
