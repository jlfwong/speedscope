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

// Differential flamegraph coloring: red for REG (new overhead), green for BAS (removed)
// ratio is encoded as (ratio + 1) / 2 to map [-1, 1] to [0, 1]
// 0% difference = light gray (0.9), 100% difference = saturated red/green (capped at 0.85)
const colorForDiffRatio = (encodedRatio: number) => {
  const ratio = encodedRatio * 2 - 1 // Decode from [0,1] to [-1,1]
  const absRatio = Math.abs(ratio)
  // Cap at 0.85 to avoid oversaturation
  const intensity = absRatio * 0.85
  // Base color is light gray (0.9) instead of pure white for better visibility
  const baseColor = 0.9
  if (ratio > 0) {
    // Red for REG (new overhead): light gray -> red
    return new Color(baseColor + (1 - baseColor) * intensity, baseColor - baseColor * intensity, baseColor - baseColor * intensity)
  } else {
    // Green for BAS (removed): light gray -> green
    return new Color(baseColor - baseColor * intensity, baseColor + (1 - baseColor) * intensity, baseColor - baseColor * intensity)
  }
}

const colorForDiffRatioGLSL = `
  vec3 colorForDiffRatio(float encodedRatio) {
    // Decode from [0.01, 1] to [-1, 1] (encoded range avoids 0 for background)
    float normalized = (encodedRatio - 0.01) / 0.99;
    float ratio = normalized * 2.0 - 1.0;
    float absRatio = abs(ratio);
    // Cap at 0.85 to avoid oversaturation
    float intensity = absRatio * 0.85;
    // Base color is light gray (0.9) instead of pure white for better visibility
    float baseColor = 0.9;
    // 0% difference = light gray, 100% difference = saturated red/green
    if (ratio > 0.0) {
      // Red for REG (new overhead): light gray -> red
      return vec3(baseColor + (1.0 - baseColor) * intensity, baseColor - baseColor * intensity, baseColor - baseColor * intensity);
    } else {
      // Green for BAS (removed): light gray -> green
      return vec3(baseColor - baseColor * intensity, baseColor + (1.0 - baseColor) * intensity, baseColor - baseColor * intensity);
    }
  }
`

export const lightTheme: Theme = {
  frameNodeNameColor: Colors.BLACK,

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
  searchFadedTextColor: Colors.BLACK,
  searchFadedFrameColor: Colors.LIGHT_GRAY,
  searchBoxTextColor: Colors.WHITE,
  searchMatchSecondaryColor: Colors.YELLOW,

  colorForBucket,
  colorForBucketGLSL,
  colorForDiffRatio,
  colorForDiffRatioGLSL,
}
