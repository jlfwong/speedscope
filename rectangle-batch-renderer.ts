import * as regl from 'regl'
import { vec3 } from 'regl'
import { Rect, Vec2, AffineTransform } from './math'
import { Color } from './color'

export class RectangleBatch {
  private vertexCapacity = 60
  private vertexCount = 0
  private positions = new Float32Array(this.vertexCapacity * 2)
  private physicalSpaceOffsets = new Float32Array(this.vertexCapacity * 2)
  private vertexColors = new Float32Array(this.vertexCapacity * 3)

  private offset = {
    topLeft: new Vec2(1, -1),
    topRight: new Vec2(-1, -1),
    bottomRight: new Vec2(-1, 1),
    bottomLeft: new Vec2(1, 1)
  }
  constructor(private gl: regl.Instance) { }

  getVertexCount() { return this.vertexCount }

  private positionBuffer: regl.Buffer | null = null
  getPositionBuffer() {
    if (!this.positionBuffer) this.positionBuffer = this.gl.buffer(this.positions)
    return this.positionBuffer
  }

  private offsetBuffer: any = null
  getPhysicalSpaceOffsetBuffer() {
    if (!this.offsetBuffer) this.offsetBuffer = this.gl.buffer(this.physicalSpaceOffsets)
    return this.offsetBuffer
  }

  private colorBuffer: any = null
  getVertexColorBuffer() {
    if (!this.colorBuffer) this.colorBuffer = this.gl.buffer(this.vertexColors)
    return this.colorBuffer
  }

  uploadToGPU() {
    this.getPositionBuffer()
    this.getPhysicalSpaceOffsetBuffer()
    this.getVertexColorBuffer()
  }

  private addVertex(y: number, x: number, offset: Vec2, color: vec3) {
    const index = this.vertexCount++
    if (index >= this.vertexCapacity) {
      // Not enough capacity, time to resize! We'll double the capacity each time.
      this.vertexCapacity *= 2
      const positions = new Float32Array(this.vertexCapacity * 2)
      const physicalSpaceOffsets = new Float32Array(this.vertexCapacity * 2)
      const vertexColors = new Float32Array(this.vertexCapacity * 3)

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

  addRect(rect: Rect, color: Color) {
    const color_: vec3 = [color.r, color.g, color.b]

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
    this.addVertex(top, left, this.offset.topLeft, color_)
    this.addVertex(bottom, left, this.offset.bottomLeft, color_)
    this.addVertex(top, right, this.offset.topRight, color_)

    this.addVertex(bottom, left, this.offset.bottomLeft, color_)
    this.addVertex(top, right, this.offset.topRight, color_)
    this.addVertex(bottom, right, this.offset.bottomRight, color_)
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
        position: (context, props) => {
          return {
            buffer: props.batch.getPositionBuffer(),
            offset: 0,
            stride: 2 * 4,
            size: 2
          }
        },
        physicalSpaceOffset: (context, props) => {
          return {
            buffer: props.batch.getPhysicalSpaceOffsetBuffer(),
            offset: 0,
            stride: 2 * 4,
            size: 2
          }
        },
        color: (context, props) => {
          return {
            buffer: props.batch.getVertexColorBuffer(),
            offset: 0,
            stride: 3 * 4,
            size: 3
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

      primitive: 'triangles',

      count: (context, props) => {
        return props.batch.getVertexCount()
      }
    })
  }

  render(props: RectangleBatchRendererProps) {
    this.command(props)
  }
}