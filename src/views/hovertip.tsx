import {Vec2} from '../lib/math'
import {Sizes, FontSize, FontFamily, ZIndex} from './style'
import {css, StyleSheet} from 'aphrodite'
import {ComponentChildren, h} from 'preact'
import { useTheme, withTheme } from './themes/theme'

interface HovertipProps {
  containerSize: Vec2
  offset: Vec2
  children?: ComponentChildren
}

export function Hovertip(props: HovertipProps) {
    const style = getStyle(useTheme())

    const {containerSize, offset} = props
    const width = containerSize.x
    const height = containerSize.y

    const positionStyle: {[key: string]: number} = {}

    const OFFSET_FROM_MOUSE = 7
    if (offset.x + OFFSET_FROM_MOUSE + Sizes.TOOLTIP_WIDTH_MAX < width) {
      positionStyle.left = offset.x + OFFSET_FROM_MOUSE
    } else {
      positionStyle.right = width - offset.x + 1
    }

    if (offset.y + OFFSET_FROM_MOUSE + Sizes.TOOLTIP_HEIGHT_MAX < height) {
      positionStyle.top = offset.y + OFFSET_FROM_MOUSE
    } else {
      positionStyle.bottom = height - offset.y + 1
    }

    return (
      <div className={css(style.hoverTip)} style={positionStyle}>
        <div className={css(style.hoverTipRow)}>{props.children}</div>
      </div>
    )
}

const HOVERTIP_PADDING = 2

const getStyle = withTheme(theme => StyleSheet.create({
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
}))