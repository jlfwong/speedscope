import {Profile} from '../lib/profile'
import {h} from 'preact'
import {useCallback} from 'preact/hooks'
import {StyleSheet, css} from 'aphrodite'
import {Colors, ZIndex, Sizes} from './style'

interface ProfileSelectRowProps {
  setProfileIndexToView: (profileIndex: number) => void
  profile: Profile
  selected: boolean
  index: number
  profileCount: number
}

export function ProfileSelectRow({
  setProfileIndexToView,
  profile,
  selected,
  profileCount,
  index,
}: ProfileSelectRowProps) {
  const onClick = useCallback(() => {
    setProfileIndexToView(index)
  }, [setProfileIndexToView, index])

  const scrollIntoView = useCallback(
    (node: HTMLElement | null) => {
      if (node && selected) {
        node.scrollIntoView({
          behavior: 'auto',
          block: 'nearest',
          inline: 'nearest',
        })
      }
    },
    [selected],
  )

  const name = profile.getName()

  const maxDigits = 1 + Math.floor(Math.log10(profileCount))

  return (
    <div
      ref={scrollIntoView}
      onClick={onClick}
      title={name}
      className={css(
        style.profileRow,
        index % 2 === 0 && style.profileRowEven,
        selected && style.profileRowSelected,
      )}
    >
      <span className={css(style.profileIndex)} style={{width: maxDigits + 'em'}}>
        {index + 1}:
      </span>{' '}
      {name}
    </div>
  )
}

interface ProfileSelectProps {
  setProfileIndexToView: (profileIndex: number) => void
  indexToView: number
  profiles: Profile[]
}

export function ProfileSelect({profiles, indexToView, setProfileIndexToView}: ProfileSelectProps) {
  return (
    <div className={css(style.profileSelectOuter)}>
      <div className={css(style.caret)} />
      <div className={css(style.profileSelectBox)}>
        <div className={css(style.profileSelectScrolling)}>
          {profiles.map((p, i) => {
            return (
              <ProfileSelectRow
                index={i}
                selected={i === indexToView}
                profile={p}
                profileCount={profiles.length}
                setProfileIndexToView={setProfileIndexToView}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

const paddingHeight = 10

const style = StyleSheet.create({
  caret: {
    width: 0,
    height: 0,
    borderLeft: '5px solid transparent',
    borderRight: '5px solid transparent',
    borderBottom: '5px solid black',
  },
  padding: {
    height: paddingHeight,
    background: Colors.BLACK,
  },
  profileRow: {
    height: Sizes.FRAME_HEIGHT - 2,
    border: '1px solid transparent',
    textAlign: 'left',
    paddingLeft: 10,
    paddingRight: 10,
    background: Colors.BLACK,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    cursor: 'pointer',
    ':hover': {
      border: `1px solid ${Colors.DARK_BLUE}`,
    },
  },
  profileRowSelected: {
    background: Colors.DARK_BLUE,
  },
  profileRowEven: {
    background: Colors.DARK_GRAY,
  },
  profileSelectScrolling: {
    maxHeight: `min(calc(100vh - ${Sizes.TOOLBAR_HEIGHT - 2 * paddingHeight}px), ${
      20.5 * Sizes.FRAME_HEIGHT
    }px)`,
    overflow: 'auto',
  },
  profileSelectBox: {
    width: '100%',
    maxWidth: 480,
    paddingTop: 10,
    paddingBottom: 10,
    background: Colors.BLACK,
    color: Colors.WHITE,
  },
  profileSelectOuter: {
    position: 'relative',
    zIndex: ZIndex.PROFILE_SELECT,
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
  },
  profileIndex: {
    textAlign: 'right',
    display: 'inline-block',
    color: Colors.LIGHT_GRAY,
  },
})
