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
  color?: string
}

export class BatchCanvasTextRenderer {
  private argsBatch: TextArgs[] = []

  text(args: TextArgs) {
    this.argsBatch.push(args)
  }

  clean() {
    this.argsBatch = []
  }

  fill(ctx: CanvasRenderingContext2D, defaultColor: string) {
    if (this.argsBatch.length === 0) return
    for (let args of this.argsBatch) {
      ctx.fillStyle = args.color ?? defaultColor
      ctx.fillText(args.text, args.x, args.y)
    }
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

  clean() {
    this.argsBatch = []
  }

  private drawPath(ctx: CanvasRenderingContext2D) {
    ctx.beginPath()
    for (let args of this.argsBatch) {
      ctx.rect(args.x, args.y, args.w, args.h)
    }
    ctx.closePath()
  }

  fill(ctx: CanvasRenderingContext2D, color: string) {
    if (this.argsBatch.length === 0) return
    ctx.fillStyle = color
    this.drawPath(ctx)
    ctx.fill()
  }

  columnFill(ctx: CanvasRenderingContext2D, color: string) {
    if (this.argsBatch.length === 0) return
    // group by column
    const buckets = new Map<number, {minY: number, maxY: number}>();
    for (let args of this.argsBatch) {
      const startCol = Math.floor(args.x);
      const endCol = Math.floor(args.x + args.w);
      for (let x = startCol; x  <= endCol; x ++) {
        let bucket = buckets.get(x);
        if (!bucket) {
          bucket = {minY: Infinity, maxY: -Infinity};
          buckets.set(x, bucket);
        }
        bucket.minY = Math.min(bucket.minY, args.y);
        bucket.maxY = Math.max(bucket.maxY, args.y + args.h);
      }
    }
    // render
    ctx.beginPath();
    ctx.fillStyle = color;
    for (const [x, {minY, maxY}] of buckets) {
      if(minY < Infinity) {
        // merge all nodes in same column, render it as single rect
        ctx.rect(x, minY, 1, maxY - minY);
      }
    }
    ctx.fill();
    ctx.closePath();
  }

  stroke(ctx: CanvasRenderingContext2D, color: string, lineWidth: number) {
    if (this.argsBatch.length === 0) return
    ctx.strokeStyle = color
    ctx.lineWidth = lineWidth
    this.drawPath(ctx)
    ctx.stroke()
  }
}
