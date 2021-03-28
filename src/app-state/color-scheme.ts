import {Atom} from '../lib/atom'

export const enum ColorScheme {
  // Default: respect prefers-color-schema
  SYSTEM,

  // Use dark theme
  DARK,

  // use light theme
  LIGHT,
}

const localStorageKey = 'speedscope-color-scheme'

function getStoredPreference(): ColorScheme {
  const storedPreference = window.localStorage && window.localStorage[localStorageKey]
  if (storedPreference === 'DARK') {
    return ColorScheme.DARK
  } else if (storedPreference === 'LIGHT') {
    return ColorScheme.LIGHT
  } else {
    return ColorScheme.SYSTEM
  }
}

function matchMediaDarkColorScheme(): MediaQueryList {
  return matchMedia('(prefers-color-scheme: dark)')
}

function nextColorScheme(scheme: ColorScheme): ColorScheme {
  const systemPrefersDarkMode = matchMediaDarkColorScheme().matches

  // We'll use a different cycling order for changing the color scheme depending
  // on what the *current* system preference is. This should guarantee that when
  // a user interacts with the color scheme toggle for the first time, it always
  // changes the color scheme.
  if (systemPrefersDarkMode) {
    switch (scheme) {
      case ColorScheme.SYSTEM: {
        return ColorScheme.LIGHT
      }
      case ColorScheme.LIGHT: {
        return ColorScheme.DARK
      }
      case ColorScheme.DARK: {
        return ColorScheme.SYSTEM
      }
    }
  } else {
    switch (scheme) {
      case ColorScheme.SYSTEM: {
        return ColorScheme.DARK
      }
      case ColorScheme.DARK: {
        return ColorScheme.LIGHT
      }
      case ColorScheme.LIGHT: {
        return ColorScheme.SYSTEM
      }
    }
  }
}

class ColorSchemeAtom extends Atom<ColorScheme> {
  cycleToNextColorScheme = () => {
    this.set(nextColorScheme(this.get()))
  }
}

export const colorSchemeAtom = new ColorSchemeAtom(getStoredPreference(), 'colorScheme')

colorSchemeAtom.subscribe(() => {
  const value = colorSchemeAtom.get()

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
})
