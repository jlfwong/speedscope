import {StyleSheet} from 'aphrodite'

export enum FontFamily {
  MONOSPACE = '"Source Code Pro", Courier, monospace',
}

export enum FontSize {
  LABEL = 10,
  TITLE = 12,
  BIG_BUTTON = 36,
}

enum Colors {
  WHITE = '#FFFFFF',
  OFF_WHITE = '#F6F6F6',
  LIGHT_GRAY = '#BDBDBD',
  GRAY = '#666666',
  DARK_GRAY = '#222222',
  BLACK = '#000000',
  DARK_BLUE = '#2F80ED',
  PALE_DARK_BLUE = '#8EB7ED',
  GREEN = '#6FCF97',
  TRANSPARENT_GREEN = 'rgba(111, 207, 151, 0.2)',
  YELLOW = '#FEDC62',
  ORANGE = '#FFAC02',
}

interface Theme {
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

  fgWeightColor: string
  bgWeightColor: string

  searchMatchPrimaryColor: string
  searchMatchSecondaryColor: string
}

export const defaultTheme: Theme = {
  fgPrimaryColor: Colors.BLACK,
  fgSecondaryColor: Colors.LIGHT_GRAY,

  bgPrimaryColor: Colors.WHITE,
  bgSecondaryColor: Colors.OFF_WHITE,

  altFgPrimaryColor: Colors.WHITE,
  altFgSecondaryColor: Colors.LIGHT_GRAY,

  altBgPrimaryColor: Colors.BLACK,
  altBgSecondaryColor: Colors.DARK_GRAY,

  selectionPrimaryColor: Colors.DARK_BLUE,
  selectionSecondaryColor: Colors.PALE_DARK_BLUE,

  fgWeightColor: Colors.GREEN,
  bgWeightColor: Colors.TRANSPARENT_GREEN,

  searchMatchPrimaryColor: Colors.ORANGE,
  searchMatchSecondaryColor: Colors.YELLOW,
}

export enum Sizes {
  MINIMAP_HEIGHT = 100,
  DETAIL_VIEW_HEIGHT = 150,
  TOOLTIP_WIDTH_MAX = 900,
  TOOLTIP_HEIGHT_MAX = 80,
  SEPARATOR_HEIGHT = 2,
  FRAME_HEIGHT = 20,
  TOOLBAR_HEIGHT = 20,
  TOOLBAR_TAB_HEIGHT = TOOLBAR_HEIGHT - SEPARATOR_HEIGHT,
}

export enum Duration {
  HOVER_CHANGE = '0.07s',
}

export enum ZIndex {
  PROFILE_SELECT = 1,
  HOVERTIP = 2,
}

export const commonStyle = StyleSheet.create({
  fillY: {
    height: '100%',
  },
  fillX: {
    width: '100%',
  },
  hbox: {
    display: 'flex',
    flexDirection: 'row',
    position: 'relative',
    overflow: 'hidden',
  },
  vbox: {
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
  },
})
