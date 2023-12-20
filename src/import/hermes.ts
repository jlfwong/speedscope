import {CallTreeProfileBuilder, FrameInfo, Profile} from '../lib/profile'
import { TimeFormatter } from '../lib/value-formatters';

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

  interface DurationEventBegin extends HermesTraceEvent {
    ph: EventsPhase.DURATION_EVENTS_BEGIN;
  }
  
  interface DurationEventEnd extends HermesTraceEvent {
    ph: EventsPhase.DURATION_EVENTS_END;
  }
  
  export type DurationEvent = DurationEventBegin | DurationEventEnd;

export interface HermesTraceEvent {
    name?: string;
    cat?: string;
    // tracing clock timestamp
    ts?: number;
    pid?: number;
    tid?: number;
    // event type (phase)
    ph: EventsPhase;
    // id for a stackFrame object
    sf?: number;
    // thread clock timestamp
    tts?: number;
    // a fixed color name
    cname?: string;
    args?: {
      [key in string]: any;
    };
  }

export interface HermesStackFrame {
  line: string;
  column: string;
  funcLine: string;
  funcColumn: string;
  name: string;
  category: string;
  // A parent function may or may not exist
  parent?: number;
}

export interface HermesSample {
  cpu: string;
  name: string;
  ts: string;
  pid: number;
  tid: string;
  weight: string;
  // Will refer to an element in the stackFrames object of the Hermes Profile
  sf: number;
  stackFrameData?: HermesStackFrame;
}

/**
 * Hermes Profile Interface
 */
export interface HermesProfile {
  traceEvents: HermesTraceEvent[];
  samples: HermesSample[];
  stackFrames: { [key in string]: HermesStackFrame };
}

function frameInfoForEvent({ name, line, column }: HermesStackFrame): FrameInfo {
  return {
    key: `${name}:${line}:${column}`,
    name,
    // TODO: --raw does not support the URL path to the file...maybe we should
    // just transform into a different profile format (like the speedscope one)
    // so that it can be used directly
    file: undefined,
    line: Number(line),
    col: Number(column),
  }
}

/**
   * Initialization function to enable O(1) access to the set of active nodes in the stack by node ID.
   * @return Map<number, number[]>
   */
function getActiveNodeArrays(profile: HermesProfile): Map<number, number[]> {
  const map: Map<number, number[]> = new Map<number, number[]>();

  /**
   * Given a nodeId, `getActiveNodes` gets all the parent nodes in reversed call order
   * @param {number} id
   */
  const getActiveNodes = (id: number): number[] => {
    if (map.has(id)) return map.get(id) || [];

    const node = profile.stackFrames[id];
    if (!node) throw new Error(`No such node ${id}`);
    if (node.parent) {
      const array = getActiveNodes(node.parent).concat([id]);
      map.set(id, array);
      return array;
    } else {
      return [id];
    }
  };

  Object.keys(profile.stackFrames).forEach((nodeId) => {
    const id = Number(nodeId);
    map.set(id, getActiveNodes(id)) 
  })

  return map;
}

export function importFromHermes(contents: HermesProfile): Profile | null {
  const profile = new CallTreeProfileBuilder()
  profile.setValueFormatter(new TimeFormatter('microseconds'))

  const activeNodeArraysById = getActiveNodeArrays(contents);
  // For each sample, get all the active nodes (nodes that are currently executing)
  // If it is a new node (not in the stack), then enter a frame
  // If a node no longer exists, then exit the frame
  const timeDeltas: number[] = [];
  let lastTimeStamp = Number(contents.samples[0].ts);

  contents.samples.forEach((sample: HermesSample, idx: number) => {
    if (idx === 0) {
      timeDeltas.push(0);
    } else {
      const timeDiff = Number(sample.ts) - lastTimeStamp;
      lastTimeStamp = Number(sample.ts);
      timeDeltas.push(timeDiff);
    }
  });

  function getActiveNodeIds(nodeId: number): number[] {
    const activeNodeIds = activeNodeArraysById.get(nodeId);
    if (!activeNodeIds) throw new Error(`No such node ID ${nodeId}`);
    return activeNodeIds;
  }

  // We need to leave frames in the same order that we start them, so we keep 
  // a stack. At each new timestamp, first we check whether there is a end
  const frameStack = [];

  type HandleSampleParams = {
    timestamp: number;
    activeNodeIds: number[];
    lastActiveNodeIds: number[];
  }

  function handleSample({ timestamp, lastActiveNodeIds, activeNodeIds }: HandleSampleParams) {
    // Frames which are present only in the currentNodeIds and not in PreviousNodeIds
    const startFrames = activeNodeIds
      .filter(id => !lastActiveNodeIds.includes(id))
      .map(id => contents.stackFrames[id]!);

    // Frames which are present only in the PreviousNodeIds and not in CurrentNodeIds
    const endFrames = lastActiveNodeIds
      .filter(id => !activeNodeIds.includes(id))
      .map(id => contents.stackFrames[id]!); 

    startFrames.forEach(frame => {
      profile.enterFrame(frameInfoForEvent(frame), timestamp)
    })

    endFrames.forEach(frame => {
      profile.leaveFrame(frameInfoForEvent(frame), timestamp)
    })
  }

  let timestamp =  Number(contents.samples[0].ts);
  let lastActiveNodeIds: number[] = [];

  for (let i = 0; i < contents.samples.length; i++) {
    const nodeId = contents.samples[i].sf;
    const timeDelta = Math.max(timeDeltas[i], 0);
    const node = contents.stackFrames[nodeId];

    if (!node) throw new Error(`Missing node ${nodeId}`);

    timestamp += timeDelta;
    const activeNodeIds = getActiveNodeIds(nodeId);

    handleSample({ timestamp, lastActiveNodeIds, activeNodeIds }) 
    lastActiveNodeIds = activeNodeIds;
  }

  handleSample({ timestamp, lastActiveNodeIds, activeNodeIds: [] })

  profile.setName('Hermes Profiler');
  return profile.build();
}