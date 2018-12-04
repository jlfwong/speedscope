import {checkProfileSnapshot} from '../lib/test-utils'

test('importFromHaskell', async () => {
  await checkProfileSnapshot('./sample/profiles/haskell/simple.prof')
})
