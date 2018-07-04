import {ValueUnit} from './file-format-spec'

export interface ValueFormatter {
  unit: ValueUnit
  format(v: number): string
}

export class RawValueFormatter implements ValueFormatter {
  unit: ValueUnit = 'none'
  format(v: number) {
    return v.toLocaleString()
  }
}

export class TimeFormatter implements ValueFormatter {
  private multiplier: number

  constructor(public unit: 'nanoseconds' | 'microseconds' | 'milliseconds' | 'seconds') {
    if (unit === 'nanoseconds') this.multiplier = 1e-9
    else if (unit === 'microseconds') this.multiplier = 1e-6
    else if (unit === 'milliseconds') this.multiplier = 1e-3
    else this.multiplier = 1
  }

  format(v: number) {
    const s = v * this.multiplier

    if (s / 60 >= 1) return `${(s / 60).toFixed(2)}min`
    if (s / 1 >= 1) return `${s.toFixed(2)}s`
    if (s / 1e-3 >= 1) return `${(s / 1e-3).toFixed(2)}ms`
    if (s / 1e-6 >= 1) return `${(s / 1e-6).toFixed(2)}µs`
    else return `${(s / 1e-9).toFixed(2)}ns`
  }
}

export class ByteFormatter implements ValueFormatter {
  unit: ValueUnit = 'bytes'

  format(v: number) {
    if (v < 1024) return `${v.toFixed(0)} B`
    v /= 1024
    if (v < 1024) return `${v.toFixed(2)} KB`
    v /= 1024
    if (v < 1024) return `${v.toFixed(2)} MB`
    v /= 1024
    return `${v.toFixed(2)} GB`
  }
}
