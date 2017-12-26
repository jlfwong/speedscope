import {StyleSheet} from 'aphrodite'

const HOVERTIP_PADDING = 2


export enum FontFamily {
  MONOSPACE = "Courier, monospace"
}

export enum FontSize {
  LABEL = 10
}

export namespace Sizes {
  export const MINIMAP_HEIGHT = 100
  export const TOOLTIP_WIDTH_MAX = 300
  export const TOOLTIP_HEIGHT_MAX = 75
}

export const style = StyleSheet.create({
  hoverTip: {
    position: 'absolute',
    background: 'white',
    border: '1px solid black',
    maxWidth: Sizes.TOOLTIP_WIDTH_MAX,
    overflow: 'hidden',
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
    overflow: 'hidden',
    paddingLeft: HOVERTIP_PADDING,
    paddingRight: HOVERTIP_PADDING,
    maxWidth: Sizes.TOOLTIP_WIDTH_MAX,
  },
  clip: {
    overflow: 'hidden'
  },
  fill: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0
  },
  minimap: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: Sizes.MINIMAP_HEIGHT,
    width: '100%',
  },
  panZoomView: {
    position: 'absolute',
    left: 0,
    top: Sizes.MINIMAP_HEIGHT,
    width: '100%',
    height: `calc(100% - ${Sizes.MINIMAP_HEIGHT}px)`,
  },
});