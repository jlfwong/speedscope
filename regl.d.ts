declare module "regl" {
  interface ReglProp {}

  type ReglPrimitiveValue =
    boolean |
    number |
    number[] |
    number[][] |
    ReglProp

  type ReglValue<P> = ReglPrimitiveValue | {(context: any, props: P, batchId: number): ReglPrimitiveValue}

  type BlendEquation = 'add' | 'subtract' | 'reverse subtract' | 'min' | 'max'

  interface ReglCommandParameters<P> {
    /** Source code of vertex shader */
    vert: string

    /** Source code of fragment shader */
    frag: string

    attributes: {[attributeName: string]: ReglValue<P>}

    uniforms: {[uniformName: string]: ReglValue<P>}

    blend?: {
      enable?: boolean,
      // TOOD(jlfwong): Narrow this down to the actualy options
      func?: {
        src: string
        dst: string
      } | {
        srcRGB: string
        srcAlpha: string
        dstRGB: string
        dstAlpha: string
      },
      equation?: BlendEquation | {
        rgb: BlendEquation
        alpha: BlendEquation
      },
      color?: [number, number, number, number]
    }

    depth?: {
      enable?: boolean,
      mask?: boolean,
      // TODO(jlfwong): Narrow
      func?: string,
      range?: [number, number]
    }

    /** Number of vertices to draw */
    count: number

    /** */
    primitive?: 'points' | 'lines' | 'line strip' | 'triangles' | 'triangle strip' | 'triangle fan'

    /** Offset of primitives to draw */
    offset?: number
  }

  function ReglConstructor(): ReglConstructor.ReglCommandConstructor
  function ReglConstructor(ctx: WebGLRenderingContext): ReglConstructor.ReglCommandConstructor
  function ReglConstructor(canvas: HTMLCanvasElement): ReglConstructor.ReglCommandConstructor

  namespace ReglConstructor {
    function prop(name: string): ReglProp

    export type vec2 = [number, number]
    export type vec3 = [number, number, number]
    export type mat3 = [number, number, number, number, number, number, number, number, number]

    interface ReglCommand<P> {
      (p: P): void
    }

    interface ReglCommandConstructor {
      <P>(params: ReglCommandParameters<P>): ReglCommand<P>
      clear(args: {
        color?: [number, number, number, number],
        depth?: number,
        stencil?: number,
      }): void
    }
  }

  export = ReglConstructor
}
