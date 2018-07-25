import {actions} from './actions'

/**
 * The root node of application state. We use redux (https://redux.js.org/)
 * as our state management solution.
 */

import * as redux from 'redux'
import {reducer, setter} from '../typed-redux'
import {Profile} from '../profile'
import {SortMethod, SortField, SortDirection} from '../profile-table-view'
import {FlamechartViewState, chronoView, leftHeavyView} from './flamechart-view-state'

export const enum ViewMode {
  CHRONO_FLAME_CHART,
  LEFT_HEAVY_FLAME_GRAPH,
  SANDWICH_VIEW,
}

export interface SandwichViewState {
  tableSortMethod: SortMethod
}

export interface ApplicationState {
  profile: Profile | null
  activeProfile: Profile | null
  flattenRecursion: boolean

  viewMode: ViewMode
  dragActive: boolean
  loading: boolean
  error: boolean

  chronoView: FlamechartViewState

  leftHeavyView: FlamechartViewState

  sandwichView: SandwichViewState
}

const activeProfile = reducer<Profile | null>((state = null, action) => {
  if (actions.setActiveProfile.matches(action)) {
    return action.payload.profile
  }
  return state
})

const defaultSortMethod = {
  field: SortField.SELF,
  direction: SortDirection.DESCENDING,
}

const sandwichView = reducer<SandwichViewState>(
  (state = {tableSortMethod: defaultSortMethod}, action) => {
    if (actions.setTableSortMethod.matches(action)) {
      return {tableSortMethod: action.payload}
    }

    return state
  },
)

export function createApplicationStore(
  initialState: Partial<ApplicationState>,
): redux.Store<ApplicationState> {
  const reducer = redux.combineReducers({
    profile: setter<Profile | null>(actions.setProfile, null),
    activeProfile: activeProfile,
    flattenRecursion: setter<boolean>(actions.setFlattenRecursion, false),

    viewMode: setter<ViewMode>(actions.setViewMode, ViewMode.CHRONO_FLAME_CHART),

    dragActive: setter<boolean>(actions.setDragActive, false),
    loading: setter<boolean>(actions.setLoading, false),
    error: setter<boolean>(actions.setError, false),

    chronoView,

    leftHeavyView,

    sandwichView,
  })

  return redux.createStore(reducer, initialState)
}
