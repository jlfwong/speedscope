import {StyleSheet} from 'aphrodite'
import {FontSize, Colors, Sizes} from './style'

export const style = StyleSheet.create({
  hoverCount: {
    color: Colors.GREEN,
  },
  fill: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
  },
  minimap: {
    height: Sizes.MINIMAP_HEIGHT,
    borderBottom: `${Sizes.SEPARATOR_HEIGHT}px solid ${Colors.LIGHT_GRAY}`,
  },
  panZoomView: {
    flex: 1,
  },

  detailView: {
    display: 'grid',
    height: Sizes.DETAIL_VIEW_HEIGHT,
    overflow: 'hidden',
    gridTemplateColumns: '120px 120px 1fr',
    gridTemplateRows: 'repeat(4, 1fr)',
    borderTop: `${Sizes.SEPARATOR_HEIGHT}px solid ${Colors.LIGHT_GRAY}`,
    fontSize: FontSize.LABEL,
    position: 'absolute',
    background: Colors.WHITE,
    width: '100vw',
    bottom: 0,
  },
  stackTraceViewPadding: {
    padding: 5,
  },
  stackTraceView: {
    height: Sizes.DETAIL_VIEW_HEIGHT,
    lineHeight: `${FontSize.LABEL + 2}px`,
    overflow: 'auto',
  },
  stackLine: {
    whiteSpace: 'nowrap',
  },
  stackFileLine: {
    color: Colors.LIGHT_GRAY,
  },
  statsTable: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gridTemplateRows: `repeat(3, ${FontSize.LABEL + 10}px)`,
    gridGap: '1px 1px',
    textAlign: 'center',
    paddingRight: 1,
  },
  statsTableHeader: {
    gridColumn: '1 / 3',
  },
  statsTableCell: {
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thisInstanceCell: {
    background: Colors.DARK_BLUE,
    color: Colors.WHITE,
  },
  allInstancesCell: {
    background: Colors.PALE_DARK_BLUE,
    color: Colors.WHITE,
  },
  barDisplay: {
    position: 'absolute',
    top: 0,
    left: 0,
    background: 'rgba(0, 0, 0, 0.2)',
    width: '100%',
  },
})
