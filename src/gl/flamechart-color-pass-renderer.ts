import {Vec2, Rect, AffineTransform} from '../lib/math'
import {Theme} from '../views/themes/theme'
import {Graphics} from './graphics'
import {setUniformAffineTransform} from './utils'

const vertexFormat = new Graphics.VertexFormat()
vertexFormat.add('position', Graphics.AttributeType.FLOAT, 2)
vertexFormat.add('uv', Graphics.AttributeType.FLOAT, 2)

const vert = `
  uniform mat3 uvTransform;
  uniform mat3 positionTransform;

  attribute vec2 position;
  attribute vec2 uv;
  varying vec2 vUv;

  void main() {
    vUv = (uvTransform * vec3(uv, 1)).xy;
    gl_Position = vec4((positionTransform * vec3(position, 1)).xy, 0, 1);
  }
`

const frag = (colorForBucket: string) => `
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

  ${colorForBucket}

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
      // Not on an edge. Draw the appropriate color.
      gl_FragColor = vec4(colorForBucket(here.z), here.a);
    }
  }
`

export interface FlamechartColorPassRenderProps {
  rectInfoTexture: Graphics.Texture
  renderOutlines: boolean
  srcRect: Rect
  dstRect: Rect
}

export class FlamechartColorPassRenderer {
  private material: Graphics.Material
  private buffer: Graphics.VertexBuffer

  constructor(private gl: Graphics.Context, theme: Theme) {
    const vertices = [
      {pos: [-1, 1], uv: [0, 1]},
      {pos: [1, 1], uv: [1, 1]},
      {pos: [-1, -1], uv: [0, 0]},
      {pos: [1, -1], uv: [1, 0]},
    ]
    const floats: number[] = []
    for (let v of vertices) {
      floats.push(v.pos[0])
      floats.push(v.pos[1])
      floats.push(v.uv[0])
      floats.push(v.uv[1])
    }

    this.buffer = gl.createVertexBuffer(vertexFormat.stride * vertices.length)
    this.buffer.uploadFloats(floats)
    this.material = gl.createMaterial(vertexFormat, vert, frag(theme.colorForBucketGLSL))
  }

  render(props: FlamechartColorPassRenderProps) {
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
    const uvTransform = AffineTransform.betweenRects(Rect.unit, uvRect)

    const {dstRect} = props
    const viewportSize = new Vec2(this.gl.viewport.width, this.gl.viewport.height)

    const physicalToNDC = AffineTransform.withScale(new Vec2(1, -1)).times(
      AffineTransform.betweenRects(new Rect(Vec2.zero, viewportSize), Rect.NDC),
    )
    const ndcRect = physicalToNDC.transformRect(dstRect)
    const positionTransform = AffineTransform.betweenRects(Rect.NDC, ndcRect)

    const uvSpacePixelSize = Vec2.unit.dividedByPointwise(
      new Vec2(props.rectInfoTexture.width, props.rectInfoTexture.height),
    )

    this.material.setUniformSampler('colorTexture', props.rectInfoTexture, 0)
    setUniformAffineTransform(this.material, 'uvTransform', uvTransform)
    this.material.setUniformFloat('renderOutlines', props.renderOutlines ? 1.0 : 0.0)
    this.material.setUniformVec2('uvSpacePixelSize', uvSpacePixelSize.x, uvSpacePixelSize.y)
    setUniformAffineTransform(this.material, 'positionTransform', positionTransform)

    this.gl.setUnpremultipliedBlendState()
    this.gl.draw(Graphics.Primitive.TRIANGLE_STRIP, this.material, this.buffer)
  }
}
