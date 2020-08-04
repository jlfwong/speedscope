import {memo} from 'preact/compat'
import {useCallback} from 'preact/hooks'
import {SearchView} from './search-view'
import {h} from 'preact'

export const SandwichSearchView = memo(() => {
  const selectPrev = useCallback(() => {}, [])
  const selectNext = useCallback(() => {}, [])

  return (
    <SearchView
      resultIndex={null}
      numResults={null}
      selectPrev={selectPrev}
      selectNext={selectNext}
    />
  )
})
