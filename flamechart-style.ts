import {StyleSheet} from 'aphrodite'
import { FontFamily, FontSize, Colors } from './style'

const HOVERTIP_PADDING = 2

export namespace Sizes {
  export const MINIMAP_HEIGHT = 100
  export const TOOLTIP_WIDTH_MAX = 300
  export const TOOLTIP_HEIGHT_MAX = 75
  export const SEPARATOR_HEIGHT = 2
}

export const style = StyleSheet.create({
  hoverTip: {
    position: 'absolute',
    background: 'white',
    border: '1px solid black',
    maxWidth: Sizes.TOOLTIP_WIDTH_MAX,
    paddingTop: HOVERTIP_PADDING,
    paddingBottom: HOVERTIP_PADDING,
    pointerEvents: 'none',
    userSelect: 'none',
    fontSize: FontSize.LABEL,
    fontFamily: FontFamily.MONOSPACE
  },
  hoverTipRow: {
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    overflowX: 'hidden',
    paddingLeft: HOVERTIP_PADDING,
    paddingRight: HOVERTIP_PADDING,
    maxWidth: Sizes.TOOLTIP_WIDTH_MAX,
  },
  hoverCount: {
    color: '#6FCF97'
  },
  clip: {
    overflow: 'hidden'
  },
  vbox: {
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  fill: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0
  },
  minimap: {
    height: Sizes.MINIMAP_HEIGHT,
    borderBottom: `${Sizes.SEPARATOR_HEIGHT}px solid ${Colors.MEDIUM_GRAY}`
  },
  panZoomView: {
    flex: 1
  },
});