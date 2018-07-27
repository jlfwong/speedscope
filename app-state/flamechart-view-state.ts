import {CallTreeNode} from '../profile'
import {Rect} from '../math'
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
  configSpaceViewportRect: Rect
}

export function createFlamechartViewStateReducer(id: FlamechartID): Reducer<FlamechartViewState> {
  let initialState: FlamechartViewState = {
    hover: null,
    selectedNode: null,
    configSpaceViewportRect: Rect.empty,
  }
  return (state = initialState, action) => {
    if (actions.flamechart.setHoveredNode.matches(action) && action.payload.id === id) {
      return {...state, hover: action.payload.hover}
    }
    if (actions.flamechart.setSelectedNode.matches(action) && action.payload.id === id) {
      return {...state, selectedNode: action.payload.selectedNode}
    }
    if (actions.flamechart.setConfigSpaceViewportRect.matches(action) && action.payload.id === id) {
      return {...state, configSpaceViewportRect: action.payload.configSpaceViewportRect}
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
