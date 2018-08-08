// A simple implementation of an efficient scrolling list view which
// renders only items within the viewport + a couple extra items.

import {h, Component} from 'preact'

export interface ListItem {
  size: number
}

interface ScrollableListViewProps {
  items: ListItem[]
  axis: 'x' | 'y'
  renderItems: (firstVisibleIndex: number, lastVisibleIndex: number) => JSX.Element | JSX.Element[]
  className?: string
}

interface ScrollableListViewState {
  firstVisibleIndex: number | null
  lastVisibleIndex: number | null
  invisiblePrefixSize: number | null
  viewportSize: number | null
  cachedTotalSize: number
}

export class ScrollableListView extends Component<
  ScrollableListViewProps,
  ScrollableListViewState
> {
  constructor(props: ScrollableListViewProps) {
    super(props)
    this.state = {
      firstVisibleIndex: null,
      lastVisibleIndex: null,
      invisiblePrefixSize: null,
      viewportSize: null,
      cachedTotalSize: props.items.reduce((a, b) => a + b.size, 0),
    }
  }

  private viewport: HTMLDivElement | null = null
  private viewportRef = (viewport?: Element) => {
    this.viewport = (viewport as HTMLDivElement) || null
  }

  private recomputeVisibleIndices(props: ScrollableListViewProps) {
    if (!this.viewport) return
    const {items} = props

    const viewportSize = this.viewport.getBoundingClientRect().height

    // We render items up to a quarter viewport height outside of the
    // viewport both above and below to prevent flickering.
    const minY = this.viewport.scrollTop - viewportSize / 4
    const maxY = this.viewport.scrollTop + viewportSize + viewportSize / 4

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
    this.setState({invisiblePrefixSize, firstVisibleIndex, lastVisibleIndex})
  }

  private pendingScroll = 0
  public scrollIndexIntoView(index: number) {
    this.pendingScroll = this.props.items.reduce((sum, cur, i) => {
      if (i >= index) return sum
      return sum + cur.size
    }, 0)
  }
  private applyPendingScroll() {
    if (!this.viewport) return

    const leftOrTop = this.props.axis === 'y' ? 'top' : 'left'
    this.viewport.scrollTo({
      [leftOrTop]: this.pendingScroll,
    })
  }

  componentWillReceiveProps(nextProps: ScrollableListViewProps) {
    if (this.props.items !== nextProps.items) {
      this.recomputeVisibleIndices(nextProps)
    }
  }

  componentDidMount() {
    this.applyPendingScroll()
    this.recomputeVisibleIndices(this.props)
    window.addEventListener('resize', this.onWindowResize)
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.onWindowResize)
  }

  onWindowResize = () => {
    this.recomputeVisibleIndices(this.props)
  }

  onViewportScroll = (ev: UIEvent) => {
    this.recomputeVisibleIndices(this.props)
  }

  render() {
    const {cachedTotalSize, firstVisibleIndex, lastVisibleIndex, invisiblePrefixSize} = this.state

    return (
      <div className={this.props.className} ref={this.viewportRef} onScroll={this.onViewportScroll}>
        <div style={{height: cachedTotalSize}}>
          <div style={{transform: `translateY(${invisiblePrefixSize}px)`}}>
            {firstVisibleIndex != null &&
              lastVisibleIndex != null &&
              this.props.renderItems(firstVisibleIndex, lastVisibleIndex)}
          </div>
        </div>
      </div>
    )
  }
}
