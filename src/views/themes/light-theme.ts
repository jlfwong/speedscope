import { Color } from "../../lib/color"
import { triangle } from "../../lib/utils"
import { Theme } from "../style"

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

export const lightTheme: Theme = ({
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
