import {StyleSheet} from 'aphrodite'
import {Color} from '../lib/color'
import {triangle} from '../lib/utils'

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

  weightColor: string

  searchMatchPrimaryColor: string
  searchMatchSecondaryColor: string

  colorForBucket: (t: number) => Color
  colorForBucketGLSL: string
}

export const lightTheme: Theme = {
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

  weightColor: Colors.GREEN,

  searchMatchPrimaryColor: Colors.ORANGE,
  searchMatchSecondaryColor: Colors.YELLOW,

  colorForBucket: (t: number) => {
    const x = triangle(30.0 * t)
    const H = 360.0 * (0.9 * t)
    const C = 0.25 + 0.2 * x
    const L = 0.8 - 0.15 * x
    return Color.fromLumaChromaHue(L, C, H)
  },

  colorForBucketGLSL: `
    vec3 colorForBucket(float t) {
      float x = triangle(30.0 * t);
      float H = 360.0 * (0.9 * t);
      float C = 0.25 + 0.2 * x;
      float L = 0.80 - 0.15 * x;
      return hcl2rgb(H, C, L);
    }
  `,
}

export const darkTheme: Theme = {
  fgPrimaryColor: Colors.WHITE,
  fgSecondaryColor: Colors.LIGHT_GRAY,

  bgPrimaryColor: Colors.DARK_GRAY,
  bgSecondaryColor: Colors.BLACK,

  altFgPrimaryColor: Colors.WHITE,
  altFgSecondaryColor: Colors.LIGHT_GRAY,

  altBgPrimaryColor: Colors.BLACK,
  altBgSecondaryColor: Colors.DARK_GRAY,

  selectionPrimaryColor: Colors.DARK_BLUE,
  selectionSecondaryColor: Colors.PALE_DARK_BLUE,

  weightColor: Colors.GREEN,

  searchMatchPrimaryColor: Colors.ORANGE,
  searchMatchSecondaryColor: Colors.YELLOW,

  colorForBucket: (t: number) => {
    const x = triangle(30.0 * t)
    const H = 360.0 * (0.9 * t)
    const C = 0.4 + 0.2 * x
    const L = 0.15 - 0.1 * x
    return Color.fromLumaChromaHue(L, C, H)
  },

  colorForBucketGLSL: `
    vec3 colorForBucket(float t) {
      float x = triangle(30.0 * t);
      float H = 360.0 * (0.9 * t);
      float C = 0.40 + 0.2 * x;
      float L = 0.15 - 0.1 * x;
      return hcl2rgb(H, C, L);
    }
  `,
}

export const defaultTheme = darkTheme

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
