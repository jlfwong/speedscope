import regl from 'regl'
import {Vec2, Rect, AffineTransform} from './math'

export interface FlamechartColorPassRenderProps {
  rectInfoTexture: regl.Texture
  renderOutlines: boolean
  srcRect: Rect
  dstRect: Rect
}
export class FlamechartColorPassRenderer {
  private command: regl.Command<FlamechartColorPassRenderProps>
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
        uniform float renderOutlines;

        varying vec2 vUv;
        uniform sampler2D colorTexture;

        // https://en.wikipedia.org/wiki/HSL_and_HSV#From_luma/chroma/hue
        vec3 hcl2rgb(float H, float C, float L) {
          float hPrime = H / 60.0;
          float X = C * (1.0 - abs(mod(hPrime, 2.0) - 1.0));
          vec3 RGB =
            hPrime < 1.0 ? vec3(C, X, 0) :
            hPrime < 2.0 ? vec3(X, C, 0) :
            hPrime < 3.0 ? vec3(0, C, X) :
            hPrime < 4.0 ? vec3(0, X, C) :
            hPrime < 5.0 ? vec3(X, 0, C) :
            vec3(C, 0, X);

          float m = L - dot(RGB, vec3(0.30, 0.59, 0.11));
          return RGB + vec3(m, m, m);
        }

        float triangle(float x) {
          return 2.0 * abs(fract(x) - 0.5) - 1.0;
        }

        vec3 colorForBucket(float t) {
          float x = triangle(30.0 * t);
          float H = 360.0 * (0.9 * t);
          float C = 0.25 + 0.2 * x;
          float L = 0.80 - 0.15 * x;
          return hcl2rgb(H, C, L);
        }

        void main() {
          vec4 here = texture2D(colorTexture, vUv);

          if (here.z == 0.0) {
            // Background color
            gl_FragColor = vec4(0, 0, 0, 0);
            return;
          }

          // Sample the 4 surrounding pixels in the depth texture to determine
          // if we should draw a boundary here or not.
          vec4 N = texture2D(colorTexture, vUv + vec2(0, uvSpacePixelSize.y));
          vec4 E = texture2D(colorTexture, vUv + vec2(uvSpacePixelSize.x, 0));
          vec4 S = texture2D(colorTexture, vUv + vec2(0, -uvSpacePixelSize.y));
          vec4 W = texture2D(colorTexture, vUv + vec2(-uvSpacePixelSize.x, 0));

          // NOTE: For outline checks, we intentionally check both the right
          // and the left to determine if we're an edge. If a rectangle is a single
          // pixel wide, we don't want to render it as an outline, so this method
          // of checking ensures that we don't outline single physical-space
          // pixel width rectangles.
          if (
            renderOutlines > 0.0 &&
            (
              here.y == N.y && here.y != S.y || // Top edge
              here.y == S.y && here.y != N.y || // Bottom edge
              here.x == E.x && here.x != W.x || // Left edge
              here.x == W.x && here.x != E.x
            )
          ) {
            // We're on an edge! Draw transparent.
            gl_FragColor = vec4(0, 0, 0, 0);
          } else {
            // Not on an edge. Draw the appropriate color;
            gl_FragColor = vec4(colorForBucket(here.z), here.a);
          }
        }
      `,

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
        position: gl.buffer([[-1, 1], [1, 1], [-1, -1], [1, -1]]),
        uv: gl.buffer([[0, 1], [1, 1], [0, 0], [1, 0]]),
      },

      count: 4,

      primitive: 'triangle strip',

      uniforms: {
        colorTexture: (context, props) => props.rectInfoTexture,
        uvTransform: (context, props) => {
          const {srcRect, rectInfoTexture} = props
          const physicalToUV = AffineTransform.withTranslation(new Vec2(0, 1))
            .times(AffineTransform.withScale(new Vec2(1, -1)))
            .times(
              AffineTransform.betweenRects(
                new Rect(Vec2.zero, new Vec2(rectInfoTexture.width, rectInfoTexture.height)),
                Rect.unit,
              ),
            )
          const uvRect = physicalToUV.transformRect(srcRect)
          return AffineTransform.betweenRects(Rect.unit, uvRect).flatten()
        },
        renderOutlines: (context, props) => {
          return props.renderOutlines ? 1.0 : 0.0
        },
        uvSpacePixelSize: (context, props) => {
          return Vec2.unit
            .dividedByPointwise(new Vec2(props.rectInfoTexture.width, props.rectInfoTexture.height))
            .flatten()
        },
        positionTransform: (context, props) => {
          const {dstRect} = props
          const viewportSize = new Vec2(context.viewportWidth, context.viewportHeight)

          const physicalToNDC = AffineTransform.withScale(new Vec2(1, -1)).times(
            AffineTransform.betweenRects(new Rect(Vec2.zero, viewportSize), Rect.NDC),
          )
          const ndcRect = physicalToNDC.transformRect(dstRect)
          return AffineTransform.betweenRects(Rect.NDC, ndcRect).flatten()
        },
      },
    })
  }

  render(props: FlamechartColorPassRenderProps) {
    this.command(props)
  }
}
