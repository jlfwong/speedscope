import {checkProfileSnapshot} from '../lib/test-utils'

test('importAsPprofProfile', async () => {
  await checkProfileSnapshot('./sample/profiles/pprof/simple.prof')
})
