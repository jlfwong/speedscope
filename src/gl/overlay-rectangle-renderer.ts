import regl from 'regl'
import {AffineTransform, Rect} from '../lib/math'
import {Graphics} from './graphics'
import {setUniformAffineTransform, setUniformVec2} from './canvas-context'

export interface ViewportRectangleRendererProps {
  configSpaceToPhysicalViewSpace: AffineTransform
  configSpaceViewportRect: Rect
}

const vert = `
  attribute vec2 position;

  void main() {
    gl_Position = vec4(position, 0, 1);
  }
`

const frag = `
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
      gl_FragColor = vec4(0.7, 0.7, 0.7, 0.8);
    } else {
      // Outside viewport rectangle
      gl_FragColor = vec4(0.7, 0.7, 0.7, 0.5);
    }
  }
`

export class Sky_ViewportRectangleRenderer {
  private material: Graphics.Material
  private buffer: Graphics.VertexBuffer

  constructor(private gl: Graphics.Context) {
    const vertexFormat = new Graphics.VertexFormat()
    vertexFormat.add('position', Graphics.AttributeType.FLOAT, 2)

    const vertices = [[-1, 1], [1, 1], [-1, -1], [1, -1]]
    const floats: number[] = []
    for (let v of vertices) {
      floats.push(v[0])
      floats.push(v[1])
    }
    this.buffer = gl.createVertexBuffer(vertexFormat.stride * vertices.length)
    this.buffer.upload(new Uint8Array(new Float32Array(floats).buffer))
    this.material = gl.createMaterial(vertexFormat, vert, frag)
  }

  render(props: ViewportRectangleRendererProps) {
    setUniformAffineTransform(
      this.material,
      'configSpaceToPhysicalViewSpace',
      props.configSpaceToPhysicalViewSpace,
    )
    // TODO(jlfwong): Pack these into a Vec4 instead
    setUniformVec2(this.material, 'configSpaceViewportOrigin', props.configSpaceViewportRect.origin)
    setUniformVec2(this.material, 'configSpaceViewportSize', props.configSpaceViewportRect.origin)
    this.material.setUniformVec2('physicalSize', this.gl.viewport.width, this.gl.viewport.height)
    this.material.setUniformVec2('physicalOrigin', this.gl.viewport.x, this.gl.viewport.y)
    this.material.setUniformFloat('framebufferHeight', this.gl.renderTargetHeight)

    this.gl.setBlendState(
      Graphics.BlendOperation.SOURCE_ALPHA,
      Graphics.BlendOperation.INVERSE_SOURCE_ALPHA,
    )
    this.gl.draw(Graphics.Primitive.TRIANGLE_STRIP, this.material, this.buffer)
    this.gl.setCopyBlendState()
  }
}

export class ViewportRectangleRenderer {
  private command: regl.Command<ViewportRectangleRendererProps>
  constructor(regl: regl.Instance) {
    this.command = regl<ViewportRectangleRendererProps>({
      vert,
      frag,

      blend: {
        enable: true,
        func: {
          srcRGB: 'src alpha',
          srcAlpha: 'one',
          dstRGB: 'one minus src alpha',
          dstAlpha: 'one',
        },
      },

      depth: {
        enable: false,
      },

      attributes: {
        // Cover full canvas with a rectangle
        // with 2 triangles using a triangle
        // strip.
        //
        // 0 +--+ 1
        //   | /|
        //   |/ |
        // 2 +--+ 3
        position: [[-1, 1], [1, 1], [-1, -1], [1, -1]],
      },

      uniforms: {
        configSpaceToPhysicalViewSpace: (context, props) => {
          return props.configSpaceToPhysicalViewSpace.flatten()
        },
        configSpaceViewportOrigin: (context, props) => {
          return props.configSpaceViewportRect.origin.flatten()
        },
        configSpaceViewportSize: (context, props) => {
          return props.configSpaceViewportRect.size.flatten()
        },
        physicalSize: (context, props) => {
          return [context.viewportWidth, context.viewportHeight]
        },
        physicalOrigin: (context, props) => {
          return [context.viewportX, context.viewportY]
        },
        framebufferHeight: (context, props) => {
          return context.framebufferHeight
        },
      },

      primitive: 'triangle strip',

      count: 4,
    })
  }

  render(props: ViewportRectangleRendererProps) {
    this.command(props)
  }

  resetStats() {
    return Object.assign(this.command.stats, {cpuTime: 0, gpuTime: 0, count: 0})
  }
  stats() {
    return this.command.stats
  }
}
