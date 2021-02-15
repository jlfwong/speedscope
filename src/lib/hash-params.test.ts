import {getHashParams} from './hash-params'

test('getHashParams', () => {
  expect(getHashParams('')).toEqual({})
  expect(getHashParams('#')).toEqual({})
  expect(getHashParams('#title=hello')).toEqual({title: 'hello'})
  expect(getHashParams('#localProfilePath=file:///tmp/file.js')).toEqual({
    localProfilePath: 'file:///tmp/file.js',
  })
  expect(
    getHashParams(
      '#profileURL=https://raw.githubusercontent.com/jlfwong/speedscope/main/sample/profiles/speedscope/0.1.2/simple-sampled.speedscope.json',
    ),
  ).toEqual({
    profileURL:
      'https://raw.githubusercontent.com/jlfwong/speedscope/main/sample/profiles/speedscope/0.1.2/simple-sampled.speedscope.json',
  })
  expect(getHashParams('#title=hello&localProfilePath=file:///tmp/file.js')).toEqual({
    title: 'hello',
    localProfilePath: 'file:///tmp/file.js',
  })
  expect(getHashParams('#title=hello%20world')).toEqual({
    title: 'hello world',
  })
  expect(getHashParams('#abc=bcd')).toEqual({})
  expect(getHashParams('garbage')).toEqual({})
})
