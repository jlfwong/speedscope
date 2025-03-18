import {checkProfileSnapshot} from '../lib/test-utils'

test('importFromPMCStatCallGraph', async () => {
  await checkProfileSnapshot('./sample/profiles/pmcstat/simple.txt')
})

test('importFromPMCStatCallGraph with invalid lines', async () => {
  await checkProfileSnapshot('./sample/profiles/pmcstat/simple-with-invalids.txt')
})
