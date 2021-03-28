import {h, ComponentChildren, createContext} from 'preact'
import {useCallback, useContext, useEffect, useState} from 'preact/hooks'
import {ColorScheme, colorSchemeAtom} from '../../app-state/color-scheme'
import {useAtom} from '../../lib/atom'
import {Color} from '../../lib/color'
import {memoizeByReference} from '../../lib/utils'
import {darkTheme} from './dark-theme'
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

  const colorScheme = useAtom(colorSchemeAtom)
  const theme = getTheme(colorScheme, systemPrefersDarkMode)
  return <ThemeContext.Provider value={theme} children={props.children} />
}
