// Papyrus works with a Queue system, because it is multithreaded, but only one thread can exist per script.
// (And we can only profile one script at a time.) We parse most "QUEUE_PUSH" events, specifically those that come
// directly before their corresponding "PUSH" event. Other "QUEUE_PUSH" (and all "QUEUE_POP") events come, as far as I
// can tell, from Events and are thus asynchronous. They are ignored.

// Stack profiling also puts a START operation at the top and a STOP operation at the bottom of the file. These are
// completely useless to us.

// Stack profiling also logs the Form a method is run on. For those that are not familiar with
// Papyrus terminology, a "Form" is an instance of a type defined by a script. E.g. a quest is a form that extends
// the "Quest" script, and thus it has certain methods, like "CompleteQuest()". This information would be useful
// for Debugging, but for profiling, it would hinder meaningful output in left heavy mode.

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
  const profile = new CallTreeProfileBuilder()
  profile.setValueFormatter(new TimeFormatter('milliseconds'))

  const papyrusProfileLines = papyrusProfile
    .splitLines()
    .filter(line => line.match(/^$|^Log closed$|log opened/) === null)
  const startValue = Number(papyrusProfileLines[0].split(':')[0])
  const endValue = Number(lastElement(papyrusProfileLines).split(':')[0]) - startValue

  const nameSet: KeyedSet<Frame> = new KeyedSet<Frame>()
  const frameStack: string[] = []
  let lastEventAt = 0

  const leaveASAPStack: string[] = []
  let lastQueueFrameName: string
  let lastQueueFrameAt: number = -1

  function enterFrame(at: number, frameName: string) {
    // Check if the last event was "QUEUE_PUSH"
    if (lastQueueFrameAt > -1) {
      // If the queue from last event matches our current frame,
      if (lastQueueFrameName === frameName && lastQueueFrameAt >= lastEventAt) {
        // first enter the queue frame at its earlier time
        enterFrame(lastQueueFrameAt, `QUEUE ${frameName}`)
      }
      lastQueueFrameAt = -1
    }
    frameStack.push(frameName)
    profile.enterFrame(Frame.getOrInsert(nameSet, {name: frameName, key: frameName}), at)
    lastEventAt = at
  }

  function leaveFrame(at: number) {
    const frame = frameStack.pop()
    assert(frame !== undefined)
    profile.leaveFrame(Frame.getOrInsert(nameSet, {name: frame, key: frame}), at)
    // Technically, the frame is popped from queue once it is pushed onto the stack (once we have "entered the frame")
    // but since we want to visualize meaningfully, we count from QUEUE_PUSH to POP and prefix with "QUEUE "
    if (frameStack.length > 0 && lastElement(frameStack).startsWith('QUEUE ')) {
      leaveFrame(at)
    }
    lastEventAt = at
  }

  function tryToLeaveFrame(at: number, frameName: string): Boolean {
    if (lastElement(frameStack) === frameName) {
      leaveFrame(at)
      // Every time we successfully leave a frame, try to leave from the last frame we put on the leaveASAPStack.
      // If we don't succeed, the frame is pushed back on the leaveASAPStack.
      const leaveASAPFrame = leaveASAPStack.pop()
      if (leaveASAPFrame !== undefined) tryToLeaveFrame(at, leaveASAPFrame)
      return true
    } else {
      if (frameStack.includes(frameName)) {
        leaveASAPStack.push(frameName)

        console.log(
          `Tried to leave frame "${frameName}" while "${lastElement(
            frameStack,
          )}" was at top. Will continue to try leaving in next iteration.`,
        )
      } else {
        console.log(`Tried to leave frame "${frameName}" which was never entered. Ignoring line.`)
      }
      return false
    }
  }

  papyrusProfileLines.forEach(line_str => {
    const line_arr = line_str.split(':')
    if (line_arr.length < 6) return // continue
    const at = Number(line_arr[0]) - startValue
    const event = line_arr[1]
    const stackStr = `STACK ${line_arr[2]}`
    const name = line_arr[5]
    if (event === 'PUSH') {
      enterFrame(at, name)
    } else if (event === 'POP') {
      // If we can't leave the frame, continue
      if (!tryToLeaveFrame(at, name)) return
    } else if (event === 'QUEUE_PUSH') {
      lastQueueFrameName = name.replace(/\?/g, '')
      lastQueueFrameAt = at
    }
    if (frameStack.length === 0) {
      enterFrame(at, stackStr)
    } else if (
      lastElement(frameStack).startsWith('Stack ') &&
      lastElement(frameStack) !== stackStr
    ) {
      tryToLeaveFrame(at, lastElement(frameStack))
      enterFrame(at, stackStr)
    }
  })

  // Close frames that are still open
  while (frameStack.length > 0) {
    leaveFrame(endValue)
  }

  return profile.build()
}
