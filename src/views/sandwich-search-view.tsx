import {memo} from 'preact/compat'
import {useContext, useMemo} from 'preact/hooks'
import {SearchView} from './search-view'
import {h} from 'preact'
import {SandwichViewContext} from './sandwich-view'

export const SandwichSearchView = memo(() => {
  const sandwichViewContext = useContext(SandwichViewContext)

  const rowList = sandwichViewContext != null ? sandwichViewContext.rowList : null
  const resultIndex =
    sandwichViewContext?.selectedFrame != null
      ? sandwichViewContext.getIndexForFrame(sandwichViewContext.selectedFrame)
      : null
  const numResults = rowList != null ? rowList.length : null

  const {selectPrev, selectNext} = useMemo(() => {
    if (rowList == null || numResults == null || numResults === 0 || sandwichViewContext == null) {
      return {selectPrev: () => {}, selectNext: () => {}}
    }

    return {
      selectPrev: () => {
        let index = resultIndex == null ? numResults - 1 : resultIndex - 1
        if (index < 0) index = numResults - 1
        sandwichViewContext.setSelectedFrame(rowList[index])
      },
      selectNext: () => {
        let index = resultIndex == null ? 0 : resultIndex + 1
        if (index >= numResults) index = 0
        sandwichViewContext.setSelectedFrame(rowList[index])
      },
    }
  }, [resultIndex, rowList, numResults, sandwichViewContext])

  return (
    <SearchView
      resultIndex={resultIndex}
      numResults={numResults}
      selectPrev={selectPrev}
      selectNext={selectNext}
    />
  )
})
