import {checkProfileSnapshot} from '../lib/test-utils'

test('importTraceEvents simple', async () => {
  await checkProfileSnapshot('./sample/profiles/trace-event/simple.json')
})

test('importTraceEvents simple object', async () => {
  await checkProfileSnapshot('./sample/profiles/trace-event/simple-object.json')
})

test('importTraceEvents multiprocess', async () => {
  await checkProfileSnapshot('./sample/profiles/trace-event/multiprocess.json')
})

test('importTraceEvents partial json import', async () => {
  await checkProfileSnapshot('./sample/profiles/trace-event/simple-partial.json')
})

test('importTraceEvents partial json import trailing comma', async () => {
  await checkProfileSnapshot('./sample/profiles/trace-event/simple-partial-trailing-comma.json')
})

test('importTraceEvents partial json import whitespace padding', async () => {
  await checkProfileSnapshot('./sample/profiles/trace-event/simple-partial-whitespace.json')
})

test('importTraceEvents bad E events', async () => {
  await checkProfileSnapshot('./sample/profiles/trace-event/too-many-end-events.json')
})

test('importTraceEvents event re-ordering', async () => {
  await checkProfileSnapshot('./sample/profiles/trace-event/must-retain-original-order.json')
})
