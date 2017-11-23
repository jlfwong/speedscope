import {h, render, Component} from 'preact'
import {StyleSheet, css} from 'aphrodite'

import {importFromStackprof} from './stackprof'
import {Flamechart, rectangleBatchRenderer} from './flamechart'

import { request } from 'https';

interface Rect {
  left: number
  top: number
  width: number
  height: number
}

class Canvas extends Component<{}, void> {
  canvasRef = (element?: Element) => {
    if (element) {
      const rectangles: Rect[] = []
      const colors: [number, number, number][] = []

      for (let i = 0; i < 1000; i++) {
        rectangles.push({
          left: 2 * Math.random() - 1,
          top: 2 * Math.random() - 1,
          width: 2 * Math.random(),
          height: 2 * Math.random(),
        })
        colors.push([Math.random(), Math.random(), Math.random()])
      }
      const renderer = rectangleBatchRenderer((element as HTMLCanvasElement).getContext('webgl')!, rectangles, colors)

      ;(function doit() {
        renderer({
          configSpaceToNDC: [
            1, 0, 0,
            0, 1, 0,
            0, 0, 1,
          ]
        })
        requestAnimationFrame(doit)
      })()
    }
  }

  render() {
    const width = window.innerWidth
    const height = window.innerHeight
    return <canvas width={width} height={height} ref={this.canvasRef} className={css(style.root)}></canvas>
  }
}

class Application extends Component<{}, void> {
  onDrop = (ev: DragEvent) => {
    const reader = new FileReader
    reader.addEventListener('loadend', () => {
      console.log(importFromStackprof(reader.result))
    })
    reader.readAsText(ev.dataTransfer.files.item(0))
    ev.preventDefault()
  }

  onDragOver = (ev: DragEvent) => {
    ev.preventDefault()
  }

  render() {
    return <div onDrop={this.onDrop} onDragOver={this.onDragOver} className={css(style.root)}>
      <Canvas />
    </div>
  }
}

const style = StyleSheet.create({
  root: {
    width: '100vw',
    height: '100vh',
    overflow: 'hidden'
  }
})

render(<Application />, document.body)