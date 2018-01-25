import * as regl from 'regl'
import { AffineTransform, Rect } from './math'

export interface ViewportRectangleRendererProps {
  configSpaceToPhysicalViewSpace: AffineTransform
  configSpaceViewportRect: Rect
}

export class ViewportRectangleRenderer {
  private command: regl.Command<ViewportRectangleRendererProps>
  constructor(regl: regl.Instance) {
    this.command = regl<ViewportRectangleRendererProps>({
      vert: `
        attribute vec2 position;

        void main() {
          gl_Position = vec4(position, 0, 1);
        }
      `,

      frag: `
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
      `,

      blend: {
        enable: true,
        func: {
          srcRGB: 'src alpha',
          srcAlpha: 'one',
          dstRGB: 'one minus src alpha',
          dstAlpha: 'one'
        }
      },

      depth: {
        enable: false
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
        position: [
          [-1, 1],
          [1, 1],
          [-1, -1],
          [1, -1]
        ]
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
        }
      },

      primitive: 'triangle strip',

      count: 4
    })
  }

  render(props: ViewportRectangleRendererProps) {
    this.command(props)
  }

  resetStats() { return Object.assign(this.command.stats, { cpuTime: 0, gpuTime: 0, count: 0 }) }
  stats() { return this.command.stats }
}