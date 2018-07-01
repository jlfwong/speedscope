import {checkProfileSnapshot} from '../test-utils'

test('importFromStackprof', async () => {
  await checkProfileSnapshot('./sample/profiles/stackprof/simple-stackprof.json')
})
