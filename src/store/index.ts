import {actions} from './actions'

/**
 * The root node of application state. We use redux (https://redux.js.org/)
 * as our state management solution.
 */

import * as redux from 'redux'
import {Reducer, Action} from '../lib/typed-redux'
import {useSelector} from '../lib/preact-redux'
import {Profile} from '../lib/profile'
import {getProfileToView} from './getters'
import {flattenRecursionAtom, profileGroupAtom} from '../app-state'
import {FlamechartViewState, SandwichViewState} from '../app-state/profile-group'
import {useAtom} from '../lib/atom'

export const enum ColorScheme {
  // Default: respect prefers-color-schema
  SYSTEM,

  // Use dark theme
  DARK,

  // use light theme
  LIGHT,
}

export interface ApplicationState {
  // The color scheme to use for the entire UI
  colorScheme: ColorScheme
}

const protocol = window.location.protocol

// Speedscope is usable both from a local HTML file being served
// from a file:// URL, and via websites. In the case of file:// URLs,
// however, XHR will be unavailable to fetching files in adjacent directories.
export const canUseXHR = protocol === 'http:' || protocol === 'https:'

function colorScheme(state: ColorScheme | undefined, action: Action<any>): ColorScheme {
  const localStorageKey = 'speedscope-color-scheme'

  if (state === undefined) {
    const storedPreference = window.localStorage && window.localStorage[localStorageKey]
    if (storedPreference === 'DARK') {
      return ColorScheme.DARK
    } else if (storedPreference === 'LIGHT') {
      return ColorScheme.LIGHT
    } else {
      return ColorScheme.SYSTEM
    }
  }

  if (actions.setColorScheme.matches(action)) {
    const value = action.payload

    switch (value) {
      case ColorScheme.DARK: {
        window.localStorage[localStorageKey] = 'DARK'
        break
      }
      case ColorScheme.LIGHT: {
        window.localStorage[localStorageKey] = 'LIGHT'
        break
      }
      case ColorScheme.SYSTEM: {
        delete window.localStorage[localStorageKey]
        break
      }
      default: {
        const _exhaustiveCheck: never = value
        return _exhaustiveCheck
      }
    }
    return value
  }

  return state
}

export function createAppStore(initialState?: ApplicationState): redux.Store<ApplicationState> {
  const reducer: Reducer<ApplicationState> = redux.combineReducers({
    colorScheme,
  })

  return redux.createStore(reducer, initialState)
}

export function useAppSelector<T>(selector: (t: ApplicationState) => T, cacheArgs: any[]): T {
  /* eslint-disable react-hooks/exhaustive-deps */
  return useSelector(selector, cacheArgs)
}

export interface ActiveProfileState {
  profile: Profile
  index: number
  chronoViewState: FlamechartViewState
  leftHeavyViewState: FlamechartViewState
  sandwichViewState: SandwichViewState
}

export function useActiveProfileState(): ActiveProfileState | null {
  const flattenRecursion = useAtom(flattenRecursionAtom)
  const profileGroupState = useAtom(profileGroupAtom)

  if (!profileGroupState) return null
  if (profileGroupState.indexToView >= profileGroupState.profiles.length) return null

  const index = profileGroupState.indexToView
  const profileState = profileGroupState.profiles[index]
  return {
    ...profileGroupState.profiles[profileGroupState.indexToView],
    profile: getProfileToView({
      profile: profileState.profile,
      flattenRecursion,
    }),
    index: profileGroupState.indexToView,
  }
}
