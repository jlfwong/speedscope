import {Rect, Vec2, AffineTransform} from '../lib/math'
import {Color} from '../lib/color'
import {Graphics} from './graphics'
import {setUniformAffineTransform} from './utils'

const vertexFormat = new Graphics.VertexFormat()
vertexFormat.add('corner', Graphics.AttributeType.FLOAT, 2)
vertexFormat.add('configSpaceBounds', Graphics.AttributeType.FLOAT, 4)
vertexFormat.add('color', Graphics.AttributeType.FLOAT, 3)

const vert = `
  uniform mat3 configSpaceToNDC;

  attribute vec2 corner;
  attribute vec4 configSpaceBounds;
  attribute vec3 color;

  varying vec3 vColor;

  void main() {
    vColor = color;
    vec2 configSpacePos = configSpaceBounds.xy + corner * configSpaceBounds.zw;
    vec2 position = (configSpaceToNDC * vec3(configSpacePos, 1)).xy;
    gl_Position = vec4(position, 1, 1);
  }
`

const frag = `
  precision mediump float;
  varying vec3 vColor;

  void main() {
    gl_FragColor = vec4(vColor.rgb, 1);
  }
`

export class RectangleBatch {
  private rects: Rect[] = []
  private colors: Color[] = []
  constructor(private gl: Graphics.Context) {}

  getRectCount() {
    return this.rects.length
  }

  private buffer: Graphics.VertexBuffer | null = null
  getBuffer(): Graphics.VertexBuffer {
    if (this.buffer) {
      return this.buffer
    }

    const corners = [[0, 0], [1, 0], [0, 1], [1, 1]]

    const floats = new Float32Array(vertexFormat.stride * 4 * this.rects.length)
    let idx = 0

    for (let i = 0; i < this.rects.length; i++) {
      const rect = this.rects[i]
      const color = this.colors[i]

      // TODO(jlfwong): In the conversion from regl to graphics.ts, I lost the
      // ability to do instanced drawing. This is a pretty significant hit to
      // the performance here since I need 4x the memory to allocate these
      // things. Adding instanced drawing to graphics.ts is non-trivial, so I'm
      // just going to try this for now.
      for (let j = 0; j < 4; j++) {
        floats[idx++] = corners[j][0]
        floats[idx++] = corners[j][1]

        floats[idx++] = rect.origin.x
        floats[idx++] = rect.origin.y
        floats[idx++] = rect.size.x
        floats[idx++] = rect.size.x

        floats[idx++] = color.r
        floats[idx++] = color.g
        floats[idx++] = color.b
      }
    }

    const bytes = new Uint8Array(floats.buffer)
    this.buffer = this.gl.createVertexBuffer(bytes.length)
    this.buffer.upload(bytes)
    return this.buffer
  }

  addRect(rect: Rect, color: Color) {
    this.rects.push(rect)
    this.colors.push(color)

    if (this.buffer) {
      this.buffer.free()
      this.buffer = null
    }
  }

  free() {
    if (this.buffer) {
      this.buffer.free()
      this.buffer = null
    }
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
  material: Graphics.Material
  constructor(private gl: Graphics.Context) {
    this.material = gl.createMaterial(vertexFormat, vert, frag)
  }

  render(props: RectangleBatchRendererProps) {
    setUniformAffineTransform(
      this.material,
      'configSpaceToNDC',
      (() => {
        const configToPhysical = AffineTransform.betweenRects(
          props.configSpaceSrcRect,
          props.physicalSpaceDstRect,
        )

        const viewportSize = new Vec2(this.gl.renderTargetWidth, this.gl.renderTargetHeight)
        const physicalToNDC = AffineTransform.withTranslation(new Vec2(-1, 1)).times(
          AffineTransform.withScale(new Vec2(2, -2).dividedByPointwise(viewportSize)),
        )

        return physicalToNDC.times(configToPhysical)
      })(),
    )

    this.gl.draw(Graphics.Primitive.TRIANGLE_STRIP, this.material, props.batch.getBuffer())
  }
}
