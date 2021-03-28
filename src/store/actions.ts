import {actionCreator} from '../lib/typed-redux'
import {CallTreeNode, Frame, ProfileGroup} from '../lib/profile'
import {ColorScheme} from '.'
import {FlamechartID} from './flamechart-view-state'
import {Rect, Vec2} from '../lib/math'
import {HashParams} from '../lib/hash-params'
import {actionCreatorWithIndex} from './profiles-state'
import {ViewMode, SortMethod} from '../app-state'

export namespace actions {
  export const setProfileGroup = actionCreator<ProfileGroup>('setProfileGroup')
  export const setProfileIndexToView = actionCreator<number>('setProfileIndexToView')
  export const setGLCanvas = actionCreator<HTMLCanvasElement | null>('setGLCanvas')
  export const setViewMode = actionCreator<ViewMode>('setViewMode')
  export const setFlattenRecursion = actionCreator<boolean>('setFlattenRecursion')
  export const setSearchQuery = actionCreator<string>('setSearchQuery')
  export const setSearchIsActive = actionCreator<boolean>('setSearchIsActive')
  export const setDragActive = actionCreator<boolean>('setDragActive')
  export const setLoading = actionCreator<boolean>('setLoading')
  export const setError = actionCreator<boolean>('setError')
  export const setHashParams = actionCreator<HashParams>('setHashParams')
  export const setColorScheme = actionCreator<ColorScheme>('setColorScheme')

  export namespace sandwichView {
    export const setTableSortMethod = actionCreator<SortMethod>('sandwichView.setTableSortMethod')

    export const setSelectedFrame = actionCreatorWithIndex<Frame | null>(
      'sandwichView.setSelectedFrame',
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
