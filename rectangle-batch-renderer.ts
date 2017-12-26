import * as regl from 'regl'
import { Rect, Vec2, AffineTransform } from './math'
import { vec2, vec3 } from 'regl'

export interface RectangleBatchRendererProps {
  configSpaceToNDC: AffineTransform
  physicalSize: Vec2
}

export const rectangleBatchRenderer = (ctx: WebGLRenderingContext, rects: Rect[], colors: vec3[], strokeSize = 1) => {
  const positions: vec2[] = []
  const physicalSpaceOffsets: vec2[] = []
  const vertexColors: vec3[] = []

  const offset = {
    topLeft: new Vec2(strokeSize, -strokeSize),
    topRight: new Vec2(-strokeSize, -strokeSize),
    bottomRight: new Vec2(-strokeSize, strokeSize),
    bottomLeft: new Vec2(strokeSize, strokeSize)
  }

  const addRectangle = (r: Rect, color: vec3) => {
    function addVertex(v: Vec2, offset: Vec2) {
      positions.push(v.flatten())
      physicalSpaceOffsets.push(offset.flatten())
      vertexColors.push(color)
    }

    // 0 +--+ 1
    //   | /|
    //   |/ |
    // 3 +--+ 2

    addVertex(r.topLeft(), offset.topLeft)
    addVertex(r.bottomLeft(), offset.bottomLeft)
    addVertex(r.topRight(), offset.topRight)

    addVertex(r.bottomLeft(), offset.bottomLeft)
    addVertex(r.topRight(), offset.topRight)
    addVertex(r.bottomRight(), offset.bottomRight)
  }

  for (let i = 0; i < rects.length; i++) {
    addRectangle(rects[i], colors[i])
  }

  return regl(ctx)<RectangleBatchRendererProps>({
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

    frag: `
      precision mediump float;
      varying vec3 vColor;
      void main() {
        gl_FragColor = vec4(vColor, 1);
      }
    `,

    attributes: {
      position: positions,
      physicalSpaceOffset: physicalSpaceOffsets,
      color: vertexColors
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

    count: vertexColors.length
  })
}