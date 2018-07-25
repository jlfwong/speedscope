import {actions} from './actions'

/**
 * The root node of application state. We use redux (https://redux.js.org/)
 * as our state management solution.
 */

import * as redux from 'redux'
import {reducer, setter} from '../typed-redux'
import {Profile} from '../profile'
import {SortMethod, SortField, SortDirection} from '../profile-table-view'
import {FlamechartAppState, chronoView, leftHeavyView} from './flamechart-view-state'
import {RowAtlas} from '../row-atlas'
import {FlamechartRowAtlasKey} from '../flamechart-renderer'
import {CanvasContext} from '../canvas-context'

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

  canvasContext: CanvasContext
  rowAtlas: RowAtlas<FlamechartRowAtlasKey>

  activeProfile: Profile | null
  flattenRecursion: boolean

  viewMode: ViewMode
  dragActive: boolean
  loading: boolean
  error: boolean

  chronoView: FlamechartAppState

  leftHeavyView: FlamechartAppState

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

    canvasContext: setter<CanvasContext | null>(actions.setCanvasContext, null),
    flamechartRowAtlas: setter<RowAtlas<FlamechartRowAtlasKey> | null>(
      actions.setFlamechartRowAtlas,
      null,
    ),

    dragActive: setter<boolean>(actions.setDragActive, false),
    loading: setter<boolean>(actions.setLoading, false),
    error: setter<boolean>(actions.setError, false),

    chronoView,

    leftHeavyView,

    sandwichView,
  })

  return redux.createStore(reducer, initialState)
}
