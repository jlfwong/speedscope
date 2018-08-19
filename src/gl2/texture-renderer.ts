import {Vec2, Rect, AffineTransform} from '../lib/math'
import {Graphics} from './graphics'
import {setUniformAffineTransform} from './utils'

export interface TextureRendererProps {
  texture: Graphics.Texture
  srcRect: Rect
  dstRect: Rect
}

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

const frag = `
  precision mediump float;

  varying vec2 vUv;
  uniform sampler2D texture;

  void main() {
   gl_FragColor = texture2D(texture, vUv);
  }
`

export interface TextureRendererProps {
  texture: Graphics.Texture
  srcRect: Rect
  dstRect: Rect
}

export class TextureRenderer {
  private buffer: Graphics.VertexBuffer
  private material: Graphics.Material

  constructor(private gl: Graphics.Context) {
    const vertexFormat = new Graphics.VertexFormat()
    vertexFormat.add('position', Graphics.AttributeType.FLOAT, 2)
    vertexFormat.add('uv', Graphics.AttributeType.FLOAT, 2)

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
    this.buffer.upload(new Uint8Array(new Float32Array(floats).buffer))
    this.material = gl.createMaterial(vertexFormat, vert, frag)
  }

  render(props: TextureRendererProps) {
    this.material.setUniformSampler('texture', props.texture, 0)
    setUniformAffineTransform(
      this.material,
      'uvTransform',
      (() => {
        const {srcRect, texture} = props
        const physicalToUV = AffineTransform.withTranslation(new Vec2(0, 1))
          .times(AffineTransform.withScale(new Vec2(1, -1)))
          .times(
            AffineTransform.betweenRects(
              new Rect(Vec2.zero, new Vec2(texture.width, texture.height)),
              Rect.unit,
            ),
          )
        const uvRect = physicalToUV.transformRect(srcRect)
        return AffineTransform.betweenRects(Rect.unit, uvRect)
      })(),
    )
    setUniformAffineTransform(
      this.material,
      'positionTransform',
      (() => {
        const {dstRect} = props

        const {viewport} = this.gl
        const viewportSize = new Vec2(viewport.width, viewport.height)

        const physicalToNDC = AffineTransform.withScale(new Vec2(1, -1)).times(
          AffineTransform.betweenRects(new Rect(Vec2.zero, viewportSize), Rect.NDC),
        )
        const ndcRect = physicalToNDC.transformRect(dstRect)
        return AffineTransform.betweenRects(Rect.NDC, ndcRect)
      })(),
    )

    this.gl.setUnpremultipliedBlendState()
    this.gl.draw(Graphics.Primitive.TRIANGLE_STRIP, this.material, this.buffer)
  }
}
