import {Color} from '../../lib/color'
import {triangle} from '../../lib/utils'
import {Theme} from './theme'

// These colors are intentionally not exported from this file, because these
// colors are theme specific, and we want all color values to come from the
// active theme.
enum Colors {
  WHITE = '#FFFFFF',
  LIGHTER_GRAY = '#D0D0D0',
  LIGHT_GRAY = '#BDBDBD',
  DARK_GRAY_L2 = '#939497',
  GRAY = '#666666',
  DARK_GRAY = '#222222',
  DARKER_GRAY = '#0C0C0C',
  OFF_BLACK = '#060606',
  BLACK = '#000000',
  MSDARK = '#262a33',
  BLUE = '#0070AF',
  PALE_BLUE = '#0097ED',
  GREEN = '#32CD32',
  LIGHT_BROWN = '#D6AE24',
  BROWN = '#EDDABE',
}

// [235, 218, 195] for async

export const PALETTE: [number, number, number][] = [
  [130, 181, 216], // calm blue
  [249, 147, 78], // orange-red 
  [229, 168, 226], // orchid purple
  [174, 162, 224], // soft indigo
  [244, 180, 89], // golden orange
  [153, 144, 222], // lavender purple
  [227, 163, 233], // soft violet
  [249, 217, 119], // bright yellow
  [214, 131, 206], // magenta
  [249, 186, 143], // coral orange
  [242, 190, 164], // peach
  [104, 183, 207], // soft blue
  [242, 145, 145], // pink
  [134, 158, 203], // periwinkle blue
  [109, 176, 144], // mint green
  [85, 144, 232], // vivid blue
  [154, 196, 138], // pastel green
  [242, 201, 109], // warm yellow
  [101, 197, 219], // cyan blue
  [244, 160, 104], // soft orange
  [244, 201, 167], // soft yellow
  [81, 149, 206], // medium blue
  [183, 219, 171], //  light green
  [234, 100, 96], // tomato
];

const colorForBucket = (t: number) => {
  const index = Math.min(Math.max(Math.floor(t * 24), 0), 23);
  const [r, g, b] = PALETTE[index];
  return Color.fromRGB(r, g, b);
};

const colorForBucketGLSL = `
  vec3 colorForBucket(float t) {
    int index = int(clamp(floor(t * 24.0), 0.0, 23.0));
    if (index == 0) return vec3(130.0, 181.0, 216.0) / 255.0;
    else if (index == 1) return vec3(244.0, 180.0, 89.0) / 255.0; 
    else if (index == 2) return vec3(229.0, 168.0, 226.0) / 255.0; 
    else if (index == 3) return vec3(174.0, 162.0, 224.0) / 255.0;
    else if (index == 4) return vec3(249.0, 147.0, 78.0) / 255.0;
    else if (index == 5) return vec3(153.0, 144.0, 222.0) / 255.0;
    else if (index == 6) return vec3(227.0, 163.0, 233.0) / 255.0; 
    else if (index == 7) return vec3(249.0, 217.0, 119.0) / 255.0;
    else if (index == 8) return vec3(214.0, 131.0, 206.0) / 255.0;
    else if (index == 9) return vec3(249.0, 186.0, 143.0) / 255.0;
    else if (index == 10) return vec3(242.0, 190.0, 164.0) / 255.0;
    else if (index == 11) return vec3(104.0, 183.0, 207.0) / 255.0;
    else if (index == 12) return vec3(242.0, 145.0, 145.0) / 255.0;
    else if (index == 13) return vec3(134.0, 158.0, 203.0) / 255.0;
    else if (index == 14) return vec3(109.0, 176.0, 144.0) / 255.0;
    else if (index == 15) return vec3(85.0, 144.0, 232.0) / 255.0;
    else if (index == 16) return vec3(154.0, 196.0, 138.0) / 255.0;
    else if (index == 17) return vec3(242.0, 201.0, 109.0) / 255.0;
    else if (index == 18) return vec3(101.0, 197.0, 219.0) / 255.0;
    else if (index == 19) return vec3(244.0, 160.0, 104.0) / 255.0;
    else if (index == 20) return vec3(244.0, 201.0, 167.0) / 255.0;
    else if (index == 21) return vec3(81.0, 149.0, 206.0) / 255.0;
    else if (index == 22) return vec3(183.0, 219.0, 171.0) / 255.0;
    else if (index == 23) return vec3(234.0, 100.0, 96.0) / 255.0;
    return vec3(1.0, 1.0, 1.0); // fallback color (white)
  }
`

// Differential flamegraph coloring: red for REG (new overhead), green for BAS (removed)
// ratio is encoded as (ratio + 1) / 2 to map [-1, 1] to [0, 1]
// 0% difference = white, 100% difference = saturated red/green (capped at 0.85)
const colorForDiffRatio = (encodedRatio: number) => {
  const ratio = encodedRatio * 2 - 1 // Decode from [0,1] to [-1,1]
  const absRatio = Math.abs(ratio)
  // Cap at 0.85 to avoid oversaturation
  const intensity = absRatio * 0.85
  if (ratio > 0) {
    // Red for REG (new overhead): white -> red
    return new Color(1, 1 - intensity, 1 - intensity)
  } else {
    // Green for BAS (removed): white -> green
    return new Color(1 - intensity, 1, 1 - intensity)
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
    // 0% difference = white, 100% difference = saturated red/green
    if (ratio > 0.0) {
      // Red for REG (new overhead): white -> red
      return vec3(1.0, 1.0 - intensity, 1.0 - intensity);
    } else {
      // Green for BAS (removed): white -> green
      return vec3(1.0 - intensity, 1.0, 1.0 - intensity);
    }
  }
`

export const darkTheme: Theme = {
  frameNodeNameColor: Colors.BLACK,

  fgPrimaryColor: Colors.WHITE,
  fgSecondaryColor: Colors.GRAY,

  bgPrimaryColor: Colors.MSDARK,
  bgSecondaryColor: Colors.DARKER_GRAY,

  altFgPrimaryColor: Colors.LIGHTER_GRAY,
  altFgSecondaryColor: Colors.GRAY,

  altBgPrimaryColor: Colors.BLACK,
  altBgSecondaryColor: Colors.MSDARK,

  selectionPrimaryColor: Colors.BLUE,
  selectionSecondaryColor: Colors.PALE_BLUE,

  weightColor: Colors.GREEN,

  searchMatchTextColor: Colors.BLACK,
  searchFadedTextColor: Colors.BLACK,
  searchFadedFrameColor: Colors.DARK_GRAY_L2,
  searchBoxTextColor: Colors.WHITE,
  searchMatchSecondaryColor: Colors.LIGHT_BROWN,

  colorForBucket,
  colorForBucketGLSL,
  colorForDiffRatio,
  colorForDiffRatioGLSL,
}
