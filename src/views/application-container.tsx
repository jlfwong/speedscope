import * as React from 'react'
import {Application, ActiveProfileState} from './application'
import {getProfileToView, getCanvasContext} from '../store/getters'
import {actions} from '../store/actions'
import {useActionCreator} from '../lib/preact-redux'
import {memo, useCallback} from 'react'
import {useAppSelector} from '../store'

export const ApplicationContainer = memo(() => {
  const appState = useAppSelector(useCallback(state => state, []))
  const canvasContext = useAppSelector(
    useCallback(state => (state.glCanvas ? getCanvasContext(state.glCanvas) : null), []),
  )

  const activeProfileState: ActiveProfileState | null = useAppSelector(
    useCallback(state => {
      const {profileGroup} = state
      if (!profileGroup) return null
      if (profileGroup.indexToView >= profileGroup.profiles.length) return null

      const index = profileGroup.indexToView
      const profileState = profileGroup.profiles[index]
      return {
        ...profileGroup.profiles[profileGroup.indexToView],
        profile: getProfileToView({
          profile: profileState.profile,
          flattenRecursion: state.flattenRecursion,
        }),
        index: profileGroup.indexToView,
      }
    }, []),
  )

  return (
    <Application
      activeProfileState={activeProfileState}
      canvasContext={canvasContext}
      setGLCanvas={useActionCreator(actions.setGLCanvas)}
      setLoading={useActionCreator(actions.setLoading)}
      setError={useActionCreator(actions.setError)}
      setProfileGroup={useActionCreator(actions.setProfileGroup)}
      setDragActive={useActionCreator(actions.setDragActive)}
      setViewMode={useActionCreator(actions.setViewMode)}
      setFlattenRecursion={useActionCreator(actions.setFlattenRecursion)}
      setProfileIndexToView={useActionCreator(actions.setProfileIndexToView)}
      {...appState}
    />
  )
})
