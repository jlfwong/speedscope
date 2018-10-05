import {checkProfileSnapshot} from '../lib/test-utils'

test('importV8HeapAlloc from Chrome', async () => {
  await checkProfileSnapshot('./sample/profiles/Chrome/69/Heap-20181005T144546.heapprofile')
})

test('importV8HeapAlloc from NodeJS', async () => {
  await checkProfileSnapshot('./sample/profiles/node/10.11.0/Heap-20181003T105432.heapprofile')
})
