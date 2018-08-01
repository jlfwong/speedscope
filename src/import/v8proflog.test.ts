import {checkProfileSnapshot} from '../lib/test-utils'

test('importFromV8ProfLog', async () => {
  await checkProfileSnapshot('./sample/profiles/node/8.5.0/simple.v8log.json')
})
