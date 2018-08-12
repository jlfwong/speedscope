import {CallTreeNode} from '../lib/profile'
import {Rect, Vec2} from '../lib/math'
import {Reducer} from '../lib/typed-redux'
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

export function createFlamechartViewStateReducer(
  id: FlamechartID,
  profileIndex: number,
): Reducer<FlamechartViewState> {
  let initialState: FlamechartViewState = {
    hover: null,
    selectedNode: null,
    configSpaceViewportRect: Rect.empty,
    logicalSpaceViewportSize: Vec2.zero,
  }
  function applies(action: {payload: {profileIndex: number; args: {id: FlamechartID}}}) {
    const {payload} = action
    return payload.args.id === id && payload.profileIndex === profileIndex
  }

  return (state = initialState, action) => {
    if (actions.flamechart.setHoveredNode.matches(action) && applies(action)) {
      const {hover} = action.payload.args
      return {...state, hover}
    }
    if (actions.flamechart.setSelectedNode.matches(action) && applies(action)) {
      const {selectedNode} = action.payload.args
      return {...state, selectedNode}
    }
    if (actions.flamechart.setConfigSpaceViewportRect.matches(action) && applies(action)) {
      const {configSpaceViewportRect} = action.payload.args
      return {...state, configSpaceViewportRect}
    }
    if (actions.flamechart.setLogicalSpaceViewportSize.matches(action) && applies(action)) {
      const {logicalSpaceViewportSize} = action.payload.args
      return {...state, logicalSpaceViewportSize}
    }
    if (actions.setViewMode.matches(action)) {
      // If we switch views, the hover information is no longer relevant
      return {...state, hover: null}
    }

    return state
  }
}
