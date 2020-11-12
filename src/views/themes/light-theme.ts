import {Color} from '../../lib/color'
import {triangle} from '../../lib/utils'
import {Theme} from './theme'

// These colors are intentionally not exported from this file, because these
// colors are theme specific, and we want all color values to come from the
// active theme.
enum Colors {
  WHITE = '#FFFFFF',
  OFF_WHITE = '#F6F6F6',
  LIGHT_GRAY = '#BDBDBD',
  GRAY = '#666666',
  DARK_GRAY = '#222222',
  OFF_BLACK = '#111111',
  BLACK = '#000000',
  DARK_BLUE = '#2F80ED',
  PALE_DARK_BLUE = '#8EB7ED',
  GREEN = '#6FCF97',
  YELLOW = '#FEDC62',
  ORANGE = '#FFAC02',
}

const C_0 = 0.25
const C_d = 0.2
const L_0 = 0.8
const L_d = 0.15

const colorForBucket = (t: number) => {
  const x = triangle(30.0 * t)
  const H = 360.0 * (0.9 * t)
  const C = C_0 + C_d * x
  const L = L_0 - L_d * x
  return Color.fromLumaChromaHue(L, C, H)
}
const colorForBucketGLSL = `
  vec3 colorForBucket(float t) {
    float x = triangle(30.0 * t);
    float H = 360.0 * (0.9 * t);
    float C = ${C_0.toFixed(1)} + ${C_d.toFixed(1)} * x;
    float L = ${L_0.toFixed(1)} - ${L_d.toFixed(1)} * x;
    return hcl2rgb(H, C, L);
  }
`

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

  searchMatchTextColor: Colors.BLACK,
  searchMatchPrimaryColor: Colors.ORANGE,
  searchMatchSecondaryColor: Colors.YELLOW,

  colorForBucket,
  colorForBucketGLSL,
}
