import {actionCreator} from '../typed-redux'
import {Profile} from '../profile'
import {FlamechartRowAtlasKey} from '../flamechart-renderer'
import {SortMethod} from '../profile-table-view'
import {CanvasContext} from '../canvas-context'
import {RowAtlas} from '../row-atlas'
import {ViewMode} from './index'

export namespace actions {
  // Set the top-level profile from which other data will be derived
  export const setProfile = actionCreator<Profile>('setProfile')

  // Set the profile currently being viewed
  export const setActiveProfile = actionCreator<{
    profile: Profile
    canvasContext: CanvasContext
    rowAtlas: RowAtlas<FlamechartRowAtlasKey>
    frameToColorBucket: Map<string | number, number>
  }>('setActiveProfile')

  // Set which top-level view should be displayed
  export const setViewMode = actionCreator<ViewMode>('setViewMode')

  // Set whether or not recursion should be flattened when viewing flamegraphs
  export const setFlattenRecursion = actionCreator<boolean>('setFlattenRecursion')

  // Set whether a file drag is currently active. Used to indicate that the
  // application is a valid drop target.
  export const setDragActive = actionCreator<boolean>('setDragActive')

  // Set whether the application is currently in a loading state. Used to
  // display a loading progress bar.
  export const setLoading = actionCreator<boolean>('setLoading')

  // Set whether the application is in an errored state.
  export const setError = actionCreator<boolean>('setError')

  // Set the table sorting method used for the sandwich view.
  export const setTableSortMethod = actionCreator<SortMethod>('setTableSortMethod')
}
