import * as fs from 'fs'
import {dumpProfile} from '../test-utils'
import {importFromFirefox} from './firefox'

test('importFromFirefox', () => {
  const input = fs.readFileSync('./sample/profiles/Firefox/59/simple-firefox.json', 'utf8')
  const profile = importFromFirefox(JSON.parse(input))
  expect(dumpProfile(profile)).toMatchSnapshot()
})
