// This importer is for Papyrus, a proprietary DSL written by Bethesda for Skyrim and FO4. It is used both for the base
// games and for mods. You can find documentation (such as the language reference) here:
// https://ck.uesp.net/wiki/Category:Papyrus
//
// For mod authors: you can find documentation on how to start profiling from the console here:
// https://ck.uesp.net/wiki/StartPapyrusScriptProfile
// and you can also start from your script:
// https://ck.uesp.net/wiki/StartScriptProfiling_-_Debug
// If you want to profile an entire mod, it is often helpful to use `StartFormProfile` on your "main quest". This will
// then profile all scripts attached to that Form.
//
// Papyrus works with a queue system, because it is multithreaded, but only one thread can exist per script.
// (And we can only profile one script at a time.) We parse most "QUEUE_PUSH" events, specifically those that come
// directly before their corresponding "PUSH" event. Other "QUEUE_PUSH" (and all "QUEUE_POP") events come, as far as I
// can tell, from Events and are thus asynchronous. They are ignored.
//
// Stack profiling also puts a "START" operation at the top and a "STOP" operation at the bottom of the file. These are
// completely useless to us.
//
// Stack profiling also logs the Form a method is run on. For those that are not familiar with
// Papyrus terminology, a "Form" is an instance of a type defined by a script. E.g. a quest is a form that extends
// the "Quest" script, and thus it has certain methods, like "CompleteQuest()". This information would be useful
// for Debugging, but for profiling, it would hinder meaningful output in left heavy mode.

import {CallTreeProfileBuilder, Frame, Profile} from '../lib/profile'
import {KeyedSet, lastOf} from '../lib/utils'
import {TimeFormatter} from '../lib/value-formatters'
import {TextFileContent} from './utils'

type ParsedLine = {
  at: number
  event: string
  stackInt: number
  name: string
}

export function importFromPapyrus(papyrusProfile: TextFileContent): Profile {
  const profile = new CallTreeProfileBuilder()
  profile.setValueFormatter(new TimeFormatter('milliseconds'))

  const papyrusProfileLines = papyrusProfile
    .splitLines()
    .filter(line => !/^$|^Log closed$|log opened/.exec(line))

  let startValue = -1
  const firstLineParsed = parseLine(papyrusProfileLines[0])
  if (firstLineParsed === null) throw Error
  startValue = firstLineParsed.at
  const lastLine = lastOf(papyrusProfileLines)
  if (lastLine === null) throw Error
  const lastLineParsed = parseLine(lastLine)
  if (lastLineParsed === null) throw Error
  const endValue = lastLineParsed.at

  const nameSet = new KeyedSet<Frame>()
  const frameStack: string[] = []
  let lastEventAt = 0

  let lastQueueFrameName: string
  let lastQueueFrameAt: number = -1

  function enterFrame(stackInt: number, at: number, frameName: string) {
    function enterFrameHelper(at: number, frameName: string) {
      frameStack.push(frameName)
      profile.enterFrame(Frame.getOrInsert(nameSet, {name: frameName, key: frameName}), at)
      lastEventAt = at
    }
    // Check if the last event was "QUEUE_PUSH"
    if (lastQueueFrameAt > -1) {
      lastQueueFrameAt = -1
      // If the queue from last event matches our current frame,
      if (lastQueueFrameName === frameName && lastQueueFrameAt >= lastEventAt) {
        // first enter the queue frame at its earlier time
        enterFrame(stackInt, lastQueueFrameAt, `QUEUE ${frameName}`)
      }
    }
    const stackFrameStr = `STACK ${stackInt}`
    // If the uppermost STACK frame on the frameStack isn't stackFrameStr
    if (
      [...frameStack].reverse().find(frameName => frameName.startsWith('STACK ')) !== stackFrameStr
    ) {
      // If we're at the bottom of the frameStack, STACK frames are kept open as long as functions only run in that
      // specific stack and closed with the function's end if the next function runs on a different stack.
      if (frameStack.length === 1) leaveFrame(lastEventAt)
      enterFrameHelper(at, stackFrameStr)
    }
    enterFrameHelper(at, frameName)
  }

  function leaveFrame(at: number) {
    const frame = frameStack.pop()
    if (frame === undefined) throw Error('Tried to leave frame when nothing was on stack.')
    profile.leaveFrame(Frame.getOrInsert(nameSet, {name: frame, key: frame}), at)
    let topOfStack = lastOf(frameStack)
    // Technically, the frame is popped from queue once it is pushed onto the stack (once we have "entered the frame")
    // but since we want to visualize meaningfully, we count from QUEUE_PUSH to POP and prefix with "QUEUE ".
    if (topOfStack !== null && topOfStack.startsWith('QUEUE ')) {
      leaveFrame(at)
      topOfStack = lastOf(frameStack)
    }
    if (frameStack.length > 1 && topOfStack !== null && topOfStack.startsWith('STACK ')) {
      leaveFrame(at)
    }
    lastEventAt = at
  }

  function tryToLeaveFrame(stackInt: number, at: number, frameName: string) {
    if (lastOf(frameStack) === frameName) {
      leaveFrame(at)
    } else {
      if (lastEventAt === 0) {
        console.log(
          `Tried to leave frame "${frameName}" which was never entered. Assuming it has been running since the start.`,
        )
        enterFrame(stackInt, 0, frameName)
        leaveFrame(at)
      } else {
        console.log(
          `Tried to leave frame "${frameName}" which was never entered. Other events have happened since the start, ignoring line.`,
        )
      }
    }
  }

  function parseLine(lineStr: string): ParsedLine | null {
    if (lineStr === undefined) throw Error('Probably tried to import empty file.')
    const lineArr = lineStr.split(':')
    if (lineArr.length < 3) return null
    if (startValue !== -1) {
      return {
        at: parseInt(lineArr[0]) - startValue,
        event: lineArr[1],
        stackInt: parseInt(lineArr[2]),
        name: lineArr[5],
      }
    } else {
      // When parsing the first line, we return an absolute `at` value to initialize `startValue`
      return {
        at: parseInt(lineArr[0]),
        event: lineArr[1],
        stackInt: parseInt(lineArr[2]),
        name: lineArr[5],
      }
    }
  }

  papyrusProfileLines.forEach((lineStr, i, papyrusProfileLines) => {
    const parsedLine = parseLine(lineStr)
    if (parsedLine === null) return // continue
    if (parsedLine.event === 'PUSH') {
      enterFrame(parsedLine.stackInt, parsedLine.at, parsedLine.name)
      i += 1
      let parsedNextLine = parseLine(papyrusProfileLines[i])
      // Search all future events in the current event for one that leaves the current frame. If it exists, leave now.
      // This way, we avoid speedscope choking on the possibly wrong order of events. The changed order is still
      // functionally correct, as the function took less than a millisecond to execute, which is measured as 0 (ms).
      while (parsedNextLine !== null && parsedNextLine.at === parsedLine.at) {
        if (
          parsedNextLine.name === parsedLine.name &&
          parsedNextLine.stackInt === parsedLine.stackInt &&
          parsedNextLine.event === 'POP'
        ) {
          tryToLeaveFrame(parsedNextLine.stackInt, parsedNextLine.at, parsedNextLine.name)
          // Delete the line that we successfully parsed and imported such that it is not processed twice
          papyrusProfileLines.splice(i, 1)
          parsedNextLine = null
        } else {
          i += 1
          if (i < papyrusProfileLines.length) parsedNextLine = parseLine(papyrusProfileLines[i])
        }
      }
    } else if (parsedLine.event === 'POP') {
      tryToLeaveFrame(parsedLine.stackInt, parsedLine.at, parsedLine.name)
    } else if (parsedLine.event === 'QUEUE_PUSH') {
      lastQueueFrameName = parsedLine.name.replace(/\?/g, '')
      lastQueueFrameAt = parsedLine.at
      return
    }
  })

  // Close frames that are still open
  while (frameStack.length > 0) {
    leaveFrame(endValue)
  }

  return profile.build()
}
