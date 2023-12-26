import * as fs from 'fs'
import * as path from 'path'
import {dumpProfile, checkProfileSnapshot} from '../lib/test-utils'

import * as JSZip from 'jszip'
import {importFromFileSystemDirectoryEntry} from '.'

describe('importFromInstrumentsDeepCopy', () => {
  test('time profile', async () => {
    await checkProfileSnapshot(
      './sample/profiles/Instruments/7.3.1/simple-time-profile-deep-copy.txt',
    )
  })

  test('allocations profile', async () => {
    await checkProfileSnapshot(
      './sample/profiles/Instruments/7.3.1/random-allocations-deep-copy.txt',
    )
  })

  test('allocations profile', async () => {
    await checkProfileSnapshot('./sample/profiles/Instruments/13.4/cycles-example-deep-copy.txt')
  })
})

// This is a bit of a weird type signature. I'm making this almost a
// FileSystemEntry, but ignoring the parts of the API I don't use anywhere and
// are a pain to implement.
class ZipBackedFileSystemEntry implements Omit<FileSystemEntry, 'filesystem' | 'getParent'> {
  readonly isFile: boolean
  readonly isDirectory: boolean
  readonly name: string
  readonly fullPath: string

  private zipDir: any | null
  private zipFile: JSZip.JSZipObject | null

  constructor(
    private zip: JSZip,
    fullPath: string,
  ) {
    this.fullPath = fullPath

    this.zipFile = zip.file(fullPath)
    this.isFile = !!this.zipFile

    if (this.isFile) {
      this.zipDir = null
      this.isDirectory = false
    } else {
      this.zipDir = zip.folder(fullPath)
      this.isDirectory = true
    }

    this.name = path.basename(this.fullPath)
  }

  file(cb: (file: File) => void, errCb: (error: Error) => void) {
    if (!this.zipFile) return errCb(new Error('Failed to extract file'))
    this.zipFile
      .async('blob')
      .then(
        blob => {
          ;(blob as any).name = this.name
          cb(blob as File)
        },
        err => {
          errCb(err)
        },
      )
      .catch(errCb)
  }

  createReader() {
    return {
      readEntries: (cb: (entries: FileSystemEntry[]) => void, errCb: (error: Error) => void) => {
        if (!this.zipDir) return errCb(new Error('Failed to read folder entries'))
        const ret: FileSystemEntry[] = []
        this.zipDir.forEach((relativePath: string, file: {name: string}) => {
          if (relativePath.split('/').length === (relativePath.endsWith('/') ? 2 : 1)) {
            ret.push(new ZipBackedFileSystemEntry(this.zip, file.name) as any as FileSystemEntry)
          }
        })
        cb(ret)
      },
    }
  }
}

describe('importFromInstrumentsTrace', () => {
  async function importFromTrace(tracePath: string) {
    const zip = await new Promise<any>((resolve, reject) => {
      fs.readFile(tracePath, (err, data) => {
        if (err) return reject(err)
        JSZip.loadAsync(data).then(resolve)
      })
    })
    const root: FileSystemDirectoryEntry = new ZipBackedFileSystemEntry(
      zip,
      'simple-time-profile.trace',
    ) as any
    const profileGroup = await importFromFileSystemDirectoryEntry(root)
    const profile = profileGroup.profiles[profileGroup.indexToView]
    expect(dumpProfile(profile)).toMatchSnapshot()
  }

  test('Instruments 8.3.3', async () => {
    await importFromTrace('./sample/profiles/Instruments/8.3.3/simple-time-profile.trace.zip')
  })
  test('Instruments 9.3.1', async () => {
    await importFromTrace('./sample/profiles/Instruments/9.3.1/simple-time-profile.trace.zip')
  })
  test('Instruments 10.0', async () => {
    await importFromTrace('./sample/profiles/Instruments/10.0/simple-time-profile.trace.zip')
  })
})
