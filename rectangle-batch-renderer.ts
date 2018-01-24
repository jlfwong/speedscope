import * as regl from 'regl'
import { vec3 } from 'regl'
import { Rect, Vec2, AffineTransform } from './math'
import { Color } from './color'

export class RectangleBatch {
  private rectCapacity = 10
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
  configSpaceToNDC: AffineTransform
  physicalSize: Vec2
  strokeSize: number
  batch: RectangleBatch
}

export class RectangleBatchRenderer {
  private command: regl.Command<RectangleBatchRendererProps>
  constructor(gl: regl.Instance) {
    this.command = gl({
      vert: `
      uniform mat3 configSpaceToNDC;
      uniform vec2 physicalSize;
      uniform float strokeSize;

      // Non-instanced
      attribute float corner;

      // Instanced
      attribute vec2 configSpaceOffset;
      attribute vec2 configSpaceSize;
      attribute vec3 color;
      varying vec3 vColor;

      void main() {
        vColor = color;

        vec2 configSpacePos = configSpaceOffset;
        vec2 physicalSpaceOffset = vec2(0, 0);

        // Corners go NW, NE, SW, SE
        if (corner == 0.0) {
          physicalSpaceOffset = vec2(1, -1);
        } else if (corner == 1.0) {
          physicalSpaceOffset = vec2(-1, -1);
          configSpacePos.x += configSpaceSize.x;
        } else if (corner == 2.0) {
          physicalSpaceOffset = vec2(1, 1);
          configSpacePos.y += configSpaceSize.y;
        } else if (corner == 3.0) {
          physicalSpaceOffset = vec2(-1, 1);
          configSpacePos += configSpaceSize;
        }

        vec2 roundedPosition = (configSpaceToNDC * vec3(configSpacePos, 1)).xy;
        vec2 halfSize = physicalSize / 2.0;
        vec2 physicalPixelSize = 2.0 / physicalSize;
        roundedPosition = floor(roundedPosition * halfSize) / halfSize;
        gl_Position = vec4(roundedPosition + physicalPixelSize * physicalSpaceOffset * strokeSize, 0, 1);
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
        // Non-instanced attributes
        corner: gl.buffer(new Float32Array([0, 1, 2, 3])),

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
        }
      },

      uniforms: {
        configSpaceToNDC: (context, props) => {
          return props.configSpaceToNDC.flatten()
        },
        physicalSize: (context, props) => {
          return props.physicalSize.flatten()
        },
        strokeSize: (context, props) => {
          return props.strokeSize
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
}