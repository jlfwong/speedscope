import {checkProfileSnapshot} from '../lib/test-utils'

test('importFromJfr', async () => {
  await checkProfileSnapshot('./sample/profiles/java-flight-recorder/heavy.jfr')
})
