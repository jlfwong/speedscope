import {Frame} from './profile'

export class Color {
  constructor(readonly r: number = 0, readonly g: number = 0, readonly b: number = 0, readonly a: number = 1) {}

  static fromLumaChromaHue(L: number, C: number, H: number) {
    // https://en.wikipedia.org/wiki/HSL_and_HSV#From_luma/chroma/hue

    const hPrime = H / 60
    const X = C * (1 - Math.abs(hPrime % 2 - 1))
    const [R1, G1, B1] = (
      hPrime < 1 ? [C, X, 0] :
      hPrime < 2 ? [X, C, 0] :
      hPrime < 3 ? [0, C, X] :
      hPrime < 4 ? [0, X, C] :
      hPrime < 5 ? [X, 0, C] :
      [C, 0, X]
    )

    const m = L - (0.30 * R1 + 0.59 * G1 + 0.11 * B1)

    return new Color(R1 + m, G1 + m, B1 + m, 1.0)
  }
}

function fract(x: number) {
  return x - Math.floor(x)
}

// TODO(jlfwong): Can probably delete this?
export class FrameColorGenerator {
  private frameToColor = new Map<Frame, Color>()

  constructor(frames: Frame[]) {
    // Make a copy so we can mutate it
    frames = [...frames]

    function key(f: Frame) {
      return (f.file || '') + f.name
    }

    function compare(a: Frame, b: Frame) {
      return key(a) > key(b) ? 1 : -1
    }

    frames.sort(compare)

    const cumulativeScores: number[] = []
    let lastScore = 0
    for (let i = 0; i < frames.length; i++) {
      const score = lastScore + Math.abs(compare(frames[i], frames[(i + 1) % frames.length]))
      cumulativeScores.push(score)
      lastScore = score
    }

    // We now have a sorted list of frames s.t. frames with similar
    // file paths and method names are clustered together.
    //
    // Now, to assign them colors, we map normalized cumulative
    // score values onto the full range of hue values.
    const totalScore = cumulativeScores[cumulativeScores.length - 1] || 1
    for (let i = 0; i < cumulativeScores.length; i++) {
      const ratio = cumulativeScores[i] / totalScore
      const x = 2 * fract(100.0 * ratio) - 1

      const L = 0.85 - 0.1 * x
      const C = 0.20 + 0.1 * x
      const H = 360 * ratio
      this.frameToColor.set(frames[i], Color.fromLumaChromaHue(L, C, H))
    }
  }

  getColorForFrame(f: Frame) { return this.frameToColor.get(f) || new Color() }
}