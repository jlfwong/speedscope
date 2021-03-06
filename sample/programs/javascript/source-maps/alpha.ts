import {beta} from './beta'
import {delta} from './delta'

export function alpha() {
  ;(function () {
    for (let i = 0; i < 1000; i++) {
      beta()
      delta()
    }
  })()
}
