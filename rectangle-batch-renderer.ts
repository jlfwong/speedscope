import * as regl from 'regl'
import { Rect, Vec2, AffineTransform } from './math'
import { vec3, ReglCommand, ReglCommandConstructor } from 'regl'
import { getOrInsert } from './utils';

export interface RectangleBatchRendererProps {
  configSpaceToNDC: AffineTransform
  physicalSize: Vec2
}

// TODO(jlfwong): There's a lot of data duplication here.
// This could be optimized a lot by de-duplicating the offsets
// & colors into a texture, then the offset & color could each
// be an index into that texture rather than a vec2/vec3 respectively.
class RectangleBucket {
  private vertexCapacity = 6000
  private vertexCount = 0
  private positions = new Float32Array(this.vertexCapacity * 6 * 2)
  private physicalSpaceOffsets = new Float32Array(this.vertexCapacity * 6 * 2)
  private vertexColors = new Float32Array(this.vertexCapacity * 6 * 3)

  private offset: {
    topLeft: Vec2,
    topRight: Vec2,
    bottomRight: Vec2,
    bottomLeft: Vec2
  }

  constructor(
    readonly regl: ReglCommandConstructor,
    readonly strokeSize: number,
    readonly maxWidth: number,
    readonly minLeft: number,
    readonly maxRight: number
  ) {
    this.offset = {
      topLeft: new Vec2(strokeSize, -strokeSize),
      topRight: new Vec2(-strokeSize, -strokeSize),
      bottomRight: new Vec2(-strokeSize, strokeSize),
      bottomLeft: new Vec2(strokeSize, strokeSize)
    }
  }

  getVertexCount() { return this.vertexCount }

  private addVertex(y: number, x: number, offset: Vec2, color: vec3) {
    const index = this.vertexCount++
    if (index >= this.vertexCapacity) {

      // Not enough capacity, time to resize! We'll quadruple the capacity each time.
      this.vertexCapacity *= 4
      const positions = new Float32Array(this.vertexCapacity * 6 * 2)
      const physicalSpaceOffsets = new Float32Array(this.vertexCapacity * 6 * 2)
      const vertexColors = new Float32Array(this.vertexCapacity * 6 * 3)

      positions.set(this.positions)
      physicalSpaceOffsets.set(this.physicalSpaceOffsets)
      vertexColors.set(this.vertexColors)

      this.positions = positions
      this.physicalSpaceOffsets = physicalSpaceOffsets
      this.vertexColors = vertexColors
    }
    this.positions[index * 2] = x
    this.positions[index * 2 + 1] = y
    this.physicalSpaceOffsets[index * 2] = offset.x
    this.physicalSpaceOffsets[index * 2 + 1] = offset.y
    this.vertexColors[index * 3] = color[0]
    this.vertexColors[index * 3 + 1] = color[1]
    this.vertexColors[index * 3 + 2] = color[2]
  }

  addRect(rect: Rect, color: vec3) {
    const top = rect.top()
    const bottom = rect.bottom()
    const left = rect.left()
    const right = rect.right()

    // 2 disjoint triangles.
    //
    // 0 +--+ 1
    //   | /|
    //   |/ |
    // 3 +--+ 2
    this.addVertex(top, left, this.offset.topLeft, color)
    this.addVertex(bottom, left, this.offset.bottomLeft, color)
    this.addVertex(top, right, this.offset.topRight, color)

    this.addVertex(bottom, left, this.offset.bottomLeft, color)
    this.addVertex(top, right, this.offset.topRight, color)
    this.addVertex(bottom, right, this.offset.bottomRight, color)
  }

  private renderer: ReglCommand<RectangleBatchRendererProps> | null = null
  render(props: RectangleBatchRendererProps): void {
    if (!this.renderer) {
      this.renderer = this.regl<RectangleBatchRendererProps>({
        vert: `
        uniform mat3 configSpaceToNDC;
        uniform vec2 physicalSize;
        attribute vec2 position;
        attribute vec3 color;
        attribute vec2 physicalSpaceOffset;
        varying vec3 vColor;
        void main() {
          vColor = color;
          vec2 roundedPosition = (configSpaceToNDC * vec3(position.xy, 1)).xy;
          vec2 halfSize = physicalSize / 2.0;
          vec2 physicalPixelSize = 2.0 / physicalSize;
          roundedPosition = floor(roundedPosition * halfSize) / halfSize;
          gl_Position = vec4(roundedPosition + physicalPixelSize * physicalSpaceOffset, 0, 1);
        }
      `,

        depth: {
          enable: false
        },

        frag: `
        precision mediump float;
        varying vec3 vColor;
        void main() {
          gl_FragColor = vec4(vColor, 1);
        }
      `,

        attributes: {
          position: {
            buffer: this.regl.buffer(this.positions),
            offset: 0,
            stride: 2 * 4,
            size: 2
          },
          physicalSpaceOffset: {
            buffer: this.regl.buffer(this.physicalSpaceOffsets),
            offset: 0,
            stride: 2 * 4,
            size: 2
          },
          color: {
            buffer: this.regl.buffer(this.vertexColors),
            offset: 0,
            stride: 3 * 4,
            size: 3
          }
        },

        uniforms: {
          configSpaceToNDC: (context, props) => {
            return props.configSpaceToNDC.flatten()
          },
          physicalSize: (context, props) => {
            return props.physicalSize.flatten()
          }
        },

        primitive: 'triangles',

        count: this.vertexCount
      })
    }
    this.renderer(props)
  }
}

export const rectangleBatchRenderer = (
  regl: regl.ReglCommandConstructor,
  configSpaceSize: Vec2,
  rects: Rect[],
  colors: vec3[],
  strokeSize = 1
) => {
  const N_BUCKET_COLUMNS = 16

  function bucketKeyForRect(rect: Rect) {
    const widthBucket = Math.ceil(Math.log2(rect.width()))

    let leftBucket = Math.floor((rect.left() / configSpaceSize.x) * N_BUCKET_COLUMNS)
    if (leftBucket === N_BUCKET_COLUMNS) leftBucket--

    return (widthBucket * N_BUCKET_COLUMNS) + leftBucket
  }

  function createBucket(key: number) {
    const widthBucket = Math.floor(key / N_BUCKET_COLUMNS)
    const leftBucket = key % N_BUCKET_COLUMNS

    const maxWidth = Math.pow(2, widthBucket)
    const minLeft = (leftBucket / N_BUCKET_COLUMNS) * configSpaceSize.x
    const maxRight = ((leftBucket + 1) / N_BUCKET_COLUMNS) * configSpaceSize.x + maxWidth

    return new RectangleBucket(regl, strokeSize, maxWidth, minLeft, maxRight)
  }

  const buckets = new Map<number, RectangleBucket>()
  for (let i = 0; i < rects.length; i++) {
    const rect = rects[i]
    const bucket = getOrInsert(buckets, bucketKeyForRect(rect), createBucket)
    bucket.addRect(rect, colors[i])
  }

  return (props: RectangleBatchRendererProps) => {
    const singlePixelNDCSize = new Vec2(
      2.0 / props.physicalSize.x,
      2.0 / props.physicalSize.y
    )
    const singlePixelConfigSize = props.configSpaceToNDC.inverseTransformVector(singlePixelNDCSize)
    if (!singlePixelConfigSize) return
    const singlePixelConfigWidth = singlePixelConfigSize.x

    for (let bucket of buckets.values()) {
      if (bucket.maxWidth < (2 * strokeSize + 1) * singlePixelConfigWidth) {
        // Every rectangle in the bucket is so small that if we tried to render
        // it, we wouldn't have
        continue
      }
      if (props.configSpaceToNDC.transformPosition(new Vec2(bucket.minLeft, 0)).x > 1) {
        // Entire bucket is outside the viewport bounds to the right
        continue
      }
      if (props.configSpaceToNDC.transformPosition(new Vec2(bucket.maxRight, 0)).x < -1) {
        // Entire bucket is outside the viewport bounds to the left
        continue
      }
      bucket.render(props)
    }
  }
}