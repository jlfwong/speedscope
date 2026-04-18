import * as fs from 'fs'
import * as path from 'path'
import {importProfilesFromArrayBuffer} from '../import'
import {canonicalizeProfileGroup} from './engine'

const FIXTURES = [
  './sample/profiles/Chrome/116/Trace-20230603T221323.json',
  './sample/profiles/speedscope/0.6.0/two-sampled.speedscope.json',
  './sample/profiles/stackcollapse/simple.txt',
  './sample/profiles/pprof/simple.prof',
  './sample/profiles/callgrind/callgrind.example.log',
  './sample/profiles/Safari/13.1/simple.html-recording.json',
]

async function importFixture(
  fixturePath: string,
  engine: 'legacy' | 'experimental',
) {
  const buffer = fs.readFileSync(fixturePath)
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
  return importProfilesFromArrayBuffer(path.basename(fixturePath), arrayBuffer, {engine})
}

for (const fixturePath of FIXTURES) {
  test(`experimental engine matches legacy for ${fixturePath}`, async () => {
    const legacy = await importFixture(fixturePath, 'legacy')
    const experimental = await importFixture(fixturePath, 'experimental')

    expect(legacy).not.toBeNull()
    expect(experimental).not.toBeNull()

    expect(canonicalizeProfileGroup(experimental!)).toEqual(canonicalizeProfileGroup(legacy!))
  })
}
