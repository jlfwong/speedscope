import {StyleDeclarationValue, css} from 'aphrodite'
import {h, Component} from 'preact'
import {style} from './flamechart-style'
import {formatPercent} from '../lib/utils'
import {Frame, CallTreeNode} from '../lib/profile'
import {ColorChit} from './color-chit'
import {Flamechart} from '../lib/flamechart'

interface StatisticsTableProps {
  title: string
  grandTotal: number
  selectedTotal: number
  selectedSelf: number
  cellStyle: StyleDeclarationValue
  formatter: (v: number) => string
}

class StatisticsTable extends Component<StatisticsTableProps, {}> {
  render() {
    const total = this.props.formatter(this.props.selectedTotal)
    const self = this.props.formatter(this.props.selectedSelf)
    const totalPerc = 100.0 * this.props.selectedTotal / this.props.grandTotal
    const selfPerc = 100.0 * this.props.selectedSelf / this.props.grandTotal

    return (
      <div className={css(style.statsTable)}>
        <div className={css(this.props.cellStyle, style.statsTableCell, style.statsTableHeader)}>
          {this.props.title}
        </div>

        <div className={css(this.props.cellStyle, style.statsTableCell)}>Total</div>
        <div className={css(this.props.cellStyle, style.statsTableCell)}>Self</div>

        <div className={css(this.props.cellStyle, style.statsTableCell)}>{total}</div>
        <div className={css(this.props.cellStyle, style.statsTableCell)}>{self}</div>

        <div className={css(this.props.cellStyle, style.statsTableCell)}>
          {formatPercent(totalPerc)}
          <div className={css(style.barDisplay)} style={{height: `${totalPerc}%`}} />
        </div>
        <div className={css(this.props.cellStyle, style.statsTableCell)}>
          {formatPercent(selfPerc)}
          <div className={css(style.barDisplay)} style={{height: `${selfPerc}%`}} />
        </div>
      </div>
    )
  }
}

interface StackTraceViewProps {
  getFrameColor: (frame: Frame) => string
  node: CallTreeNode
}
class StackTraceView extends Component<StackTraceViewProps, {}> {
  render() {
    const rows: JSX.Element[] = []
    let node: CallTreeNode | null = this.props.node
    for (; node && !node.isRoot(); node = node.parent) {
      const row: (JSX.Element | string)[] = []
      const {frame} = node

      row.push(<ColorChit color={this.props.getFrameColor(frame)} />)

      if (rows.length) {
        row.push(<span className={css(style.stackFileLine)}>> </span>)
      }
      row.push(frame.name)

      if (frame.file) {
        let pos = frame.file
        if (frame.line) {
          pos += `:${frame.line}`
          if (frame.col) {
            pos += `:${frame.col}`
          }
        }
        row.push(<span className={css(style.stackFileLine)}> ({pos})</span>)
      }
      rows.push(<div className={css(style.stackLine)}>{row}</div>)
    }
    return (
      <div className={css(style.stackTraceView)}>
        <div className={css(style.stackTraceViewPadding)}>{rows}</div>
      </div>
    )
  }
}

interface FlamechartDetailViewProps {
  flamechart: Flamechart
  getCSSColorForFrame: (frame: Frame) => string
  selectedNode: CallTreeNode
}

export class FlamechartDetailView extends Component<FlamechartDetailViewProps, {}> {
  render() {
    const {flamechart, selectedNode} = this.props
    const {frame} = selectedNode

    return (
      <div className={css(style.detailView)}>
        <StatisticsTable
          title={'This Instance'}
          cellStyle={style.thisInstanceCell}
          grandTotal={flamechart.getTotalWeight()}
          selectedTotal={selectedNode.getTotalWeight()}
          selectedSelf={selectedNode.getSelfWeight()}
          formatter={flamechart.formatValue.bind(flamechart)}
        />
        <StatisticsTable
          title={'All Instances'}
          cellStyle={style.allInstancesCell}
          grandTotal={flamechart.getTotalWeight()}
          selectedTotal={frame.getTotalWeight()}
          selectedSelf={frame.getSelfWeight()}
          formatter={flamechart.formatValue.bind(flamechart)}
        />
        <StackTraceView node={selectedNode} getFrameColor={this.props.getCSSColorForFrame} />
      </div>
    )
  }
}
