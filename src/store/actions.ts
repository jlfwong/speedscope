import {actionCreator} from '../lib/typed-redux'
import {ColorScheme} from '.'
import {SortMethod} from '../app-state'

export namespace actions {
  export const setSearchQuery = actionCreator<string>('setSearchQuery')
  export const setSearchIsActive = actionCreator<boolean>('setSearchIsActive')
  export const setColorScheme = actionCreator<ColorScheme>('setColorScheme')

  export namespace sandwichView {
    export const setTableSortMethod = actionCreator<SortMethod>('sandwichView.setTableSortMethod')
  }
}
