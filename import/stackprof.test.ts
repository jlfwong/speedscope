import * as fs from 'fs'
import {dumpProfile} from '../test-utils'
import {importFromStackprof} from './stackprof'

test('importFromStackprof', () => {
  const input = fs.readFileSync('./sample/profiles/stackprof/simple-stackprof.json', 'utf8')
  const profile = importFromStackprof(JSON.parse(input))
  expect(dumpProfile(profile)).toMatchSnapshot()
})
