import {TimeFormatter, ByteFormatter} from './value-formatters'

describe('TimeFormatter', () => {
  test('input units milliseconds', () => {
    const f = new TimeFormatter('milliseconds')
    expect(f.format(0.00004)).toEqual('40.00ns')
    expect(f.format(0.04)).toEqual('40.00µs')
    expect(f.format(3)).toEqual('3.00ms')
    expect(f.format(2070)).toEqual('2.07s')
    expect(f.format(150000)).toEqual('2:30')
    expect(f.format(1203123)).toEqual('20:03')
  })

  test('input units seconds', () => {
    const f = new TimeFormatter('seconds')
    expect(f.format(0.00004)).toEqual('40.00µs')
    expect(f.format(0.003)).toEqual('3.00ms')
    expect(f.format(2.07)).toEqual('2.07s')
    expect(f.format(150)).toEqual('2:30')
    expect(f.format(1203.123)).toEqual('20:03')
  })
})

test('ByteFormatter', () => {
  const f = new ByteFormatter()
  expect(f.format(100)).toEqual('100 B')
  expect(f.format(1024)).toEqual('1.00 KB')
  expect(f.format(3.5 * 1024 * 1024)).toEqual('3.50 MB')
  expect(f.format(4.32 * 1024 * 1024 * 1024)).toEqual('4.32 GB')
})
