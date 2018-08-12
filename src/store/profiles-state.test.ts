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
    expect(profileGroup!.name).toBe(initialProfileGroup.name)
    expect(profileGroup!.indexToView).toBe(initialProfileGroup.indexToView)

    for (let i = 0; i < initialProfileGroup.profiles.length; i++) {
      expect(profileGroup!.profiles[i].profile).toEqual(initialProfileGroup.profiles[i])
    }
  })

  storeTest('setProfileIndexToView', ({getState, dispatch}) => {
    dispatch(actions.setProfileGroup(initialProfileGroup))
    expect(getState().profileGroup!.indexToView).toBe(1)
    dispatch(actions.setProfileIndexToView(0))
    expect(getState()!.profileGroup!.indexToView).toBe(0)
    dispatch(actions.setProfileIndexToView(-1))
    expect(getState()!.profileGroup!.indexToView).toBe(0)
    dispatch(actions.setProfileIndexToView(2))
    expect(getState().profileGroup!.indexToView).toBe(1)
  })
})
