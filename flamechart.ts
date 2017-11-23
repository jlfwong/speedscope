import {Profile, Frame} from './profile'

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