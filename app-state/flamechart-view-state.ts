import {CallTreeNode} from '../profile'
import {Rect, Vec2} from '../math'
import {Reducer} from './typed-redux'
import {actions} from './actions'

export enum FlamechartID {
  LEFT_HEAVY = 'LEFT_HEAVY',
  CHRONO = 'CHRONO',
  SANDWICH_INVERTED_CALLERS = 'SANDWICH_INVERTED_CALLERS',
  SANDWICH_CALLEES = 'SANDWICH_CALLEES',
}

export interface FlamechartViewState {
  hover: {
    node: CallTreeNode
    event: MouseEvent
  } | null
  selectedNode: CallTreeNode | null
  logicalSpaceViewportSize: Vec2
  configSpaceViewportRect: Rect
}

export function createFlamechartViewStateReducer(id: FlamechartID): Reducer<FlamechartViewState> {
  let initialState: FlamechartViewState = {
    hover: null,
    selectedNode: null,
    configSpaceViewportRect: Rect.empty,
    logicalSpaceViewportSize: Vec2.zero,
  }
  return (state = initialState, action) => {
    if (actions.flamechart.setHoveredNode.matches(action) && action.payload.id === id) {
      const {hover} = action.payload
      return {...state, hover}
    }
    if (actions.flamechart.setSelectedNode.matches(action) && action.payload.id === id) {
      const {selectedNode} = action.payload
      return {...state, selectedNode}
    }
    if (actions.flamechart.setConfigSpaceViewportRect.matches(action) && action.payload.id === id) {
      const {configSpaceViewportRect} = action.payload
      return {...state, configSpaceViewportRect}
    }
    if (
      actions.flamechart.setLogicalSpaceViewportSize.matches(action) &&
      action.payload.id === id
    ) {
      const {logicalSpaceViewportSize} = action.payload
      return {...state, logicalSpaceViewportSize}
    }
    if (actions.setProfile.matches(action)) {
      // If the profile changes, we should invalidate all of our state, since none of it still applies
      return initialState
    }
    if (actions.setViewMode.matches(action)) {
      // If we switch views, the hover information is no longer relevant
      return {...state, hover: null}
    }

    return state
  }
}
