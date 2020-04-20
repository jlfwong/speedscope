import {
  FrameInfo,
  StackListProfileBuilder,
  CallTreeNode,
  CallTreeProfileBuilder,
  Profile,
} from './profile'

function getFrameInfo(key: string): FrameInfo {
  return {
    key: key,
    name: key,
    file: `${key}.ts`,
    line: key.length,
  }
}

const fa = getFrameInfo('a')
const fb = getFrameInfo('b')
const fc = getFrameInfo('c')
const fd = getFrameInfo('d')
const fe = getFrameInfo('e')

function toStackList(profile: Profile, grouped: boolean): string[] {
  let stackList: string[] = []
  const curStack: (number | string)[] = []
  let lastValue = 0

  function maybeEmit(value: number) {
    if (lastValue != value) {
      stackList.push(
        curStack.map(k => `${k}`).join(';') + ` ${profile.formatValue(value - lastValue)}`,
      )
      lastValue = value
    }
  }

  function openFrame(node: CallTreeNode, value: number) {
    maybeEmit(value)
    curStack.push(node.frame.name)
  }

  function closeFrame(node: CallTreeNode, value: number) {
    maybeEmit(value)
    curStack.pop()
  }

  if (grouped) {
    profile.forEachCallGrouped(openFrame, closeFrame)
  } else {
    profile.forEachCall(openFrame, closeFrame)
  }
  return stackList
}

function flatten<T>(ts: T[][]): T[] {
  let ret: T[] = []
  return ret.concat(...ts)
}

function toTreeString(profile: Profile, grouped: boolean): string {
  function visit(node: CallTreeNode): string[] {
    const childLines = flatten(node.children.map(child => visit(child))).map(l => `  ${l}`)
    const nodeStr = `${node.frame.key}:${node.getSelfWeight()}:${node.getTotalWeight()}`

    if (childLines.length > 0) {
      return [`(${nodeStr}`].concat(childLines).concat(')')
    } else {
      return [`(${nodeStr})`]
    }
  }

  if (grouped) {
    return visit(profile.getGroupedCalltreeRoot()).join('\n')
  } else {
    return visit(profile.getAppendOrderCalltreeRoot()).join('\n')
  }
}

function verifyProfile(profile: Profile) {
  const allFrameKeys = new Set([fa, fb, fc, fd, fe].map(f => f.key))
  const framesInProfile = new Set<string | number>()
  profile.forEachFrame(f => framesInProfile.add(f.key))
  expect(allFrameKeys).toEqual(framesInProfile)

  expect(toStackList(profile, false)).toEqual([
    // prettier-ignore
    'a 1',
    'a;b 2',
    'a;b;d 1',
    'a;b;c 1',
    ' 1',
    'a 1',
    'a;b 1',
    'a;b;b 1',
    'a;b;e 1',
    'a 1',
  ])

  expect(toStackList(profile, true)).toEqual([
    // prettier-ignore
    'a;b;d 1',
    'a;b;c 1',
    'a;b;b 1',
    'a;b;e 1',
    'a;b 3',
    'a 3',
  ])

  const flattened = profile.getProfileWithRecursionFlattened()
  expect(toStackList(flattened, false)).toEqual([
    // prettier-ignore
    'a 1',
    'a;b 2',
    'a;b;d 1',
    'a;b;c 1',
    ' 1',
    'a 1',
    'a;b 2',
    'a;b;e 1',
    'a 1',
  ])

  expect(toStackList(flattened, true)).toEqual([
    // prettier-ignore
    'a;b;d 1',
    'a;b;c 1',
    'a;b;e 1',
    'a;b 4',
    'a 3',
  ])
}

test('StackListProfileBuilder', () => {
  const b = new StackListProfileBuilder()

  const samples = [
    // prettier-ignore
    [fa],
    [fa, fb],
    [fa, fb],
    [fa, fb, fd],
    [fa, fb, fc],
    [],
    [fa],
    [fa, fb],
    [fa, fb, fb],
    [fa, fb, fe],
    [fa],
  ]

  samples.forEach(stack => {
    b.appendSampleWithWeight(stack, 1)
  })
  b.appendSampleWithWeight([], 4)

  const profile = b.build()
  expect(profile.getTotalWeight()).toBe(samples.length + 4)
  expect(profile.getTotalNonIdleWeight()).toBe(samples.length - 1)
  verifyProfile(profile)
})

test('StackListProfileBuilder separates non-contiguous', () => {
  const b = new StackListProfileBuilder()

  const samples = [
    // prettier-ignore
    [fa, fb, fc],
    [fa, fb],
    [fa],
    [fa, fb],
    [fa, fb, fc],
  ]

  samples.forEach(stack => {
    b.appendSampleWithWeight(stack, 1)
  })
  b.appendSampleWithWeight([], 4)
  const profile = b.build()

  expect(toTreeString(profile, true)).toMatchSnapshot('grouped')
  expect(toTreeString(profile, false)).toMatchSnapshot('append order')
})

test('CallTreeProfileBuilder', () => {
  const b = new CallTreeProfileBuilder()

  b.enterFrame(fa, 0)

  b.enterFrame(fb, 1)

  b.enterFrame(fd, 3)

  b.leaveFrame(fd, 4)
  b.enterFrame(fc, 4)

  b.leaveFrame(fc, 5)
  b.leaveFrame(fb, 5)
  b.leaveFrame(fa, 5)

  b.enterFrame(fa, 6)

  b.enterFrame(fb, 7)

  b.enterFrame(fb, 8)

  b.leaveFrame(fb, 9)
  b.enterFrame(fe, 9)

  b.leaveFrame(fe, 10)
  b.leaveFrame(fb, 10)

  b.leaveFrame(fa, 11)

  const profile = b.build()
  verifyProfile(profile)
})

test('CallTreeProfileBuilder separates non-contiguous', () => {
  const b = new CallTreeProfileBuilder()

  b.enterFrame(fa, 0)
  b.enterFrame(fb, 0)
  b.enterFrame(fc, 0)

  b.leaveFrame(fc, 1)

  b.leaveFrame(fb, 2)

  b.enterFrame(fb, 3)

  b.enterFrame(fc, 4)

  b.leaveFrame(fc, 5)
  b.leaveFrame(fb, 5)
  b.leaveFrame(fa, 5)

  const profile = b.build()
  expect(toTreeString(profile, true)).toMatchSnapshot('grouped')
  expect(toTreeString(profile, false)).toMatchSnapshot('append order')
})

test('getInvertedProfileForCallersOf', () => {
  const b = new StackListProfileBuilder()

  const samples = [
    // prettier-ignore
    [fb],
    [fa, fb],
    [fa, fb, fc],
    [fa],
    [fa, fb, fd],
    [fa],
    [fd, fb],
  ]
  samples.forEach(stack => {
    b.appendSampleWithWeight(stack, 1)
  })

  const profile = b.build()
  const inverted = profile.getInvertedProfileForCallersOf(fb)

  expect(toStackList(inverted, false)).toEqual([
    // prettier-ignore
    'b 1',
    'b;a 3',
    'b;d 1',
  ])
})

test('getProfileForCalleesOf', () => {
  const b = new StackListProfileBuilder()

  const samples = [
    // prettier-ignore
    [fb],
    [fa, fb],
    [fa, fb, fc],
    [fa],
    [fa, fb, fd],
    [fa],
    [fd, fb],
  ]
  samples.forEach(stack => {
    b.appendSampleWithWeight(stack, 1)
  })

  const profile = b.build()
  const inverted = profile.getProfileForCalleesOf(fb)

  expect(toStackList(inverted, false)).toEqual([
    // prettier-ignore
    'b 2',
    'b;c 1',
    'b;d 1',
    'b 1',
  ])
})

test('getProfileWithRecursionFlattened', () => {
  const b = new StackListProfileBuilder()

  const samples = [
    // prettier-ignore
    [fa],
    [fa, fb, fa],
    [fa, fb, fa, fb, fa],
    [fa, fb, fa],
  ]
  samples.forEach(stack => {
    b.appendSampleWithWeight(stack, 1)
  })

  const profile = b.build()
  const inverted = profile.getProfileWithRecursionFlattened()

  expect(toStackList(inverted, false)).toEqual([
    // prettier-ignore
    'a 1',
    'a;b 3',
  ])

  const framesInProfile = new Set<string | number>()
  inverted.forEachFrame(f => {
    if (f.key === fa.key) {
      expect(f.getSelfWeight()).toEqual(4)
    }
    if (f.key === fb.key) {
      expect(f.getSelfWeight()).toEqual(0)
    }
    framesInProfile.add(f.key)
  })
  const allFrameKeys = new Set([fa, fb].map(f => f.key))
  expect(allFrameKeys).toEqual(framesInProfile)
})
