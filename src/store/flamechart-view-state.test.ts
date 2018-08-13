import {storeTest, profileGroupTwoSampled} from './store-test-utils'
import {actions} from './actions'
import {Rect, Vec2} from '../lib/math'
import {FlamechartID} from './flamechart-view-state'
import {ViewMode} from '.'

describe('flamechart view state', () => {
  storeTest('setHoveredNode', ({getState, dispatch}) => {
    dispatch(actions.setProfileGroup(profileGroupTwoSampled))
    expect(getState().profileGroup!.profiles[0].chronoViewState.hover).toEqual(null)
    const {profileGroup} = getState()
    const hover = {
      node: profileGroup!.profiles[0].profile.getAppendOrderCalltreeRoot().children[0],
      event: {} as MouseEvent,
    }
    dispatch(
      actions.flamechart.setHoveredNode({
        profileIndex: 0,
        args: {
          id: FlamechartID.CHRONO,
          hover,
        },
      }),
    )
    expect(getState().profileGroup!.profiles[0].chronoViewState.hover).toEqual(hover)
    expect(getState().profileGroup!.profiles[0].leftHeavyViewState.hover).toEqual(null)
    expect(getState().profileGroup!.profiles[1].chronoViewState.hover).toEqual(null)

    // Changing view mode should clear the hover state
    dispatch(actions.setViewMode(ViewMode.LEFT_HEAVY_FLAME_GRAPH))
    expect(getState().profileGroup!.profiles[0].chronoViewState.hover).toEqual(null)
  })

  storeTest('setSelectedNode', ({getState, dispatch}) => {
    dispatch(actions.setProfileGroup(profileGroupTwoSampled))
    expect(getState().profileGroup!.profiles[0].chronoViewState.selectedNode).toEqual(null)
    const {profileGroup} = getState()
    const selectedNode = profileGroup!.profiles[0].profile.getAppendOrderCalltreeRoot().children[0]
    dispatch(
      actions.flamechart.setSelectedNode({
        profileIndex: 0,
        args: {
          id: FlamechartID.CHRONO,
          selectedNode,
        },
      }),
    )
    expect(getState().profileGroup!.profiles[0].chronoViewState.selectedNode).toEqual(selectedNode)
    expect(getState().profileGroup!.profiles[0].leftHeavyViewState.selectedNode).toEqual(null)
    expect(getState().profileGroup!.profiles[1].chronoViewState.selectedNode).toEqual(null)
  })

  storeTest('setLogicalSpaceViewportSize', ({getState, dispatch}) => {
    dispatch(actions.setProfileGroup(profileGroupTwoSampled))
    expect(getState().profileGroup!.profiles[0].chronoViewState.logicalSpaceViewportSize).toEqual(
      Vec2.zero,
    )
    const logicalSpaceViewportSize = new Vec2(3, 5)
    dispatch(
      actions.flamechart.setLogicalSpaceViewportSize({
        profileIndex: 0,
        args: {
          id: FlamechartID.CHRONO,
          logicalSpaceViewportSize,
        },
      }),
    )
    expect(getState().profileGroup!.profiles[0].chronoViewState.logicalSpaceViewportSize).toEqual(
      logicalSpaceViewportSize,
    )

    expect(
      getState().profileGroup!.profiles[0].leftHeavyViewState.logicalSpaceViewportSize,
    ).toEqual(Vec2.zero)
    expect(getState().profileGroup!.profiles[1].chronoViewState.logicalSpaceViewportSize).toEqual(
      Vec2.zero,
    )
  })

  storeTest('setConfigSpaceViewportRect', ({getState, dispatch}) => {
    dispatch(actions.setProfileGroup(profileGroupTwoSampled))
    expect(getState().profileGroup!.profiles[0].chronoViewState.configSpaceViewportRect).toEqual(
      Rect.empty,
    )
    dispatch(
      actions.flamechart.setConfigSpaceViewportRect({
        profileIndex: 0,
        args: {
          id: FlamechartID.CHRONO,
          configSpaceViewportRect: new Rect(Vec2.zero, Vec2.unit),
        },
      }),
    )
    expect(getState().profileGroup!.profiles[0].chronoViewState.configSpaceViewportRect).toEqual(
      new Rect(Vec2.zero, Vec2.unit),
    )

    expect(getState().profileGroup!.profiles[0].leftHeavyViewState.configSpaceViewportRect).toEqual(
      Rect.empty,
    )
    expect(getState().profileGroup!.profiles[1].chronoViewState.configSpaceViewportRect).toEqual(
      Rect.empty,
    )
  })
})
