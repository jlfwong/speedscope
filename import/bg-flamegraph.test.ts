import {checkProfileSnapshot} from '../test-utils'

test('importFromBGFlameGraph', async () => {
  await checkProfileSnapshot('./sample/profiles/stackcollapse/simple.txt')
})
