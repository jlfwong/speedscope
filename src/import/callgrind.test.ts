import {checkProfileSnapshot} from '../lib/test-utils'

test('importFromCallgrind', async () => {
  await checkProfileSnapshot('./sample/profiles/callgrind/callgrind.example.log')
})

test('importFromCallgrind name compression', async () => {
  await checkProfileSnapshot('./sample/profiles/callgrind/callgrind.name-compression.log')
})

test('importFromCallgrind multiple event types', async () => {
  await checkProfileSnapshot('./sample/profiles/callgrind/callgrind.multiple-event-types.log')
})

test('importFromCallgrind subposition compression', async () => {
  await checkProfileSnapshot('./sample/profiles/callgrind/callgrind.subposition-compression.log')
})

test('importFromCallgrind cfn reset', async () => {
  await checkProfileSnapshot('./sample/profiles/callgrind/callgrind.cfn-reset.log')
})

test('importFromCallgrind positions instr line', async () => {
  await checkProfileSnapshot('./sample/profiles/callgrind/callgrind.instr-line-positions.log')
})

test('importFromCallgrind positions instr', async () => {
  await checkProfileSnapshot('./sample/profiles/callgrind/callgrind.positions-instr.log')
})

test('importFromCallgrind instr line subposition compression', async () => {
  await checkProfileSnapshot('./sample/profiles/callgrind/callgrind.instr-line-subposition.log')
})

test('importFromCallgrind cyclic callgraph', async () => {
  await checkProfileSnapshot('./sample/profiles/callgrind/callgrind.cyclic-callgraph.log')
})
