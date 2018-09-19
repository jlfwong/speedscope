import * as pako from 'pako'

export interface ProfileDataSource {
  readAsArrayBuffer(): Promise<ArrayBuffer>
  readAsText(): Promise<string>
}

export class MaybeCompressedDataReader implements ProfileDataSource {
  private uncompressedData: Promise<ArrayBuffer>

  constructor(maybeCompressedDataPromise: Promise<ArrayBuffer>) {
    this.uncompressedData = maybeCompressedDataPromise.then(async (fileData: ArrayBuffer) => {
      try {
        const result = pako.inflate(new Uint8Array(fileData)).buffer
        return result
      } catch (e) {
        return fileData
      }
    })
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
}

export class MaybeCompressedFileReader implements ProfileDataSource {
  private reader: MaybeCompressedDataReader

  constructor(file: File) {
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

    this.reader = new MaybeCompressedDataReader(maybeCompressedDataPromise)
  }

  readAsArrayBuffer(): Promise<ArrayBuffer> {
    return this.reader.readAsArrayBuffer()
  }

  readAsText(): Promise<string> {
    return this.reader.readAsText()
  }
}
