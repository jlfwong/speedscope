import * as pako from 'pako'

export interface ProfileDataSource {
  name(): Promise<string>
  readAsArrayBuffer(): Promise<ArrayBuffer>
  readAsText(): Promise<string>
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

    // By default, we assume the file is utf-8 encoded.
    let encoding = 'utf-8'

    const array = new Uint8Array(buffer)
    if (array.length > 2) {
      if (array[0] === 0xff && array[1] === 0xfe) {
        // UTF-16, Little Endian encoding
        encoding = 'utf-16le'
      } else if (array[0] === 0xfe && array[1] === 0xff) {
        // UTF-16, Big Endian encoding
        encoding = 'utf-16be'
      }
    }

    if (typeof TextDecoder !== 'undefined') {
      const decoder = new TextDecoder(encoding)
      return decoder.decode(buffer)
    } else {
      // JavaScript strings are UTF-16 encoded, but we're reading data from disk
      // that we're going to blindly assume it's ASCII encoded. This codepath
      // only exists for older browser support.
      console.warn('This browser does not support TextDecoder. Decoding text as ASCII.')
      let ret: string = ''
      for (let i = 0; i < array.length; i++) {
        ret += String.fromCharCode(array[i])
      }
      return ret
    }
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
