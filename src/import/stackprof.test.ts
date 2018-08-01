import {checkProfileSnapshot} from '../lib/test-utils'

test('importFromStackprof', async () => {
  await checkProfileSnapshot('./sample/profiles/stackprof/simple-stackprof.json')
})
