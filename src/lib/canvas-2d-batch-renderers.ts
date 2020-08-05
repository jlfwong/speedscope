// This file contains a collection of classes which make it easier to perform
// batch rendering of Canvas2D primitives. The advantage of this over just doing
// ctx.beginPath() ... ctx.rect(...) ... ctx.endPath() is that you can construct
// several different batch renderers are the same time, then decide on their
// paint order at the end.
//
// See FlamechartPanZoomView.renderOverlays for an example of how this is used.

export interface TextArgs {
  text: string
  x: number
  y: number
}

export class BatchCanvasTextRenderer {
  private argsBatch: TextArgs[] = []

  text(args: TextArgs) {
    this.argsBatch.push(args)
  }

  fill(ctx: CanvasRenderingContext2D, color: string) {
    if (this.argsBatch.length === 0) return
    ctx.fillStyle = color
    for (let args of this.argsBatch) {
      ctx.fillText(args.text, args.x, args.y)
    }
    this.argsBatch = []
  }
}

export interface RectArgs {
  x: number
  y: number
  w: number
  h: number
}

export class BatchCanvasRectRenderer {
  private argsBatch: RectArgs[] = []

  rect(args: RectArgs) {
    this.argsBatch.push(args)
  }

  private drawPath(ctx: CanvasRenderingContext2D) {
    ctx.beginPath()
    for (let args of this.argsBatch) {
      ctx.rect(args.x, args.y, args.w, args.h)
    }
    ctx.closePath()
    this.argsBatch = []
  }

  fill(ctx: CanvasRenderingContext2D, color: string) {
    if (this.argsBatch.length === 0) return
    ctx.fillStyle = color
    this.drawPath(ctx)
    ctx.fill()
  }

  stroke(ctx: CanvasRenderingContext2D, color: string, lineWidth: number) {
    if (this.argsBatch.length === 0) return
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth
    this.drawPath(ctx)
    ctx.stroke()
  }
}
