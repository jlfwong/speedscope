import {StyleSheet} from 'aphrodite'

export enum FontFamily {
  MONOSPACE = 'Arial, sans-serif, Courier, monospace',
  FRAME = 'Inter, sans-serif',
}

export enum FontSize {
  SEARCH_BAR = 13,
  LABEL = 12,
  TITLE = 13,
  BIG_BUTTON = 36,
}

export enum Sizes {
  MINIMAP_HEIGHT = 80,
  DETAIL_VIEW_HEIGHT = 100,
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
  GRAPH = 0,
  TABLE = 1,
  TOOLBAR = 2,
  PROFILE_SELECT = 3,
  HOVERTIP = 4,
  MENU = 9998,
  INFO = 9999,
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
