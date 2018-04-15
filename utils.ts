export function lastOf<T>(ts: T[]): T | null {
  return ts[ts.length - 1] || null
}

export function sortBy<T>(ts: T[], key: (t: T) => number | string): void {
  function comparator(a: T, b: T) {
    return key(a) < key(b) ? -1 : 1
  }
  ts.sort(comparator)
}

export function getOrInsert<K, V>(map: Map<K, V>, k: K, fallback: (k?: K) => V): V {
  if (!map.has(k)) map.set(k, fallback(k))
  return map.get(k)!
}

export function getOrElse<K, V>(map: Map<K, V>, k: K, fallback: (k?: K) => V): V {
  if (!map.has(k)) return fallback(k)
  return map.get(k)!
}

export interface HasKey {
  readonly key: string | number
}

export class KeyedSet<T extends HasKey> {
  private map = new Map<string | number, T>()

  has(t: T): boolean {
    return this.map.has(t.key)
  }
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

// NOTE: This blindly assumes the same result across contexts.
const measureTextCache = new Map<string, number>()
export function cachedMeasureTextWidth(ctx: CanvasRenderingContext2D, text: string): number {
  if (!measureTextCache.has(text)) {
    measureTextCache.set(text, ctx.measureText(text).width)
  }
  return measureTextCache.get(text)!
}
