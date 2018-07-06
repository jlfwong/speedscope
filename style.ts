import {StyleSheet} from 'aphrodite'

export enum FontFamily {
  MONOSPACE = '"Source Code Pro", Courier, monospace',
}

export enum FontSize {
  LABEL = 10,
  TITLE = 12,
  BIG_BUTTON = 36,
}

export enum Colors {
  WHITE = '#FFFFFF',
  OFF_WHITE = '#F6F6F6',
  LIGHT_GRAY = '#BDBDBD',
  GRAY = '#666666',
  DARK_GRAY = '#222222',
  BLACK = '#000000',
  BRIGHT_BLUE = '#56CCF2',
  DARK_BLUE = '#2F80ED',
  PALE_DARK_BLUE = '#8EB7ED',
  GREEN = '#6FCF97',
  TRANSPARENT_GREEN = 'rgba(111, 207, 151, 0.2)',
}

export enum Sizes {
  MINIMAP_HEIGHT = 100,
  DETAIL_VIEW_HEIGHT = 150,
  TOOLTIP_WIDTH_MAX = 300,
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
  HOVERTIP = 1,
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
