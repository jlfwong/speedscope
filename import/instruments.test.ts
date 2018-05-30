import * as fs from 'fs'
import {dumpProfile} from '../test-utils'
import {importFromInstrumentsDeepCopy} from './instruments'

describe('importFromInstrumentsDeepCopy', () => {
  test('time profile', () => {
    const input = fs.readFileSync(
      './sample/profiles/Instruments/7.3.1/simple-time-profile-deep-copy.txt',
      'utf8',
    )
    const profile = importFromInstrumentsDeepCopy(input)
    expect(dumpProfile(profile)).toMatchSnapshot()
  })

  test('allocations profile', () => {
    const input = fs.readFileSync(
      './sample/profiles/Instruments/7.3.1/random-allocations-deep-copy.txt',
      'utf8',
    )
    const profile = importFromInstrumentsDeepCopy(input)
    expect(dumpProfile(profile)).toMatchSnapshot()
  })
})
