import {Profile, Frame} from './profile'
import regl, {ReglCommandConstructor} from 'regl'

interface FlamechartFrame {
  frame: Frame
  start: number
  end: number
}

type StackLayer = FlamechartFrame[]

export class Flamechart {
  // Bottom to top
  private layers: StackLayer[] = []

  private duration: number = 0

  private getLayers() { return this.layers }

  private appendFrame(layerIndex: number, frame: Frame, timeDelta: number) {
    while (layerIndex <= this.layers.length) this.layers.push([])
    this.layers[layerIndex].push({
      frame: frame,
      start: this.duration,
      end: this.duration + timeDelta
    })
  }

  private appendSample(stack: Frame[], timeDelta: number) {
    for (let i = 0; i < stack.length; i++) {
      this.appendFrame(i, stack[i], timeDelta)
    }
    this.duration += timeDelta
  }

  private static mergeAdjacentFrames(layer: StackLayer): StackLayer {
    const ret: StackLayer = []
    for (let flamechartFrame of layer) {
      const prev = ret.length > 0 ? ret[ret.length - 1] : null
      if (prev && prev.frame === flamechartFrame.frame && prev.end === flamechartFrame.start) {
        prev.end = flamechartFrame.end
      } else {
        ret.push(flamechartFrame)
      }
    }
    return ret
  }

  constructor(private profile: Profile) {
    profile.forEachSample(this.appendSample.bind(this))
    this.layers = this.layers.map(Flamechart.mergeAdjacentFrames)
  }
}

interface Rect {
  left: number
  top: number
  width: number
  height: number
}

type vec2 = [number, number]
type vec3 = [number, number, number]
type mat3 = [number, number, number, number, number, number, number, number, number]

export const rectangleBatchRenderer = (ctx: WebGLRenderingContext, rects: Rect[], colors: vec3[]) => {
  const gl = regl(ctx)

  const positions: vec2[] = []
  const vertexColors: vec3[] = []

  const addRectangle = (r: Rect, color: [number, number, number]) => {
    const NW: [number, number] = [r.left, r.top]
    const NE: [number, number] = [r.left + r.width, r.top]
    const SW: [number, number] = [r.left, r.top + r.height]
    const SE: [number, number] = [r.left + r.width, r.top + r.height]

    positions.push(NW)
    positions.push(SW)
    positions.push(NE)

    positions.push(SW)
    positions.push(NE)
    positions.push(SE)

    for (let i = 0; i < 6; i++) vertexColors.push(color)
  }

  for (let i = 0; i < rects.length; i++) addRectangle(rects[i], colors[i])

  return gl<{
    configSpaceToNDC: mat3
  }>({
    vert: `
      uniform mat3 configSpaceToNDC;
      attribute vec2 position;
      attribute vec3 color;
      varying vec3 vColor;
      void main() {
        vColor = color;
        gl_Position = vec4((configSpaceToNDC * vec3(position, 1)).xy, 0, 1);
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
      color: vertexColors
    },

    uniforms: {
      configSpaceToNDC: (context, props) => {
        return props.configSpaceToNDC
      }
    },

    primitive: 'triangles',

    count: colors.length
  })
}