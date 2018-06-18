import {h, Component} from 'preact'
import {StyleSheet, css} from 'aphrodite'
import {Colors, FontSize} from './style'

interface ColorChitProps {
  color: string
}

export class ColorChit extends Component<ColorChitProps, {}> {
  render() {
    return <span className={css(style.stackChit)} style={{backgroundColor: this.props.color}} />
  }
}

const style = StyleSheet.create({
  stackChit: {
    position: 'relative',
    top: -1,
    display: 'inline-block',
    verticalAlign: 'middle',
    marginRight: '0.5em',
    border: `1px solid ${Colors.LIGHT_GRAY}`,
    width: FontSize.LABEL - 2,
    height: FontSize.LABEL - 2,
  },
})
