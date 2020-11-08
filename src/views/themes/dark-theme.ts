import {Color} from '../../lib/color'
import {triangle} from '../../lib/utils'
import {Theme} from '../style'

// These colors are intentionally not exported from this file, because these
// colors are theme specific, and we want all color values to come from the
// active theme.
enum Colors {
  LIGHTER_GRAY = '#E0E0E0',
  LIGHT_GRAY = '#BDBDBD',
  GRAY = '#666666',
  DARK_GRAY = '#222222',
  DARKER_GRAY = '#0C0C0C',
  OFF_BLACK = '#060606',
  BLACK = '#000000',
  BLUE = '#00769B',
  PALE_BLUE = '#004E75',
  GREEN = '#0F8A42',
  YELLOW = '#D9AE15',
  ORANGE = '#9E6E0B',
}

export const darkTheme: Theme = {
  fgPrimaryColor: Colors.LIGHTER_GRAY,
  fgSecondaryColor: Colors.GRAY,

  bgPrimaryColor: Colors.OFF_BLACK,
  bgSecondaryColor: Colors.DARKER_GRAY,

  altFgPrimaryColor: Colors.LIGHTER_GRAY,
  altFgSecondaryColor: Colors.DARK_GRAY,

  altBgPrimaryColor: Colors.BLACK,
  altBgSecondaryColor: Colors.OFF_BLACK,

  selectionPrimaryColor: Colors.BLUE,
  selectionSecondaryColor: Colors.PALE_BLUE,

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
