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

  function openFrame(node: CallTreeNode, value: number) {
    if (lastValue != value) {
      stackList.push(curStack.map(k => `${k}`).join(';'))
      lastValue = value
    }
    curStack.push(node.frame.key)
  }

  function closeFrame(node: CallTreeNode, value: number) {
    if (lastValue != value) {
      stackList.push(curStack.map(k => `${k}`).join(';'))
      lastValue = value
    }
    curStack.pop()
  }

  if (grouped) {
    profile.forEachCallGrouped(openFrame, closeFrame)
  } else {
    profile.forEachCall(openFrame, closeFrame)
  }
  return stackList
}

function verifyProfile(profile: Profile) {
  const allFrameKeys = new Set([fa, fb, fc, fd, fe].map(f => f.key))
  const framesInProfile = new Set<string | number>()
  profile.forEachFrame(f => framesInProfile.add(f.key))
  expect(allFrameKeys).toEqual(framesInProfile)

  expect(toStackList(profile, false)).toEqual([
    // prettier-ignore
    'a',
    'a;b',
    'a;b;d',
    'a;b;c',
    '',
    'a',
    'a;b',
    'a;b;b',
    'a;b;e',
    'a',
  ])

  expect(toStackList(profile, true)).toEqual([
    // prettier-ignore
    'a;b;e',
    'a;b;b',
    'a;b;c',
    'a;b;d',
    'a;b',
    'a',
  ])

  const flattened = profile.getProfileWithRecursionFlattened()
  expect(toStackList(flattened, false)).toEqual([
    // prettier-ignore
    'a',
    'a;b',
    'a;b;d',
    'a;b;c',
    '',
    'a',
    'a;b',
    'a;b;e',
    'a',
  ])

  expect(toStackList(flattened, true)).toEqual([
    // prettier-ignore
    'a;b;e',
    'a;b;c',
    'a;b;d',
    'a;b',
    'a',
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
    b.appendSample(stack, 1)
  })
  b.appendSample([], 4)

  const profile = b.build()
  expect(profile.getTotalWeight()).toBe(samples.length + 4)
  expect(profile.getTotalNonIdleWeight()).toBe(samples.length - 1)
  verifyProfile(profile)
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
    b.appendSample(stack, 1)
  })

  const profile = b.build()
  const inverted = profile.getInvertedProfileForCallersOf(fb)

  expect(toStackList(inverted, false)).toEqual([
    // prettier-ignore
    'b',
    'b;a',
    'b;d',
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
    b.appendSample(stack, 1)
  })

  const profile = b.build()
  const inverted = profile.getProfileForCalleesOf(fb)

  expect(toStackList(inverted, false)).toEqual([
    // prettier-ignore
    'b',
    'b;c',
    'b;d',
    'b',
  ])
})
