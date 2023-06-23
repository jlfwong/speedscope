import {checkProfileSnapshot} from '../lib/test-utils'

test('importFromPapyrus script profile', async () => {
  await checkProfileSnapshot('./sample/profiles/papyrus/script.log')
})

test('importFromPapyrus stack profile', async () => {
  await checkProfileSnapshot('./sample/profiles/papyrus/stack.log')
})
