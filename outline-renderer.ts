import * as regl from 'regl'
import { Vec2, Rect, AffineTransform } from './math'

export class OutlineRendererProps {
  colorTexture: regl.Texture
  depthTexture: regl.Texture
  srcRect: Rect
  dstRect: Rect
}
export class OutlineRenderer {
  private command: regl.Command<OutlineRendererProps>
  constructor(gl: regl.Instance) {
    this.command = gl({
      vert: `
        uniform mat3 uvTransform;
        uniform mat3 positionTransform;

        attribute vec2 position;
        attribute vec2 uv;
        varying vec2 vUv;

        void main() {
          vUv = (uvTransform * vec3(uv, 1)).xy;
          gl_Position = vec4((positionTransform * vec3(position, 1)).xy, 0, 1);
        }
      `,

      frag: `
        precision mediump float;

        uniform vec2 uvSpacePixelSize;

        varying vec2 vUv;
        uniform sampler2D colorTexture;
        uniform sampler2D depthTexture;

        void main() {
          // Sample the 4 surrounding pixels in the depth texture to determine
          // if we should draw a boundary here or not.
          float N = texture2D(depthTexture, vUv + vec2(0, uvSpacePixelSize.y)).r;
          float E = texture2D(depthTexture, vUv + vec2(uvSpacePixelSize.x, 0)).r;
          float S = texture2D(depthTexture, vUv + vec2(0, -uvSpacePixelSize.y)).r;
          float W = texture2D(depthTexture, vUv + vec2(-uvSpacePixelSize.x, 0)).r;
          float here = texture2D(depthTexture, vUv).x;

          if (
            here == N && here != S || // Top edge
            here == S && here != N || // Bottom edge
            here == E && here != W || // Left edge
            here == W && here != E
          ) {
            // We're on an edge! Draw white.
            gl_FragColor = vec4(1, 1, 1, 1);
          } else {
            gl_FragColor = texture2D(colorTexture, vUv);
          }
        }
      `,

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
        position: gl.buffer([
          [-1, 1],
          [1, 1],
          [-1, -1],
          [1, -1]
        ]),
        uv: gl.buffer([
          [0, 1],
          [1, 1],
          [0, 0],
          [1, 0]
        ])
      },

      count: 4,

      primitive: 'triangle strip',

      uniforms: {
        colorTexture: (context, props) => props.colorTexture,
        depthTexture: (context, props) => props.depthTexture,
        uvTransform: (context, props) => {
          const { srcRect, colorTexture } = props
          const physicalToUV = AffineTransform.withTranslation(new Vec2(0, 1))
            .times(AffineTransform.withScale(new Vec2(1, -1)))
            .times(AffineTransform.betweenRects(
                new Rect(Vec2.zero, new Vec2(colorTexture.width, colorTexture.height)),
                Rect.unit
            ))
          const uvRect = physicalToUV.transformRect(srcRect)
          return AffineTransform.betweenRects(
            Rect.unit,
            uvRect,
          ).flatten()
        },
        uvSpacePixelSize: (context, props) => {
          return Vec2.unit.dividedByPointwise(new Vec2(props.colorTexture.width, props.colorTexture.height)).flatten()
        },
        positionTransform: (context, props) => {
          const { dstRect } = props
          const viewportSize = new Vec2(context.viewportWidth, context.viewportHeight)

          const physicalToNDC = AffineTransform.withScale(new Vec2(1, -1))
            .times(AffineTransform.betweenRects(
              new Rect(Vec2.zero, viewportSize),
              Rect.NDC)
            )
          const ndcRect = physicalToNDC.transformRect(dstRect)
          return AffineTransform.betweenRects(Rect.NDC, ndcRect).flatten()
        }
      },
    })
  }

  render(props: OutlineRendererProps) {
    this.command(props)
  }
}
