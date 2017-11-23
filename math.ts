export class Vec2 {
  constructor(readonly x = 0, readonly y = 0) {}
  plus(other: Vec2) { return new Vec2(this.x + other.x, this.y + other.y) }
  minus(other: Vec2) { return new Vec2(this.x - other.x, this.y - other.y) }
  times(scalar: number) { return new Vec2(this.x * scalar, this.y * scalar) }
  dot(other: Vec2) { return this.x * other.x + this.y * other.y }
  length2() { return this.dot(this) }
  length() { return Math.sqrt(this.length2()) }

  flatten(): [number, number] { return [this.x, this.y] }
}

export class Rect {
  constructor(
    readonly origin = new Vec2(),
    readonly size = new Vec2()
  ) {}

  width() { return this.size.x }
  height() { return this.size.y }

  left() { return this.origin.x }
  right() { return this.left() + this.width() }
  top() { return this.origin.y }
  bottom() { return this.top() + this.height() }

  topLeft() { return this.origin }
  topRight() { return this.origin.plus(new Vec2(this.width(), 0)) }

  bottomRight() { return this.origin.plus(this.size) }
  bottomLeft() { return this.origin.plus(new Vec2(0, this.height())) }
}