export function lastOf<T>(ts: T[]): T | null {
  return ts[ts.length - 1] || null
}

export function sortBy<T>(ts: T[], key: (t: T) => number | string): void {
  function comparator(a: T, b: T) {
    const keyA = key(a)
    const keyB = key(b)
    return keyA < keyB ? -1 : keyA > keyB ? 1 : 0
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

export function findValueBisect(
  lo: number,
  hi: number,
  f: (val: number) => number,
  target: number,
  targetRangeSize = 1,
): [number, number] {
  console.assert(!isNaN(targetRangeSize) && !isNaN(target))
  while (true) {
    if (hi - lo <= targetRangeSize) return [lo, hi]
    const mid = (hi + lo) / 2
    const val = f(mid)
    if (val < target) lo = mid
    else hi = mid
  }
}

// Similar to Array.prototype.findIndex, except uses a binary search.
//
// This assumes that the condition transitions exactly once from false to true
// in the list, e.g. the following is a valid input:
//
//  ls        = [a, b, c, d]
//  ls.map(f) = [false, false, true, true]
//
// The following is an invalid input:
//
//  ls        = [a, b, c, d]
//  ls.map(f) = [false, true, false, true]
export function findIndexBisect<T>(ls: T[], f: (val: T) => boolean): number {
  if (ls.length === 0) return -1

  let lo = 0
  let hi = ls.length - 1

  while (hi !== lo) {
    const mid = Math.floor((lo + hi) / 2)

    if (f(ls[mid])) {
      // The desired index is <= mid
      hi = mid
    } else {
      // The desired index is > mid
      lo = mid + 1
    }
  }

  return f(ls[hi]) ? hi : -1
}

export function noop(...args: any[]) {}

export function objectsHaveShallowEquality<T extends object>(a: T, b: T): boolean {
  for (let key in a) {
    if (a[key] !== b[key]) return false
  }
  for (let key in b) {
    if (a[key] !== b[key]) return false
  }
  return true
}

export function memoizeByShallowEquality<T extends object, U>(cb: (t: T) => U): (t: T) => U {
  let last: {args: T; result: U} | null = null
  return (args: T) => {
    let result: U
    if (last == null) {
      result = cb(args)
      last = {args, result}
      return result
    } else if (objectsHaveShallowEquality(last.args, args)) {
      return last.result
    } else {
      last.args = args
      last.result = cb(args)
      return last.result
    }
  }
}

export function memoizeByReference<T, U>(cb: (t: T) => U): (t: T) => U {
  let last: {args: T; result: U} | null = null
  return (args: T) => {
    let result: U
    if (last == null) {
      result = cb(args)
      last = {args, result}
      return result
    } else if (last.args === args) {
      return last.result
    } else {
      last.args = args
      last.result = cb(args)
      return last.result
    }
  }
}

export function lazyStatic<T>(cb: () => T): () => T {
  let last: {result: T} | null = null
  return () => {
    if (last == null) {
      last = {result: cb()}
    }
    return last.result
  }
}

const base64lookupTable = lazyStatic(
  (): Map<string, number> => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    const ret = new Map<string, number>()
    for (let i = 0; i < alphabet.length; i++) {
      ret.set(alphabet.charAt(i), i)
    }
    ret.set('=', -1)
    return ret
  },
)

// NOTE: There are probably simpler solutions to this problem, but I have this written already, so
// until we run into problems with this, let's just use this.
//
// See: https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding#The_Unicode_Problem#The_Unicode_Problem
export function decodeBase64(encoded: string): Uint8Array {
  // Reference: https://www.rfc-editor.org/rfc/rfc4648.txt

  const lookupTable = base64lookupTable()

  // 3 byte groups are represented as sequneces of 4 characters.
  //
  // "The encoding process represents 24-bit groups of input bits as output
  //  strings of 4 encoded characters."
  //
  // "Special processing is performed if fewer than 24 bits are available
  //  at the end of the data being encoded.  A full encoding quantum is
  //  always completed at the end of a quantity.  When fewer than 24 input
  //  bits are available in an input group bits with value zero are added
  //  (on the right) to form an integral number of 6-bit groups."

  if (encoded.length % 4 !== 0) {
    throw new Error(
      `Invalid length for base64 encoded string. Expected length % 4 = 0, got length = ${encoded.length}`,
    )
  }

  const quartetCount = encoded.length / 4
  let byteCount: number

  // Special processing is performed if fewer than 24 bits are available
  // at the end of the data being encoded.  A full encoding quantum is
  // always completed at the end of a quantity.  When fewer than 24 input
  // bits are available in an input group, bits with value zero are added
  // (on the right) to form an integral number of 6-bit groups.  Padding
  // at the end of the data is performed using the '=' character.  Since
  // all base 64 input is an integral number of octets, only the following
  // cases can arise:
  //
  // (1) The final quantum of encoding input is an integral multiple of 24
  //     bits; here, the final unit of encoded output will be an integral
  //     multiple of 4 characters with no "=" padding.
  //
  // (2) The final quantum of encoding input is exactly 8 bits; here, the
  //     final unit of encoded output will be two characters followed by
  //     two "=" padding characters.
  //
  // (3) The final quantum of encoding input is exactly 16 bits; here, the
  //     final unit of encoded output will be three characters followed by
  //     one "=" padding character.
  if (encoded.length >= 4) {
    if (encoded.charAt(encoded.length - 1) === '=') {
      if (encoded.charAt(encoded.length - 2) === '=') {
        // Case (2)
        byteCount = quartetCount * 3 - 2
      } else {
        // Case (3)
        byteCount = quartetCount * 3 - 1
      }
    } else {
      // Case (1)
      byteCount = quartetCount * 3
    }
  } else {
    // Case (1)
    byteCount = quartetCount * 3
  }

  const bytes = new Uint8Array(byteCount)
  let offset = 0

  for (let i = 0; i < quartetCount; i++) {
    const enc1 = encoded.charAt(i * 4 + 0)
    const enc2 = encoded.charAt(i * 4 + 1)
    const enc3 = encoded.charAt(i * 4 + 2)
    const enc4 = encoded.charAt(i * 4 + 3)

    const sextet1 = lookupTable.get(enc1)
    const sextet2 = lookupTable.get(enc2)
    const sextet3 = lookupTable.get(enc3)
    const sextet4 = lookupTable.get(enc4)

    if (sextet1 == null || sextet2 == null || sextet3 == null || sextet4 == null) {
      throw new Error(
        `Invalid quartet at indices ${i * 4} .. ${i * 4 + 3}: ${encoded.substring(
          i * 4,
          i * 4 + 3,
        )}`,
      )
    }

    bytes[offset++] = (sextet1 << 2) | (sextet2 >> 4)
    if (enc3 !== '=') {
      bytes[offset++] = ((sextet2 & 15) << 4) | (sextet3 >> 2)
    }
    if (enc4 !== '=') {
      bytes[offset++] = ((sextet3 & 7) << 6) | sextet4
    }
  }

  if (offset !== byteCount) {
    throw new Error(`Expected to decode ${byteCount} bytes, but only decoded ${offset})`)
  }

  return bytes
}
