import * as redux from 'redux'
import {actionCreator, reducer, setter} from './typed-redux'
import {Profile, Frame} from './profile'
import {Flamechart} from './flamechart'
import {FlamechartRenderer, FlamechartRowAtlasKey} from './flamechart-renderer'
import {SortMethod, SortField, SortDirection} from './profile-table-view'
import {CanvasContext} from './canvas-context'
import {RowAtlas} from './row-atlas'

export const enum ViewMode {
  CHRONO_FLAME_CHART,
  LEFT_HEAVY_FLAME_GRAPH,
  SANDWICH_VIEW,
}

export interface FlamechartViewState {
  flamechart: Flamechart | null
  flamechartRenderer: FlamechartRenderer | null
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

export namespace actions {
  export const setProfile = actionCreator<Profile>('setProfile')
  export const setActiveProfile = actionCreator<{
    profile: Profile
    canvasContext: CanvasContext
    rowAtlas: RowAtlas<FlamechartRowAtlasKey>
    frameToColorBucket: Map<string | number, number>
  }>('setActiveProfile')
  export const setViewMode = actionCreator<ViewMode>('setViewMode')
  export const setFlattenRecursion = actionCreator<boolean>('setFlattenRecursion')
  export const setDragActive = actionCreator<boolean>('setDragActive')
  export const setLoading = actionCreator<boolean>('setLoading')
  export const setError = actionCreator<boolean>('setError')

  export const setTableSortMethod = actionCreator<SortMethod>('setTableSortMethod')
}

const activeProfile = reducer<Profile | null>((state = null, action) => {
  if (actions.setActiveProfile.matches(action)) {
    return action.payload.profile
  }
  return state
})

const chronoView = reducer<FlamechartViewState>(
  (state = {flamechart: null, flamechartRenderer: null}, action) => {
    if (actions.setActiveProfile.matches(action)) {
      const {profile, canvasContext, rowAtlas, frameToColorBucket} = action.payload

      function getColorBucketForFrame(frame: Frame) {
        return frameToColorBucket.get(frame.key) || 0
      }

      const flamechart = new Flamechart({
        getTotalWeight: profile.getTotalWeight.bind(profile),
        forEachCall: profile.forEachCall.bind(profile),
        formatValue: profile.formatValue.bind(profile),
        getColorBucketForFrame,
      })
      const flamechartRenderer = new FlamechartRenderer(canvasContext, rowAtlas, flamechart)

      return {flamechart, flamechartRenderer}
    }
    return state
  },
)

const leftHeavyView = reducer<FlamechartViewState>(
  (state = {flamechart: null, flamechartRenderer: null}, action) => {
    if (actions.setActiveProfile.matches(action)) {
      const {profile, canvasContext, rowAtlas, frameToColorBucket} = action.payload

      function getColorBucketForFrame(frame: Frame) {
        return frameToColorBucket.get(frame.key) || 0
      }

      const flamechart = new Flamechart({
        getTotalWeight: profile.getTotalNonIdleWeight.bind(profile),
        forEachCall: profile.forEachCallGrouped.bind(profile),
        formatValue: profile.formatValue.bind(profile),
        getColorBucketForFrame,
      })
      const flamechartRenderer = new FlamechartRenderer(canvasContext, rowAtlas, flamechart)

      return {flamechart, flamechartRenderer}
    }

    return state
  },
)

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

  console.log('initialState', initialState)

  return redux.createStore(reducer, initialState)
}
