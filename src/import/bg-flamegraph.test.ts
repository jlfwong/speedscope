import {checkProfileSnapshot} from '../lib/test-utils'

test('importFromBGFlameGraph', async () => {
  await checkProfileSnapshot('./sample/profiles/stackcollapse/simple.txt')
})

test('importFromBGFlameGraph with CRLF', async () => {
  await checkProfileSnapshot('./sample/profiles/stackcollapse/simple-crlf.txt')
})

test('importFromBGFlameGraph with UTF-16, Little Endian', async () => {
  await checkProfileSnapshot('./sample/profiles/stackcollapse/simple-utf16-le.txt')
})

test('importFromBGFlameGraph with UTF-16, Big Endian', async () => {
  await checkProfileSnapshot('./sample/profiles/stackcollapse/simple-utf16-be.txt')
})

test('importFromBGFlameGraph with invalid lines', async () => {
  await checkProfileSnapshot('./sample/profiles/stackcollapse/simple-with-invalids.txt')
})
