import {SortMethod, SortField, SortDirection} from '../views/profile-table-view'
import {Frame} from '../lib/profile'
import {
  FlamechartViewState,
  FlamechartID,
  createFlamechartViewStateReducer,
} from './flamechart-view-state'
import {Reducer} from '../lib/typed-redux'
import {actions} from './actions'

export interface SandwichViewState {
  tableSortMethod: SortMethod
  callerCallee: CallerCalleeState | null
}

export interface CallerCalleeState {
  selectedFrame: Frame
  invertedCallerFlamegraph: FlamechartViewState
  calleeFlamegraph: FlamechartViewState
}

const defaultSortMethod = {
  field: SortField.SELF,
  direction: SortDirection.DESCENDING,
}

const calleesReducer = createFlamechartViewStateReducer(FlamechartID.SANDWICH_CALLEES)
const invertedCallersReducer = createFlamechartViewStateReducer(
  FlamechartID.SANDWICH_INVERTED_CALLERS,
)

export const sandwichView: Reducer<SandwichViewState> = (
  state = {tableSortMethod: defaultSortMethod, callerCallee: null},
  action,
) => {
  if (actions.setProfile.matches(action)) {
    // When a new profile is dropped in, none of the selection state is going to make
    // sense any more.
    return {...state, callerCallee: null}
  }

  const {callerCallee} = state
  if (callerCallee) {
    const {calleeFlamegraph, invertedCallerFlamegraph} = callerCallee
    const nextCalleeFlamegraph = calleesReducer(calleeFlamegraph, action)
    const nextInvertedCallerFlamegraph = invertedCallersReducer(invertedCallerFlamegraph, action)

    if (
      nextCalleeFlamegraph !== calleeFlamegraph ||
      nextInvertedCallerFlamegraph !== invertedCallerFlamegraph
    ) {
      return {
        ...state,
        callerCallee: {
          ...callerCallee,
          calleeFlamegraph: nextCalleeFlamegraph,
          invertedCallerFlamegraph: nextInvertedCallerFlamegraph,
        },
      }
    }
  }

  if (actions.sandwichView.setTableSortMethod.matches(action)) {
    return {...state, tableSortMethod: action.payload}
  }

  if (actions.sandwichView.setSelectedFrame.matches(action)) {
    if (action.payload == null) {
      return {
        ...state,
        callerCallee: null,
      }
    } else {
      return {
        ...state,
        callerCallee: {
          selectedFrame: action.payload,
          calleeFlamegraph: calleesReducer(undefined, action),
          invertedCallerFlamegraph: invertedCallersReducer(undefined, action),
        },
      }
    }
  }

  return state
}
