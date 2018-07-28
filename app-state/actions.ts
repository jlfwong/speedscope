import {actionCreator} from './typed-redux'
import {Profile, CallTreeNode, Frame} from '../profile'
import {SortMethod} from '../profile-table-view'
import {ViewMode} from '.'
import {FlamechartID} from './flamechart-view-state'
import {Rect} from '../math'
import {HashParams} from '../hash-params'

export namespace actions {
  // Set the top-level profile from which other data will be derived
  export const setProfile = actionCreator<Profile>('setProfile')

  // Set the profile currently being viewed
  export const setActiveProfile = actionCreator<Profile>('setActiveProfile')

  export const setFrameToColorBucket = actionCreator<Map<string | number, number>>(
    'setFrameToColorBucket',
  )

  export const setGLCanvas = actionCreator<HTMLCanvasElement | null>('setGLCanvas')

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

  // Set whether parameters defined by the URL encoded k=v pairs after the # in the URL
  export const setHashParams = actionCreator<HashParams>('setHashParams')

  export namespace sandwichView {
    // Set the table sorting method used for the sandwich view.
    export const setTableSortMethod = actionCreator<SortMethod>('sandwichView.setTableSortMethod')

    export const setSelectedFrame = actionCreator<Frame | null>('sandwichView.setSelectedFarmr')
  }

  export namespace flamechart {
    export const setHoveredNode = actionCreator<{
      id: FlamechartID
      hover: {node: CallTreeNode; event: MouseEvent} | null
    }>('flamechart.setHoveredNode')

    export const setSelectedNode = actionCreator<{
      id: FlamechartID
      selectedNode: CallTreeNode | null
    }>('flamechart.setSelectedNode')

    export const setConfigSpaceViewportRect = actionCreator<{
      id: FlamechartID
      configSpaceViewportRect: Rect
    }>('flamechart.setConfigSpaceViewportRect')
  }
}
