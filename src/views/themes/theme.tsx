import {h, ComponentChildren, createContext} from 'preact'
import {useCallback, useContext, useEffect, useState} from 'preact/hooks'
import {Color} from '../../lib/color'
import {memoizeByReference} from '../../lib/utils'
import { ColorScheme, useAppSelector } from '../../store'
import { darkTheme } from './dark-theme'
import {lightTheme} from './light-theme'

export interface Theme {
  fgPrimaryColor: string
  fgSecondaryColor: string
  bgPrimaryColor: string
  bgSecondaryColor: string

  altFgPrimaryColor: string
  altFgSecondaryColor: string
  altBgPrimaryColor: string
  altBgSecondaryColor: string

  selectionPrimaryColor: string
  selectionSecondaryColor: string

  weightColor: string

  searchMatchTextColor: string
  searchMatchPrimaryColor: string
  searchMatchSecondaryColor: string

  colorForBucket: (t: number) => Color
  colorForBucketGLSL: string
}

export const ThemeContext = createContext<Theme>(lightTheme)

export function useTheme(): Theme {
  return useContext(ThemeContext)
}

export function withTheme<T>(cb: (theme: Theme) => T) {
  return memoizeByReference(cb)
}

function matchMediaDarkColorScheme(): MediaQueryList {
  return matchMedia('(prefers-color-scheme: dark)')
}

export function colorSchemeToString(scheme: ColorScheme): string {
  switch (scheme) {
    case ColorScheme.SYSTEM: {
      return 'System'
    }
    case ColorScheme.DARK: {
      return 'Dark'
    }
    case ColorScheme.LIGHT: {
      return 'Light'
    }
  }
}

export function nextColorScheme(scheme: ColorScheme): ColorScheme {
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

function getTheme(colorScheme: ColorScheme, systemPrefersDarkMode: boolean) {
  switch (colorScheme) {
    case ColorScheme.SYSTEM: {
      return systemPrefersDarkMode ? darkTheme : lightTheme
    }
    case ColorScheme.DARK: {
      return darkTheme
    }
    case ColorScheme.LIGHT: {
      return lightTheme
    }
  }
}


export function ThemeProvider(props: {children: ComponentChildren}) {
  const [systemPrefersDarkMode, setSystemPrefersDarkMode] = useState(
    () => matchMediaDarkColorScheme().matches,
  )

  const matchMediaListener = useCallback(
    (event: MediaQueryListEvent) => {
      setSystemPrefersDarkMode(event.matches)
    },
    [setSystemPrefersDarkMode],
  )

  useEffect(() => {
    const media = matchMediaDarkColorScheme()
    media.addEventListener('change', matchMediaListener)
    return () => {
      media.removeEventListener('change', matchMediaListener)
    }
  }, [matchMediaListener])

  const colorScheme = useAppSelector(s => s.colorScheme, [])
  const theme = getTheme(colorScheme, systemPrefersDarkMode)
  return <ThemeContext.Provider value={theme} children={props.children} />
}