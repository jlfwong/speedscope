/**
 * @author mrdoob / http://mrdoob.com/
 * Heavily modified port of https://github.com/mrdoob/stats.js
 */

export class StatsPanel {
  private container: HTMLElement = document.createElement('div')
  private shown: number = 0
  private panels: Panel[] = []
  private msPanel: Panel = new Panel('MS', '#0f0', '#020')
  private fpsPanel: Panel = new Panel('FPS', '#0ff', '#002')

  constructor() {
    this.container.style.cssText = `
      position:fixed;
      bottom:0;
      right:0;
      cursor:pointer;
      opacity:0.9;
      z-index:10000
    `
    this.container.addEventListener('click', () => {
      this.showPanel((this.shown + 1) % this.panels.length)
    })
    this.addPanel(this.msPanel)
    this.addPanel(this.fpsPanel)
    document.body.appendChild(this.container)
  }

  addPanel(panel: Panel) {
    panel.appendTo(this.container)
    this.panels.push(panel)
    this.showPanel(this.panels.length - 1)
  }

  showPanel(id: number) {
    for (var i = 0; i < this.container.children.length; i++) {
      ;(this.container.children[i] as HTMLElement).style.display = i === id ? 'block' : 'none'
    }
    this.shown = id
  }

  private beginTime: number = 0
  begin() {
    this.beginTime = (performance || Date).now()
  }

  private frames = 0
  private prevTime = 0
  end() {
    this.frames++
    var time = (performance || Date).now()
    this.msPanel.update(time - this.beginTime, 200)

    if (time >= this.prevTime + 1000) {
      this.fpsPanel.update((this.frames * 1000) / (time - this.prevTime), 100)
      this.prevTime = time
      this.frames = 0
    }
  }
}

const PR = Math.round(window.devicePixelRatio || 1)

class Panel {
  private min: number = Infinity
  private max: number = 0
  private canvas: HTMLCanvasElement = document.createElement('canvas')
  private context = this.canvas.getContext('2d')!
  private WIDTH = 80 * PR
  private HEIGHT = 48 * PR
  private TEXT_X = 3 * PR
  private TEXT_Y = 2 * PR
  private GRAPH_X = 3 * PR
  private GRAPH_Y = 15 * PR
  private GRAPH_WIDTH = 74 * PR
  private GRAPH_HEIGHT = 30 * PR

  constructor(private name: string, private fg: string, private bg: string) {
    this.canvas.width = this.WIDTH
    this.canvas.height = this.HEIGHT
    this.canvas.style.cssText = 'width:80px;height:48px'

    this.context.font = 'bold ' + 9 * PR + 'px Helvetica,Arial,sans-serif'
    this.context.textBaseline = 'top'
    this.context.fillStyle = bg
    this.context.fillRect(0, 0, this.WIDTH, this.HEIGHT)
    this.context.fillStyle = fg
    this.context.fillText(this.name, this.TEXT_X, this.TEXT_Y)
    this.context.fillRect(this.GRAPH_X, this.GRAPH_Y, this.GRAPH_WIDTH, this.GRAPH_HEIGHT)
    this.context.fillStyle = bg
    this.context.globalAlpha = 0.9
    this.context.fillRect(this.GRAPH_X, this.GRAPH_Y, this.GRAPH_WIDTH, this.GRAPH_HEIGHT)
  }

  appendTo(el: HTMLElement) {
    el.appendChild(this.canvas)
  }

  update(value: number, maxValue: number) {
    this.min = Math.min(this.min, value)
    this.max = Math.max(this.max, value)

    this.context.fillStyle = this.bg
    this.context.globalAlpha = 1
    this.context.fillRect(0, 0, this.WIDTH, this.GRAPH_Y)
    this.context.fillStyle = this.fg
    this.context.fillText(
      Math.round(value) +
        ' ' +
        name +
        ' (' +
        Math.round(this.min) +
        '-' +
        Math.round(this.max) +
        ')',
      this.TEXT_X,
      this.TEXT_Y,
    )
    this.context.drawImage(
      this.canvas,
      this.GRAPH_X + PR,
      this.GRAPH_Y,
      this.GRAPH_WIDTH - PR,
      this.GRAPH_HEIGHT,
      this.GRAPH_X,
      this.GRAPH_Y,
      this.GRAPH_WIDTH - PR,
      this.GRAPH_HEIGHT,
    )
    this.context.fillRect(this.GRAPH_X + this.GRAPH_WIDTH - PR, this.GRAPH_Y, PR, this.GRAPH_HEIGHT)
    this.context.fillStyle = this.bg
    this.context.globalAlpha = 0.9
    this.context.fillRect(
      this.GRAPH_X + this.GRAPH_WIDTH - PR,
      this.GRAPH_Y,
      PR,
      Math.round((1 - value / maxValue) * this.GRAPH_HEIGHT),
    )
  }
}
