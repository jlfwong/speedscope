import {CallTreeProfileBuilder, Frame, Profile} from '../lib/profile'
import {KeyedSet} from '../lib/utils'
import assert from 'assert'
import {TimeFormatter} from '../lib/value-formatters'
import {TextFileContent} from './utils'

/**
 * Returns the last element of `arr`
 */
function lastElement<T>(arr: T[]): T {
  return arr.slice(-1)[0]
}

export function importFromPapyrus(papyrusProfile: TextFileContent): Profile {
  const papyrusProfileLines = papyrusProfile
    .splitLines()
    .filter(line => line.match(/^$|^Log closed$|log opened/) === null)
  const startValue = Number(papyrusProfileLines[0].split(':')[0])
  const endValue = Number(lastElement(papyrusProfileLines).split(':')[0]) - startValue
  // Profile starts at zero even though I set totalWeight
  const profile = new CallTreeProfileBuilder()
  profile.setValueFormatter(new TimeFormatter('milliseconds'))

  // These two are kept in the profile, why are they protected?
  const nameSet: KeyedSet<Frame> = new KeyedSet<Frame>()
  const frameStack: string[] = []

  const leaveASAPStack: string[] = []

  function enterFrame(at: number, frame: string) {
    frameStack.push(frame)
    profile.enterFrame(Frame.getOrInsert(nameSet, {name: frame, key: frame}), at)
  }

  function leaveFrame(at: number) {
    const frame = frameStack.pop()
    assert(frame !== undefined)
    profile.leaveFrame(Frame.getOrInsert(nameSet, {name: frame, key: frame}), at)
  }

  function tryToLeaveFrame(at: number, frame: string): Boolean {
    if (lastElement(frameStack) === frame) {
      leaveFrame(at)
      // Every time we successfully leave a frame, try to leave from the last frame we put on the leaveASAPStack.
      // If we don't succeed, the frame is pushed back on the leaveASAPStack.
      const leaveASAPFrame = leaveASAPStack.pop()
      if (leaveASAPFrame !== undefined) tryToLeaveFrame(at, leaveASAPFrame)
      return true
    } else {
      if (frameStack.includes(frame)) {
        leaveASAPStack.push(frame)

        console.log(
          `Tried to leave frame "${frame}" while "${lastElement(
            frameStack,
          )}" was at top. Will continue to try leaving in next iteration.`,
        )
      } else {
        console.log(`Tried to leave frame "${frame}" which was never entered. Ignoring line.`)
      }
      return false
    }
  }

  papyrusProfileLines.forEach(line_str => {
    const line_arr = line_str.split(':')
    if (line_arr.length < 6) return // continue
    const at = Number(line_arr[0]) - startValue
    const operation = line_arr[1]
    const stack_str = `Stack ${line_arr[2]}`
    const name = line_arr[5]
    if (operation === 'PUSH') {
      enterFrame(at, name)
    } else if (operation === 'POP') {
      // If we can't leave the frame, continue
      if (!tryToLeaveFrame(at, name)) return
    }
    if (frameStack.length === 0) {
      enterFrame(at, stack_str)
    } else if (
      lastElement(frameStack).startsWith('Stack ') &&
      lastElement(frameStack) !== stack_str
    ) {
      tryToLeaveFrame(at, lastElement(frameStack))
      enterFrame(at, stack_str)
    }
    // There are other types of operations, namely QUEUE_PUSH and QUEUE_POP. Papyrus works with a Queue system, because
    // it is multithreaded, but only one thread can exist per script. (And we can only profile one script at a time.)
    // These events are not very interesting to us, as they are 1. asynchronous and 2. not relevant to measuring the
    // performance of a specific function.

    // Stack profiling also puts a START operation at the top and a STOP operation at the bottom of the file. These are
    // completely useless to us.

    // Stack profiling also logs the Form a method is run on. For those that are not familiar with
    // Papyrus terminology, a "Form" is an instance of a type defined by a script. E.g. a quest is a form that extends
    // the "Quest" script, and thus it has certain methods, like "CompleteQuest()". This information would be useful
    // for Debugging, but for profiling, it would hinder meaningful output in left heavy mode.
  })

  // close frames that are still open
  while (frameStack.length > 0) {
    leaveFrame(endValue)
  }

  return profile.build()
}
