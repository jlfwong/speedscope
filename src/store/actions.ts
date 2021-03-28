import {actionCreator} from '../lib/typed-redux'
import {ColorScheme} from '.'

export namespace actions {
  export const setColorScheme = actionCreator<ColorScheme>('setColorScheme')
}
