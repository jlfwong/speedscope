import {FrameInfo} from '../lib/profile'
import {lastOf} from '../lib/utils'
import {ProfileBuilderInfo, Sample, StackFrame, ChromeTraceWithSamples} from './trace-event'

/**
 * The chrome json trace event spec only specifies name and category
 * as required stack frame properties
 *
 * https://docs.google.com/document/d/1CvAClvFfyA5R-PhYUmn5OOQtYMH4h6I0nSsKchNAySU/preview#heading=h.b4y98p32171
 */
function frameInfoForEvent({name, category}: StackFrame): FrameInfo {
  return {
    key: `${name}:${category}`,
    name: name,
  }
}

/**
 * Initialization function to enable O(1) access to the set of active nodes in the stack by node ID.
 */
function getActiveNodeArrays(profile: ChromeTraceWithSamples): Map<number, number[]> {
  const map: Map<number, number[]> = new Map<number, number[]>()

  // Given a nodeId, `getActiveNodes` gets all the parent nodes in reversed call order
  const getActiveNodes = (id: number): number[] => {
    if (map.has(id)) return map.get(id) || []

    const node = profile.stackFrames[id]
    if (!node) throw new Error(`No such node ${id}`)
    if (node.parent) {
      const array = getActiveNodes(node.parent).concat([id])
      map.set(id, array)
      return array
    } else {
      return [id]
    }
  }

  Object.keys(profile.stackFrames).forEach(nodeId => {
    const id = Number(nodeId)
    map.set(id, getActiveNodes(id))
  })

  return map
}

/**
 * Returns an array containing the time difference in microseconds between the previous
 * sample and the current sample
 */
function getTimeDeltas(samples: Sample[]) {
  const timeDeltas: number[] = []
  let lastTimeStamp = Number(samples[0].ts)

  samples.forEach((sample: Sample, idx: number) => {
    if (idx === 0) {
      timeDeltas.push(0)
    } else {
      const timeDiff = Number(sample.ts) - lastTimeStamp
      lastTimeStamp = Number(sample.ts)
      timeDeltas.push(timeDiff)
    }
  })

  return timeDeltas
}

export function constructProfileFromJsonObject(
  contents: ChromeTraceWithSamples,
  samplesForPidTid: Sample[],
  {profileBuilder}: ProfileBuilderInfo,
) {
  const activeNodeArraysById = getActiveNodeArrays(contents)

  /**
   * The json object format maintains an object of stack frames where the
   * key is the frame id and the value is the stack frame object.
   */
  function getFrameById(frameId: string | number): StackFrame {
    return contents.stackFrames[String(frameId)]
  }

  /**
   * Wrapper function to get the active nodes for a given node id. We should
   * always have active nodes for any given node.
   */
  function getActiveNodeIds(nodeId: number): number[] {
    const activeNodeIds = activeNodeArraysById.get(nodeId)
    if (!activeNodeIds) throw new Error(`No such node ID ${nodeId}`)
    return activeNodeIds
  }

  // We need to leave frames in the same order that we start them, so we keep a stack
  // of frames that are currently open
  const frameStack: StackFrame[] = []

  /**
   * Enter a frame, pushing it to the top of the stack so that we keep track of what functions
   * are currently being executed
   */
  function enterFrame(frame: StackFrame, timestamp: number) {
    frameStack.push(frame)
    profileBuilder.enterFrame(frameInfoForEvent(frame), timestamp)
  }

  /**
   * Attempt to leave a frame. First we check if the frame matches what we expect to be the
   * next thing to leave (top of the stack). If this is not the case we warn, and then leave
   * the frame at the top of the stack
   */
  function tryToLeaveFrame(frame: StackFrame, timestamp: number) {
    const lastActiveFrame = lastOf(frameStack)

    if (lastActiveFrame == null) {
      console.warn(
        `Tried to end frame "${
          frameInfoForEvent(frame).key
        }", but the stack was empty. Doing nothing instead.`,
      )
      return
    }

    const frameInfo = frameInfoForEvent(frame)
    const lastActiveFrameInfo = frameInfoForEvent(lastActiveFrame)

    if (frame.name !== lastActiveFrame.name) {
      console.warn(
        `ts=${timestamp}: Tried to end "${frameInfo.key}" when "${lastActiveFrameInfo.key}" was on the top of the stack. Doing nothing instead.`,
      )
      return
    }

    if (frameInfo.key !== lastActiveFrameInfo.key) {
      console.warn(
        `ts=${timestamp}: Tried to end "${frameInfo.key}" when "${lastActiveFrameInfo.key}" was on the top of the stack. Ending ${lastActiveFrameInfo.key} instead.`,
      )
    }

    frameStack.pop()
    profileBuilder.leaveFrame(lastActiveFrameInfo, timestamp)
  }

  /**
   * Handle opening and closing the appropriate frames at a given timestamp
   *
   * @param activeNodeIds - The ids of the functions that are active at this timestamp
   * @param lastActiveNodeIds - The ids of the functions active at the previous timestamp
   * @param timestamp - The current timestamp (microseconds)
   */
  function handleSample(activeNodeIds: number[], lastActiveNodeIds: number[], timestamp: number) {
    // Frames which are present only in the currentNodeIds and not in lastActiveNodeIds
    const startFrameIds = activeNodeIds.filter(id => !lastActiveNodeIds.includes(id))

    // Frames which are present only in the PreviousNodeIds and not in activeNodeIds
    const endFrameIds = lastActiveNodeIds.filter(id => !activeNodeIds.includes(id))

    // Before we take the first event in the end ids, let's first see if there are any
    // end events that exactly match the top of the stack. We'll prioritize first by key,
    // then by name if we can't find a key match.
    while (endFrameIds.length > 0) {
      const stackTop = lastOf(frameStack)

      if (stackTop != null) {
        const bFrameInfo = frameInfoForEvent(stackTop)

        let swapped: boolean = false

        for (let i = 1; i < endFrameIds.length; i++) {
          const eEvent = getFrameById(endFrameIds[i])
          const eFrameInfo = frameInfoForEvent(eEvent)

          if (bFrameInfo.key === eFrameInfo.key) {
            // We have a match! Process this one first.
            const temp = endFrameIds[0]
            endFrameIds[0] = endFrameIds[i]
            endFrameIds[i] = temp
            swapped = true
            break
          }
        }

        if (!swapped) {
          // There was no key match, let's see if we can find a name match
          for (let i = 1; i < endFrameIds.length; i++) {
            const eEvent = getFrameById(endFrameIds[i])

            if (eEvent.name === stackTop.name) {
              // We have a match! Process this one first.
              const temp = endFrameIds[0]
              endFrameIds[0] = endFrameIds[i]
              endFrameIds[i] = temp
              swapped = true
              break
            }
          }
        }
      }

      const endFrameId = endFrameIds.shift()!
      tryToLeaveFrame(getFrameById(endFrameId), timestamp)
    }

    startFrameIds.forEach(frameId => {
      const frame = getFrameById(frameId)
      enterFrame(frame, timestamp)
    })
  }

  let currentTimestamp = 0
  let lastActiveNodeIds: number[] = []

  const timeDeltas = getTimeDeltas(samplesForPidTid)

  for (let i = 0; i < samplesForPidTid.length; i++) {
    const nodeId = samplesForPidTid[i].sf
    const timeDelta = Math.max(timeDeltas[i], 0)
    const node = getFrameById(nodeId)

    if (!node) throw new Error(`Missing node ${nodeId}`)

    currentTimestamp += timeDelta
    const activeNodeIds = getActiveNodeIds(nodeId)

    handleSample(activeNodeIds, lastActiveNodeIds, currentTimestamp)
    lastActiveNodeIds = activeNodeIds
  }

  handleSample([], lastActiveNodeIds, currentTimestamp)
}
