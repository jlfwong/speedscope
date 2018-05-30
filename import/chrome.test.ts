import * as fs from 'fs'
import {dumpProfile} from '../test-utils'
import {importFromChromeCPUProfile, importFromChromeTimeline} from './chrome'

test('importFromChromeCPUProfile', () => {
  const input = fs.readFileSync('./sample/profiles/Chrome/65/simple.cpuprofile', 'utf8')
  const profile = importFromChromeCPUProfile(JSON.parse(input))
  expect(dumpProfile(profile)).toMatchSnapshot()
})

test('importFromChromeTimeline', () => {
  const input = fs.readFileSync('./sample/profiles/Chrome/65/simple-timeline.json', 'utf8')
  const profile = importFromChromeTimeline(JSON.parse(input))
  expect(dumpProfile(profile)).toMatchSnapshot()
})
