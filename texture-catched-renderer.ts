import * as regl from 'regl'
import { Vec2, Rect, AffineTransform } from './math'

export class TextureRendererProps {
  texture: regl.Texture
  srcRect: Rect
  dstRect: Rect
}

export class TextureRenderer {
  private command: regl.Command<TextureRendererProps>
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

        varying vec2 vUv;
        uniform sampler2D texture;

        void main() {
          gl_FragColor = texture2D(texture, vUv);
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

      uniforms: {
        texture: (context, props) => props.texture,
        uvTransform: (context, props) => {
          const { srcRect, texture } = props
          const physicalToUV = AffineTransform.withTranslation(new Vec2(0, 1))
            .times(AffineTransform.withScale(new Vec2(1, -1)))
            .times(AffineTransform.betweenRects(
                new Rect(Vec2.zero, new Vec2(texture.width, texture.height)),
                Rect.unit
            ))
          const uvRect = physicalToUV.transformRect(srcRect)
          return AffineTransform.betweenRects(
            Rect.unit,
            uvRect,
          ).flatten()
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

      primitive: 'triangle strip',

      count: 4
    })
  }

  render(props: TextureRendererProps) {
    this.command(props)
  }

  resetStats() { return Object.assign(this.command.stats, { cpuTime: 0, gpuTime: 0, count: 0 }) }
  stats() { return this.command.stats }
}

export interface TextureCachedRendererOptions<T> {
  textureRenderer: TextureRenderer
  render(t: T): void
  shouldUpdate(oldProps: T, newProps: T): boolean
}

export class TextureCachedRenderer<T> {
  private renderUncached: (t: T) => void
  private shouldUpdate: (oldProps: T, newProps: T) => boolean
  private texture: regl.Texture
  private framebuffer: regl.Framebuffer
  private textureRenderer: TextureRenderer
  private withContext: regl.Command<{}>

  constructor(private gl: regl.Instance, options: TextureCachedRendererOptions<T>) {
    this.renderUncached = options.render
    this.shouldUpdate = options.shouldUpdate
    this.textureRenderer = options.textureRenderer

    this.texture = gl.texture(1, 1)
    this.framebuffer = gl.framebuffer({color: [this.texture]})
    this.withContext = gl({})
  }

  private lastRenderProps: T | null = null

  private dirty: boolean = false
  setDirty() {
    this.dirty = true
  }

  render(props: T) {
    this.withContext((context: regl.Context) => {
      let needsRender = false
      if (this.texture.width !== context.viewportWidth || this.texture.height !== context.viewportHeight) {
        // TODO(jlfwong): Can probably just use this.framebuffer.resize
        this.texture({ width: context.viewportWidth, height: context.viewportHeight })
        this.framebuffer({ color: [this.texture] })
        needsRender = true
      } else if (this.lastRenderProps == null) {
        needsRender = true
      } else if (this.shouldUpdate(this.lastRenderProps, props)) {
        needsRender = true
      } else if (this.dirty) {
        needsRender = true
      }

      if (needsRender) {
        this.gl({
          viewport: (context, props) => {
            return {
              x: 0,
              y: 0,
              width: context.viewportWidth,
              height: context.viewportHeight
            }
          },
          framebuffer: this.framebuffer
        })(() => {
          this.gl.clear({color: [0, 0, 0, 0]})
          this.renderUncached(props)
        })
      }

      const glViewportRect = new Rect(Vec2.zero, new Vec2(context.viewportWidth, context.viewportHeight))

      // Render from texture
      this.textureRenderer.render({
        texture: this.texture,
        srcRect: glViewportRect,
        dstRect: glViewportRect
      })
      this.lastRenderProps = props
      this.dirty = false
    })
  }
}