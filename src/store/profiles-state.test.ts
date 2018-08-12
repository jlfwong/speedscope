import * as fs from 'fs'

import {storeTest} from './store-test-utils'
import {actions} from './actions'
import {importSpeedscopeProfiles} from '../lib/file-format'

const filepath = './sample/profiles/speedscope/0.6.0/two-sampled.speedscope.json'
const input = fs.readFileSync(filepath, 'utf8')
const initialProfileGroup = importSpeedscopeProfiles(JSON.parse(input))

describe('profileGroup', () => {
  storeTest('setProfileGroup', ({getState, dispatch}) => {
    expect(getState().profileGroup).toBe(null)
    dispatch(actions.setProfileGroup(initialProfileGroup))
    const {profileGroup} = getState()
    if (!profileGroup) throw new Error('No profile found')
    expect(profileGroup.name).toBe(initialProfileGroup.name)
    expect(profileGroup.indexToView).toBe(initialProfileGroup.indexToView)

    for (let i = 0; i < initialProfileGroup.profiles.length; i++) {
      expect(profileGroup.profiles[i].profile).toEqual(initialProfileGroup.profiles[i])
    }
  })
})
