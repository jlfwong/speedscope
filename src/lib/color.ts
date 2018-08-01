import {clamp} from './math'

export class Color {
  constructor(
    readonly r: number = 0,
    readonly g: number = 0,
    readonly b: number = 0,
    readonly a: number = 1,
  ) {}

  static fromLumaChromaHue(L: number, C: number, H: number) {
    // 0 <= L <= 1
    // 0 <= C <= 1
    // 0 <= H <= 360
    // https://en.wikipedia.org/wiki/HSL_and_HSV#From_luma/chroma/hue

    const hPrime = H / 60
    const X = C * (1 - Math.abs(hPrime % 2 - 1))
    const [R1, G1, B1] =
      hPrime < 1
        ? [C, X, 0]
        : hPrime < 2
          ? [X, C, 0]
          : hPrime < 3
            ? [0, C, X]
            : hPrime < 4
              ? [0, X, C]
              : hPrime < 5
                ? [X, 0, C]
                : [C, 0, X]

    const m = L - (0.3 * R1 + 0.59 * G1 + 0.11 * B1)

    return new Color(clamp(R1 + m, 0, 1), clamp(G1 + m, 0, 1), clamp(B1 + m, 0, 1), 1.0)
  }

  toCSS(): string {
    return `rgba(${(255 * this.r).toFixed()}, ${(255 * this.g).toFixed()}, ${(
      255 * this.b
    ).toFixed()}, ${this.a.toFixed(2)})`
  }
}
