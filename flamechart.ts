import {Profile, Frame, CallTreeNode} from './profile'

interface FlamechartFrame {
  node: CallTreeNode
  start: number
  end: number
  parent: FlamechartFrame | null
  children: FlamechartFrame[]
}

type StackLayer = FlamechartFrame[]

export class Flamechart {
  // Bottom to top
  private layers: StackLayer[] = []
  private duration: number = 0
  private minFrameWidth: number = 1

  private frameColors = new Map<Frame, [number, number, number]>()

  getDuration() { return this.duration }
  getLayers() { return this.layers }
  getFrameColors() { return this.frameColors }
  getMinFrameWidth() { return this.minFrameWidth }

  private appendFrame(layerIndex: number, node: CallTreeNode, timeDelta: number, parent: FlamechartFrame | null) {
    while (layerIndex >= this.layers.length) this.layers.push([])
    const flamechartFrame: FlamechartFrame = {
      node: node,
      start: this.duration,
      end: this.duration + timeDelta,
      parent,
      children: []
    }
    this.layers[layerIndex].push(flamechartFrame)
    if (parent) {
      parent.children.push(flamechartFrame)
    }
    return flamechartFrame
  }

  private appendSample(stack: CallTreeNode[], timeDelta: number) {
    let parent: FlamechartFrame | null = null
    for (let i = 0; i < stack.length; i++) {
      parent = this.appendFrame(i, stack[i], timeDelta, parent)
    }
    this.duration += timeDelta
  }

  private static shouldMergeFrames(first: FlamechartFrame, second: FlamechartFrame): boolean {
    if (first.node !== second.node) return false
    if (first.parent !== second.parent) return false
    if (first.end !== second.start) return false
    return true
  }

  private static mergeFrames(first: FlamechartFrame, second: FlamechartFrame): FlamechartFrame {
    const frame: FlamechartFrame = {
      node: first.node,
      start: first.start,
      end: second.end,
      parent: first.parent,
      children: first.children.concat(second.children)
    }
    for (let child of frame.children) {
      child.parent = frame
    }
    return frame
  }

  private static mergeAdjacentFrames(layer: StackLayer): StackLayer {
    const ret: StackLayer = []
    for (let flamechartFrame of layer) {
      const prev = ret.length > 0 ? ret[ret.length - 1] : null
      if (prev && Flamechart.shouldMergeFrames(prev, flamechartFrame)) {
        ret.pop()
        ret.push(Flamechart.mergeFrames(prev, flamechartFrame))
      } else {
        ret.push(flamechartFrame)
      }
    }
    return ret
  }

  private selectFrameColors(profile: Profile) {
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

    this.profile.forEachFrame(f => frames.push(f))
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

  constructor(private profile: Profile) {
    profile.forEachSample(this.appendSample.bind(this))
    this.layers = this.layers.map(Flamechart.mergeAdjacentFrames)
    this.minFrameWidth = Infinity
    for (let layer of this.layers) {
      for (let frame of layer) {
        this.minFrameWidth = Math.min(this.minFrameWidth, frame.end - frame.start)
      }
    }
    this.selectFrameColors(profile)
  }
}