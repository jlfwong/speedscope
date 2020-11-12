import {Color} from '../lib/color'
import {AffineTransform, Rect} from '../lib/math'
import {Theme} from '../views/themes/theme'
import {Graphics} from './graphics'
import {setUniformAffineTransform, setUniformVec2} from './utils'

export interface ViewportRectangleRendererProps {
  configSpaceToPhysicalViewSpace: AffineTransform
  configSpaceViewportRect: Rect
}

const vertexFormat = new Graphics.VertexFormat()
vertexFormat.add('position', Graphics.AttributeType.FLOAT, 2)

const vert = `
  attribute vec2 position;

  void main() {
    gl_Position = vec4(position, 0, 1);
  }
`

const frag = (theme: Theme) => {
  const {r, g, b} = Color.fromCSSHex(theme.fgSecondaryColor)
  const rgb = `${r.toFixed(1)}, ${g.toFixed(1)}, ${b.toFixed(1)}`
  return `
    precision mediump float;

    uniform mat3 configSpaceToPhysicalViewSpace;
    uniform vec2 physicalSize;
    uniform vec2 physicalOrigin;
    uniform vec2 configSpaceViewportOrigin;
    uniform vec2 configSpaceViewportSize;
    uniform float framebufferHeight;

    void main() {
      vec2 origin = (configSpaceToPhysicalViewSpace * vec3(configSpaceViewportOrigin, 1.0)).xy;
      vec2 size = (configSpaceToPhysicalViewSpace * vec3(configSpaceViewportSize, 0.0)).xy;

      vec2 halfSize = physicalSize / 2.0;

      float borderWidth = 2.0;

      origin = floor(origin * halfSize) / halfSize + borderWidth * vec2(1.0, 1.0);
      size = floor(size * halfSize) / halfSize - 2.0 * borderWidth * vec2(1.0, 1.0);

      vec2 coord = gl_FragCoord.xy;
      coord.x = coord.x - physicalOrigin.x;
      coord.y = framebufferHeight - coord.y - physicalOrigin.y;
      vec2 clamped = clamp(coord, origin, origin + size);
      vec2 gap = clamped - coord;
      float maxdist = max(abs(gap.x), abs(gap.y));

      // TOOD(jlfwong): Could probably optimize this to use mix somehow.
      if (maxdist == 0.0) {
        // Inside viewport rectangle
        gl_FragColor = vec4(0, 0, 0, 0);
      } else if (maxdist < borderWidth) {
        // Inside viewport rectangle at border
        gl_FragColor = vec4(${rgb}, 0.8);
      } else {
        // Outside viewport rectangle
        gl_FragColor = vec4(${rgb}, 0.5);
      }
    }
  `
}

export class ViewportRectangleRenderer {
  private material: Graphics.Material
  private buffer: Graphics.VertexBuffer

  constructor(private gl: Graphics.Context, theme: Theme) {
    const vertices = [
      [-1, 1],
      [1, 1],
      [-1, -1],
      [1, -1],
    ]
    const floats: number[] = []
    for (let v of vertices) {
      floats.push(v[0])
      floats.push(v[1])
    }
    this.buffer = gl.createVertexBuffer(vertexFormat.stride * vertices.length)
    this.buffer.upload(new Uint8Array(new Float32Array(floats).buffer))
    this.material = gl.createMaterial(vertexFormat, vert, frag(theme))
  }

  render(props: ViewportRectangleRendererProps) {
    setUniformAffineTransform(
      this.material,
      'configSpaceToPhysicalViewSpace',
      props.configSpaceToPhysicalViewSpace,
    )

    // TODO(jlfwong): Pack these into a Vec4 instead
    setUniformVec2(this.material, 'configSpaceViewportOrigin', props.configSpaceViewportRect.origin)
    setUniformVec2(this.material, 'configSpaceViewportSize', props.configSpaceViewportRect.size)
    // TODO(jlfwong): Pack these into a Vec4 instead

    const viewport = this.gl.viewport
    this.material.setUniformVec2('physicalOrigin', viewport.x, viewport.y)
    this.material.setUniformVec2('physicalSize', viewport.width, viewport.height)

    this.material.setUniformFloat('framebufferHeight', this.gl.renderTargetHeightInPixels)

    this.gl.setBlendState(
      Graphics.BlendOperation.SOURCE_ALPHA,
      Graphics.BlendOperation.INVERSE_SOURCE_ALPHA,
    )
    this.gl.draw(Graphics.Primitive.TRIANGLE_STRIP, this.material, this.buffer)
  }
}
