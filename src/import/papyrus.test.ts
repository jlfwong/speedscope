import {checkProfileSnapshot} from '../lib/test-utils'

test('importFromPapyrus script profile', async () => {
    await checkProfileSnapshot('./sample/profiles/papyrus/script_parallel_pop_push.log')
})

test('importFromPapyrus stack profile', async () => {
    await checkProfileSnapshot('./sample/profiles/papyrus/stack_incomplete.log.txt')
})
