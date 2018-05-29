import {clamp, Vec2} from './math'
import * as jsc from 'jsverify'

test('clamp', () => {
  jsc.assertForall(jsc.number, jsc.number, jsc.number, (a, b, c) => {
    const result = clamp(a, b, c)
    if (a < b) return result == b
    if (a > c) return result == c
    return result == a
  })
})

const arbitraryVec2 = jsc
  .record({x: jsc.number, y: jsc.number})
  .smap(v => new Vec2(v.x, v.y), v => ({x: v.x, y: v.y}))

describe('Vec2', () => {
  test('constructor', () => {
    jsc.assertForall(jsc.number, jsc.number, (a, b) => {
      const v = new Vec2(a, b)
      return v.x == a && v.y == b
    })
  })

  test('withX', () => {
    jsc.assertForall(arbitraryVec2, jsc.number, (v, n) => {
      return v.withX(n).x === n
    })
  })

  test('withY', () => {
    jsc.assertForall(arbitraryVec2, jsc.number, (v, n) => {
      return v.withY(n).y === n
    })
  })

  test('plus', () => {
    jsc.assertForall(arbitraryVec2, arbitraryVec2, (v1, v2) => {
      const sum = v1.plus(v2)
      return sum.x === v1.x + v2.x && sum.y === v1.y + v2.y
    })
  })

  test('minus', () => {
    jsc.assertForall(arbitraryVec2, arbitraryVec2, (v1, v2) => {
      const diff = v1.minus(v2)
      return diff.x === v1.x - v2.x && diff.y === v1.y - v2.y
    })
  })

  test('times', () => {
    jsc.assertForall(arbitraryVec2, jsc.number, (v1, s) => {
      const prod = v1.times(s)
      return prod.x === v1.x * s && prod.y === v1.y * s
    })
  })

  test('timesPointwise', () => {
    jsc.assertForall(arbitraryVec2, arbitraryVec2, (v1, v2) => {
      const prod = v1.timesPointwise(v2)
      return prod.x === v1.x * v2.x && prod.y === v1.y * v2.y
    })
  })

  test('dividedByPointwise', () => {
    jsc.assertForall(
      arbitraryVec2,
      jsc.suchthat(arbitraryVec2, v => v.x !== 0 && v.y !== 0),
      (v1, v2) => {
        const div = v1.dividedByPointwise(v2)
        return div.x === v1.x / v2.x && div.y === v1.y / v2.y
      },
    )
  })

  test('dot', () => {
    jsc.assertForall(arbitraryVec2, arbitraryVec2, (v1, v2) => {
      return v1.dot(v2) === v1.x * v2.x + v1.y * v2.y
    })
  })

  test('equals', () => {
    jsc.assertForall(jsc.number, jsc.number, (a, b) => {
      return new Vec2(a, b).equals(new Vec2(a, b))
    })

    jsc.assertForall(arbitraryVec2, arbitraryVec2, (a, b) => {
      return a.equals(b) === (a.x === b.x && a.y === b.y)
    })
  })

  test('length2', () => {
    jsc.assertForall(arbitraryVec2, v => {
      return v.length2() === v.x * v.x + v.y * v.y
    })
  })

  test('length', () => {
    jsc.assertForall(arbitraryVec2, v => {
      return v.length() === Math.sqrt(v.x * v.x + v.y * v.y)
    })
  })

  test('abs', () => {
    jsc.assertForall(arbitraryVec2, v => {
      const q = v.abs()
      return q.x === Math.abs(v.x) && q.y === Math.abs(v.y)
    })
  })

  test('min', () => {
    jsc.assertForall(arbitraryVec2, arbitraryVec2, (v1, v2) => {
      const min = Vec2.min(v1, v2)
      return min.x === Math.min(v1.x, v2.x) && min.y === Math.min(v1.y, v2.y)
    })
  })

  test('max', () => {
    jsc.assertForall(arbitraryVec2, arbitraryVec2, (v1, v2) => {
      const max = Vec2.max(v1, v2)
      return max.x === Math.max(v1.x, v2.x) && max.y === Math.max(v1.y, v2.y)
    })
  })

  test('flatten', () => {
    jsc.assertForall(arbitraryVec2, v1 => {
      const flat = v1.flatten()
      return flat[0] == v1.x && flat[1] == v1.y
    })
  })
})
