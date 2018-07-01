export function clamp(x: number, minVal: number, maxVal: number) {
  if (x < minVal) return minVal
  if (x > maxVal) return maxVal
  return x
}

export class Vec2 {
  constructor(readonly x: number, readonly y: number) {}
  withX(x: number) {
    return new Vec2(x, this.y)
  }
  withY(y: number) {
    return new Vec2(this.x, y)
  }

  plus(other: Vec2) {
    return new Vec2(this.x + other.x, this.y + other.y)
  }
  minus(other: Vec2) {
    return new Vec2(this.x - other.x, this.y - other.y)
  }
  times(scalar: number) {
    return new Vec2(this.x * scalar, this.y * scalar)
  }
  timesPointwise(other: Vec2) {
    return new Vec2(this.x * other.x, this.y * other.y)
  }
  dividedByPointwise(other: Vec2) {
    return new Vec2(this.x / other.x, this.y / other.y)
  }
  dot(other: Vec2) {
    return this.x * other.x + this.y * other.y
  }
  equals(other: Vec2) {
    return this.x === other.x && this.y === other.y
  }
  approxEquals(other: Vec2, epsilon = 1e-9) {
    return Math.abs(this.x - other.x) < epsilon && Math.abs(this.y - other.y) < epsilon
  }

  length2() {
    return this.dot(this)
  }
  length() {
    return Math.sqrt(this.length2())
  }
  abs() {
    return new Vec2(Math.abs(this.x), Math.abs(this.y))
  }

  static min(a: Vec2, b: Vec2) {
    return new Vec2(Math.min(a.x, b.x), Math.min(a.y, b.y))
  }

  static max(a: Vec2, b: Vec2) {
    return new Vec2(Math.max(a.x, b.x), Math.max(a.y, b.y))
  }

  static clamp(v: Vec2, min: Vec2, max: Vec2) {
    return new Vec2(clamp(v.x, min.x, max.x), clamp(v.y, min.y, max.y))
  }

  static zero = new Vec2(0, 0)
  static unit = new Vec2(1, 1)

  flatten(): [number, number] {
    return [this.x, this.y]
  }
}

export class AffineTransform {
  constructor(
    readonly m00 = 1,
    readonly m01 = 0,
    readonly m02 = 0,
    readonly m10 = 0,
    readonly m11 = 1,
    readonly m12 = 0,
  ) {}

  withScale(s: Vec2) {
    let {m00, m01, m02, m10, m11, m12} = this
    m00 = s.x
    m11 = s.y
    return new AffineTransform(m00, m01, m02, m10, m11, m12)
  }
  static withScale(s: Vec2) {
    return new AffineTransform().withScale(s)
  }
  scaledBy(s: Vec2) {
    return AffineTransform.withScale(s).times(this)
  }
  getScale() {
    return new Vec2(this.m00, this.m11)
  }

  withTranslation(t: Vec2) {
    let {m00, m01, m02, m10, m11, m12} = this
    m02 = t.x
    m12 = t.y
    return new AffineTransform(m00, m01, m02, m10, m11, m12)
  }
  static withTranslation(t: Vec2) {
    return new AffineTransform().withTranslation(t)
  }
  getTranslation() {
    return new Vec2(this.m02, this.m12)
  }
  translatedBy(t: Vec2) {
    return AffineTransform.withTranslation(t).times(this)
  }

  static betweenRects(from: Rect, to: Rect) {
    return AffineTransform.withTranslation(from.origin.times(-1))
      .scaledBy(new Vec2(to.size.x / from.size.x, to.size.y / from.size.y))
      .translatedBy(to.origin)
  }

  times(other: AffineTransform) {
    const m00 = this.m00 * other.m00 + this.m01 * other.m10
    const m01 = this.m00 * other.m01 + this.m01 * other.m11
    const m02 = this.m00 * other.m02 + this.m01 * other.m12 + this.m02

    const m10 = this.m10 * other.m00 + this.m11 * other.m10
    const m11 = this.m10 * other.m01 + this.m11 * other.m11
    const m12 = this.m10 * other.m02 + this.m11 * other.m12 + this.m12
    return new AffineTransform(m00, m01, m02, m10, m11, m12)
  }

  equals(other: AffineTransform) {
    return (
      this.m00 == other.m00 &&
      this.m01 == other.m01 &&
      this.m02 == other.m02 &&
      this.m10 == other.m10 &&
      this.m11 == other.m11 &&
      this.m12 == other.m12
    )
  }

  approxEquals(other: AffineTransform, epsilon = 1e-9) {
    return (
      Math.abs(this.m00 - other.m00) < epsilon &&
      Math.abs(this.m01 - other.m01) < epsilon &&
      Math.abs(this.m02 - other.m02) < epsilon &&
      Math.abs(this.m10 - other.m10) < epsilon &&
      Math.abs(this.m11 - other.m11) < epsilon &&
      Math.abs(this.m12 - other.m12) < epsilon
    )
  }

  timesScalar(s: number) {
    const {m00, m01, m02, m10, m11, m12} = this
    return new AffineTransform(s * m00, s * m01, s * m02, s * m10, s * m11, s * m12)
  }

  det() {
    const {m00, m01, m02, m10, m11, m12} = this
    const m20 = 0
    const m21 = 0
    const m22 = 1

    return (
      m00 * (m11 * m22 - m12 * m21) - m01 * (m10 * m22 - m12 * m20) + m02 * (m10 * m21 - m11 * m20)
    )
  }

  adj() {
    const {m00, m01, m02, m10, m11, m12} = this
    const m20 = 0
    const m21 = 0
    const m22 = 1

    // Adjugate matrix (a) is the transpose of the
    // cofactor matrix (c).
    //
    // 00 01 02
    // 10 11 12
    // 20 21 22

    const a00 = /* c00 = */ +(m11 * m22 - m12 * m21)
    const a01 = /* c10 = */ -(m01 * m22 - m02 * m21)
    const a02 = /* c20 = */ +(m01 * m12 - m02 * m11)
    const a10 = /* c01 = */ -(m10 * m22 - m12 * m20)
    const a11 = /* c11 = */ +(m00 * m22 - m02 * m20)
    const a12 = /* c21 = */ -(m00 * m12 - m02 * m10)

    return new AffineTransform(a00, a01, a02, a10, a11, a12)
  }

  inverted(): AffineTransform | null {
    const det = this.det()
    if (det === 0) return null
    const adj = this.adj()
    return adj.timesScalar(1 / det)
  }

  transformVector(v: Vec2) {
    return new Vec2(v.x * this.m00 + v.y * this.m01, v.x * this.m10 + v.y * this.m11)
  }

  inverseTransformVector(v: Vec2): Vec2 | null {
    const inv = this.inverted()
    if (!inv) return null
    return inv.transformVector(v)
  }

  transformPosition(v: Vec2) {
    return new Vec2(
      v.x * this.m00 + v.y * this.m01 + this.m02,
      v.x * this.m10 + v.y * this.m11 + this.m12,
    )
  }

  inverseTransformPosition(v: Vec2): Vec2 | null {
    const inv = this.inverted()
    if (!inv) return null
    return inv.transformPosition(v)
  }

  transformRect(r: Rect) {
    const size = this.transformVector(r.size)
    const origin = this.transformPosition(r.origin)

    if (size.x < 0 && size.y < 0) {
      return new Rect(origin.plus(size), size.abs())
    } else if (size.x < 0) {
      return new Rect(origin.withX(origin.x + size.x), size.abs())
    } else if (size.y < 0) {
      return new Rect(origin.withY(origin.y + size.y), size.abs())
    }

    return new Rect(origin, size)
  }

  inverseTransformRect(r: Rect): Rect | null {
    const inv = this.inverted()
    if (!inv) return null
    return inv.transformRect(r)
  }

  flatten(): [number, number, number, number, number, number, number, number, number] {
    // Flatten into GLSL format
    // prettier-ignore
    return [
      this.m00, this.m10, 0,
      this.m01, this.m11, 0,
      this.m02, this.m12, 1,
    ]
  }
}

export class Rect {
  constructor(readonly origin: Vec2, readonly size: Vec2) {}

  isEmpty() {
    return this.width() == 0 || this.height() == 0
  }

  width() {
    return this.size.x
  }
  height() {
    return this.size.y
  }

  left() {
    return this.origin.x
  }
  right() {
    return this.left() + this.width()
  }
  top() {
    return this.origin.y
  }
  bottom() {
    return this.top() + this.height()
  }

  topLeft() {
    return this.origin
  }
  topRight() {
    return this.origin.plus(new Vec2(this.width(), 0))
  }

  bottomRight() {
    return this.origin.plus(this.size)
  }
  bottomLeft() {
    return this.origin.plus(new Vec2(0, this.height()))
  }

  withOrigin(origin: Vec2) {
    return new Rect(origin, this.size)
  }
  withSize(size: Vec2) {
    return new Rect(this.origin, size)
  }

  closestPointTo(p: Vec2) {
    return new Vec2(clamp(p.x, this.left(), this.right()), clamp(p.y, this.top(), this.bottom()))
  }

  distanceFrom(p: Vec2) {
    return p.minus(this.closestPointTo(p)).length()
  }

  contains(p: Vec2) {
    return this.distanceFrom(p) === 0
  }

  hasIntersectionWith(other: Rect) {
    const top = Math.max(this.top(), other.top())
    const bottom = Math.max(top, Math.min(this.bottom(), other.bottom()))
    if (bottom - top === 0) return false

    const left = Math.max(this.left(), other.left())
    const right = Math.max(left, Math.min(this.right(), other.right()))
    if (right - left === 0) return false
    return true
  }

  intersectWith(other: Rect): Rect {
    const topLeft = Vec2.max(this.topLeft(), other.topLeft())
    const bottomRight = Vec2.max(topLeft, Vec2.min(this.bottomRight(), other.bottomRight()))

    return new Rect(topLeft, bottomRight.minus(topLeft))
  }

  equals(other: Rect) {
    return this.origin.equals(other.origin) && this.size.equals(other.size)
  }

  approxEquals(other: Rect) {
    return this.origin.approxEquals(other.origin) && this.size.approxEquals(other.size)
  }

  area() {
    return this.size.x * this.size.y
  }

  static empty = new Rect(Vec2.zero, Vec2.zero)
  static unit = new Rect(Vec2.zero, Vec2.unit)
  static NDC = new Rect(new Vec2(-1, -1), new Vec2(2, 2))
}
