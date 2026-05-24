import {FileFormat} from './file-format-spec'

export interface ValueFormatter {
  unit: FileFormat.ValueUnit
  format(v: number): string
}

export function prettyPrintNumber(num: number) {
  if (num >= 1e15) {
    return parseFloat((num / 1e15).toFixed(1)) + 'P';
  }
  if (num >= 1e12) {
    return parseFloat((num / 1e12).toFixed(1)) + 'T';
  }
  if (num >= 1e9) {
    return parseFloat((num / 1e9).toFixed(1)) + 'B';
  }
  if (num >= 1e6) {
    return parseFloat((num / 1e6).toFixed(1)) + 'M';
  }
  if (num >= 1e3) {
    return parseFloat((num / 1e3).toFixed(1)) + 'K';
  }
  return num.toString();
}

export class RawValueFormatter implements ValueFormatter {
  unit: FileFormat.ValueUnit = 'none'
  format(v: number) {
    return prettyPrintNumber(v)
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

  formatUnsigned(v: number) {
    const s = v * this.multiplier
    const units = [
      ['d', 86400],
      ['h', 3600],
      ['m', 60],
      ['s', 1],
      ['ms', 1e-3],
      ['us', 1e-6],
      ['ns', 1e-9],
    ] as const;

    if (s === 0) return '0ns';
    for (const [unit, value] of units) {
      if(s >= value || value === 1e-9) {
        return `${parseFloat((s / value).toFixed(1))}${unit}`;
      }
    }
  }

  format(v: number) {
    return `${v < 0 ? '-' : ''}${this.formatUnsigned(Math.abs(v))}`
  }
}

export class ByteFormatter implements ValueFormatter {
  unit: FileFormat.ValueUnit = 'bytes'

  format(v: number) {
    if (v < 1024) return `${parseFloat(v.toFixed(0))} B`;
    v /= 1024;
    if (v < 1024) return `${parseFloat(v.toFixed(1))} KB`;
    v /= 1024;
    if (v < 1024) return `${parseFloat(v.toFixed(1))} MB`;
    v /= 1024;
    if (v < 1024) return `${parseFloat(v.toFixed(1))} GB`;
    v /= 1024;
    if (v < 1024) return `${parseFloat(v.toFixed(1))} TB`;
    v /= 1024;
    return `${parseFloat(v.toFixed(1))} PB`;
  }
}
