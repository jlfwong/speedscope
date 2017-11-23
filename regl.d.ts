declare module "regl" {
  interface ReglProp {}

  type ReglPrimitiveValue =
    boolean |
    number |
    number[] |
    number[][] |
    ReglProp

  type ReglValue<P> = ReglPrimitiveValue | {(context: any, props: P, batchId: number): ReglPrimitiveValue}

  export type vec2 = [number, number]
  export type vec3 = [number, number, number]
  export type mat3 = [number, number, number, number, number, number, number, number, number]

  interface ReglCommandParameters<P> {
    /** Source code of vertex shader */
    vert: string

    /** Source code of fragment shader */
    frag: string

    attributes: {[attributeName: string]: ReglValue<P>}

    uniforms: {[uniformName: string]: ReglValue<P>}

    /** Number of vertices to draw */
    count: number

    /** */
    primitive?: 'points' | 'lines' | 'line strip' | 'triangles' | 'triangle strip' | 'triangle fan'

    /** Offset of primitives to draw */
    offset?: number
  }

  export interface ReglCommand<P> {
    (p: P): void
  }

  export interface ReglCommandConstructor {
    <P>(params: ReglCommandParameters<P>): ReglCommand<P>
  }

  function ReglConstructor(): ReglCommandConstructor
  function ReglConstructor(ctx: WebGLRenderingContext): ReglCommandConstructor
  function ReglConstructor(canvas: HTMLCanvasElement): ReglCommandConstructor

  namespace ReglConstructor {
    function prop(name: string): ReglProp
  }

  export default ReglConstructor
}
