import {Vec2} from '../lib/math'
import {Sizes, FontSize, FontFamily, ZIndex} from './style'
import {css, StyleSheet} from 'aphrodite'
import {ComponentChildren, h} from 'preact'
import {useTheme, withTheme} from './themes/theme'
import { useCallback } from 'preact/hooks'

interface HovertipProps {
  containerSize: Vec2
  offset: Vec2
  children?: ComponentChildren
}

export function Hovertip(props: HovertipProps) {
  const style = getStyle(useTheme())

  const {containerSize, offset} = props
  const containerWidth = containerSize.x
  const containerHeight = containerSize.y

  const OFFSET_FROM_MOUSE = 7

  const updateLocation = useCallback((el: HTMLDivElement | null) => {
    if (!el) return

    const clientRect = el.getBoundingClientRect()

    // Place the hovertip to the right of the cursor.
    let leftEdgeX = offset.x + OFFSET_FROM_MOUSE

    // If this would cause it to overflow the container, align the right
    // edge of the hovertip with the right edge of the container.
    if (leftEdgeX + clientRect.width > containerWidth - 1) {
      leftEdgeX = containerWidth - clientRect.width - 1

      // If aligning the right edge overflows the container, align the left edge
      // of the hovertip with the left edge of the container.
      if (leftEdgeX < 1) { leftEdgeX = 1 }
    }
    el.style.left = `${leftEdgeX}px`

    // Place the tooltip below the cursor
    let topEdgeY = offset.y + OFFSET_FROM_MOUSE

    // If this would cause it to overflow the container, place the hovertip
    // above the cursor instead. This intentionally differs from the horizontal
    // axis logic to avoid the cursor being in the middle of a hovertip when
    // possible.
    if (topEdgeY + clientRect.height > containerHeight - 1) {
      topEdgeY = offset.y - clientRect.height - 1

      // If placing the hovertip above the cursor overflows the container, align
      // the top edge of the hovertip with the top edge of the container.
      if (topEdgeY < 1) { topEdgeY = 1 }
    }
    el.style.top = `${topEdgeY}px`

  }, [containerWidth, containerHeight, offset.x, offset.y])

  return (
    <div className={css(style.hoverTip)} ref={updateLocation}>
      <div className={css(style.hoverTipRow)}>{props.children}</div>
    </div>
  )
}

const HOVERTIP_PADDING = 2

const getStyle = withTheme(theme =>
  StyleSheet.create({
    hoverTip: {
      position: 'absolute',
      background: theme.bgPrimaryColor,
      border: '1px solid black',
      maxWidth: Sizes.TOOLTIP_WIDTH_MAX,
      paddingTop: HOVERTIP_PADDING,
      paddingBottom: HOVERTIP_PADDING,
      pointerEvents: 'none',
      userSelect: 'none',
      fontSize: FontSize.LABEL,
      fontFamily: FontFamily.MONOSPACE,
      zIndex: ZIndex.HOVERTIP,
    },
    hoverTipRow: {
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      overflowX: 'hidden',
      paddingLeft: HOVERTIP_PADDING,
      paddingRight: HOVERTIP_PADDING,
      maxWidth: Sizes.TOOLTIP_WIDTH_MAX,
    },
  }),
)
