export function lastOf<T>(ts: T[]): T | null {
  return ts[ts.length - 1] || null
}

export function sortBy<T>(ts: T[], key: (t: T) => number | string): void {
  function comparator(a: T, b: T) {
    return key(a) < key(b) ? -1 : 1
  }
  ts.sort(comparator)
}

export function getOrInsert<K, V>(map: Map<K, V>, k: K, fallback: (k: K) => V): V {
  if (!map.has(k)) map.set(k, fallback(k))
  return map.get(k)!
}

export function getOrElse<K, V>(map: Map<K, V>, k: K, fallback: (k: K) => V): V {
  if (!map.has(k)) return fallback(k)
  return map.get(k)!
}

export function getOrThrow<K, V>(map: Map<K, V>, k: K): V {
  if (!map.has(k)) {
    throw new Error(`Expected key ${k}`)
  }
  return map.get(k)!
}

// Intended to be used to de-duplicate objects based on a key property. This
// allows value comparisons to be done efficiently and for the returned objects
// to be used intuitively in Map objects.
//
// Example usage:
//
// export class Frame {
//   private constructor(readonly file: string, readonly name: string) {}
//   get key() { return `${this.file}:${this.name}` }
//   static getOrInsert(set: KeyedSet<Frame>, file: string, name: string) {
//     return set.getOrInsert(set, new Frame(file, name))
//   }
// }
//
export interface HasKey {
  readonly key: string | number
}
export class KeyedSet<T extends HasKey> implements Iterable<T> {
  private map = new Map<string | number, T>()

  getOrInsert(t: T): T {
    const key = t.key
    const existing = this.map.get(key)
    if (existing) return existing
    this.map.set(key, t)
    return t
  }
  forEach(fn: (t: T) => void) {
    this.map.forEach(fn)
  }
  [Symbol.iterator]() {
    return this.map.values()
  }
}

export function* itMap<T, U>(it: Iterable<T>, f: (t: T) => U): Iterable<U> {
  for (let t of it) {
    yield f(t)
  }
}

export function itForEach<T>(it: Iterable<T>, f: (t: T) => void): void {
  for (let t of it) {
    f(t)
  }
}

export function itReduce<T, U>(it: Iterable<T>, f: (a: U, b: T) => U, init: U): U {
  let accum: U = init
  for (let t of it) {
    accum = f(accum, t)
  }
  return accum
}

export function zeroPad(s: string, width: number) {
  return new Array(Math.max(width - s.length, 0) + 1).join('0') + s
}

// NOTE: This blindly assumes the same result across contexts.
const measureTextCache = new Map<string, number>()

let lastDevicePixelRatio = -1
export function cachedMeasureTextWidth(ctx: CanvasRenderingContext2D, text: string): number {
  if (window.devicePixelRatio !== lastDevicePixelRatio) {
    // This cache is no longer valid!
    measureTextCache.clear()
    lastDevicePixelRatio = window.devicePixelRatio
  }
  if (!measureTextCache.has(text)) {
    measureTextCache.set(text, ctx.measureText(text).width)
  }
  return measureTextCache.get(text)!
}

export function formatPercent(percent: number) {
  let formattedPercent = `${percent.toFixed(0)}%`
  if (percent === 100) formattedPercent = '100%'
  else if (percent > 99) formattedPercent = '>99%'
  else if (percent < 0.01) formattedPercent = '<0.01%'
  else if (percent < 1) formattedPercent = `${percent.toFixed(2)}%`
  else if (percent < 10) formattedPercent = `${percent.toFixed(1)}%`
  return formattedPercent
}

export function fract(x: number) {
  return x - Math.floor(x)
}

export function triangle(x: number) {
  return 2.0 * Math.abs(fract(x) - 0.5) - 1.0
}
