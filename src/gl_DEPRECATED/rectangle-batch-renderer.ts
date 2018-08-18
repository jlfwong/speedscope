import regl from 'regl'
import {Rect, Vec2, AffineTransform} from '../lib/math'
import {Color} from '../lib/color'

export class RectangleBatch {
  private rectCapacity = 1000
  private rectCount = 0

  private configSpaceOffsets = new Float32Array(this.rectCapacity * 2)
  private configSpaceSizes = new Float32Array(this.rectCapacity * 2)
  private colors = new Float32Array(this.rectCapacity * 3)

  constructor(private gl: regl.Instance) {}

  getRectCount() {
    return this.rectCount
  }

  private configSpaceOffsetBuffer: regl.Buffer | null = null
  getConfigSpaceOffsetBuffer() {
    if (!this.configSpaceOffsetBuffer)
      this.configSpaceOffsetBuffer = this.gl.buffer(this.configSpaceOffsets)
    return this.configSpaceOffsetBuffer
  }

  private configSpaceSizeBuffer: regl.Buffer | null = null
  getConfigSpaceSizeBuffer() {
    if (!this.configSpaceSizeBuffer)
      this.configSpaceSizeBuffer = this.gl.buffer(this.configSpaceSizes)
    return this.configSpaceSizeBuffer
  }

  private colorBuffer: regl.Buffer | null = null
  getColorBuffer() {
    if (!this.colorBuffer) this.colorBuffer = this.gl.buffer(this.colors)
    return this.colorBuffer
  }

  uploadToGPU() {
    this.getConfigSpaceOffsetBuffer()
    this.getConfigSpaceSizeBuffer()
    this.getColorBuffer()
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

const vert = `
  uniform mat3 configSpaceToNDC;

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
    vec2 configSpacePos = configSpaceOffset + corner * configSpaceSize;
    vec2 position = (configSpaceToNDC * vec3(configSpacePos, 1)).xy;
    gl_Position = vec4(position, 1, 1);
  }
`

const frag = `
  precision mediump float;
  varying vec3 vColor;
  varying float vParity;

  void main() {
    gl_FragColor = vec4(vColor.rgb, 1);
  }
`

export class RectangleBatchRenderer {
  private command: regl.Command<RectangleBatchRendererProps>
  constructor(gl: regl.Instance) {
    // We draw the parity / 5 into the depth channel so it can be used in a
    // post-processing step to draw boundaries between rectangles. We use 5
    // different values (2 per row) + one for the background, so we can
    // distingish both between adjacent rectangles on a row and between rows!
    this.command = gl({
      vert,
      frag,

      depth: {
        enable: false,
      },

      attributes: {
        // Non-instanced attributes
        corner: gl.buffer([[0, 0], [1, 0], [0, 1], [1, 1]]),

        // Instanced attributes
        configSpaceOffset: (context, props) => {
          return {
            buffer: props.batch.getConfigSpaceOffsetBuffer(),
            offset: 0,
            stride: 2 * 4,
            size: 2,
            divisor: 1,
          }
        },
        configSpaceSize: (context, props) => {
          return {
            buffer: props.batch.getConfigSpaceSizeBuffer(),
            offset: 0,
            stride: 2 * 4,
            size: 2,
            divisor: 1,
          }
        },
        color: (context, props) => {
          return {
            buffer: props.batch.getColorBuffer(),
            offset: 0,
            stride: 3 * 4,
            size: 3,
            divisor: 1,
          }
        },
      },

      uniforms: {
        configSpaceToNDC: (context, props) => {
          const configToPhysical = AffineTransform.betweenRects(
            props.configSpaceSrcRect,
            props.physicalSpaceDstRect,
          )

          const viewportSize = new Vec2(context.viewportWidth, context.viewportHeight)

          const physicalToNDC = AffineTransform.withTranslation(new Vec2(-1, 1)).times(
            AffineTransform.withScale(new Vec2(2, -2).dividedByPointwise(viewportSize)),
          )

          return physicalToNDC.times(configToPhysical).flatten()
        },

        parityOffset: (context, props) => {
          return props.parityOffset == null ? 0 : props.parityOffset
        },

        parityMin: (context, props) => {
          return props.parityMin == null ? 0 : 1 + props.parityMin
        },
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

  resetStats() {
    return Object.assign(this.command.stats, {cpuTime: 0, gpuTime: 0, count: 0})
  }
  stats() {
    return this.command.stats
  }
}
