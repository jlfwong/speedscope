import {actionCreator} from '../lib/typed-redux'
import {CallTreeNode, Frame, ProfileGroup} from '../lib/profile'
import {SortMethod} from '../views/profile-table-view'
import {ViewMode} from '.'
import {FlamechartID} from './flamechart-view-state'
import {Rect, Vec2} from '../lib/math'
import {HashParams} from '../lib/hash-params'
import {actionCreatorWithIndex} from './profiles-state'

export namespace actions {
  // Set the top-level profile group from which other data will be derived
  export const setProfileGroup = actionCreator<ProfileGroup>('setProfileGroup')

  // Set the index into the profile group to view
  export const setProfileIndexToView = actionCreator<number>('setProfileIndexToView')

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

    export const setSelectedFrame = actionCreatorWithIndex<Frame | null>(
      'sandwichView.setSelectedFarmr',
    )
  }

  export namespace flamechart {
    export const setHoveredNode = actionCreatorWithIndex<{
      id: FlamechartID
      hover: {node: CallTreeNode; event: MouseEvent} | null
    }>('flamechart.setHoveredNode')

    export const setSelectedNode = actionCreatorWithIndex<{
      id: FlamechartID
      selectedNode: CallTreeNode | null
    }>('flamechart.setSelectedNode')

    export const setConfigSpaceViewportRect = actionCreatorWithIndex<{
      id: FlamechartID
      configSpaceViewportRect: Rect
    }>('flamechart.setConfigSpaceViewportRect')

    export const setLogicalSpaceViewportSize = actionCreatorWithIndex<{
      id: FlamechartID
      logicalSpaceViewportSize: Vec2
    }>('flamechart.setLogicalSpaceViewportSpace')
  }
}
