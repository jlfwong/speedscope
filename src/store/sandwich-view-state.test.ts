import {storeTest, profileGroupTwoSampled} from './store-test-utils'
import {actions} from './actions'

describe('sandwich view state', () => {
  storeTest('setSelectedFrame', ({getState, dispatch}) => {
    dispatch(actions.setProfileGroup(profileGroupTwoSampled))
    expect(getState().profileGroup!.profiles[0].sandwichViewState.callerCallee).toBe(null)
    const {profileGroup} = getState()
    const selectedFrame = profileGroup!.profiles[0].profile.getAppendOrderCalltreeRoot().children[0]
      .frame
    dispatch(actions.sandwichView.setSelectedFrame({profileIndex: 0, args: selectedFrame}))

    expect(getState().profileGroup!.profiles[0].sandwichViewState.callerCallee!.selectedFrame).toBe(
      selectedFrame,
    )

    // Other profiles selection state should not change
    expect(getState().profileGroup!.profiles[1].sandwichViewState.callerCallee).toBe(null)

    const selectedFrame2 = profileGroup!.profiles[0].profile.getAppendOrderCalltreeRoot()
      .children[0].children[0].frame
    dispatch(actions.sandwichView.setSelectedFrame({profileIndex: 0, args: selectedFrame2}))
    expect(getState().profileGroup!.profiles[0].sandwichViewState.callerCallee!.selectedFrame).toBe(
      selectedFrame2,
    )
  })
})
