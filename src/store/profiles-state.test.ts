import {storeTest, profileGroupTwoSampled} from './store-test-utils'
import {actions} from './actions'

describe('profileGroup', () => {
  storeTest('setProfileGroup', ({getState, dispatch}) => {
    expect(getState().profileGroup).toBe(null)
    dispatch(actions.setProfileGroup(profileGroupTwoSampled))
    const {profileGroup} = getState()
    expect(profileGroup!.name).toBe(profileGroupTwoSampled.name)
    expect(profileGroup!.indexToView).toBe(profileGroupTwoSampled.indexToView)

    for (let i = 0; i < profileGroupTwoSampled.profiles.length; i++) {
      expect(profileGroup!.profiles[i].profile).toEqual(profileGroupTwoSampled.profiles[i])
    }
  })

  storeTest('setProfileIndexToView', ({getState, dispatch}) => {
    dispatch(actions.setProfileGroup(profileGroupTwoSampled))
    expect(getState().profileGroup!.indexToView).toBe(1)
    dispatch(actions.setProfileIndexToView(0))
    expect(getState()!.profileGroup!.indexToView).toBe(0)
    dispatch(actions.setProfileIndexToView(-1))
    expect(getState()!.profileGroup!.indexToView).toBe(0)
    dispatch(actions.setProfileIndexToView(2))
    expect(getState().profileGroup!.indexToView).toBe(1)
  })

  storeTest('preserve state', ({getState, dispatch}) => {
    // When an unrelated action occurs, we should not change the identiy of the profileGroup
    // property
    dispatch(actions.setProfileGroup(profileGroupTwoSampled))
    const profileGroup = getState().profileGroup
    dispatch(actions.setDragActive(true))
    expect(getState().profileGroup).toBe(profileGroup)
  })
})
