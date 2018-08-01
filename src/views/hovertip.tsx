import {Vec2} from '../lib/math'
import {Sizes, Colors, FontSize, FontFamily, ZIndex} from './style'
import {css, StyleSheet} from 'aphrodite'
import {h, Component} from 'preact'

interface HovertipProps {
  containerSize: Vec2
  offset: Vec2
}

export class Hovertip extends Component<HovertipProps, {}> {
  render() {
    const {containerSize, offset} = this.props
    const width = containerSize.x
    const height = containerSize.y

    const positionStyle: {
      left?: number
      right?: number
      top?: number
      bottom?: number
    } = {}

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
        <div className={css(style.hoverTipRow)}>{this.props.children}</div>
      </div>
    )
  }
}

const HOVERTIP_PADDING = 2

const style = StyleSheet.create({
  hoverTip: {
    position: 'absolute',
    background: Colors.WHITE,
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
})
