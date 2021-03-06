import {StyleSheet} from 'aphrodite'

export enum FontFamily {
  MONOSPACE = '"Source Code Pro", Courier, monospace',
}

export enum FontSize {
  LABEL = 10,
  TITLE = 12,
  BIG_BUTTON = 36,
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
