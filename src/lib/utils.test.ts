import {
  sortBy,
  getOrInsert,
  getOrElse,
  getOrThrow,
  itMap,
  itForEach,
  itReduce,
  zeroPad,
  formatPercent,
  KeyedSet,
  binarySearch,
  memoizeByReference,
  memoizeByShallowEquality,
  objectsHaveShallowEquality,
} from './utils'

test('sortBy', () => {
  const ls = ['a3', 'b2', 'c1', 'd4']
  sortBy(ls, k => k.charCodeAt(1))
  expect(ls).toEqual(['c1', 'b2', 'a3', 'd4'])
})

test('getOrInsert', () => {
  const m = new Map<string, number>()
  expect(getOrInsert(m, 'hello', k => k.length)).toBe(5)
  expect(getOrInsert(m, 'hello', k => 2 * k.length)).toBe(5)
  expect(getOrInsert(m, 'x', k => k.length)).toBe(1)
  expect(m.get('hello')).toBe(5)
  expect(m.get('x')).toBe(1)
})

class ValueType {
  private constructor(readonly a: string, readonly num: number) {}
  get key() {
    return `${this.a}_${this.num}`
  }
  static getOrInsert(set: KeyedSet<ValueType>, a: string, num: number) {
    return set.getOrInsert(new ValueType(a, num))
  }
}

test('KeyedSet', () => {
  const set = new KeyedSet<ValueType>()

  const x1 = ValueType.getOrInsert(set, 'x', 1)
  const x2 = ValueType.getOrInsert(set, 'x', 1)
  const y = ValueType.getOrInsert(set, 'y', 1)

  expect(x1).toBe(x2)
  expect(y).not.toBe(x1)

  const set2 = new KeyedSet<ValueType>()
  const x3 = ValueType.getOrInsert(set2, 'x', 1)
  expect(x1).not.toBe(x3)
})

test('getOrElse', () => {
  const m = new Map<string, number>()
  expect(getOrElse(m, 'hello', k => k.length)).toBe(5)
  expect(getOrElse(m, 'hello', k => 2 * k.length)).toBe(10)
  expect(getOrElse(m, 'x', k => k.length)).toBe(1)
  expect(getOrElse(m, 'x', () => 3)).toBe(3)
  expect(m.get('hello')).toBe(undefined)
  expect(m.get('x')).toBe(undefined)
})

test('getOrThrow', () => {
  const m = new Map<string, number>()
  m.set('hello', 5)
  expect(getOrThrow(m, 'hello')).toBe(5)
  expect(() => getOrThrow(m, 'goodbye')).toThrow('Expected key goodbye')
})

test('itMap', () => {
  const s = new Set<number>([1, 2, 3])
  expect(new Set(itMap(s, v => v * v))).toEqual(new Set([1, 4, 9]))
})

test('itForEach', () => {
  const s = new Set<number>([1, 2, 3])
  const t = new Set()
  itForEach(s, v => t.add(v * v))
  expect(t).toEqual(new Set([1, 4, 9]))
})

test('itReduce', () => {
  const s = new Set<number>([1, 2, 3])
  expect(itReduce(s, (a, b) => a + b, 0)).toBe(6)
})

test('zeroPad', () => {
  expect(zeroPad('1', 2)).toBe('01')
  expect(zeroPad('1', 3)).toBe('001')
  expect(zeroPad('1000', 3)).toBe('1000')
  expect(zeroPad('FF', 4)).toBe('00FF')
})

test('formatPercent', () => {
  expect(formatPercent(0.42)).toBe('0.42%')
  expect(formatPercent(0.4)).toBe('0.40%')
  expect(formatPercent(1)).toBe('1.0%')
  expect(formatPercent(1.6)).toBe('1.6%')
  expect(formatPercent(99)).toBe('99%')
  expect(formatPercent(99.9)).toBe('>99%')
  expect(formatPercent(100)).toBe('100%')
})

test('binarySearch', () => {
  const [lo, hi] = binarySearch(0, 10, n => Math.log(n), 1, 0.0001)
  expect(lo).toBeCloseTo(Math.E, 4)
  expect(lo).toBeLessThan(Math.E)
  expect(hi).toBeGreaterThan(Math.E)
})

test('memoizeByReference', () => {
  let hitCount = 0
  const identity = memoizeByReference((arg: number) => {
    hitCount++
    return arg
  })

  expect(identity(3)).toBe(3)
  expect(hitCount).toBe(1)
  expect(identity(3)).toBe(3)
  expect(hitCount).toBe(1)

  expect(identity(5)).toBe(5)
  expect(hitCount).toBe(2)

  expect(identity(3)).toBe(3)
  expect(hitCount).toBe(3)
})

test('memoizeByShallowEquality', () => {
  let hitCount = 0
  const identity = memoizeByShallowEquality((arg: {a: number; b: number}) => {
    hitCount++
    return arg
  })

  expect(identity({a: 1, b: 2})).toEqual({a: 1, b: 2})
  expect(hitCount).toBe(1)
  expect(identity({a: 1, b: 2})).toEqual({a: 1, b: 2})
  expect(hitCount).toBe(1)

  expect(identity({a: 2, b: 2})).toEqual({a: 2, b: 2})
  expect(hitCount).toBe(2)
  expect(identity({a: 2, b: 2})).toEqual({a: 2, b: 2})
  expect(hitCount).toBe(2)

  expect(identity({a: 2, b: 1})).toEqual({a: 2, b: 1})
  expect(hitCount).toBe(3)
  expect(identity({a: 2, b: 1})).toEqual({a: 2, b: 1})
  expect(hitCount).toBe(3)

  expect(identity({a: 1, b: 2})).toEqual({a: 1, b: 2})
  expect(hitCount).toBe(4)
})

test('objectsHaveShallowEquality', () => {
  expect(objectsHaveShallowEquality({}, {})).toBe(true)
  expect(objectsHaveShallowEquality({a: 1, b: 2}, {a: 1, b: 2})).toBe(true)

  expect(objectsHaveShallowEquality({a: 1, b: 2}, {a: 1, b: 3})).toBe(false)
  expect(objectsHaveShallowEquality({a: 1, b: 2}, {a: 2, b: 2})).toBe(false)
  expect(objectsHaveShallowEquality({a: 1}, {a: 1, b: 2})).toBe(false)
  expect(objectsHaveShallowEquality({a: 1, b: 2}, {b: 2})).toBe(false)

  expect(objectsHaveShallowEquality([], [])).toBe(true)
  expect(objectsHaveShallowEquality([1, 2], [1, 2])).toBe(true)

  expect(objectsHaveShallowEquality([1], [1, 2])).toBe(false)
  expect(objectsHaveShallowEquality([1, 2], [1])).toBe(false)
})
