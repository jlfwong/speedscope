import {actionCreator} from '../lib/typed-redux'
import {ColorScheme} from '.'
import {HashParams} from '../lib/hash-params'
import {ViewMode, SortMethod} from '../app-state'

export namespace actions {
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
  }
}
