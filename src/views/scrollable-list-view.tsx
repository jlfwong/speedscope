// A simple implementation of an efficient scrolling list view which
// renders only items within the viewport + a couple extra items.

import {h, JSX} from 'preact'
import {useState, useCallback, useRef, useMemo, useEffect} from 'preact/hooks'

export interface ListItem {
  size: number
}

interface RangeResult {
  firstVisibleIndex: number
  lastVisibleIndex: number
  invisiblePrefixSize: number
}

interface ScrollableListViewProps {
  items: ListItem[]
  axis: 'x' | 'y'
  renderItems: (
    firstVisibleIndex: number,
    lastVisibleIndex: number,
  ) => JSX.Element | JSX.Element[] | null
  className?: string
  initialIndexInView?: number | null
}

export const ScrollableListView = ({
  items,
  axis,
  renderItems,
  className,
  initialIndexInView,
}: ScrollableListViewProps) => {
  const [viewportSize, setViewportSize] = useState<number | null>(null)
  const [viewportScrollOffset, setViewportScrollOffset] = useState<number>(0)

  const viewportRef = useRef<HTMLDivElement | null>(null)

  const widthOrHeight = axis === 'x' ? 'width' : 'height'
  const leftOrTop = axis === 'x' ? 'left' : 'top'
  const scrollLeftOrScrollTop = axis === 'x' ? 'scrollLeft' : 'scrollTop'

  // This is kind of a weird hack, but I'm not sure what the better of doing something like this is.
  const offset = initialIndexInView
    ? items.reduce((a, b, i) => (i < initialIndexInView ? a + b.size : a), 0)
    : 0
  const initialScroll = useRef<number | null>(offset)

  const viewportCallback = useCallback(
    (viewport: HTMLDivElement | null) => {
      if (viewport) {
        requestAnimationFrame(() => {
          setViewportSize(viewport.getBoundingClientRect()[widthOrHeight])
          if (initialScroll.current != null) {
            viewport.scrollTo({[leftOrTop]: initialScroll.current})
            initialScroll.current = null
          }
        })
      } else {
        setViewportSize(null)
      }
      viewportRef.current = viewport
    },
    [setViewportSize, widthOrHeight, leftOrTop],
  )

  const rangeResult: RangeResult | null = useMemo(() => {
    if (viewportRef.current == null || viewportSize == null || viewportScrollOffset == null) {
      return null
    }

    // We render items up to a quarter viewport height outside of the
    // viewport both above and below to prevent flickering.
    const minY = viewportScrollOffset - viewportSize / 4
    const maxY = viewportScrollOffset + viewportSize + viewportSize / 4

    let total = 0
    let invisiblePrefixSize = 0

    let i = 0
    for (; i < items.length; i++) {
      const item = items[i]
      invisiblePrefixSize = total
      total += item.size
      if (total >= minY) {
        break
      }
    }

    const firstVisibleIndex = i

    for (; i < items.length; i++) {
      const item = items[i]
      total += item.size
      if (total >= maxY) {
        break
      }
    }

    const lastVisibleIndex = Math.min(i, items.length - 1)

    return {
      firstVisibleIndex,
      lastVisibleIndex,
      invisiblePrefixSize,
    }
  }, [viewportSize, viewportScrollOffset, items])

  const totalSize = useMemo(() => items.reduce((a, b) => a + b.size, 0), [items])

  const onViewportScroll = useCallback(() => {
    if (viewportRef.current != null) {
      setViewportScrollOffset(viewportRef.current[scrollLeftOrScrollTop])
    }
  }, [scrollLeftOrScrollTop])

  useEffect(() => {
    const resizeListener = () => {
      if (viewportRef.current != null) {
        setViewportSize(viewportRef.current.getBoundingClientRect()[widthOrHeight])
      }
    }

    window.addEventListener('resize', resizeListener)
    return () => {
      window.removeEventListener('resize', resizeListener)
    }
  }, [widthOrHeight])

  const visibleItems = useMemo(() => {
    return rangeResult
      ? renderItems(rangeResult.firstVisibleIndex, rangeResult.lastVisibleIndex)
      : null
  }, [renderItems, rangeResult])

  const content = useMemo(() => {
    return (
      <div style={{height: totalSize}}>
        <div style={{transform: `translateY(${rangeResult?.invisiblePrefixSize || 0}px)`}}>
          {visibleItems}
        </div>
      </div>
    )
  }, [rangeResult, visibleItems, totalSize])

  return (
    <div className={className} ref={viewportCallback} onScroll={onViewportScroll}>
      {content}
    </div>
  )
}
