import {perfetto} from './perfetto.proto.js'
import {importFromPerfettoTrace} from './perfetto'

describe('importFromPerfettoTrace', () => {
  it('should return null for empty buffer', () => {
    const profile = importFromPerfettoTrace(new ArrayBuffer(0))
    expect(profile).toBe(null)
  })

  it('should return null for invalid protobuf data', () => {
    const invalidData = new ArrayBuffer(10)
    new Uint8Array(invalidData).fill(0xff) // Fill with invalid data
    const profile = importFromPerfettoTrace(invalidData)
    expect(profile).toBe(null)
  })

  it('should return null for trace with no packets', () => {
    const trace = perfetto.protos.Trace.create({
      packet: [],
    })
    const buffer = perfetto.protos.Trace.encode(trace).finish()
    const profile = importFromPerfettoTrace(buffer.buffer)
    expect(profile).toBe(null)
  })

  // Simplified test with minimal structure
  it('should handle empty trace packets', () => {
    const trace = perfetto.protos.Trace.create({
      packet: [
        {
          timestamp: 1000000,
          // Empty packet with just timestamp
        },
      ],
    })

    const buffer = perfetto.protos.Trace.encode(trace).finish()
    const profile = importFromPerfettoTrace(buffer.buffer)

    // Should return null because no meaningful data
    expect(profile).toBe(null)
  })
})
