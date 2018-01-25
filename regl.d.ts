declare module "regl" {
  interface InitializationOptions {
    /** A reference to a WebGL rendering context. (Default created from canvas) */
    gl?: WebGLRenderingContext
    /** A reference to an HTML canvas element. (Default created and appending to container) */
    canvas?: HTMLCanvasElement | string
    /** A container element which regl inserts a canvas into. (Default document.body) */
    container?: HTMLElement | string
    /** The context creation attributes passed to the WebGL context constructor. See below for defaults. */
    attributes?: {
      /** Boolean that indicates if the canvas contains an alpha buffer. */
      alpha?: boolean
      /** Boolean that indicates that the drawing buffer has a depth buffer of at least 16 bits. */
      depth?: boolean
      /** Boolean that indicates that the drawing buffer has a stencil buffer of at least 8 bits. */
      stencil?: boolean
      /** Boolean that indicates whether or not to perform anti-aliasing. */
      antialias?: boolean
      /** Boolean that indicates that the page compositor will assume the drawing buffer contains colors with pre-multiplied alpha. */
      premultipliedAlpha?: boolean
      /** If the value is true the buffers will not be cleared and will preserve their values until cleared or overwritten by the author. */
      preserveDrawingBuffer?: boolean
      /** Boolean that indicates if a context will be created if the system performance is low. */
      failIfMajorPerformanceCavet?: boolean
    }
    /** A multiplier which is used to scale the canvas size relative to the container. (Default window.devicePixelRatio) */
    pixelRatio?: number
    /** A list of extensions that must be supported by WebGL context. Default [] */
    extensions?: string[] | string
    /** A list of extensions which are loaded opportunistically. Default [] */
    optionalExtensions?: string[] | string
    /** If set, turns on profiling for all commands by default. (Default false) */
    profile?: boolean
    /**
     * An optional callback which accepts a pair of arguments, (err, regl) that
     * is called after the application loads. If not specified, context creation
     * errors throw.
     */
    onDone?: (err: Error, regl: regl.Instance) => void
  }
  function regl(options: InitializationOptions): regl.Instance

  /** Create fullscreen canvas */
  function regl(): regl.Instance

  /** Build from an existing canvas */
  function regl(canvas: HTMLCanvasElement): regl.Instance

  /** Build from an existing div container */
  function regl(container: HTMLElement): regl.Instance

  /** Build from an existing WebGL context */
  function regl(gl: WebGLRenderingContext): regl.Instance

  namespace regl {
    export type vec2 = [number, number]
    export type vec3 = [number, number, number]
    export type vec4 = [number, number, number, number]
    export type mat3 = [number, number, number, number, number, number, number, number, number]
    export type mat4 = [number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number]
    type GlslPrimitive = number | vec2 | vec3 | vec4 | mat3 | mat4

    interface Tick {
      cancel(): void
    }

    interface Instance {
      <P>(params: CommandOptions<P>): Command<P>

      clear(args: {
        color?: [number, number, number, number],
        depth?: number,
        stencil?: number,
      }): void

      // TODO(jlfwong): read()

      buffer(args: BufferArgs): Buffer
      texture(width: number, height: number): Texture
      texture(args: TextureArgs): Texture
      framebuffer(args: FramebufferOptions): Framebuffer
      renderbuffer(args: RenderBufferOptions): RenderBuffer

      limits: {
        colorBits: [number, number, number, number]
        depthBits: number
        stencilBits: number
        subpixelBits: number
        extensions: string[]
        maxAnistropic: number
        maxDrawbuffers: number
        maxColorAttachments: number
        pointSizeDims: number
        lineWidthDims: number
        maxViewportDims: number
        maxCombinedTextureUnits: number
        maxCubeMapSize: number
        maxTextureUnits: number
        maxTextureSize: number
        maxAttributes: number
        maxVertexUniforms: number
        maxVertexTextureUnits: number
        maxFragmentUniforms: number
        glsl: string
        renderer: string
        vendor: string
        version: string
      }

      stats: {
        bufferCount: number
        elementsCount: number
        framebufferCount: number
        shaderCount: number
        textureCount: number
        cubeCount: number
        renderbufferCount: number
        getTotalTextureSize(): number
        getTotalBufferSize(): number
        getTotalRenderbufferSize(): number
        getMaxUniformsCount(): number
        maxTextureUnits(): number
      }

      destroy(): void

      frame(callback: (context: Context) => void): Tick
    }

    type TypedArray = Int8Array | Uint8Array | Uint8ClampedArray | Int16Array |
      Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array

    type DrawMode = 'points' | 'lines' | 'line strip' | 'line loop' | 'triangles' | 'triangle strip' | 'triangle fan'

    interface Context {
      tick: number
      time: number
      viewportWidth: number
      viewportHeight: number
      framebufferWidth: number
      framebufferHeight: number
      drawingBufferWidth: number
      drawingBufferHeight: number
      pixelRatio: number
      [key: string]: any
    }

    interface BufferOptions {
      data?: TypedArray | GlslPrimitive[]

      /** If data is null or not present reserves space for the buffer	 */
      length?: number

      /** Sets array buffer usage hint	*/
      usage?: 'static' | 'dynamic' | 'stream'
    }
    type BufferArgs = number | number[] | vec2[] | vec3[] | mat3[] | TypedArray | BufferOptions
    interface Buffer {
      (args: BufferArgs): void
      stats: {
        size: number
      }
      destroy(): void
    }

    interface ElementsOptions {
      data?: TypedArray
      usage?: 'static' | 'dynamic' | 'stream'
      length?: number
      primitive?: GlslPrimitive
      count?: number
    }
    type ElementsArgs = vec3[] | ElementsOptions
    interface Elements {
      (args: ElementsArgs): void
      destroy(): void
    }

    type MagFilter = 'nearest' | 'linear'
    type MinFilter = 'nearest' | 'linear' | 'mipmap' | 'linear mipmap linear' | 'nearest mipmap linear' | 'nearest mipmap nearest'
    type WrapMode = 'repeat' | 'clamp' | 'mirror'
    type TextureFormat = 'alpha' | 'luminance' | 'luminance alpha' | 'rgb' | 'rgba' | 'rgba4' | 'rgb5 a1' | 'rgb565' | 'srgb' | 'srgba' | 'depth' | 'depth stencil' | 'rgb s3tc dxt1' | 'rgb s3tc dxt5' | 'rgb atc' | 'rgba atc explicit alpha' | 'rgba atc interpolated alpha' | 'rgb pvrtc 4bppv1' | 'rgb pvrtc 2bppv1' | 'rgba pvrtc 4bppv1' | 'rgba pvrtc 2bppv1' | 'rgb etc1'
    type TextureType = 'uint8' | 'uint16' | 'float' | 'float32' | 'half float' | 'float16'
    type ColorSpace = 'none' | 'browser'
    type MipmapHint = "don't care" | 'dont care' | 'nice' | 'fast'

    type TextureData = number[] | number[][] | TypedArray | HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | CanvasRenderingContext2D
    interface TextureOptions {
      width?: number
      height?: number
      shape?: [number, number] | [number, number, number]
      radius?: number

      /** Sets magnification filter */
      mag?: MagFilter
      /** Sets minification filter */
      min?: MinFilter
      /** Sets wrap mode on S axis */
      wrapS?: WrapMode
      /** Sets wrap mode on T axis */
      wrapT?: WrapMode
      /** Sets number of anisotropic samples, requires EXT_texture_filter_anisotropic	*/
      aniso?: number
      format?: TextureFormat
      type?: TextureType
      mipmap?: MipmapHint | boolean
      /** Flips textures vertically when uploading */
      flipY?: boolean
      /** Sets unpack alignment per pixel */
      alignment?: number
      /** Premultiply alpha when unpacking */
      premultiplyAlpha?: boolean
      colorSpace?: ColorSpace

      copy?: boolean

      data?: TextureData
    }
    type TextureArgs = TextureData | TextureOptions
    interface Texture {
      width: number
      height: number

      (args: TextureArgs): void
      destroy(): void
      stats: {
        size: number
      }
    }

    // TODO(jlfwong): Cube maps
    // TODO(jlfwong): Cubic frame buffers

    interface RenderBufferOptions {
      format?: 'rgba4' | 'rgb565' | 'rgb5 a1' | 'depth' | 'stencil' | 'depth stencil' | 'srgba' | 'rgba16f' | 'rgb16f' | 'rgba32f'
      width?: number
      height?: number
      shape?: [number, number]
      radius?: number
    }
    interface RenderBuffer {
      (options: RenderBufferOptions): void
      resize(width: number, height: number): void
      destroy(): void
      stats: {
        size: number
      }
    }

    interface FramebufferOptions {
      width?: number
      height?: number
      shape?: [number, number]
      color?: RenderBuffer[] | Texture[]
      depth?: boolean | RenderBuffer | Texture
      stencil?: boolean | RenderBuffer | Texture
      depthStencil?: boolean | RenderBuffer | Texture
      colorFormat?: 'rgba' | 'rgba4' | 'rgb565' | 'rgb5 a1' | 'rgb16f' | 'rgba16f' | 'rgba32f' | 'srgba'
      colorType?: 'uint8' | 'half float' | 'float'
    }
    interface Framebuffer {
      (options: FramebufferOptions): void
      resize(width: number, height: number): void
      destroy(): void
    }

    type Uniform = number | vec2 | vec3 | mat3 | Texture

    interface AttributeOptions {
      buffer?: Buffer | BufferArgs
      offset?: number
      stride?: number
      normalized?: boolean
      size?: number
      divisor?: number
    }
    type Attribute = AttributeOptions | Buffer | BufferArgs | { constant: number | vec2 | vec3 | vec4 | mat3 | mat4 }

    interface Computed<P, T> {
      (context: Context, props: P, batchId: number): T
    }
    type MaybeComputed<P, T> = Computed<P, T> | T

    type DepthFunction = 'never' | 'always' | '<' | 'less' | '<=' | 'lequal' | '>' | 'greater' | '>=' | 'gequal' | '=' | 'equal' | '!=' | 'notequal'
    type BlendFunction = 0 | 'zero' | 1 | 'one' | 'src color' | 'one minus src color' | 'src alpha' | 'one minus src alpha' | 'dst color' | 'one minus dst color' | 'dst alpha' | 'one minus dst alpha' | 'constant color' | 'one minus constant color' | 'one minus constant alpha' | 'src alpha saturate'
    type BlendEquation = 'add' | 'subtract' | 'reverse subtract' | 'min' | 'max'
    type StencilFunction = DepthFunction
    type StencilOp = 'zero' | 'keep' | 'replace' | 'invert' | 'increment' | 'decrement' | 'increment wrap' | 'decrement wrap'
    interface CommandOptions<P> {
      /** Source code of vertex shader */
      vert?: string

      /** Source code of fragment shader */
      frag?: string

      context?: { [contextName: string]: MaybeComputed<P, any> }

      uniforms?: { [uniformName: string]: MaybeComputed<P, Uniform> }

      attributes?: { [attributeName: string]: MaybeComputed<P, Attribute> }

      primitive?: DrawMode

      /** Number of vertices to draw */
      count?: MaybeComputed<P, number>

      /** Offset of primitives to draw */
      offset?: MaybeComputed<P, number>

      /** Number of instances to render	 */
      instances?: MaybeComputed<P, number>

      /** Element array buffer */
      elements?: MaybeComputed<P, Elements | ElementsArgs>

      framebuffer?: MaybeComputed<P, Framebuffer>

      profile?: MaybeComputed<P, boolean>

      depth?: MaybeComputed<P, {
        enable?: boolean,
        mask?: boolean,
        func?: DepthFunction,
        range?: [number, number]
      }>

      blend?: MaybeComputed<P, {
        enable?: boolean,
        func?: {
          src: BlendFunction
          dst: BlendFunction
        } | {
          srcRGB: BlendFunction
          srcAlpha: BlendFunction
          dstRGB: BlendFunction
          dstAlpha: BlendFunction
        },
        equation?: BlendEquation | {
          rgb: BlendEquation
          alpha: BlendEquation
        },
        color?: vec4
      }>

      stencil?: MaybeComputed<P, {
        enable?: boolean
        mask?: number
        func?: StencilFunction
        opFront?: { fail: StencilOp, zfail: StencilOp, pass: StencilOp },
        opBack?: { fail: StencilOp, zfail: StencilOp, pass: StencilOp },
      }>

      polygonOffset?: MaybeComputed<P, {
        enable?: boolean
        offset?: {
          factor: number
          units: number
        }
      }>

      cull?: MaybeComputed<P, {
        enable?: boolean
        face?: 'front' | 'back'
      }>

      frontFace?: MaybeComputed<P, 'cw' | 'ccw'>

      dither?: MaybeComputed<P, boolean>

      lineWidth?: MaybeComputed<P, number>

      colorMask?: MaybeComputed<P, [boolean, boolean, boolean, boolean]>

      sample?: MaybeComputed<P, {
        enable?: boolean
        alpha?: boolean
        coverage?: {
          value: number
          invert: boolean
        }
      }>

      scissor?: MaybeComputed<P, {
        enable?: boolean
        box?: {
          x: number
          y: number
          width: number
          height: number
        }
      }>

      viewport?: MaybeComputed<P, {
        x: number
        y: number
        width: number
        height: number
      }>
    }

    function prop<P>(name: keyof P): (context: Context, props: P, batchId: number) => P[keyof P]
    function context<P>(name: keyof Context): (context: Context, props: P, batchId: number) => Context[keyof Context]

    interface Command<P> {
      /** One shot rendering */
      (): void
      (p: P): void

      /** Render a batch */
      (ps: P[]): void

      /** Scoped commands */
      (cb: (context: Context) => void): void
      (p: P, cb: (context: Context) => void): void

      stats: {
        /** Aggregate time spent on the GPU in ms */
        gpuTime: number

        /** Aggregate time spent on the CPU in ms */
        cpuTime: number

        /** Total number of calls of this command */
        count: number
      }
    }
  }

  export = regl
}
