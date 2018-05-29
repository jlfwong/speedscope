import {clamp, Vec2} from './math'

test('clamp', () => {
  expect(clamp(1.5, 1, 2)).toBe(1.5)
  expect(clamp(2.5, 1, 2)).toBe(2)
  expect(clamp(0.5, 1, 2)).toBe(1)
})

describe('Vec2', () => {
  test('constructor', () => {
    expect(new Vec2(1, 2).x).toBe(1)
    expect(new Vec2(1, 2).y).toBe(2)
  })

  test('withX', () => {
    expect(new Vec2(1, 2).withX(3)).toEqual(new Vec2(3, 2))
  })

  test('withY', () => {
    expect(new Vec2(1, 2).withY(3)).toEqual(new Vec2(1, 3))
  })

  test('plus', () => {
    expect(new Vec2(1, 2).plus(new Vec2(3, 5))).toEqual(new Vec2(4, 7))
  })

  test('minus', () => {
    expect(new Vec2(1, 2).minus(new Vec2(3, 5))).toEqual(new Vec2(-2, -3))
  })

  test('times', () => {
    expect(new Vec2(1, 2).times(-4)).toEqual(new Vec2(-4, -8))
  })

  test('timesPointwise', () => {
    expect(new Vec2(1, 2).timesPointwise(new Vec2(2, 6))).toEqual(new Vec2(2, 12))
  })

  test('dividedByPointwise', () => {
    expect(new Vec2(1, 2).dividedByPointwise(new Vec2(2, 2))).toEqual(new Vec2(0.5, 1))
  })

  test('dot', () => {
    expect(new Vec2(1, 2).dot(new Vec2(3, 4))).toBe(11)
  })

  test('equals', () => {
    expect(new Vec2(1, 2).equals(new Vec2(1, 2))).toBe(true)
    expect(new Vec2(1, 2).equals(new Vec2(1, 3))).toBe(false)
    expect(new Vec2(1, 2).equals(new Vec2(3, 2))).toBe(false)
    expect(new Vec2(1, 2).equals(new Vec2(2, 1))).toBe(false)
  })

  test('length2', () => {
    expect(new Vec2(3, 4).length2()).toBe(25)
  })

  test('length', () => {
    expect(new Vec2(3, 4).length()).toBe(5)
  })

  test('abs', () => {
    expect(new Vec2(3, 4).abs()).toEqual(new Vec2(3, 4))
    expect(new Vec2(-3, 4).abs()).toEqual(new Vec2(3, 4))
    expect(new Vec2(3, -4).abs()).toEqual(new Vec2(3, 4))
    expect(new Vec2(-3, -4).abs()).toEqual(new Vec2(3, 4))
  })

  test('min', () => {
    expect(Vec2.min(new Vec2(1, 4), new Vec2(2, 3))).toEqual(new Vec2(1, 3))
  })

  test('max', () => {
    expect(Vec2.max(new Vec2(1, 4), new Vec2(2, 3))).toEqual(new Vec2(2, 4))
  })

  test('flatten', () => {
    expect(new Vec2(3, 4).flatten()).toEqual([3, 4])
  })
})
