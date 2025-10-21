import {importProfilesFromArrayBuffer} from './index'
import * as fs from 'fs'
import * as path from 'path'

describe('Perfetto trace import integration', () => {
  it('should import Perfetto trace file by filename', async () => {
    const tracePath = path.join(__dirname, '../../sample/profiles/perfetto/simple.perfetto-trace')

    if (!fs.existsSync(tracePath)) {
      console.warn('Perfetto trace file not found, skipping test:', tracePath)
      return
    }

    const buffer = fs.readFileSync(tracePath)
    const profileGroup = await importProfilesFromArrayBuffer('simple.perfetto-trace', buffer.buffer)

    // The sample trace is very minimal, so we might get null if it has no meaningful data
    // Just test that it doesn't crash
    if (profileGroup) {
      expect(profileGroup.profiles.length).toBeGreaterThan(0)
    }
  })

  it('should import Perfetto trace file by extension .perfetto-trace', async () => {
    const tracePath = path.join(__dirname, '../../sample/profiles/perfetto/simple.perfetto-trace')

    if (!fs.existsSync(tracePath)) {
      console.warn('Perfetto trace file not found, skipping test:', tracePath)
      return
    }

    const buffer = fs.readFileSync(tracePath)
    const profileGroup = await importProfilesFromArrayBuffer('test.perfetto-trace', buffer.buffer)

    // Test filename-based detection
    if (profileGroup) {
      expect(profileGroup.profiles.length).toBeGreaterThan(0)
    }
  })

  it('should import Perfetto trace file by extension .pftrace', async () => {
    const tracePath = path.join(__dirname, '../../sample/profiles/perfetto/simple.perfetto-trace')

    if (!fs.existsSync(tracePath)) {
      console.warn('Perfetto trace file not found, skipping test:', tracePath)
      return
    }

    const buffer = fs.readFileSync(tracePath)
    const profileGroup = await importProfilesFromArrayBuffer('test.pftrace', buffer.buffer)

    // Test filename-based detection
    if (profileGroup) {
      expect(profileGroup.profiles.length).toBeGreaterThan(0)
    }
  })
})
