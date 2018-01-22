import * as regl from 'regl'
import { Rect, Vec2, AffineTransform } from './math'
import { vec3 } from 'regl'

export interface RectangleBatchRendererProps {
  configSpaceToNDC: AffineTransform
  physicalSize: Vec2
}

export const rectangleBatchRenderer = (gl: regl.Instance, rects: Rect[], colors: vec3[], strokeSize = 1) => {
  const positions = new Float32Array(rects.length * 6 * 2)
  const physicalSpaceOffsets = new Float32Array(rects.length * 6 * 2)
  const vertexColors = new Float32Array(rects.length * 6 * 3)

  const offset = {
    topLeft: new Vec2(strokeSize, -strokeSize),
    topRight: new Vec2(-strokeSize, -strokeSize),
    bottomRight: new Vec2(-strokeSize, strokeSize),
    bottomLeft: new Vec2(strokeSize, strokeSize)
  }

  let vertexIndex = 0
  function addVertex(y: number, x: number, offset: Vec2, color: vec3) {
    const index = vertexIndex++
    positions[index * 2] = x
    positions[index * 2 + 1] = y
    physicalSpaceOffsets[index * 2] = offset.x
    physicalSpaceOffsets[index * 2 + 1] = offset.y
    vertexColors[index * 3] = color[0]
    vertexColors[index * 3 + 1] = color[1]
    vertexColors[index * 3 + 2] = color[2]
  }

  for (let i = 0; i < rects.length; i++) {
    const r = rects[i]
    const color = colors[i]

    const top = r.top()
    const bottom = r.bottom()
    const left = r.left()
    const right = r.right()

    // 2 disjoint triangles.
    //
    // 0 +--+ 1
    //   | /|
    //   |/ |
    // 3 +--+ 2
    addVertex(top, left, offset.topLeft, color)
    addVertex(bottom, left, offset.bottomLeft, color)
    addVertex(top, right, offset.topRight, color)

    addVertex(bottom, left, offset.bottomLeft, color)
    addVertex(top, right, offset.topRight, color)
    addVertex(bottom, right, offset.bottomRight, color)
  }

  return gl<RectangleBatchRendererProps>({
    vert: `
      uniform mat3 configSpaceToNDC;
      uniform vec2 physicalSize;
      attribute vec2 position;
      attribute vec3 color;
      attribute vec2 physicalSpaceOffset;
      varying vec3 vColor;
      void main() {
        vColor = color;
        vec2 roundedPosition = (configSpaceToNDC * vec3(position.xy, 1)).xy;
        vec2 halfSize = physicalSize / 2.0;
        vec2 physicalPixelSize = 2.0 / physicalSize;
        roundedPosition = floor(roundedPosition * halfSize) / halfSize;
        gl_Position = vec4(roundedPosition + physicalPixelSize * physicalSpaceOffset, 0, 1);
      }
    `,

    depth: {
      enable: false
    },

    frag: `
      precision mediump float;
      varying vec3 vColor;
      void main() {
        gl_FragColor = vec4(vColor, 1);
      }
    `,

    attributes: {
      position: {
        buffer: gl.buffer(positions),
        offset: 0,
        stride: 2 * 4,
        size: 2
      },
      physicalSpaceOffset: {
        buffer: gl.buffer(physicalSpaceOffsets),
        offset: 0,
        stride: 2 * 4,
        size: 2
      },
      color: {
        buffer: gl.buffer(vertexColors),
        offset: 0,
        stride: 3 * 4,
        size: 3
      }
    },

    uniforms: {
      configSpaceToNDC: (context, props) => {
        return props.configSpaceToNDC.flatten()
      },
      physicalSize: (context, props) => {
        return props.physicalSize.flatten()
      }
    },

    primitive: 'triangles',

    count: vertexColors.length / 3
  })
}