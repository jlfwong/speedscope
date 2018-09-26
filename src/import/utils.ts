import * as pako from 'pako'
import {decodeBase64} from '../lib/utils'

export interface ProfileDataSource {
  name(): Promise<string>
  readAsArrayBuffer(): Promise<ArrayBuffer>
  readAsText(): Promise<string>
}

export class Base64ProfileDataSource implements ProfileDataSource {
  private bytes: Uint8Array

  constructor(private fileName: string, b64contents: string) {
    this.bytes = decodeBase64(b64contents)
  }
  async name() {
    return this.fileName
  }
  async readAsArrayBuffer() {
    return this.bytes.buffer
  }
  async readAsText() {
    // JavaScript strings are UTF-16 encoded, but we're reading data
    // from disk that we're going to asusme is UTF-8 encoded.
    let ret: string = ''
    for (let i = 0; i < this.bytes.length; i++) {
      ret += String.fromCharCode(this.bytes[i])
    }
    return ret
  }
}

export class TextProfileDataSource implements ProfileDataSource {
  constructor(private fileName: string, private contents: string) {}
  async name() {
    return this.fileName
  }
  async readAsArrayBuffer() {
    // JavaScript strings are UTF-16 encoded, but if this string is
    // constructed based on

    // TODO(jlfwong): Might want to make this construct an array
    // buffer based on the text
    return new ArrayBuffer(0)
  }
  async readAsText() {
    return this.contents
  }
}

export class MaybeCompressedDataReader implements ProfileDataSource {
  private uncompressedData: Promise<ArrayBuffer>

  constructor(
    private namePromise: Promise<string>,
    maybeCompressedDataPromise: Promise<ArrayBuffer>,
  ) {
    this.uncompressedData = maybeCompressedDataPromise.then(async (fileData: ArrayBuffer) => {
      try {
        const result = pako.inflate(new Uint8Array(fileData)).buffer
        return result
      } catch (e) {
        return fileData
      }
    })
  }

  async name(): Promise<string> {
    return await this.namePromise
  }

  async readAsArrayBuffer(): Promise<ArrayBuffer> {
    return await this.uncompressedData
  }

  async readAsText(): Promise<string> {
    const buffer = await this.readAsArrayBuffer()
    let ret: string = ''

    // JavaScript strings are UTF-16 encoded, but we're reading data
    // from disk that we're going to asusme is UTF-8 encoded.
    const array = new Uint8Array(buffer)
    for (let i = 0; i < array.length; i++) {
      ret += String.fromCharCode(array[i])
    }
    return ret
  }

  static fromFile(file: File): MaybeCompressedDataReader {
    const maybeCompressedDataPromise: Promise<ArrayBuffer> = new Promise(resolve => {
      const reader = new FileReader()
      reader.addEventListener('loadend', () => {
        if (!(reader.result instanceof ArrayBuffer)) {
          throw new Error('Expected reader.result to be an instance of ArrayBuffer')
        }
        resolve(reader.result)
      })
      reader.readAsArrayBuffer(file)
    })

    return new MaybeCompressedDataReader(Promise.resolve(file.name), maybeCompressedDataPromise)
  }

  static fromArrayBuffer(name: string, buffer: ArrayBuffer): MaybeCompressedDataReader {
    return new MaybeCompressedDataReader(Promise.resolve(name), Promise.resolve(buffer))
  }
}
