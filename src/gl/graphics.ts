// This is a port of the GPU APIs from https://github.com/evanw/sky from Skew to
// TypeScript.
//
// The MIT License (MIT)
// Original work Copyright (c) 2016 Evan Wallace
// Modified work Copyright (c) 2018 Jamie Wong
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

// NOTE: This file intentionally has no dependencies.

// Dependencies & polyfills for import from skew
const RELEASE =
  typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production'

function assert(condition: boolean) {
  if (!RELEASE) {
    if (!condition) throw new Error('Assertion failed.')
  }
}

function appendOne<T>(ts: T[], t: T): void {
  if (ts.indexOf(t) === -1) ts.push(t)
}

function removeOne<T>(ts: T[], t: T): void {
  const index = ts.indexOf(t)
  if (index !== -1) ts.splice(index, 1)
}

function TEXTURE_N(gl: WebGLRenderingContext, index: number) {
  assert(index >= 0 && index <= 31)
  return (gl.TEXTURE0 + index) as GLenum
}

export namespace Graphics {
  export class Rect {
    constructor(
      public x: number = 0,
      public y: number = 0,
      public width: number = 0,
      public height: number = 0,
    ) {}

    set(x: number, y: number, width: number, height: number) {
      this.x = x
      this.y = y
      this.width = width
      this.height = height
    }

    equals(other: Rect) {
      return (
        this.x === other.x &&
        this.y === other.y &&
        this.width === other.width &&
        this.height === other.height
      )
    }
  }

  export class Color {
    constructor(
      public redF: number,
      public greenF: number,
      public blueF: number,
      public alphaF: number,
    ) {}

    equals(other: Color): boolean {
      return (
        this.redF === other.redF &&
        this.greenF === other.greenF &&
        this.blueF === other.blueF &&
        this.alphaF === other.alphaF
      )
    }

    static TRANSPARENT = new Color(0, 0, 0, 0)
  }

  // Converted from https://github.com/evanw/sky/blob/c72de77/src/graphics/context.sk
  export enum BlendOperation {
    ZERO = 0,
    ONE = 1,

    SOURCE_COLOR = 2,
    TARGET_COLOR = 3,
    INVERSE_SOURCE_COLOR = 4,
    INVERSE_TARGET_COLOR = 5,

    SOURCE_ALPHA = 6,
    TARGET_ALPHA = 7,
    INVERSE_SOURCE_ALPHA = 8,
    INVERSE_TARGET_ALPHA = 9,

    CONSTANT = 10,
    INVERSE_CONSTANT = 11,
  }

  export enum Primitive {
    TRIANGLES,
    TRIANGLE_STRIP,
  }

  export abstract class Context {
    abstract addContextResetHandler(callback: () => void): void
    abstract beginFrame(): void
    abstract clear(color: Color): void

    abstract createMaterial(
      format: VertexFormat,
      vertexSource: string,
      fragmentSource: string,
    ): Material
    abstract createTexture(
      format: TextureFormat,
      width: number,
      height: number,
      pixels?: Uint8Array,
    ): Texture
    abstract createRenderTarget(texture: Texture): RenderTarget
    abstract createVertexBuffer(byteCount: number): VertexBuffer
    abstract currentRenderTarget: RenderTarget | null
    abstract draw(primitive: Primitive, material: Material, vertices: VertexBuffer): void
    abstract endFrame(): void
    abstract removeContextResetHandler(callback: () => void): void
    abstract resize(
      widthInPixels: number,
      heightInPixels: number,
      widthInAppUnits: number,
      heightInAppUnits: number,
    ): void
    abstract setRenderTarget(renderTarget: RenderTarget | null): void
    abstract setViewport(x: number, y: number, width: number, height: number): void
    abstract viewport: Rect
    abstract widthInPixels: number
    abstract heightInPixels: number

    abstract renderTargetHeightInPixels: number
    abstract renderTargetWidthInPixels: number

    abstract setBlendState(source: BlendOperation, target: BlendOperation): void
    setCopyBlendState() {
      this.setBlendState(BlendOperation.ONE, BlendOperation.ZERO)
    }
    setAddBlendState() {
      this.setBlendState(BlendOperation.ONE, BlendOperation.ONE)
    }
    setPremultipliedBlendState() {
      this.setBlendState(BlendOperation.ONE, BlendOperation.INVERSE_SOURCE_ALPHA)
    }
    setUnpremultipliedBlendState() {
      this.setBlendState(BlendOperation.SOURCE_ALPHA, BlendOperation.INVERSE_SOURCE_ALPHA)
    }

    protected resizeEventHandlers = new Set<() => void>()
    addAfterResizeEventHandler(callback: () => void): void {
      this.resizeEventHandlers.add(callback)
    }
    removeAfterResizeEventHandler(callback: () => void): void {
      this.resizeEventHandlers.delete(callback)
    }
  }

  export interface Material {
    context: Context
    format: VertexFormat
    fragmentSource: string
    vertexSource: string
    setUniformFloat(name: string, x: number): void
    setUniformInt(name: string, x: number): void
    setUniformVec2(name: string, x: number, y: number): void
    setUniformVec3(name: string, x: number, y: number, z: number): void
    setUniformVec4(name: string, x: number, y: number, z: number, w: number): void
    setUniformMat3(
      name: string,
      m00: number,
      m01: number,
      m02: number,
      m10: number,
      m11: number,
      m12: number,
      m20: number,
      m21: number,
      m22: number,
    ): void
    setUniformSampler(name: string, texture: Texture, index: number): void
  }

  export enum AttributeType {
    FLOAT,
    BYTE,
  }

  export function attributeByteLength(type: AttributeType) {
    return type == AttributeType.FLOAT ? 4 : 1
  }

  export class Attribute {
    constructor(
      readonly name: string,
      readonly type: AttributeType,
      readonly count: number,
      readonly byteOffset: number,
    ) {}
  }

  export class VertexFormat {
    private _attributes: Attribute[] = []
    private _stride = 0

    get attributes() {
      return this._attributes
    }
    get stride() {
      return this._stride
    }

    add(name: string, type: AttributeType, count: number): VertexFormat {
      this.attributes.push(new Attribute(name, type, count, this.stride))
      this._stride += count * attributeByteLength(type)
      return this
    }
  }

  export abstract class VertexBuffer {
    abstract byteCount: number
    abstract context: Context
    abstract move(sourceByteOffset: number, targetByteOffset: number, byteCount: number): void
    abstract upload(bytes: Uint8Array, byteOffset?: number): void
    uploadFloat32Array(floats: Float32Array) {
      this.upload(new Uint8Array(floats.buffer), 0)
    }
    uploadFloats(floats: number[]) {
      this.uploadFloat32Array(new Float32Array(floats))
    }
    abstract free(): void
  }

  export enum PixelFilter {
    NEAREST,
    LINEAR,
  }

  export enum PixelWrap {
    REPEAT,
    CLAMP,
  }

  export class TextureFormat {
    constructor(
      readonly minFilter: PixelFilter,
      readonly magFilter: PixelFilter,
      readonly wrap: PixelWrap,
    ) {}

    static LINEAR_CLAMP = new TextureFormat(PixelFilter.LINEAR, PixelFilter.LINEAR, PixelWrap.CLAMP)
    static LINEAR_MIN_NEAREST_MAG_CLAMP = new TextureFormat(
      PixelFilter.LINEAR,
      PixelFilter.NEAREST,
      PixelWrap.CLAMP,
    )
    static NEAREST_CLAMP = new TextureFormat(
      PixelFilter.NEAREST,
      PixelFilter.NEAREST,
      PixelWrap.CLAMP,
    )
  }

  export interface Texture {
    context: Context
    format: TextureFormat
    width: number
    height: number
    resize(width: number, height: number, pixels?: Uint8Array): void
    setFormat(format: TextureFormat): void
    free(): void
  }

  export interface RenderTarget {
    context: Context
    texture: Texture
    setColor(texture: Texture): void
    free(): void
  }
}

// Converted from https://github.com/evanw/sky/blob/c72de77/src/browser/context.sk
export namespace WebGL {
  export class Context extends Graphics.Context {
    private _attributeCount = 0
    private _blendOperationMap: {[key: number]: GLenum}
    private _blendOperations = 0
    private _contextResetHandlers: (() => void)[] = []
    private _currentClearColor = Graphics.Color.TRANSPARENT
    private _currentRenderTarget: RenderTarget | null = null
    private _defaultViewport = new Graphics.Rect()
    private _forceStateUpdate = true
    private _generation = 1
    private _gl: WebGLRenderingContext
    private _height = 0
    private _oldBlendOperations = 0
    private _oldRenderTarget: RenderTarget | null = null
    private _oldViewport = new Graphics.Rect()
    private _width = 0

    get widthInPixels() {
      return this._width
    }
    get heightInPixels() {
      return this._height
    }

    constructor(canvas: HTMLCanvasElement = document.createElement('canvas')) {
      super()
      let gl = canvas.getContext('webgl', {
        alpha: false,
        antialias: false,
        depth: false,
        preserveDrawingBuffer: false,
        stencil: false,
      })

      if (gl == null) {
        throw new Error('Setup failure')
      }

      this._gl = gl
      let style = canvas.style
      canvas.width = 0
      canvas.height = 0
      style.width = style.height = '0'

      canvas.addEventListener('webglcontextlost', (e: Event) => {
        e.preventDefault()
      })

      canvas.addEventListener('webglcontextrestored', this.handleWebglContextRestored)

      // Using maps makes these compact in release
      this._blendOperationMap = {
        [Graphics.BlendOperation.ZERO]: this._gl.ZERO,
        [Graphics.BlendOperation.ONE]: this._gl.ONE,

        [Graphics.BlendOperation.SOURCE_COLOR]: this._gl.SRC_COLOR,
        [Graphics.BlendOperation.TARGET_COLOR]: this._gl.DST_COLOR,
        [Graphics.BlendOperation.INVERSE_SOURCE_COLOR]: this._gl.ONE_MINUS_SRC_COLOR,
        [Graphics.BlendOperation.INVERSE_TARGET_COLOR]: this._gl.ONE_MINUS_DST_COLOR,

        [Graphics.BlendOperation.SOURCE_ALPHA]: this._gl.SRC_ALPHA,
        [Graphics.BlendOperation.TARGET_ALPHA]: this._gl.DST_ALPHA,
        [Graphics.BlendOperation.INVERSE_SOURCE_ALPHA]: this._gl.ONE_MINUS_SRC_ALPHA,
        [Graphics.BlendOperation.INVERSE_TARGET_ALPHA]: this._gl.ONE_MINUS_DST_ALPHA,

        [Graphics.BlendOperation.CONSTANT]: this._gl.CONSTANT_COLOR,
        [Graphics.BlendOperation.INVERSE_CONSTANT]: this._gl.ONE_MINUS_CONSTANT_COLOR,
      }
    }

    private handleWebglContextRestored = () => {
      this._attributeCount = 0
      this._currentClearColor = Graphics.Color.TRANSPARENT
      this._forceStateUpdate = true
      this._generation++
      for (let handler of this._contextResetHandlers) {
        handler()
      }
    }

    public testContextLoss() {
      this.handleWebglContextRestored()
    }

    get gl() {
      return this._gl
    }
    get generation() {
      return this._generation
    }
    addContextResetHandler(callback: () => void) {
      appendOne(this._contextResetHandlers, callback)
    }
    removeContextResetHandler(callback: () => void) {
      removeOne(this._contextResetHandlers, callback)
    }

    get currentRenderTarget() {
      return this._currentRenderTarget
    }

    beginFrame() {
      this.setRenderTarget(null)
    }

    endFrame() {}

    setBlendState(source: Graphics.BlendOperation, target: Graphics.BlendOperation) {
      this._blendOperations = Context._packBlendModes(source, target)
    }

    setViewport(x: number, y: number, width: number, height: number) {
      ;(this._currentRenderTarget != null
        ? this._currentRenderTarget.viewport
        : this._defaultViewport
      ).set(x, y, width, height)
    }

    get viewport() {
      return this._currentRenderTarget != null
        ? this._currentRenderTarget.viewport
        : this._defaultViewport
    }

    get renderTargetWidthInPixels() {
      return this._currentRenderTarget != null
        ? this._currentRenderTarget.viewport.width
        : this._width
    }

    get renderTargetHeightInPixels() {
      return this._currentRenderTarget != null
        ? this._currentRenderTarget.viewport.height
        : this._height
    }

    draw(
      primitive: Graphics.Primitive,
      material: Graphics.Material,
      vertices: Graphics.VertexBuffer,
    ) {
      // Update the texture set before preparing the material so uniform samplers can check for that they use different textures
      this._updateRenderTargetAndViewport()
      Material.from(material).prepare()

      // Update the vertex buffer before updating the format so attributes can bind correctly
      VertexBuffer.from(vertices).prepare()
      this._updateFormat(material.format)

      // Draw now that everything is ready
      this._updateBlendState()

      this._gl.drawArrays(
        primitive == Graphics.Primitive.TRIANGLES ? this._gl.TRIANGLES : this._gl.TRIANGLE_STRIP,
        0,
        Math.floor(vertices.byteCount / material.format.stride),
      )

      // Forced state updates are done once after a context loss
      this._forceStateUpdate = false
    }

    resize(
      widthInPixels: number,
      heightInPixels: number,
      widthInAppUnits: number,
      heightInAppUnits: number,
    ) {
      let canvas = this._gl.canvas as HTMLCanvasElement
      const bounds = canvas.getBoundingClientRect()

      if (
        this._width === widthInPixels &&
        this._height === heightInPixels &&
        bounds.width === widthInAppUnits &&
        bounds.height === heightInAppUnits
      ) {
        // Nothing to do here!
        return
      }

      let style = canvas.style
      canvas.width = widthInPixels
      canvas.height = heightInPixels
      style.width = `${widthInAppUnits}px`
      style.height = `${heightInAppUnits}px`
      this.setViewport(0, 0, widthInPixels, heightInPixels)
      this._width = widthInPixels
      this._height = heightInPixels

      this.resizeEventHandlers.forEach(cb => cb())
    }

    clear(color: Graphics.Color) {
      this._updateRenderTargetAndViewport()
      this._updateBlendState()

      if (!color.equals(this._currentClearColor)) {
        this._gl.clearColor(color.redF, color.greenF, color.blueF, color.alphaF)
        this._currentClearColor = color
      }

      this._gl.clear(this._gl.COLOR_BUFFER_BIT)
    }

    setRenderTarget(renderTarget: Graphics.RenderTarget | null) {
      this._currentRenderTarget = RenderTarget.from(renderTarget)
    }

    createMaterial(
      format: Graphics.VertexFormat,
      vertexSource: string,
      fragmentSource: string,
    ): Graphics.Material {
      let material = new Material(this, format, vertexSource, fragmentSource)

      // Compiling shaders is really expensive so we want to get that started
      // as early as possible. In Chrome and possibly other browsers, shader
      // compilation can happen asynchronously as long as you don't call
      // useProgram().
      //
      //   https://plus.google.com/+BrandonJonesToji/posts/4ERHkicC5Ny
      //
      material.program

      return material
    }

    createVertexBuffer(byteCount: number): Graphics.VertexBuffer {
      assert(byteCount > 0 && byteCount % 4 == 0)
      return new VertexBuffer(this, byteCount)
    }

    createTexture(
      format: Graphics.TextureFormat,
      width: number,
      height: number,
      pixels?: Uint8Array,
    ): Graphics.Texture {
      return new Texture(this, format, width, height, pixels)
    }

    createRenderTarget(texture: Graphics.Texture): Graphics.RenderTarget {
      return new RenderTarget(this, Texture.from(texture))
    }

    private ANGLE_instanced_arrays: ANGLE_instanced_arrays | null = null
    private ANGLE_instanced_arrays_generation: number = -1
    getANGLE_instanced_arrays(): ANGLE_instanced_arrays {
      if (this.ANGLE_instanced_arrays_generation !== this._generation) {
        this.ANGLE_instanced_arrays = null
      }
      if (!this.ANGLE_instanced_arrays) {
        this.ANGLE_instanced_arrays = this.gl.getExtension('ANGLE_instanced_arrays')
        if (!this.ANGLE_instanced_arrays) {
          throw new Error('Failed to get extension ANGLE_instanced_arrays')
        }
      }
      return this.ANGLE_instanced_arrays!
    }

    _updateRenderTargetAndViewport() {
      let renderTarget = this._currentRenderTarget
      let viewport = renderTarget != null ? renderTarget.viewport : this._defaultViewport
      let gl = this._gl

      if (this._forceStateUpdate || this._oldRenderTarget != renderTarget) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, renderTarget ? renderTarget.framebuffer : null)
        this._oldRenderTarget = renderTarget
      }

      if (this._forceStateUpdate || !this._oldViewport.equals(viewport)) {
        gl.viewport(
          viewport.x,
          this.renderTargetHeightInPixels - viewport.y - viewport.height,
          viewport.width,
          viewport.height,
        )
        this._oldViewport.set(viewport.x, viewport.y, viewport.width, viewport.height)
      }
    }

    _updateBlendState() {
      if (this._forceStateUpdate || this._oldBlendOperations != this._blendOperations) {
        let gl = this._gl
        let operations = this._blendOperations
        let oldOperations = this._oldBlendOperations
        let source = (operations & 0xf) as Graphics.BlendOperation
        let target = (operations >> 4) as Graphics.BlendOperation

        assert(source in this._blendOperationMap)
        assert(target in this._blendOperationMap)

        // Special-case the blend mode that just writes over the target buffer
        if (operations == Context.COPY_BLEND_OPERATIONS) {
          gl.disable(gl.BLEND)
        } else {
          if (this._forceStateUpdate || oldOperations == Context.COPY_BLEND_OPERATIONS) {
            gl.enable(gl.BLEND)
          }

          // Otherwise, use actual blending
          gl.blendFunc(this._blendOperationMap[source], this._blendOperationMap[target])
        }

        this._oldBlendOperations = operations
      }
    }

    _updateFormat(format: Graphics.VertexFormat) {
      // Update the attributes
      let gl = this._gl
      let attributes = format.attributes
      let count = attributes.length
      for (let i = 0; i < count; i++) {
        let attribute = attributes[i]
        let isByte = attribute.type == Graphics.AttributeType.BYTE
        gl.vertexAttribPointer(
          i,
          attribute.count,
          isByte ? gl.UNSIGNED_BYTE : gl.FLOAT,
          isByte,
          format.stride,
          attribute.byteOffset,
        )
      }

      // Update the attribute count
      while (this._attributeCount < count) {
        gl.enableVertexAttribArray(this._attributeCount)
        this._attributeCount++
      }
      while (this._attributeCount > count) {
        this._attributeCount--
        gl.disableVertexAttribArray(this._attributeCount)
      }
      this._attributeCount = count
    }

    getWebGLInfo(): {renderer: string | null; vendor: string | null; version: string | null} {
      const ext = this.gl.getExtension('WEBGL_debug_renderer_info')
      const renderer = ext ? this.gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : null
      const vendor = ext ? this.gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : null
      const version = this.gl.getParameter(this.gl.VERSION)
      return {renderer, vendor, version}
    }

    static from(context: Graphics.Context): Context {
      assert(context == null || context instanceof Context)
      return context as Context
    }

    static _packBlendModes(
      source: Graphics.BlendOperation,
      target: Graphics.BlendOperation,
    ): number {
      return source | (target << 4)
    }

    static COPY_BLEND_OPERATIONS = Context._packBlendModes(
      Graphics.BlendOperation.ONE,
      Graphics.BlendOperation.ZERO,
    )
  }

  abstract class Uniform {
    constructor(
      protected readonly _material: Material,
      protected readonly _name: string,
      protected _generation = 0,
      protected _location: WebGLUniformLocation | null = null,
      protected _isDirty = true,
    ) {}

    // Upload this uniform if it's dirty
    abstract prepare(): void

    get location(): WebGLUniformLocation {
      let context = Context.from(this._material.context)
      if (this._generation != context.generation) {
        this._location = context.gl.getUniformLocation(this._material.program, this._name)
        this._generation = context.generation

        // Validate the shader against this uniform
        if (!RELEASE) {
          let program = this._material.program
          let gl = context.gl
          for (let i = 0, ii = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS); i < ii; i++) {
            let info = gl.getActiveUniform(program, i)
            if (info && info.name == this._name) {
              assert(info.size == 1)
              switch (info.type) {
                case gl.FLOAT: {
                  assert(this instanceof UniformFloat)
                  break
                }
                case gl.FLOAT_MAT3: {
                  assert(this instanceof UniformMat3)
                  break
                }
                case gl.FLOAT_VEC2: {
                  assert(this instanceof UniformVec2)
                  break
                }
                case gl.FLOAT_VEC3: {
                  assert(this instanceof UniformVec3)
                  break
                }
                case gl.FLOAT_VEC4: {
                  assert(this instanceof UniformVec4)
                  break
                }
                case gl.INT: {
                  assert(this instanceof UniformInt)
                  break
                }
                case gl.SAMPLER_2D: {
                  assert(this instanceof UniformSampler)
                  break
                }
                default:
                  assert(false)
              }
            }
          }
        }
      }
      if (!this._location) {
        throw new Error('Failed to get uniform location')
      }
      return this._location
    }
  }

  class UniformFloat extends Uniform {
    private _x = 0.0

    set(x: number) {
      if (x != this._x) {
        this._x = x
        this._isDirty = true
      }
    }

    prepare() {
      let context = Context.from(this._material.context)
      if (this._generation != context.generation || this._isDirty) {
        context.gl.uniform1f(this.location, this._x)
        this._isDirty = false
      }
    }
  }

  class UniformInt extends Uniform {
    private _x = 0

    set(x: number) {
      if (x != this._x) {
        this._x = x
        this._isDirty = true
      }
    }

    prepare() {
      let context = Context.from(this._material.context)
      if (this._generation != context.generation || this._isDirty) {
        context.gl.uniform1i(this.location, this._x)
        this._isDirty = false
      }
    }
  }

  class UniformVec2 extends Uniform {
    private _x = 0.0
    private _y = 0.0

    set(x: number, y: number) {
      if (x != this._x || y != this._y) {
        this._x = x
        this._y = y
        this._isDirty = true
      }
    }

    prepare() {
      let context = Context.from(this._material.context)
      if (this._generation != context.generation || this._isDirty) {
        context.gl.uniform2f(this.location, this._x, this._y)
        this._isDirty = false
      }
    }
  }

  class UniformVec3 extends Uniform {
    private _x = 0.0
    private _y = 0.0
    private _z = 0.0

    set(x: number, y: number, z: number) {
      if (x != this._x || y != this._y || z != this._z) {
        this._x = x
        this._y = y
        this._z = z
        this._isDirty = true
      }
    }

    prepare() {
      let context = Context.from(this._material.context)
      if (this._generation != context.generation || this._isDirty) {
        context.gl.uniform3f(this.location, this._x, this._y, this._z)
        this._isDirty = false
      }
    }
  }

  class UniformVec4 extends Uniform {
    private _x = 0.0
    private _y = 0.0
    private _z = 0.0
    private _w = 0.0

    set(x: number, y: number, z: number, w: number) {
      if (x != this._x || y != this._y || z != this._z || w != this._w) {
        this._x = x
        this._y = y
        this._z = z
        this._w = w
        this._isDirty = true
      }
    }

    prepare() {
      let context = Context.from(this._material.context)
      if (this._generation != context.generation || this._isDirty) {
        context.gl.uniform4f(this.location, this._x, this._y, this._z, this._w)
        this._isDirty = false
      }
    }
  }

  class UniformMat3 extends Uniform {
    private _values = [1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0]

    set(
      m00: number,
      m01: number,
      m02: number,
      m10: number,
      m11: number,
      m12: number,
      m20: number,
      m21: number,
      m22: number,
    ) {
      // These values are deliberately transposed because WebGL requires the "transpose" argument of uniformMatrix() to be false
      UniformMat3._cachedValues[0] = m00
      UniformMat3._cachedValues[1] = m10
      UniformMat3._cachedValues[2] = m20
      UniformMat3._cachedValues[3] = m01
      UniformMat3._cachedValues[4] = m11
      UniformMat3._cachedValues[5] = m21
      UniformMat3._cachedValues[6] = m02
      UniformMat3._cachedValues[7] = m12
      UniformMat3._cachedValues[8] = m22

      for (let i = 0; i < 9; i++) {
        if (UniformMat3._cachedValues[i] != this._values[i]) {
          let swap = this._values
          this._values = UniformMat3._cachedValues
          UniformMat3._cachedValues = swap
          this._isDirty = true
          break
        }
      }
    }

    prepare() {
      let context = Context.from(this._material.context)
      if (this._generation != context.generation || this._isDirty) {
        context.gl.uniformMatrix3fv(this.location, false, this._values)
        this._isDirty = false
      }
    }

    // Statically allocate this to avoid allocations
    static _cachedValues = [1.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0]
  }

  class UniformSampler extends Uniform {
    private _texture: Texture | null = null
    private _index = -1

    set(texture: Graphics.Texture, index: number) {
      if (this._texture != texture || this._index != index) {
        this._texture = Texture.from(texture)
        this._index = index
        this._isDirty = true
      }
    }

    prepare() {
      let context = Context.from(this._material.context)
      let gl = context.gl
      assert(
        this._texture == null ||
          context.currentRenderTarget == null ||
          this._texture != context.currentRenderTarget.texture,
      )
      if (this._generation != context.generation || this._isDirty) {
        gl.uniform1i(this.location, this._index)
        this._isDirty = false
      }
      gl.activeTexture(TEXTURE_N(gl, this._index))
      gl.bindTexture(
        gl.TEXTURE_2D,
        this._texture != null && this._texture.width > 0 && this._texture.height > 0
          ? this._texture.texture
          : null,
      )
    }
  }

  class Material implements Graphics.Material {
    constructor(
      private readonly _context: Context,
      private readonly _format: Graphics.VertexFormat,
      private readonly _vertexSource: string,
      private readonly _fragmentSource: string,
      private readonly _uniformsMap: {[key: string]: Uniform} = {},
      private readonly _uniformsList: Uniform[] = [],
      private _generation = 0,
      private _program: WebGLProgram | null = null,
    ) {}

    get context() {
      return this._context
    }
    get format() {
      return this._format
    }
    get vertexSource() {
      return this._vertexSource
    }
    get fragmentSource() {
      return this._fragmentSource
    }

    setUniformFloat(name: string, x: number) {
      let uniform = this._uniformsMap[name] || null
      if (uniform == null) {
        uniform = new UniformFloat(this, name)
        this._uniformsMap[name] = uniform
        this._uniformsList.push(uniform)
      }
      assert(uniform instanceof UniformFloat)
      ;(uniform as UniformFloat).set(x)
    }

    setUniformInt(name: string, x: number) {
      let uniform = this._uniformsMap[name] || null
      if (uniform == null) {
        uniform = new UniformInt(this, name)
        this._uniformsMap[name] = uniform
        this._uniformsList.push(uniform)
      }
      assert(uniform instanceof UniformInt)
      ;(uniform as UniformInt).set(x)
    }

    setUniformVec2(name: string, x: number, y: number) {
      let uniform = this._uniformsMap[name] || null
      if (uniform == null) {
        uniform = new UniformVec2(this, name)
        this._uniformsMap[name] = uniform
        this._uniformsList.push(uniform)
      }
      assert(uniform instanceof UniformVec2)
      ;(uniform as UniformVec2).set(x, y)
    }

    setUniformVec3(name: string, x: number, y: number, z: number) {
      let uniform = this._uniformsMap[name] || null
      if (uniform == null) {
        uniform = new UniformVec3(this, name)
        this._uniformsMap[name] = uniform
        this._uniformsList.push(uniform)
      }
      assert(uniform instanceof UniformVec3)
      ;(uniform as UniformVec3).set(x, y, z)
    }

    setUniformVec4(name: string, x: number, y: number, z: number, w: number) {
      let uniform = this._uniformsMap[name] || null
      if (uniform == null) {
        uniform = new UniformVec4(this, name)
        this._uniformsMap[name] = uniform
        this._uniformsList.push(uniform)
      }
      assert(uniform instanceof UniformVec4)
      ;(uniform as UniformVec4).set(x, y, z, w)
    }

    setUniformMat3(
      name: string,
      m00: number,
      m01: number,
      m02: number,
      m10: number,
      m11: number,
      m12: number,
      m20: number,
      m21: number,
      m22: number,
    ) {
      let uniform = this._uniformsMap[name] || null
      if (uniform == null) {
        uniform = new UniformMat3(this, name)
        this._uniformsMap[name] = uniform
        this._uniformsList.push(uniform)
      }
      assert(uniform instanceof UniformMat3)
      ;(uniform as UniformMat3).set(m00, m01, m02, m10, m11, m12, m20, m21, m22)
    }

    setUniformSampler(name: string, texture: Graphics.Texture, index: number) {
      let uniform = this._uniformsMap[name] || null
      if (uniform == null) {
        uniform = new UniformSampler(this, name)
        this._uniformsMap[name] = uniform
        this._uniformsList.push(uniform)
      }
      assert(uniform instanceof UniformSampler)
      ;(uniform as UniformSampler).set(texture, index)
    }

    get program(): WebGLProgram {
      let gl = this._context.gl
      if (this._generation != this._context.generation) {
        this._program = gl.createProgram()!
        this._compileShader(gl, gl.VERTEX_SHADER, this.vertexSource)
        this._compileShader(gl, gl.FRAGMENT_SHADER, this.fragmentSource)
        let attributes = this.format.attributes
        for (let i = 0; i < attributes.length; i++) {
          gl.bindAttribLocation(this._program, i, attributes[i].name)
        }
        gl.linkProgram(this._program)
        if (!gl.getProgramParameter(this._program, gl.LINK_STATUS)) {
          throw new Error(`${gl.getProgramInfoLog(this._program)}`)
        }
        this._generation = this._context.generation

        // Validate this shader against the format
        if (!RELEASE) {
          for (let attribute of attributes) {
            for (
              let i = 0, ii = gl.getProgramParameter(this.program, gl.ACTIVE_ATTRIBUTES);
              i < ii;
              i++
            ) {
              let info = gl.getActiveAttrib(this.program, i)
              if (info && info.name == attribute.name) {
                assert(info.size == 1)
                switch (attribute.count) {
                  case 1: {
                    assert(info.type == gl.FLOAT)
                    break
                  }
                  case 2: {
                    assert(info.type == gl.FLOAT_VEC2)
                    break
                  }
                  case 3: {
                    assert(info.type == gl.FLOAT_VEC3)
                    break
                  }
                  case 4: {
                    assert(info.type == gl.FLOAT_VEC4)
                    break
                  }
                  default: {
                    assert(false)
                  }
                }
              }
            }
          }
        }
      }
      return this._program!
    }

    prepare(): void {
      this._context.gl.useProgram(this.program)
      for (let uniform of this._uniformsList) {
        uniform.prepare()
      }
    }

    _compileShader(gl: WebGLRenderingContext, type: GLenum, source: string) {
      let shader = gl.createShader(type)
      if (!shader) {
        throw new Error('Failed to create shader')
      }
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(`${gl.getShaderInfoLog(shader)}`)
      }
      if (!this._program) {
        throw new Error('Tried to attach shader before program was created')
      }
      gl.attachShader(this._program, shader)
    }

    static from(material: Graphics.Material): Material {
      assert(material == null || material instanceof Material)
      return material as Material
    }
  }

  class VertexBuffer extends Graphics.VertexBuffer {
    private readonly _context: Context
    private _generation = 0
    private _buffer: WebGLBuffer | null = null
    private _bytes: Uint8Array | null = null
    private _isDirty = true
    private _dirtyMin = VertexBuffer.INT_MAX
    private _dirtyMax = 0
    private _totalMin = VertexBuffer.INT_MAX
    private _totalMax = 0
    private _byteCount = 0

    constructor(context: Context, byteCount: number) {
      super()
      this._context = context
      this._byteCount = byteCount
      this._bytes = new Uint8Array(byteCount)
    }

    get context() {
      return this._context
    }
    get byteCount() {
      return this._byteCount
    }

    move(sourceByteOffset: number, targetByteOffset: number, byteCount: number) {
      assert(byteCount >= 0)
      assert(0 <= sourceByteOffset && sourceByteOffset + byteCount <= this._byteCount)
      assert(0 <= targetByteOffset && targetByteOffset + byteCount <= this._byteCount)

      if (this._bytes && sourceByteOffset != targetByteOffset && byteCount != 0) {
        this._bytes.set(this._bytes.subarray(sourceByteOffset, this._byteCount), targetByteOffset)
        this._growDirtyRegion(
          Math.min(sourceByteOffset, targetByteOffset),
          Math.max(sourceByteOffset, targetByteOffset) + byteCount,
        )
      }
    }

    upload(bytes: Uint8Array, byteOffset: number = 0) {
      assert(0 <= byteOffset && byteOffset + bytes.length <= this._byteCount)
      assert(this._bytes != null)
      this._bytes!.set(bytes, byteOffset)
      this._growDirtyRegion(byteOffset, byteOffset + bytes.length)
    }

    free() {
      if (this._buffer) {
        this._context.gl.deleteBuffer(this._buffer)
      }

      // Reset the generation to force this to be re-uploaded if it's used again
      // in the future.
      this._generation = 0
    }

    prepare(): void {
      let gl = this._context.gl

      if (this._generation !== this._context.generation) {
        this._buffer = gl.createBuffer()
        this._generation = this._context.generation
        this._isDirty = true
      }

      gl.bindBuffer(gl.ARRAY_BUFFER, this._buffer)

      if (this._isDirty) {
        gl.bufferData(gl.ARRAY_BUFFER, this._byteCount, gl.DYNAMIC_DRAW)
        this._dirtyMin = this._totalMin
        this._dirtyMax = this._totalMax
        this._isDirty = false
      }

      if (this._dirtyMin < this._dirtyMax) {
        gl.bufferSubData(
          gl.ARRAY_BUFFER,
          this._dirtyMin,
          this._bytes!.subarray(this._dirtyMin, this._dirtyMax),
        )
        this._dirtyMin = VertexBuffer.INT_MAX
        this._dirtyMax = 0
      }
    }

    _growDirtyRegion(min: number, max: number) {
      this._dirtyMin = Math.min(this._dirtyMin, min)
      this._dirtyMax = Math.max(this._dirtyMax, max)
      this._totalMin = Math.min(this._totalMin, min)
      this._totalMax = Math.max(this._totalMax, max)
    }

    static INT_MAX = 0x7fffffff

    static from(buffer: Graphics.VertexBuffer): VertexBuffer {
      assert(buffer == null || buffer instanceof VertexBuffer)
      return buffer as VertexBuffer
    }
  }

  class Texture implements Graphics.Texture {
    constructor(
      private readonly _context: Context,
      private _format: Graphics.TextureFormat,
      private _width: number,
      private _height: number,
      private _pixels: Uint8Array | null = null,
      private _texture: WebGLTexture | null = null,
      private _generation = 0,
      private _isFormatDirty = true,
      private _isContentDirty = true,
    ) {}

    get context() {
      return this._context
    }
    get format() {
      return this._format
    }
    get width() {
      return this._width
    }
    get height() {
      return this._height
    }

    resize(width: number, height: number, pixels: Uint8Array | null = null) {
      this._width = width
      this._height = height
      this._pixels = pixels
      this._isContentDirty = true
    }

    setFormat(format: Graphics.TextureFormat) {
      if (this._format != format) {
        this._format = format
        this._isFormatDirty = true
      }
    }

    get texture(): WebGLTexture {
      let gl = this._context.gl

      // Create
      if (this._generation != this._context.generation) {
        this._texture = gl.createTexture()
        this._generation = this._context.generation
        this._isFormatDirty = true
        this._isContentDirty = true
      }

      // Format
      if (this._isFormatDirty) {
        gl.bindTexture(gl.TEXTURE_2D, this._texture)
        gl.texParameteri(
          gl.TEXTURE_2D,
          gl.TEXTURE_MAG_FILTER,
          this.format.magFilter == Graphics.PixelFilter.NEAREST ? gl.NEAREST : gl.LINEAR,
        )
        gl.texParameteri(
          gl.TEXTURE_2D,
          gl.TEXTURE_MIN_FILTER,
          this.format.minFilter == Graphics.PixelFilter.NEAREST ? gl.NEAREST : gl.LINEAR,
        )
        gl.texParameteri(
          gl.TEXTURE_2D,
          gl.TEXTURE_WRAP_S,
          this.format.wrap == Graphics.PixelWrap.REPEAT ? gl.REPEAT : gl.CLAMP_TO_EDGE,
        )
        gl.texParameteri(
          gl.TEXTURE_2D,
          gl.TEXTURE_WRAP_T,
          this.format.wrap == Graphics.PixelWrap.REPEAT ? gl.REPEAT : gl.CLAMP_TO_EDGE,
        )
        this._isFormatDirty = false
      }

      if (this._isContentDirty) {
        gl.bindTexture(gl.TEXTURE_2D, this._texture)
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          this._width,
          this._height,
          0,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          this._pixels,
        )
        this._isContentDirty = false
      }

      return this._texture!
    }

    free() {
      if (this.texture) {
        this._context.gl.deleteTexture(this.texture)
        this._generation = 0
      }
    }

    static from(texture: Graphics.Texture): Texture {
      assert(texture == null || texture instanceof Texture)
      return texture as Texture
    }
  }

  class RenderTarget implements Graphics.RenderTarget {
    constructor(
      private _context: Context,
      private _texture: Texture,
      private _framebuffer: WebGLFramebuffer | null = null,
      private _generation = 0,
      private _isDirty = true,
      private _viewport = new Graphics.Rect(),
    ) {}

    get context() {
      return this._context
    }
    get texture() {
      return this._texture
    }
    get viewport() {
      return this._viewport
    }
    setColor(texture: Graphics.Texture) {
      if (this._texture != texture) {
        this._texture = Texture.from(texture)
        this._isDirty = true
      }
    }

    get framebuffer(): WebGLFramebuffer {
      let gl = this._context.gl
      let texture = this._texture.texture

      // Create
      if (this._generation != this._context.generation) {
        this._framebuffer = gl.createFramebuffer()
        this._generation = this._context.generation
        this._isDirty = true
      }

      // Update
      if (this._isDirty) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, this._framebuffer)
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)
        assert(gl.checkFramebufferStatus(gl.FRAMEBUFFER) == gl.FRAMEBUFFER_COMPLETE)
        this._isDirty = false
      }

      return this._framebuffer!
    }

    free() {
      if (this._framebuffer) {
        this._context.gl.deleteFramebuffer(this._framebuffer)
        this._generation = 0
      }
    }

    static from(renderTarget: Graphics.RenderTarget | null): RenderTarget | null {
      assert(renderTarget == null || renderTarget instanceof RenderTarget)
      return renderTarget as RenderTarget | null
    }
  }
}
