import {h} from 'preact'
import {StyleSheet, css} from 'aphrodite'
import {FontSize} from './style'
import {useTheme, withTheme} from './themes/theme'

interface ColorChitProps {
  color: string
}

export function ColorChit(props: ColorChitProps) {
  const style = getStyle(useTheme())
  return <span className={css(style.stackChit)} style={{backgroundColor: props.color}} />
}

const getStyle = withTheme(theme =>
  StyleSheet.create({
    stackChit: {
      position: 'relative',
      top: -1,
      display: 'inline-block',
      verticalAlign: 'middle',
      marginRight: '0.5em',
      border: `1px solid ${theme.fgSecondaryColor}`,
      width: FontSize.LABEL - 2,
      height: FontSize.LABEL - 2,
    },
  }),
)
