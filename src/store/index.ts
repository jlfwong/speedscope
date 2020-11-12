import {actions} from './actions'

/**
 * The root node of application state. We use redux (https://redux.js.org/)
 * as our state management solution.
 */

import * as redux from 'redux'
import {setter, Reducer, Action} from '../lib/typed-redux'
import {HashParams, getHashParams} from '../lib/hash-params'
import {ProfileGroupState, profileGroup} from './profiles-state'
import {SortMethod, SortField, SortDirection} from '../views/profile-table-view'
import {useSelector} from '../lib/preact-redux'
import {Profile} from '../lib/profile'
import {FlamechartViewState} from './flamechart-view-state'
import {SandwichViewState} from './sandwich-view-state'
import {getProfileToView} from './getters'

export const enum ViewMode {
  CHRONO_FLAME_CHART,
  LEFT_HEAVY_FLAME_GRAPH,
  SANDWICH_VIEW,
}

export const enum ColorScheme {
  // Default: respect prefers-color-schema
  SYSTEM,

  // Use dark theme
  DARK,

  // use light theme
  LIGHT,
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

  // The color scheme to use for the entire UI
  colorScheme: ColorScheme
}

const protocol = window.location.protocol

// Speedscope is usable both from a local HTML file being served
// from a file:// URL, and via websites. In the case of file:// URLs,
// however, XHR will be unavailable to fetching files in adjacent directories.
export const canUseXHR = protocol === 'http:' || protocol === 'https:'

function colorScheme(state: ColorScheme | undefined, action: Action<any>): ColorScheme {
  const localStorageKey = 'speedscope-color-scheme'

  if (state === undefined) {
    const storedPreference = window.localStorage && window.localStorage[localStorageKey]
    if (storedPreference === 'DARK') {
      return ColorScheme.DARK
    } else if (storedPreference === 'LIGHT') {
      return ColorScheme.LIGHT
    } else {
      return ColorScheme.SYSTEM
    }
  }

  if (actions.setColorScheme.matches(action)) {
    const value = action.payload

    switch (value) {
      case ColorScheme.DARK: {
        window.localStorage[localStorageKey] = 'DARK'
        break
      }
      case ColorScheme.LIGHT: {
        window.localStorage[localStorageKey] = 'LIGHT'
        break
      }
      case ColorScheme.SYSTEM: {
        delete window.localStorage[localStorageKey]
        break
      }
      default: {
        const _exhaustiveCheck: never = value
        return _exhaustiveCheck
      }
    }
    return value
  }

  return state
}

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

    colorScheme,
  })

  return redux.createStore(reducer, initialState)
}

export function useAppSelector<T>(selector: (t: ApplicationState) => T, cacheArgs: any[]): T {
  /* eslint-disable react-hooks/exhaustive-deps */
  return useSelector(selector, cacheArgs)
}

export interface ActiveProfileState {
  profile: Profile
  index: number
  chronoViewState: FlamechartViewState
  leftHeavyViewState: FlamechartViewState
  sandwichViewState: SandwichViewState
}

export function useActiveProfileState(): ActiveProfileState | null {
  return useAppSelector(state => {
    const {profileGroup} = state
    if (!profileGroup) return null
    if (profileGroup.indexToView >= profileGroup.profiles.length) return null

    const index = profileGroup.indexToView
    const profileState = profileGroup.profiles[index]
    return {
      ...profileGroup.profiles[profileGroup.indexToView],
      profile: getProfileToView({
        profile: profileState.profile,
        flattenRecursion: state.flattenRecursion,
      }),
      index: profileGroup.indexToView,
    }
  }, [])
}
