import {checkProfileSnapshot} from '../lib/test-utils'

test('importHermesProfileSimple simple', async () => {
  await checkProfileSnapshot('./sample/profiles/hermes/simple.json')
})
