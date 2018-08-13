import {Frame} from '../lib/profile'
import {
  FlamechartViewState,
  FlamechartID,
  createFlamechartViewStateReducer,
} from './flamechart-view-state'
import {Reducer} from '../lib/typed-redux'
import {actions} from './actions'

export interface SandwichViewState {
  callerCallee: CallerCalleeState | null
}

export interface CallerCalleeState {
  selectedFrame: Frame
  invertedCallerFlamegraph: FlamechartViewState
  calleeFlamegraph: FlamechartViewState
}

export function createSandwichView(profileIndex: number): Reducer<SandwichViewState> {
  const calleesReducer = createFlamechartViewStateReducer(
    FlamechartID.SANDWICH_CALLEES,
    profileIndex,
  )
  const invertedCallersReducer = createFlamechartViewStateReducer(
    FlamechartID.SANDWICH_INVERTED_CALLERS,
    profileIndex,
  )
  function applies(action: {payload: {profileIndex: number}}) {
    const {payload} = action
    return payload.profileIndex === profileIndex
  }

  return (state = {callerCallee: null}, action) => {
    if (actions.sandwichView.setSelectedFrame.matches(action) && applies(action)) {
      if (action.payload.args == null) {
        return {
          ...state,
          callerCallee: null,
        }
      } else {
        return {
          ...state,
          callerCallee: {
            selectedFrame: action.payload.args,
            calleeFlamegraph: calleesReducer(undefined, action),
            invertedCallerFlamegraph: invertedCallersReducer(undefined, action),
          },
        }
      }
    }

    const {callerCallee} = state
    if (callerCallee) {
      const {calleeFlamegraph, invertedCallerFlamegraph} = callerCallee
      const nextCalleeFlamegraph = calleesReducer(calleeFlamegraph, action)
      const nextInvertedCallerFlamegraph = invertedCallersReducer(invertedCallerFlamegraph, action)

      if (
        nextCalleeFlamegraph === calleeFlamegraph &&
        nextInvertedCallerFlamegraph === invertedCallerFlamegraph
      ) {
        return state
      }

      return {
        ...state,
        callerCallee: {
          ...callerCallee,
          calleeFlamegraph: nextCalleeFlamegraph,
          invertedCallerFlamegraph: nextInvertedCallerFlamegraph,
        },
      }
    }

    return state
  }
}
