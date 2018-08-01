import {Color} from './color'

describe('Color', () => {
  test('fromLumaChromaHue', () => {
    expect(Color.fromLumaChromaHue(0, 0, 0).toCSS()).toEqual('rgba(0, 0, 0, 1.00)')
    expect(Color.fromLumaChromaHue(1, 0, 0).toCSS()).toEqual('rgba(255, 255, 255, 1.00)')

    expect(Color.fromLumaChromaHue(0.5, 0, 30).toCSS()).toEqual('rgba(128, 128, 128, 1.00)')
    expect(Color.fromLumaChromaHue(0.5, 0, 60).toCSS()).toEqual('rgba(128, 128, 128, 1.00)')

    expect(Color.fromLumaChromaHue(0.5, 0.5, 0).toCSS()).toEqual('rgba(217, 89, 89, 1.00)')

    expect(Color.fromLumaChromaHue(0.5, 1.0, 0).toCSS()).toEqual('rgba(255, 51, 51, 1.00)')
    expect(Color.fromLumaChromaHue(0.5, 1.0, 60).toCSS()).toEqual('rgba(156, 156, 0, 1.00)')
    expect(Color.fromLumaChromaHue(0.5, 1.0, 120).toCSS()).toEqual('rgba(0, 232, 0, 1.00)')
    expect(Color.fromLumaChromaHue(0.5, 1.0, 180).toCSS()).toEqual('rgba(0, 204, 204, 1.00)')
    expect(Color.fromLumaChromaHue(0.5, 1.0, 240).toCSS()).toEqual('rgba(99, 99, 255, 1.00)')
    expect(Color.fromLumaChromaHue(0.5, 1.0, 300).toCSS()).toEqual('rgba(255, 23, 255, 1.00)')
    expect(Color.fromLumaChromaHue(0.5, 1.0, 360).toCSS()).toEqual('rgba(255, 51, 51, 1.00)')
  })

  test('toCSS', () => {
    expect(new Color().toCSS()).toEqual('rgba(0, 0, 0, 1.00)')
    expect(new Color(1, 0, 0, 1).toCSS()).toEqual('rgba(255, 0, 0, 1.00)')
    expect(new Color(0, 1, 0, 1).toCSS()).toEqual('rgba(0, 255, 0, 1.00)')
    expect(new Color(0, 0, 1, 1).toCSS()).toEqual('rgba(0, 0, 255, 1.00)')
    expect(new Color(0, 0, 1, 0.599).toCSS()).toEqual('rgba(0, 0, 255, 0.60)')
  })
})
