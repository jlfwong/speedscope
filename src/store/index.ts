import {actions} from './actions'

/**
 * The root node of application state. We use redux (https://redux.js.org/)
 * as our state management solution.
 */

import * as redux from 'redux'
import {setter, Reducer} from '../lib/typed-redux'
import {Profile} from '../lib/profile'
import {
  createFlamechartViewStateReducer,
  FlamechartID,
  FlamechartViewState,
} from './flamechart-view-state'
import {SandwichViewState, sandwichView} from './sandwich-view-state'
import {HashParams, getHashParams} from '../lib/hash-params'

export const enum ViewMode {
  CHRONO_FLAME_CHART,
  LEFT_HEAVY_FLAME_GRAPH,
  SANDWICH_VIEW,
}

export interface ApplicationState {
  profile: Profile | null
  frameToColorBucket: Map<string | number, number>

  hashParams: HashParams

  glCanvas: HTMLCanvasElement | null

  flattenRecursion: boolean

  viewMode: ViewMode
  dragActive: boolean
  loading: boolean
  error: boolean

  chronoView: FlamechartViewState
  leftHeavyView: FlamechartViewState
  sandwichView: SandwichViewState
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
    profile: setter<Profile | null>(actions.setProfile, null),
    frameToColorBucket: setter<Map<string | number, number>>(
      actions.setFrameToColorBucket,
      new Map(),
    ),

    hashParams: setter<HashParams>(actions.setHashParams, hashParams),

    flattenRecursion: setter<boolean>(actions.setFlattenRecursion, false),

    viewMode: setter<ViewMode>(actions.setViewMode, ViewMode.CHRONO_FLAME_CHART),

    glCanvas: setter<HTMLCanvasElement | null>(actions.setGLCanvas, null),

    dragActive: setter<boolean>(actions.setDragActive, false),
    loading: setter<boolean>(actions.setLoading, loading),
    error: setter<boolean>(actions.setError, false),

    chronoView: createFlamechartViewStateReducer(FlamechartID.CHRONO),
    leftHeavyView: createFlamechartViewStateReducer(FlamechartID.LEFT_HEAVY),

    sandwichView,
  })

  return redux.createStore(reducer, initialState)
}
