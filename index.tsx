import {h, render, Component} from 'preact'
import {StyleSheet, css} from 'aphrodite'

import {importFromBGFlameGraph} from './import/bg-flamegraph'

import {Profile} from './profile'
import {Flamechart, FlamechartView} from './flamechart'

interface ApplicationState {
  profile: Profile | null
  flamechart: Flamechart | null
}

class Application extends Component<{}, ApplicationState> {
  onDrop = (ev: DragEvent) => {
    const reader = new FileReader
    reader.addEventListener('loadend', () => {
      const profile = importFromBGFlameGraph(reader.result)
      const flamechart = new Flamechart(profile)
      this.setState({profile, flamechart})
    })
    reader.readAsText(ev.dataTransfer.files.item(0))
    ev.preventDefault()
  }

  onDragOver = (ev: DragEvent) => {
    ev.preventDefault()
  }

  componentDidMount() {
    window.addEventListener('resize', () => {
      this.forceUpdate()
    })
  }

  render() {
    const {flamechart} = this.state
    return <div onDrop={this.onDrop} onDragOver={this.onDragOver} className={css(style.root)}>
      {flamechart &&
        <FlamechartView flamechart={flamechart} />}
    </div>
  }
}

const style = StyleSheet.create({
  root: {
    width: '100vw',
    height: '100vh',
    overflow: 'hidden'
  }
})

render(<Application />, document.body)