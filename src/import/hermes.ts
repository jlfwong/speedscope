import {CallTreeProfileBuilder, FrameInfo, Profile} from '../lib/profile'
import {lastOf} from '../lib/utils'
import {TimeFormatter} from '../lib/value-formatters'

enum EventsPhase {
  DURATION_EVENTS_BEGIN = 'B',
  DURATION_EVENTS_END = 'E',
  COMPLETE_EVENTS = 'X',
  INSTANT_EVENTS = 'I',
  COUNTER_EVENTS = 'C',
  ASYNC_EVENTS_NESTABLE_START = 'b',
  ASYNC_EVENTS_NESTABLE_INSTANT = 'n',
  ASYNC_EVENTS_NESTABLE_END = 'e',
  FLOW_EVENTS_START = 's',
  FLOW_EVENTS_STEP = 't',
  FLOW_EVENTS_END = 'f',
  SAMPLE_EVENTS = 'P',
  OBJECT_EVENTS_CREATED = 'N',
  OBJECT_EVENTS_SNAPSHOT = 'O',
  OBJECT_EVENTS_DESTROYED = 'D',
  METADATA_EVENTS = 'M',
  MEMORY_DUMP_EVENTS_GLOBAL = 'V',
  MEMORY_DUMP_EVENTS_PROCESS = 'v',
  MARK_EVENTS = 'R',
  CLOCK_SYNC_EVENTS = 'c',
  CONTEXT_EVENTS_ENTER = '(',
  CONTEXT_EVENTS_LEAVE = ')',
  // Deprecated
  ASYNC_EVENTS_START = 'S',
  ASYNC_EVENTS_STEP_INTO = 'T',
  ASYNC_EVENTS_STEP_PAST = 'p',
  ASYNC_EVENTS_END = 'F',
  LINKED_ID_EVENTS = '=',
}

interface HermesTraceEvent {
  name?: string
  cat?: string
  // tracing clock timestamp
  ts?: string
  pid?: number
  tid?: number
  // event type (phase)
  ph: EventsPhase
  // id for a stackFrame object
  sf?: number
  // thread clock timestamp
  tts?: number
  // a fixed color name
  cname?: string
  args?: {
    [key in string]: any
  }
}

export interface HermesStackFrame {
  line: string
  column: string
  funcLine: string
  funcColumn: string
  name: string
  category: string
  // A parent function may or may not exist
  parent?: number
}

export interface HermesSample {
  cpu: string
  name: string
  ts: string
  pid: number
  tid: string
  weight: string
  // Will refer to an element in the stackFrames object of the Hermes Profile
  sf: number
  stackFrameData?: HermesStackFrame
}

/**
 * Hermes Profile Interface
 */
export interface HermesProfile {
  traceEvents: HermesTraceEvent[]
  samples: HermesSample[]
  stackFrames: {[key in string]: HermesStackFrame}
}

export function isHermesProfile(profile: any): profile is HermesProfile {
  return 'traceEvents' in profile && 'stackFrames' in profile && 'samples' in profile
}

type ParsedEventDetails = {
  name: string
  file: string
  line: number
  col: number
}

/**
 * Hermes appends the file, line, and column information inside the name field, so it looks like this:
 *
 * useRecoilValue(http://localhost:8081/index.bundle?platform=android&dev=false&minify=false&app=org.toshi&modulesOnly=false&runModule=true:111183:42)
 */
export function getEventDetails(input: string): ParsedEventDetails {
  // Regular expression to match the required format, allowing for an optional name
  const regex = /^(.*?)(?:\((.+):(\d+):(\d+)\))?$/

  // Match the input string against the regex pattern
  const match = input.match(regex)
  if (!match || match.length < 5) {
    throw new Error('Input string does not match the expected format.')
  }

  // Extract matched groups with a default name "(unnamed)" if the name is empty
  const [, name, file, line, col] = match
  const parsedName = name || '(unnamed)'

  // Return the parsed data as an object
  return {
    name: parsedName,
    file: file || '',
    line: line ? parseInt(line, 10) : 0,
    col: col ? parseInt(col, 10) : 0,
  }
}

function frameInfoForEvent(stackFrame: HermesStackFrame): FrameInfo {
  const {name, file, line, col} = getEventDetails(stackFrame.name)

  const lineNumber = line ?? Number(stackFrame.line)
  const colNumber = col ?? Number(stackFrame.column)

  return {
    key: `${name}:${file}:${lineNumber}:${colNumber}`,
    name,
    file,
    line: line ?? Number(stackFrame.line),
    col: col ?? Number(stackFrame.column),
  }
}

/**
 * Initialization function to enable O(1) access to the set of active nodes in the stack by node ID.
 */
function getActiveNodeArrays(profile: HermesProfile): Map<number, number[]> {
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
function getTimeDeltas(contents: HermesProfile) {
  const timeDeltas: number[] = []
  let lastTimeStamp = Number(contents.samples[0].ts)

  contents.samples.forEach((sample: HermesSample, idx: number) => {
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

export function importFromHermes(contents: HermesProfile): Profile | null {
  const profile = new CallTreeProfileBuilder()
  profile.setValueFormatter(new TimeFormatter('microseconds'))

  const activeNodeArraysById = getActiveNodeArrays(contents)

  /**
   * The hermes format maintains an object of stack frames where the
   * key is the frame id and the value is the stack frame object.
   */
  function getFrameById(frameId: string | number): HermesStackFrame {
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
  const frameStack: HermesStackFrame[] = []

  /**
   * Enter a frame, pushing it to the top of the stack so that we keep track of what functions
   * are currently being executed
   */
  function enterFrame(frame: HermesStackFrame, timestamp: number) {
    frameStack.push(frame)
    profile.enterFrame(frameInfoForEvent(frame), timestamp)
  }

  /**
   * Attempt to leave a frame. First we check if the frame matches what we expect to be the
   * next thing to leave (top of the stack). If this is not the case we warn, and then leave
   * the frame at the top of the stack
   */
  function tryToLeaveFrame(frame: HermesStackFrame, timestamp: number) {
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
    profile.leaveFrame(lastActiveFrameInfo, timestamp)
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

  const timeDeltas = getTimeDeltas(contents)

  for (let i = 0; i < contents.samples.length; i++) {
    const nodeId = contents.samples[i].sf
    const timeDelta = Math.max(timeDeltas[i], 0)
    const node = getFrameById(nodeId)

    if (!node) throw new Error(`Missing node ${nodeId}`)

    currentTimestamp += timeDelta
    const activeNodeIds = getActiveNodeIds(nodeId)

    handleSample(activeNodeIds, lastActiveNodeIds, currentTimestamp)
    lastActiveNodeIds = activeNodeIds
  }

  handleSample([], lastActiveNodeIds, currentTimestamp)

  profile.setName('Hermes Profile')
  return profile.build()
}
