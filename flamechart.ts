import {Profile, Frame, CallTreeNode} from './profile'

import { lastOf } from './utils'

interface FlamechartFrame {
  node: CallTreeNode
  start: number
  end: number
  parent: FlamechartFrame | null
  children: FlamechartFrame[]
}

type StackLayer = FlamechartFrame[]

interface FlamechartDataSource {
  getTotalWeight(): number

  forEachCall(
    openFrame: (node: CallTreeNode, value: number) => void,
    closeFrame: (value: number) => void
  ): void

  forEachFrame(fn: (frame: Frame) => void): void
}

export class Flamechart {
  // Bottom to top
  private layers: StackLayer[] = []
  private totalWeight: number = 0
  private minFrameWidth: number = 1

  private frameColors = new Map<Frame, [number, number, number]>()

  getTotalWeight() { return this.totalWeight }
  getLayers() { return this.layers }
  getFrameColors() { return this.frameColors }
  getMinFrameWidth() { return this.minFrameWidth }

  // TODO(jlfwong): Move this a color generation file
  private selectFrameColors(source: FlamechartDataSource) {
    const frames: Frame[] = []

    function parts(f: Frame) {
      return (f.file || '').split('/').concat(f.name.split(/\W/))
    }

    function compare(a: Frame, b: Frame) {
      const aParts = parts(a)
      const bParts = parts(b)

      const minLength = Math.min(aParts.length, bParts.length)

      let prefixMatchLength = 0
      for (let i = 0; i < minLength; i++) {
        if (aParts[i] === bParts[i]) prefixMatchLength++
        else break
      }

      // Weight matches at the beginning of the string more heavily
      const score = Math.pow(0.90, prefixMatchLength)

      return aParts.join() > bParts.join() ? score : -score
    }

    this.source.forEachFrame(f => frames.push(f))
    frames.sort(compare)

    const cumulativeScores: number[] = []
    let lastScore = 0
    for (let i = 0; i < frames.length; i++) {
      const score = lastScore + Math.abs(compare(frames[i], frames[(i + 1)%frames.length]))
      cumulativeScores.push(score)
      lastScore = score
    }

    // We now have a sorted list of frames s.t. frames with similar
    // file paths and method names are clustered together.
    //
    // Now, to assign them colors, we map normalized cumulative
    // score values onto the full range of hue values.
    const hues: number[] = []
    const totalScore = cumulativeScores[cumulativeScores.length - 1] || 1
    for (let i = 0; i < cumulativeScores.length; i++) {
      hues.push(360 * cumulativeScores[i] / totalScore)
    }

    for (let i = 0; i < hues.length; i++) {
      const H = hues[i]

      const delta = 0.20 * Math.random() - 0.1
      const C = 0.20 + delta
      const Y = 0.85 - delta

      // TODO(jlfwong): Move this into color routines in a different file
      // https://en.wikipedia.org/wiki/HSL_and_HSV#From_luma/chroma/hue

      const hPrime = H / 60
      const X = C * (1 - Math.abs(hPrime % 2 - 1))
      const [R1, G1, B1] = (
        hPrime < 1 ? [C, X, 0] :
        hPrime < 2 ? [X, C, 0] :
        hPrime < 3 ? [0, C, X] :
        hPrime < 4 ? [0, X, C] :
        hPrime < 5 ? [X, 0, C] :
        [C, 0, X]
      )

      const m = Y - (0.30 * R1 + 0.59 * G1 + 0.11 * B1)
      this.frameColors.set(frames[i], [R1 + m, G1 + m, B1 + m])
    }
  }

  constructor(private source: FlamechartDataSource) {
    const stack: FlamechartFrame[] = []
    const openFrame = (node: CallTreeNode, value: number) => {
      const parent = lastOf(stack)
      const frame: FlamechartFrame = {
        node,
        parent,
        children: [],
        start: value,
        end: value,
      }
      if (parent) {
        parent.children.push(frame)
      }
      stack.push(frame)
    }

    this.minFrameWidth = Infinity
    const closeFrame = (value: number) => {
      console.assert(stack.length > 0)
      const stackTop = stack.pop()!
      stackTop.end = value
      const layerIndex = stack.length
      while (this.layers.length <= layerIndex) this.layers.push([])
      this.layers[layerIndex].push(stackTop)
      this.minFrameWidth = Math.min(this.minFrameWidth, stackTop.end - stackTop.start)
    }

    this.totalWeight = source.getTotalWeight()
    source.forEachCall(openFrame, closeFrame)
    this.selectFrameColors(source)
  }
}