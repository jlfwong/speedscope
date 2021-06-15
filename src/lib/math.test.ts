import {clamp, Vec2, AffineTransform, Rect} from './math'
import fc from 'fast-check'

// Change this to fc.integer() to debug failures more easily
// let numericType = fc.integer()
let numericTypeMinAccuracy = 1e-3 // reduce accuracy of double generator
let numericType = fc
  .double({
    next: true,
    noDefaultInfinity: true,
    noNaN: true,
    min: -1 / numericTypeMinAccuracy,
    max: 1 / numericTypeMinAccuracy,
  })
  .map(d => Math.round(d / numericTypeMinAccuracy) * numericTypeMinAccuracy)

test('clamp', () => {
  fc.assert(
    fc.property(numericType, numericType, numericType, (a, b, c) => {
      const result = clamp(a, b, c)
      if (a < b) return result == b
      if (a > c) return result == c
      return result == a
    }),
  )
})

const arbitraryVec2 = fc.record({x: numericType, y: numericType}).map(v => new Vec2(v.x, v.y))

const positiveVec2 = arbitraryVec2.filter(v => v.x > 0 && v.y > 0)

const arbitraryTransform = fc
  .record({
    m00: numericType,
    m01: numericType,
    m02: numericType,
    m10: numericType,
    m11: numericType,
    m12: numericType,
  })
  .map(t => new AffineTransform(t.m00, t.m01, t.m02, t.m10, t.m11, t.m12))

const invertibleTransform = arbitraryTransform.filter(t => {
  const d = t.det()
  return d != 0 && Number.isFinite(d)
})

const simpleTransform = fc
  .record({scale: arbitraryVec2, translation: arbitraryVec2})
  .map(t => AffineTransform.withScale(t.scale).withTranslation(t.translation))
  .filter(t => {
    const d = t.det()
    return d != 0 && Number.isFinite(d)
  })

const arbitraryRect = fc
  .record({origin: arbitraryVec2, size: positiveVec2})
  .map(r => new Rect(r.origin, r.size))

describe('Vec2', () => {
  test('constructor', () => {
    fc.assert(
      fc.property(numericType, numericType, (a, b) => {
        const v = new Vec2(a, b)
        return v.x == a && v.y == b
      }),
    )
  })

  test('withX', () => {
    fc.assert(
      fc.property(arbitraryVec2, numericType, (v, n) => {
        return v.withX(n).x === n
      }),
    )
  })

  test('withY', () => {
    fc.assert(
      fc.property(arbitraryVec2, numericType, (v, n) => {
        return v.withY(n).y === n
      }),
    )
  })

  test('plus', () => {
    fc.assert(
      fc.property(arbitraryVec2, arbitraryVec2, (v1, v2) => {
        const sum = v1.plus(v2)
        return sum.x === v1.x + v2.x && sum.y === v1.y + v2.y
      }),
    )
  })

  test('minus', () => {
    fc.assert(
      fc.property(arbitraryVec2, arbitraryVec2, (v1, v2) => {
        const diff = v1.minus(v2)
        return diff.x === v1.x - v2.x && diff.y === v1.y - v2.y
      }),
    )
  })

  test('times', () => {
    fc.assert(
      fc.property(arbitraryVec2, numericType, (v1, s) => {
        const prod = v1.times(s)
        return prod.x === v1.x * s && prod.y === v1.y * s
      }),
    )
  })

  test('timesPointwise', () => {
    fc.assert(
      fc.property(arbitraryVec2, arbitraryVec2, (v1, v2) => {
        const prod = v1.timesPointwise(v2)
        return prod.x === v1.x * v2.x && prod.y === v1.y * v2.y
      }),
    )
  })

  test('dividedByPointwise', () => {
    fc.assert(
      fc.property(
        arbitraryVec2,
        arbitraryVec2.filter(v => v.x !== 0 && v.y !== 0),
        (v1, v2) => {
          const div = v1.dividedByPointwise(v2)
          return div.x === v1.x / v2.x && div.y === v1.y / v2.y
        },
      ),
    )
  })

  test('dot', () => {
    fc.assert(
      fc.property(arbitraryVec2, arbitraryVec2, (v1, v2) => {
        return v1.dot(v2) === v1.x * v2.x + v1.y * v2.y
      }),
    )
  })

  test('equals', () => {
    fc.assert(
      fc.property(numericType, numericType, (a, b) => {
        return new Vec2(a, b).equals(new Vec2(a, b))
      }),
    )

    fc.assert(
      fc.property(arbitraryVec2, arbitraryVec2, (a, b) => {
        return a.equals(b) === (a.x === b.x && a.y === b.y)
      }),
    )
  })

  test('length2', () => {
    fc.assert(
      fc.property(arbitraryVec2, v => {
        return v.length2() === v.x * v.x + v.y * v.y
      }),
    )
  })

  test('length', () => {
    fc.assert(
      fc.property(arbitraryVec2, v => {
        return v.length() === Math.sqrt(v.x * v.x + v.y * v.y)
      }),
    )
  })

  test('abs', () => {
    fc.assert(
      fc.property(arbitraryVec2, v => {
        const q = v.abs()
        return q.x === Math.abs(v.x) && q.y === Math.abs(v.y)
      }),
    )
  })

  test('min', () => {
    fc.assert(
      fc.property(arbitraryVec2, arbitraryVec2, (v1, v2) => {
        const min = Vec2.min(v1, v2)
        return min.x === Math.min(v1.x, v2.x) && min.y === Math.min(v1.y, v2.y)
      }),
    )
  })

  test('max', () => {
    fc.assert(
      fc.property(arbitraryVec2, arbitraryVec2, (v1, v2) => {
        const max = Vec2.max(v1, v2)
        return max.x === Math.max(v1.x, v2.x) && max.y === Math.max(v1.y, v2.y)
      }),
    )
  })

  test('flatten', () => {
    fc.assert(
      fc.property(arbitraryVec2, v1 => {
        const flat = v1.flatten()
        return flat[0] == v1.x && flat[1] == v1.y
      }),
    )
  })
})

describe('Rect', () => {
  test('isEmpty', () => {
    fc.assert(
      fc.property(arbitraryVec2, numericType, (v, n) => {
        return new Rect(v, new Vec2(0, n)).isEmpty()
      }),
    )
    fc.assert(
      fc.property(arbitraryVec2, numericType, (v, n) => {
        return new Rect(v, new Vec2(n, 0)).isEmpty()
      }),
    )
    fc.assert(
      fc.property(arbitraryVec2, v => {
        return !new Rect(v, Vec2.unit).isEmpty()
      }),
    )
  })

  test('width', () => {
    fc.assert(
      fc.property(arbitraryVec2, arbitraryVec2, (v1, v2) => {
        return new Rect(v1, v2).width() == v2.x
      }),
    )
  })
  test('height', () => {
    fc.assert(
      fc.property(arbitraryVec2, arbitraryVec2, (v1, v2) => {
        return new Rect(v1, v2).height() == v2.y
      }),
    )
  })
  test('left', () => {
    fc.assert(
      fc.property(arbitraryVec2, arbitraryVec2, (v1, v2) => {
        return new Rect(v1, v2).left() == v1.x
      }),
    )
  })
  test('top', () => {
    fc.assert(
      fc.property(arbitraryVec2, arbitraryVec2, (v1, v2) => {
        return new Rect(v1, v2).top() == v1.y
      }),
    )
  })
  test('right', () => {
    fc.assert(
      fc.property(arbitraryVec2, arbitraryVec2, (v1, v2) => {
        return new Rect(v1, v2).right() == v1.x + v2.x
      }),
    )
  })
  test('bottom', () => {
    fc.assert(
      fc.property(arbitraryVec2, arbitraryVec2, (v1, v2) => {
        return new Rect(v1, v2).bottom() == v1.y + v2.y
      }),
    )
  })
  test('topLeft', () => {
    fc.assert(
      fc.property(arbitraryVec2, arbitraryVec2, (v1, v2) => {
        return new Rect(v1, v2).topLeft().equals(v1)
      }),
    )
  })
  test('topRight', () => {
    fc.assert(
      fc.property(arbitraryVec2, arbitraryVec2, (v1, v2) => {
        return new Rect(v1, v2).topRight().equals(v1.plus(v2.withY(0)))
      }),
    )
  })
  test('bottomLeft', () => {
    fc.assert(
      fc.property(arbitraryVec2, arbitraryVec2, (v1, v2) => {
        return new Rect(v1, v2).bottomLeft().equals(v1.plus(v2.withX(0)))
      }),
    )
  })
  test('bottomRight', () => {
    fc.assert(
      fc.property(arbitraryVec2, arbitraryVec2, (v1, v2) => {
        return new Rect(v1, v2).bottomRight().equals(v1.plus(v2))
      }),
    )
  })

  test('withOrigin', () => {
    fc.assert(
      fc.property(arbitraryRect, arbitraryVec2, (r, v) => {
        return r.withOrigin(v).origin.equals(v)
      }),
    )
  })
  test('withSize', () => {
    fc.assert(
      fc.property(arbitraryRect, arbitraryVec2, (r, v) => {
        return r.withSize(v).size.equals(v)
      }),
    )
  })

  test('closestPointTo', () => {
    fc.assert(
      fc.property(arbitraryRect, arbitraryVec2, (r, v) => {
        const p = r.closestPointTo(v)
        return p.x >= r.left() && p.x <= r.right() && p.y >= r.top() && p.y <= r.bottom()
      }),
    )
  })

  test('hasIntersectionWith', () => {
    fc.assert(
      fc.property(arbitraryRect, arbitraryRect, (r1, r2) => {
        return r1.hasIntersectionWith(r2) === !r1.intersectWith(r2).isEmpty()
      }),
    )
  })

  test('intersectWith', () => {
    fc.assert(
      fc.property(arbitraryRect, arbitraryRect, (r1, r2) => {
        const inter = r1.intersectWith(r2)
        return inter.isEmpty() || (r1.hasIntersectionWith(inter) && r2.hasIntersectionWith(inter))
      }),
    )
  })
})

describe('AffineTransform', () => {
  test('inverted', () => {
    expect(new AffineTransform(0, 0, 0, 0, 0, 0).inverted()).toBe(null)

    fc.assert(
      fc.property(invertibleTransform, t => {
        return t.inverted()!.inverted()!.approxEquals(t)
      }),
    )
  })

  test('translation', () => {
    fc.assert(
      fc.property(arbitraryTransform, arbitraryVec2, (t, v1) => {
        return t.withTranslation(v1).getTranslation().equals(v1)
      }),
    )

    fc.assert(
      fc.property(arbitraryTransform, arbitraryVec2, (t, v1) => {
        const initialTranslation = t.getTranslation()
        return t.translatedBy(v1).getTranslation().approxEquals(initialTranslation.plus(v1))
      }),
    )
  })

  test('scale', () => {
    fc.assert(
      fc.property(arbitraryTransform, arbitraryVec2, (t, v1) => {
        return t.withScale(v1).getScale().equals(v1)
      }),
    )
  })

  test('transformVector', () => {
    // Vector transformation are translation-invariant
    fc.assert(
      fc.property(arbitraryVec2, arbitraryVec2, (v1, v2) => {
        return AffineTransform.withTranslation(v1).transformVector(v2).approxEquals(v2)
      }),
    )

    fc.assert(
      fc.property(arbitraryVec2, arbitraryVec2, (v1, v2) => {
        return AffineTransform.withScale(v1).transformVector(v2).approxEquals(v2.timesPointwise(v1))
      }),
    )
  })

  test('inverseTransformVector', () => {
    fc.assert(
      fc.property(invertibleTransform, arbitraryVec2, (t, v) => {
        return t.inverseTransformVector(t.transformVector(v))!.approxEquals(v)
      }),
    )
  })

  test('transformPosition', () => {
    fc.assert(
      fc.property(arbitraryVec2, arbitraryVec2, (v1, v2) => {
        return AffineTransform.withTranslation(v1).transformPosition(v2).approxEquals(v2.plus(v1))
      }),
    )

    fc.assert(
      fc.property(arbitraryVec2, arbitraryVec2, (v1, v2) => {
        return AffineTransform.withScale(v1)
          .transformPosition(v2)
          .approxEquals(v2.timesPointwise(v1))
      }),
    )
  })

  test('inverseTransformPosition', () => {
    fc.assert(
      fc.property(invertibleTransform, arbitraryVec2, (t, v) => {
        return t.inverseTransformPosition(t.transformPosition(v))!.approxEquals(v)
      }),
    )
  })

  test('transformRect', () => {
    fc.assert(
      fc.property(arbitraryVec2, arbitraryRect, (v, r) => {
        return AffineTransform.withTranslation(v)
          .transformRect(r)
          .equals(r.withOrigin(r.origin.plus(v)))
      }),
    )

    fc.assert(
      fc.property(arbitraryVec2, arbitraryRect, (v, r) => {
        const t = AffineTransform.withScale(v)
        const rt = t.transformRect(r)
        return Math.abs(rt.area() - r.area() * Math.abs(t.det())) < 1e-6
      }),
    )
  })

  test('inverseTransformRect', () => {
    fc.assert(
      fc.property(simpleTransform, arbitraryRect, (t, r) => {
        return t.inverseTransformRect(t.transformRect(r))!.approxEquals(r)
      }),
    )
  })

  test('times', () => {
    fc.assert(
      fc.property(invertibleTransform, invertibleTransform, (t1, t2) => {
        return t1.times(t2).times(t2.inverted()!).approxEquals(t1)
      }),
    )
  })
})
