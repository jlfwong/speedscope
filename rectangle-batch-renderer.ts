import * as regl from 'regl'
import { Rect, Vec2, AffineTransform } from './math'
import { Color } from './color'

export class RectangleBatch {
  private rectCapacity = 1000
  private rectCount = 0

  private configSpaceOffsets = new Float32Array(this.rectCapacity * 2)
  private configSpaceSizes = new Float32Array(this.rectCapacity * 2)
  private colors = new Float32Array(this.rectCapacity * 3)

  constructor(private gl: regl.Instance) { }

  getRectCount() { return this.rectCount }

  private configSpaceOffsetBuffer: regl.Buffer | null = null
  getConfigSpaceOffsetBuffer() {
    if (!this.configSpaceOffsetBuffer) this.configSpaceOffsetBuffer = this.gl.buffer(this.configSpaceOffsets)
    return this.configSpaceOffsetBuffer
  }

  private configSpaceSizeBuffer: regl.Buffer | null = null
  getConfigSpaceSizeBuffer() {
    if (!this.configSpaceSizeBuffer) this.configSpaceSizeBuffer = this.gl.buffer(this.configSpaceSizes)
    return this.configSpaceSizeBuffer
  }

  private colorBuffer: regl.Buffer | null = null
  getColorBuffer() {
    if (!this.colorBuffer) this.colorBuffer = this.gl.buffer(this.colors)
    return this.colorBuffer
  }

  private indexBuffer: regl.Buffer | null = null
  getIndexBuffer() {
    if (!this.indexBuffer) {
      const indices = new Float32Array(this.rectCount)
      for (let i = 0; i < this.rectCount; i++) indices[i] = i
      this.indexBuffer = this.gl.buffer(indices)
    }
    return this.indexBuffer
  }

  uploadToGPU() {
    this.getConfigSpaceOffsetBuffer()
    this.getConfigSpaceSizeBuffer()
    this.getColorBuffer()
    this.getIndexBuffer()
  }

  addRect(rect: Rect, color: Color) {
    const index = this.rectCount++
    if (index >= this.rectCapacity) {
      // Not enough capacity, time to resize! We'll double the capacity each time.
      this.rectCapacity *= 2
      const configSpaceOffsets = new Float32Array(this.rectCapacity * 2)
      const configSpaceSizes = new Float32Array(this.rectCapacity * 2)
      const colors = new Float32Array(this.rectCapacity * 3)

      configSpaceOffsets.set(this.configSpaceOffsets)
      configSpaceSizes.set(this.configSpaceSizes)
      colors.set(this.colors)

      this.configSpaceOffsets = configSpaceOffsets
      this.configSpaceSizes = configSpaceSizes
      this.colors = colors
    }
    this.configSpaceOffsets[index * 2] = rect.origin.x
    this.configSpaceOffsets[index * 2 + 1] = rect.origin.y

    this.configSpaceSizes[index * 2] = rect.size.x
    this.configSpaceSizes[index * 2 + 1] = rect.size.y

    this.colors[index * 3] = color.r
    this.colors[index * 3 + 1] = color.g
    this.colors[index * 3 + 2] = color.b
  }
}

export interface RectangleBatchRendererProps {
  batch: RectangleBatch
  configSpaceSrcRect: Rect
  physicalSpaceDstRect: Rect
  parityMin?: number
  parityOffset?: number
}

export class RectangleBatchRenderer {
  private command: regl.Command<RectangleBatchRendererProps>
  constructor(gl: regl.Instance) {
    // We draw the parity / 4 into the depth channel so it
    // can be used in a post-processing step to draw boundaries
    // between rectangles. We use 4 different values (2 per row)
    // so we can distingish both between adjacent rectangles on a row
    // and between rows!
    this.command = gl({
      vert: `
      uniform mat3 configSpaceToNDC;
      uniform float parityMin;
      uniform float parityOffset;

      // Non-instanced
      attribute vec2 corner;

      // Instanced
      attribute vec2 configSpaceOffset;
      attribute vec2 configSpaceSize;
      attribute vec3 color;
      attribute float index;

      varying vec3 vColor;

      void main() {
        vColor = color;
        float depth = parityMin + mod(parityOffset + index, 2.0);
        vec2 configSpacePos = configSpaceOffset + corner * configSpaceSize;
        vec2 position = (configSpaceToNDC * vec3(configSpacePos, 1)).xy;
        gl_Position = vec4(position, depth / 4.0, 1);
      }
    `,

    depth: {
      enable: false
    },

    frag: `
      precision mediump float;
      varying vec3 vColor;
      varying float vParity;
      void main() {
        gl_FragColor = vec4(vColor, 1);
      }
    `,

      attributes: {
        // Non-instanced attributes
        corner: gl.buffer([
          [0, 0],
          [1, 0],
          [0, 1],
          [1, 1],
        ]),

        // Instanced attributes
        configSpaceOffset: (context, props) => {
          return {
            buffer: props.batch.getConfigSpaceOffsetBuffer(),
            offset: 0,
            stride: 2 * 4,
            size: 2,
            divisor: 1
          }
        },
        configSpaceSize: (context, props) => {
          return {
            buffer: props.batch.getConfigSpaceSizeBuffer(),
            offset: 0,
            stride: 2 * 4,
            size: 2,
            divisor: 1
          }
        },
        color: (context, props) => {
          return {
            buffer: props.batch.getColorBuffer(),
            offset: 0,
            stride: 3 * 4,
            size: 3,
            divisor: 1
          }
        },
        index: (context, props) => {
          return {
            buffer: props.batch.getIndexBuffer(),
            offset: 0,
            stride: 4,
            size: 1,
            divisor: 1
          }
        }
      },

      uniforms: {
        configSpaceToNDC: (context, props) => {
          const configToPhysical = AffineTransform.betweenRects(
            props.configSpaceSrcRect,
            props.physicalSpaceDstRect
          )

          const viewportSize = new Vec2(context.viewportWidth, context.viewportHeight)

          const physicalToNDC = AffineTransform.withTranslation(new Vec2(-1, 1))
            .times(AffineTransform.withScale(new Vec2(2, -2).dividedByPointwise(viewportSize)))

          return physicalToNDC.times(configToPhysical).flatten()
        },

        parityOffset: (context, props) => {
          return props.parityOffset || 0
        },

        parityMin: (context, props) => {
          return props.parityMin || 0
        }
      },

      instances: (context, props) => {
        return props.batch.getRectCount()
      },

      count: 4,

      primitive: 'triangle strip',
    })
  }

  render(props: RectangleBatchRendererProps) {
    this.command(props)
  }

  resetStats() { return Object.assign(this.command.stats, { cpuTime: 0, gpuTime: 0, count: 0 }) }
  stats() { return this.command.stats }
}