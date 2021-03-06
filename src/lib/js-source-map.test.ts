import * as fs from 'fs'
import * as path from 'path'
import {importProfilesFromArrayBuffer} from '../import'
import {importJavaScriptSourceMapSymbolRemapper} from './js-source-map'
import {Frame} from './profile'

async function checkSourceMapApplication(pathToProfile: string, pathToSourceMap: string) {
  const buffer = fs.readFileSync(pathToProfile)
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
  const profileGroup = await importProfilesFromArrayBuffer(
    path.basename(pathToProfile),
    arrayBuffer,
  )

  if (!profileGroup) {
    fail('Failed to extract profile')
    return
  }

  const sourceMapFileName = path.basename(pathToSourceMap)
  const remapper = await importJavaScriptSourceMapSymbolRemapper(
    fs.readFileSync(pathToSourceMap, 'utf-8'),
    sourceMapFileName,
  )

  if (!remapper) {
    fail('Failed to extract sourcemap')
    return
  }

  const key: (f: {name?: string; file?: string; line?: number; col?: number}) => string = f => {
    return `${f.name} @ ${f.file}:${f.line}:${f.col}`
  }

  const frames: Frame[] = []

  profileGroup.profiles[profileGroup.indexToView].forEachFrame(f => {
    frames.push(f)
  })

  frames.sort((a, b) => (a.key < b.key ? -1 : 1))

  const remappedFrames: string[] = []
  frames.forEach(f => {
    const remapped = remapper(f)
    if (!remapped) return
    remappedFrames.push(`(${key({...f, ...remapped})}) <- (${key(f)})`)
  })

  expect(remappedFrames).toMatchSnapshot()
}

test('source-map remapping of chrome-85-webpack', async () => {
  await checkSourceMapApplication(
    './sample/profiles/source-maps/chrome-85-webpack.json',
    './sample/profiles/source-maps/webpack/typescript-source-map-test.js.map',
  )
})

test('source-map remapping of firefox-79-webpack', async () => {
  await checkSourceMapApplication(
    './sample/profiles/source-maps/firefox-79-webpack.json',
    './sample/profiles/source-maps/webpack/typescript-source-map-test.js.map',
  )
})

test('source-map remapping of safari-13-webpack', async () => {
  await checkSourceMapApplication(
    './sample/profiles/source-maps/safari-13-webpack.json',
    './sample/profiles/source-maps/webpack/typescript-source-map-test.js.map',
  )
})

test('source-map remapping of chrome-85-esbuild', async () => {
  await checkSourceMapApplication(
    './sample/profiles/source-maps/chrome-85-esbuild.json',
    './sample/profiles/source-maps/esbuild/typescript-source-map-test.js.map',
  )
})

test('source-map remapping of chrome-85-parcel', async () => {
  await checkSourceMapApplication(
    './sample/profiles/source-maps/chrome-85-parcel.json',
    './sample/profiles/source-maps/parcel/typescript-source-map-test.js.map',
  )
})
