import {h, render, Component} from 'preact'
import {StyleSheet, css} from 'aphrodite'

import {Profile, Frame} from './profile'
import regl, {vec2, vec3, mat3, ReglCommand, ReglCommandConstructor} from 'regl'
import { Rect, Vec2, AffineTransform } from './math'

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

  getDuration() { return this.duration }
  getLayers() { return this.layers }

  private appendFrame(layerIndex: number, frame: Frame, timeDelta: number) {
    while (layerIndex >= this.layers.length) this.layers.push([])
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

interface FlamechartViewProps {
  flamechart: Flamechart
}

export class FlamechartView extends Component<FlamechartViewProps, void> {
  renderer: ReglCommand<RectangleBatchRendererProps> | null = null
  canvas: HTMLCanvasElement | null = null

  canvasRef = (element?: Element) => {
    if (element) {
      const {flamechart} = this.props
      const rects: Rect[] = []
      const colors: vec3[] = []

      const layers = flamechart.getLayers()
      const duration = flamechart.getDuration()
      const maxStackHeight = layers.length

      for (let i = 0; i < layers.length; i++) {
        const layer = layers[i]
        for (let frame of layer) {
          rects.push(new Rect(
            new Vec2(frame.start, i),
            new Vec2(frame.end - frame.start, 1)
          ))
          colors.push([Math.random(), Math.random(), 0])
        }
      }

      this.canvas = element as HTMLCanvasElement
      const ctx = this.canvas.getContext('webgl')!
      this.renderer = rectangleBatchRenderer(ctx, rects, colors)
      this.renderGL()
    }
  }

  renderGL() {
    if (this.renderer && this.canvas) {
      const {flamechart} = this.props
      const layers = flamechart.getLayers()
      const duration = flamechart.getDuration()
      const maxStackHeight = layers.length

      const viewportWidth = this.canvas.width
      const viewportHeight = this.canvas.height

      let viewSpaceToNDC = AffineTransform
        .withScale(new Vec2(2 / viewportWidth, -2 / viewportHeight))
        .withTranslation(new Vec2(-1, 1))

      const configSpaceFrameHeight = 1
      const viewSpaceFrameHeight = 16
      const ndcFrameHeight = viewSpaceFrameHeight * viewSpaceToNDC.getScale().y

      let configSpaceToViewSpace = AffineTransform.withScale(new Vec2(viewportWidth / duration, 16))

      console.log(viewSpaceToNDC.times(configSpaceToViewSpace))

      this.renderer({
        configSpaceToNDC: viewSpaceToNDC.times(configSpaceToViewSpace)
      })
    }
  }

  render() {
    const width = window.innerWidth
    const height = window.innerHeight
    return <canvas width={width} height={height} ref={this.canvasRef} className={css(style.fullscreen)}></canvas>
  }
}

const style = StyleSheet.create({
  fullscreen: {
    width: '100vw',
    height: '100vh',
  }
})


interface RectangleBatchRendererProps {
  configSpaceToNDC: AffineTransform
}

export const rectangleBatchRenderer = (ctx: WebGLRenderingContext, rects: Rect[], colors: vec3[]) => {
  const positions: vec2[] = []
  const vertexColors: vec3[] = []

  const addRectangle = (r: Rect, color: vec3) => {
    function addVertex(v: Vec2) {
      positions.push(v.flatten())
      vertexColors.push(color)
    }

    addVertex(r.topLeft())
    addVertex(r.bottomLeft())
    addVertex(r.topRight())

    addVertex(r.bottomLeft())
    addVertex(r.topRight())
    addVertex(r.bottomRight())
  }

  for (let i = 0; i < rects.length; i++) {
    addRectangle(rects[i], colors[i])
  }

  return regl(ctx)<RectangleBatchRendererProps>({
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
        return props.configSpaceToNDC.flatten()
      }
    },

    primitive: 'triangles',

    count: vertexColors.length
  })
}