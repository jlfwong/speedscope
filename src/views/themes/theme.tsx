import {h, ComponentChildren, createContext} from 'preact'
import {useCallback, useContext, useEffect, useState} from 'preact/hooks'
import {Color} from '../../lib/color'
import {memoizeByReference} from '../../lib/utils'
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

const darkMedia = '(prefers-color-scheme: dark)'

export function ThemeProvider(props: {children: ComponentChildren}) {
  const [isDarkMode, setIsDarkMode] = useState(() => matchMedia(darkMedia).matches)
  const matchMediaListener = useCallback(
    (event: MediaQueryListEvent) => {
      setIsDarkMode(event.matches)
    },
    [setIsDarkMode],
  )

  useEffect(() => {
    const media = matchMedia(darkMedia)
    media.addEventListener('change', matchMediaListener)
    return () => {
      media.removeEventListener('change', matchMediaListener)
    }
  }, [matchMediaListener])

  const theme = isDarkMode ? darkTheme : lightTheme
  return <ThemeContext.Provider value={theme} children={props.children} />
}