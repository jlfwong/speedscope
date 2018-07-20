import {Profile, FrameInfo, StackListProfileBuilder} from '../profile'
import {getOrInsert, sortBy} from '../utils'
import {TimeFormatter} from '../value-formatters'

// References:
// - https://github.com/nodejs/node/blob/7edd0a17af8d74dce7dd6c7554a8b8523f83efdc/lib/internal/v8_prof_processor.js#L5
// - https://github.com/nodejs/node/blob/7edd0a17af8d74dce7dd6c7554a8b8523f83efdc/deps/v8/tools/tickprocessor.js
// - https://github.com/nodejs/node/blob/2db2857c72c219e5ba1642a345e52cfdd8c44a66/deps/v8/tools/logreader.js#L147
// - https://github.com/mapbox/flamebearer/blob/a8d4d5c0061ed439660783c613c43ab28b751219/index.js#L53

interface Code {
  name: string
  type: 'CODE' | 'CPP' | 'JS' | 'SHARED_LIB'
  timestamp?: number
  kind?:
    | 'Bultin'
    | 'BytecodeHandler'
    | 'Handler'
    | 'KeyedLoadIC'
    | 'KeyedStoreIC'
    | 'LoadGlobalIC'
    | 'LoadIC'
    | 'Opt'
    | 'StoreIC'
    | 'Stub'
    | 'Unopt'
    | 'Builtin'
    | 'RegExp'
  func?: number
  tm?: number
}

interface Function {
  name: string
  codes: number[]
}

interface Tick {
  // Timestamp
  tm: number

  // Virtual machine state?
  vm: number

  // stack
  s: number[]
}

interface V8LogProfile {
  code: Code[]
  functions: Function[]
  ticks: Tick[]
}

function codeToFrameInfo(code: Code, v8log: V8LogProfile): FrameInfo {
  if (!code || !code.type) {
    return {
      key: '(unknown type)',
      name: '(unknown type)',
    }
  }

  let name = code.name
  switch (code.type) {
    case 'CPP': {
      const matches = name.match(/[tT] ([^(<]*)/)
      if (matches) name = `(c++) ${matches[1]}`
      break
    }

    case 'SHARED_LIB':
      name = '(LIB) ' + name
      break

    case 'JS': {
      const matches = name.match(/([a-zA-Z0-9\._\-$]*) ([a-zA-Z0-9\.\-_\/$]*):(\d+):(\d+)/)
      if (matches) {
        return {
          key: name,
          name: matches[1].length > 0 ? matches[1] : '(anonymous)',
          file: matches[2].length > 0 ? matches[2] : '(unknown file)',
          line: parseInt(matches[3], 10),
          col: parseInt(matches[1], 10),
        }
      }
      break
    }

    case 'CODE': {
      switch (code.kind) {
        case 'LoadIC':
        case 'StoreIC':
        case 'KeyedStoreIC':
        case 'KeyedLoadIC':
        case 'LoadGlobalIC':
        case 'Handler':
          name = '(IC) ' + name
          break

        case 'BytecodeHandler':
          name = '(bytecode) ~' + name
          break
        case 'Stub':
          name = '(stub) ' + name
          break
        case 'Builtin':
          name = '(builtin) ' + name
          break
        case 'RegExp':
          name = '(regexp) ' + name
          break
      }
      break
    }

    default: {
      name = `(${code.type}) ${name}`
      break
    }
  }

  return {key: name, name}
}

export function importFromV8ProfLog(v8log: V8LogProfile): Profile {
  const profile = new StackListProfileBuilder()

  const sToFrameInfo = new Map<number, FrameInfo>()
  function getFrameInfo(t: number) {
    return getOrInsert(sToFrameInfo, t, t => {
      const code = v8log.code[t]
      return codeToFrameInfo(code, v8log)
    })
  }

  let lastTm = 0

  sortBy(v8log.ticks, tick => tick.tm)

  for (let tick of v8log.ticks) {
    const stack: FrameInfo[] = []

    // tick.s holds the call stack at the time the sample was taken. The
    // structure is a little strange -- it seems to be capturing both the
    // JavaScript stack & the parallel C++ stack by interleaving the two.
    // Because the stacks might not be the same length, it looks like the
    // shorter stack is padded with indices of -1, so we'll just ignore those
    // stacks.
    //
    // If you change the start index to `let i = tick.s.length - 1` instead,
    // you'll see the C++ stack instead.
    //
    // Mostly the numbers in the stack seem to be indices into the `v8log.code`
    // array, but some of the numbers in the C++ stack seem to be raw memory
    // addresses.

    for (let i = tick.s.length - 2; i >= 0; i -= 2) {
      const id = tick.s[i]

      if (id === -1) continue
      if (id > v8log.code.length) {
        // Treat this like a memory address
        stack.push({
          key: id,
          name: `0x${id.toString(16)}`,
        })
        continue
      }
      stack.push(getFrameInfo(id))
    }
    profile.appendSample(stack, tick.tm - lastTm)
    lastTm = tick.tm
  }

  // Despite the code in the v8 processing library indicating that the
  // timestamps come from a variable called "time_ns", from making empirical
  // recordings, it really seems like these profiles are recording timestamps in
  // microseconds, not nanoseconds.
  // https://github.com/nodejs/node/blob/c39caa997c751473d0c8f50af8c6b14bcd389fa0/deps/v8/tools/profile.js#L1076
  profile.setValueFormatter(new TimeFormatter('microseconds'))

  return profile.build()
}
