import * as fs from 'fs'
import {importFromBGFlameGraph} from './bg-flamegraph'
import {dumpProfile} from '../test-utils'

test('importFromBGFlameGraph', () => {
  const input = fs.readFileSync('./sample/profiles/stackcollapse/simple.txt', 'utf8')
  const profile = importFromBGFlameGraph(input)
  expect(dumpProfile(profile)).toMatchSnapshot()
})
