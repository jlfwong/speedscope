import {storeTest, profileGroupTwoSampled} from './store-test-utils'
import {actions} from './actions'
import {SortDirection, SortField, SortMethod} from '../views/profile-table-view'

describe('sandwich view state', () => {
  storeTest('setTableSortMethod', ({getState, dispatch}) => {
    dispatch(actions.setProfileGroup(profileGroupTwoSampled))

    const defaultSortMethod: SortMethod = {
      field: SortField.SELF,
      direction: SortDirection.DESCENDING,
    }
    expect(getState().profileGroup!.profiles[0].sandwichViewState.tableSortMethod).toEqual(
      defaultSortMethod,
    )

    const newSortMethod: SortMethod = {
      field: SortField.SYMBOL_NAME,
      direction: SortDirection.DESCENDING,
    }

    dispatch(
      actions.sandwichView.setTableSortMethod({
        profileIndex: 0,
        args: newSortMethod,
      }),
    )
    expect(getState().profileGroup!.profiles[0].sandwichViewState.tableSortMethod).toEqual(
      newSortMethod,
    )
    expect(getState().profileGroup!.profiles[1].sandwichViewState.tableSortMethod).toEqual(
      defaultSortMethod,
    )
  })

  storeTest('setSelectedFrame', ({getState, dispatch}) => {
    dispatch(actions.setProfileGroup(profileGroupTwoSampled))
    expect(getState().profileGroup!.profiles[0].sandwichViewState.callerCallee).toBe(null)
    const {profileGroup} = getState()
    const selectedFrame = profileGroup!.profiles[0].profile.getAppendOrderCalltreeRoot().children[0]
      .frame
    dispatch(actions.sandwichView.setSelectedFrame({profileIndex: 0, args: selectedFrame}))

    expect(getState().profileGroup!.profiles[0].sandwichViewState.callerCallee!.selectedFrame).toBe(
      selectedFrame,
    )

    // Other profiles selection state should not change
    expect(getState().profileGroup!.profiles[1].sandwichViewState.callerCallee).toBe(null)

    const selectedFrame2 = profileGroup!.profiles[0].profile.getAppendOrderCalltreeRoot()
      .children[0].children[0].frame
    dispatch(actions.sandwichView.setSelectedFrame({profileIndex: 0, args: selectedFrame2}))
    expect(getState().profileGroup!.profiles[0].sandwichViewState.callerCallee!.selectedFrame).toBe(
      selectedFrame2,
    )
  })
})
