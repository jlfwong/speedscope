import {actions} from './actions'

/**
 * The root node of application state. We use redux (https://redux.js.org/)
 * as our state management solution.
 */

import * as redux from 'redux'
import {setter, Reducer} from '../lib/typed-redux'
import {HashParams, getHashParams} from '../lib/hash-params'
import {ProfileGroupState, profileGroup} from './profiles-state'

export const enum ViewMode {
  CHRONO_FLAME_CHART,
  LEFT_HEAVY_FLAME_GRAPH,
  SANDWICH_VIEW,
}

export interface ApplicationState {
  hashParams: HashParams

  glCanvas: HTMLCanvasElement | null

  flattenRecursion: boolean

  viewMode: ViewMode
  dragActive: boolean
  loading: boolean
  error: boolean

  profileGroup: ProfileGroupState
}

const protocol = window.location.protocol

// Speedscope is usable both from a local HTML file being served
// from a file:// URL, and via websites. In the case of file:// URLs,
// however, XHR will be unavailable to fetching files in adjacent directories.
export const canUseXHR = protocol === 'http:' || protocol === 'https:'

export function createApplicationStore(
  initialState: Partial<ApplicationState>,
): redux.Store<ApplicationState> {
  const hashParams = getHashParams()

  const loading = canUseXHR && hashParams.profileURL != null

  const reducer: Reducer<ApplicationState> = redux.combineReducers({
    profileGroup,

    hashParams: setter<HashParams>(actions.setHashParams, hashParams),

    flattenRecursion: setter<boolean>(actions.setFlattenRecursion, false),

    viewMode: setter<ViewMode>(actions.setViewMode, ViewMode.CHRONO_FLAME_CHART),

    glCanvas: setter<HTMLCanvasElement | null>(actions.setGLCanvas, null),

    dragActive: setter<boolean>(actions.setDragActive, false),
    loading: setter<boolean>(actions.setLoading, loading),
    error: setter<boolean>(actions.setError, false),
  })

  return redux.createStore(reducer, initialState)
}
