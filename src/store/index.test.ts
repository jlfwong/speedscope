import {ViewMode} from '.'
import {actions} from './actions'
import {storeTest} from './store-test-utils'

storeTest('flattenRecursion', ({getState, dispatch}) => {
  expect(getState().flattenRecursion).toBe(false)
  dispatch(actions.setFlattenRecursion(true))
  expect(getState().flattenRecursion).toBe(true)
})

storeTest('viewMode', ({getState, dispatch}) => {
  expect(getState().viewMode).toBe(ViewMode.CHRONO_FLAME_CHART)
  dispatch(actions.setViewMode(ViewMode.SANDWICH_VIEW))
  expect(getState().viewMode).toBe(ViewMode.SANDWICH_VIEW)
})

storeTest('dragActive', ({getState, dispatch}) => {
  expect(getState().dragActive).toBe(false)
  dispatch(actions.setDragActive(true))
  expect(getState().dragActive).toBe(true)
})

storeTest('loading', ({getState, dispatch}) => {
  expect(getState().loading).toBe(false)
  dispatch(actions.setLoading(true))
  expect(getState().loading).toBe(true)
})

storeTest('error', ({getState, dispatch}) => {
  expect(getState().error).toBe(false)
  dispatch(actions.setError(true))
  expect(getState().error).toBe(true)
})
