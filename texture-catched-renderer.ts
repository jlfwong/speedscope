import * as regl from 'regl'
import { Vec2, Rect } from './math'

export class TextureRendererProps {
  texture: regl.Texture
  ndcRect: Rect
  uvRect: Rect
}

export class TextureRenderer {
  private command: regl.Command<TextureRendererProps>
  constructor(gl: regl.Instance) {
    this.command = gl({
      vert: `
        attribute vec2 position;
        attribute vec2 uv;
        varying vec2 vUv;

        void main() {
          vUv = uv;
          gl_Position = vec4(position, 0, 1);
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
        position: (context, props) => {
          const rect = props.ndcRect

          return [
            rect.topLeft().flatten(),
            rect.topRight().flatten(),
            rect.bottomLeft().flatten(),
            rect.bottomRight().flatten()
          ]
        },
        uv: (context, props) => {
          const rect = props.uvRect

          return [
            rect.topLeft().flatten(),
            rect.topRight().flatten(),
            rect.bottomLeft().flatten(),
            rect.bottomRight().flatten()
          ]
        }
      },

      uniforms: {
        texture: (context, props) => props.texture
      },

      primitive: 'triangle strip',

      count: 4
    })
  }

  render(context: regl.Context, props: TextureRendererProps) {
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

  constructor(private gl: regl.Instance, options: TextureCachedRendererOptions<T>) {
    this.renderUncached = options.render
    this.shouldUpdate = options.shouldUpdate
    this.textureRenderer = options.textureRenderer

    this.texture = gl.texture(1, 1)
    this.framebuffer = gl.framebuffer({color: [this.texture]})
  }

  private lastRenderProps: T | null = null

  private dirty: boolean = false
  setDirty() {
    this.dirty = true
  }

  render(context: regl.Context, props: T) {
    let needsRender = false
    if (this.texture.width !== context.viewportWidth || this.texture.height !== context.viewportHeight) {
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
      // Render to texture
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

    // Render from texture
    this.textureRenderer.render(context, {
      texture: this.texture,
      ndcRect: new Rect(new Vec2(-1, -1), new Vec2(2, 2)),
      uvRect: new Rect(new Vec2(0, 0), new Vec2(1, 1))
    })
    this.lastRenderProps = props
    this.dirty = false
  }
}