import {actions} from './actions'

/**
 * The root node of application state. We use redux (https://redux.js.org/)
 * as our state management solution.
 */

import * as redux from 'redux'
import {setter, Reducer} from '../lib/typed-redux'
import {HashParams, getHashParams} from '../lib/hash-params'
import {ProfileGroupState, profileGroup} from './profiles-state'
import {SortMethod, SortField, SortDirection} from '../views/profile-table-view'
import {useSelector} from '../lib/preact-redux'

export const enum ViewMode {
  CHRONO_FLAME_CHART,
  LEFT_HEAVY_FLAME_GRAPH,
  SANDWICH_VIEW,
}

export interface ApplicationState {
  // The top-level profile group from which most other data will be derived
  profileGroup: ProfileGroupState

  // Parameters defined by the URL encoded k=v pairs after the # in the URL
  hashParams: HashParams

  glCanvas: HTMLCanvasElement | null

  // Which top-level view should be displayed
  viewMode: ViewMode

  // True if recursion should be flattened when viewing flamegraphs
  flattenRecursion: boolean

  // The query used in top-level views
  //
  // An empty string indicates that the search is open by no filter is applied.
  // searchIsActive is stored separately, because we may choose to persist the
  // query even when the search input is closed.
  searchQuery: string
  searchIsActive: boolean

  // True when a file drag is currently active. Used to indicate that the
  // application is a valid drop target.
  dragActive: boolean

  // True when the application is currently in a loading state. Used to
  // display a loading progress bar.
  loading: boolean

  // True when the application is an error state, e.g. because the profile
  // imported was invalid.
  error: boolean

  // The table sorting method using for the sandwich view, specifying the column
  // to sort by, and the direction to sort that clumn.
  tableSortMethod: SortMethod
}

const protocol = window.location.protocol

// Speedscope is usable both from a local HTML file being served
// from a file:// URL, and via websites. In the case of file:// URLs,
// however, XHR will be unavailable to fetching files in adjacent directories.
export const canUseXHR = protocol === 'http:' || protocol === 'https:'

export function createAppStore(initialState?: ApplicationState): redux.Store<ApplicationState> {
  const hashParams = getHashParams()

  const loading = canUseXHR && hashParams.profileURL != null

  const reducer: Reducer<ApplicationState> = redux.combineReducers({
    profileGroup,

    hashParams: setter<HashParams>(actions.setHashParams, hashParams),

    flattenRecursion: setter<boolean>(actions.setFlattenRecursion, false),

    viewMode: setter<ViewMode>(actions.setViewMode, ViewMode.CHRONO_FLAME_CHART),

    searchQuery: setter<string>(actions.setSearchQuery, ''),
    searchIsActive: setter<boolean>(actions.setSearchIsActive, false),

    glCanvas: setter<HTMLCanvasElement | null>(actions.setGLCanvas, null),

    dragActive: setter<boolean>(actions.setDragActive, false),
    loading: setter<boolean>(actions.setLoading, loading),
    error: setter<boolean>(actions.setError, false),

    tableSortMethod: setter<SortMethod>(actions.sandwichView.setTableSortMethod, {
      field: SortField.SELF,
      direction: SortDirection.DESCENDING,
    }),
  })

  return redux.createStore(reducer, initialState)
}

export function useAppSelector<T>(selector: (t: ApplicationState) => T, cacheArgs: any[]): T {
  /* eslint-disable react-hooks/exhaustive-deps */
  return useSelector(selector, cacheArgs)
}
