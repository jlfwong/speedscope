import {FrameInfo, StackListProfileBuilder, CallTreeNode} from './profile'

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

  const allFrameKeys = new Set([fa, fb, fc, fd, fe].map(f => f.key))
  const framesInProfile = new Set<string | number>()
  profile.forEachFrame(f => framesInProfile.add(f.key))
  expect(allFrameKeys).toEqual(framesInProfile)

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

  function closeFrame(value: number) {
    if (lastValue != value) {
      stackList.push(curStack.map(k => `${k}`).join(';'))
      lastValue = value
    }
    curStack.pop()
  }

  profile.forEachCall(openFrame, closeFrame)
  expect(stackList).toEqual([
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

  stackList = []
  profile.forEachCallGrouped(openFrame, closeFrame)
  expect(stackList).toEqual([
    // prettier-ignore
    '',
    'a;b;e',
    'a;b;b',
    'a;b;c',
    'a;b;d',
    'a;b',
    'a',
  ])
})
