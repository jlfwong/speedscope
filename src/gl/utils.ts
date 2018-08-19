import {Graphics} from './graphics'
import {AffineTransform, Vec2} from '../lib/math'

export function setUniformAffineTransform(
  material: Graphics.Material,
  name: string,
  transform: AffineTransform,
) {
  let {m00, m01, m02, m10, m11, m12} = transform
  material.setUniformMat3(name, m00, m01, m02, m10, m11, m12, 0, 0, 1)
}
export function setUniformVec2(material: Graphics.Material, name: string, vec: Vec2) {
  material.setUniformVec2(name, vec.x, vec.y)
}

export function renderInto(gl: Graphics.Context, target: Graphics.RenderTarget, cb: () => void) {
  gl.setRenderTarget(target)
  gl.setViewport(0, 0, target.texture.width, target.texture.height)
  cb()
  gl.setRenderTarget(null)
}
