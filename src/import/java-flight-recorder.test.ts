import {checkProfileSnapshot} from '../lib/test-utils'

test('interpretHeavyJfr', async () => {
  await checkProfileSnapshot('./sample/profiles/java-flight-recorder/heavy.jfr')
})
