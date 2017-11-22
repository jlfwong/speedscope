import {h, render, Component} from 'preact'
import {StyleSheet, css} from 'aphrodite'

import {importFromStackprof} from './stackprof'

class Application extends Component<{}, void> {
  onDrop = (ev: DragEvent) => {
    const reader = new FileReader
    reader.addEventListener('loadend', () => {
      console.log(importFromStackprof(reader.result))
    })
    reader.readAsText(ev.dataTransfer.files.item(0))
    ev.preventDefault()
  }

  onDragOver = (ev: DragEvent) => {
    ev.preventDefault()
  }

  render() {
    return <div onDrop={this.onDrop} onDragOver={this.onDragOver} className={css(style.root)}>
    </div>
  }
}

const style = StyleSheet.create({
  root: {
    width: '100vw',
    height: '100vw'
  }
})

render(<Application />, document.body)