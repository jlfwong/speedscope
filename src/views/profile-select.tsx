import {Profile} from '../lib/profile'
import {h} from 'preact'
import {useCallback} from 'preact/hooks/src'
import {StyleSheet, css} from 'aphrodite'
import {Colors} from './style'

interface ProfileSelectRowProps {
  setProfileIndexToView: (profileIndex: number) => void
  profile: Profile
  index: number
}

export function ProfileSelectRow(props: ProfileSelectRowProps) {
  const onClick = useCallback(() => {
    props.setProfileIndexToView(props.index)
  }, [props.setProfileIndexToView, props.index])

  return (
    <div onClick={onClick}>
      {props.index}: {props.profile.getName()}
    </div>
  )
}

interface ProfileSelectProps {
  setProfileIndexToView: (profileIndex: number) => void
  indexToView: number
  profiles: Profile[]
}

export function ProfileSelect(props: ProfileSelectProps) {
  return (
    <div className={css(style.profileSelect)}>
      {props.profiles.map((p, i) => {
        return (
          <ProfileSelectRow
            key={i}
            index={i}
            profile={p}
            setProfileIndexToView={props.setProfileIndexToView}
          />
        )
      })}
    </div>
  )
}

const style = StyleSheet.create({
  profileSelect: {
    width: 480,
    background: Colors.BLACK,
    color: Colors.WHITE,
  },
})
