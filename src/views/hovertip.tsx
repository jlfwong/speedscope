import {Vec2} from '../lib/math'
import {Sizes, FontSize, FontFamily, ZIndex} from './style'
import {css, StyleSheet} from 'aphrodite'
import {ComponentChildren, h} from 'preact'
import {useTheme, withTheme} from './themes/theme'
import {useCallback, useRef, useEffect} from 'preact/hooks'
import { getWH } from '../gl/canvas-context'

interface HovertipProps {
  containerSize: Vec2
  offset: Vec2
  children?: ComponentChildren
}

export function Hovertip(props: HovertipProps) {
  const style = getStyle(useTheme())
  const hoverRef = useRef<HTMLDivElement | null>(null);
  const rafId = useRef<number | 0>(0);
  const {containerSize, offset} = props
  const containerWidth = containerSize.x
  const containerHeight = containerSize.y

  const OFFSET_FROM_MOUSE = 7

  const updateLocation = useCallback(
    () => {
      const el = hoverRef.current;
      if (!el) return

      const clientRect = getWH(el)

      // Place the hovertip to the right of the cursor.
      let leftEdgeX = offset.x + OFFSET_FROM_MOUSE

      // If this would cause it to overflow the container, align the right
      // edge of the hovertip with the right edge of the container.
      if (leftEdgeX + clientRect.width > containerWidth - 1) {
        leftEdgeX = containerWidth - clientRect.width - 1

        // If aligning the right edge overflows the container, align the left edge
        // of the hovertip with the left edge of the container.
        if (leftEdgeX < 1) {
          leftEdgeX = 1
        }
      }

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
        if (topEdgeY < 1) {
          topEdgeY = 1
        }
      }
      // translate3d will utilize GPU to render the tooltip standalone
      el.style.transform = `translate3d(${leftEdgeX}px, ${topEdgeY}px, 0)`;
    },
    [containerWidth, containerHeight, offset.x, offset.y],
  )

  // avoid update whole preact tree, faster
  useEffect(() => {
    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      rafId.current = 0;
      updateLocation();
    });
    return () => {
      if(rafId.current) {
        cancelAnimationFrame(rafId.current);
        rafId.current = 0;
      }
    }
  }, [updateLocation]);

  return (
    <div className={css(style.hoverTip)} ref={hoverRef} style={{position: 'fixed', willChange: 'transform', pointerEvents: 'none', transform: 'translate3d(-9999px, -9999px, 0)'}}>
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
