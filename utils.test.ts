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
