import {storeTest, profileGroupTwoSampled} from './store-test-utils'
import {actions} from './actions'
import {Vec2} from '../lib/math'
import {FlamechartID} from './flamechart-view-state'

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

    // Changing selection when something is already selected should work
    const selectedFrame2 = profileGroup!.profiles[0].profile.getAppendOrderCalltreeRoot()
      .children[0].children[0].frame
    dispatch(actions.sandwichView.setSelectedFrame({profileIndex: 0, args: selectedFrame2}))
    expect(getState().profileGroup!.profiles[0].sandwichViewState.callerCallee!.selectedFrame).toBe(
      selectedFrame2,
    )

    // Clear selection
    dispatch(actions.sandwichView.setSelectedFrame({profileIndex: 0, args: null}))
    expect(getState().profileGroup!.profiles[0].sandwichViewState.callerCallee).toBe(null)
  })

  storeTest('contained flamegraphs receive updates', ({getState, dispatch}) => {
    dispatch(actions.setProfileGroup(profileGroupTwoSampled))
    const {profileGroup} = getState()
    const selectedFrame = profileGroup!.profiles[0].profile.getAppendOrderCalltreeRoot().children[0]
      .frame
    dispatch(actions.sandwichView.setSelectedFrame({profileIndex: 0, args: selectedFrame}))

    expect(
      getState().profileGroup!.profiles[0].sandwichViewState.callerCallee!.calleeFlamegraph
        .logicalSpaceViewportSize,
    ).toEqual(Vec2.zero)
    dispatch(
      actions.flamechart.setLogicalSpaceViewportSize({
        profileIndex: 0,
        args: {id: FlamechartID.SANDWICH_CALLEES, logicalSpaceViewportSize: Vec2.unit},
      }),
    )
    expect(
      getState().profileGroup!.profiles[0].sandwichViewState.callerCallee!.calleeFlamegraph
        .logicalSpaceViewportSize,
    ).toEqual(Vec2.unit)
  })

  storeTest('preserve identity', ({getState, dispatch}) => {
    dispatch(actions.setProfileGroup(profileGroupTwoSampled))
    const {profileGroup} = getState()
    const selectedFrame = profileGroup!.profiles[0].profile.getAppendOrderCalltreeRoot().children[0]
      .frame
    dispatch(actions.sandwichView.setSelectedFrame({profileIndex: 0, args: selectedFrame}))

    // When an unrelated action is triggered, it should not change the identity of the sandwichViewState
    const sandwichViewState = getState().profileGroup!.profiles[0].sandwichViewState
    dispatch(actions.setLoading(true))
    expect(getState().profileGroup!.profiles[0].sandwichViewState).toBe(sandwichViewState)
  })
})
