import * as pako from 'pako'

// TODO(jlfwong): Figure out proper type annotations
const {JSON_parse} : {JSON_parse: (array: Uint8Array) => any} = require('uint8array-json-parser')

export interface ProfileDataSource {
  name(): Promise<string>
  readAsArrayBuffer(): Promise<ArrayBuffer>
  readAsText(): Promise<TextFileContent>
}


interface TextFileContent {
  splitLines(): string[]
  asString(): string
  parseAsJSON(): any
}

// V8 has a maximum string size. To support files whose contents exceeds that
// size, we provide an alternate string interface for text backed by a
// Uint8Array instead.
//
// If the buffer is under a certain size, we fall back to using a simple string
// representation.
//
// See: https://github.com/v8/v8/blob/8b663818fc311217c2cdaaab935f020578bfb7a8/src/objects/string.h#L479-L483
export class BufferBackedTextFileContent implements TextFileContent {
  private array: Uint8Array
  private decodedString: string | null = null
  private encoding: string

  constructor(buffer: ArrayBuffer) {
    this.array = new Uint8Array(buffer)

    this.encoding = 'utf-8'
    if (this.array.length > 2) {
      if (this.array[0] === 0xff && this.array[1] === 0xfe) {
        // UTF-16, Little Endian encoding
        this.encoding = 'utf-16le'
      } else if (this.array[0] === 0xfe && this.array[1] === 0xff) {
        // UTF-16, Big Endian encoding
        this.encoding = 'utf-16be'
      }
    }


    if (typeof TextDecoder !== 'undefined') {
      // If TextDecoder is available, we'll try to use it to decode the string.
      const decoder = new TextDecoder(this.encoding)
      this.decodedString = decoder.decode(buffer)
      if (this.array.length > 0 && this.decodedString.length === 0) {
        // If the resulting string would be larger than the max string size,
        // TextDecoder.decode returns an empty string.
        this.decodedString = null
      }
    } else {
      //
      // At time of writing (2021/03/27), the maximum string length in V8 is
      //  32 bit systems: 2^28 - 16 = ~2.68M chars
      //  64 bit systems: 2^29 - 24 = ~5.37M chars
      //
      // https://source.chromium.org/chromium/chromium/src/+/main:v8/include/v8-primitive.h;drc=cb88fe94d9044d860cc75c89e1bc270ab4062702;l=125
      // JavaScript strings are UTF-16 encoded, but we're reading data from disk
      // that we're going to blindly assume it's ASCII encoded. This codepath
      // only exists for older browser support.

      console.warn('This browser does not support TextDecoder. Decoding text as ASCII.')
      // TODO(jlfwong): Warn if size is over limit
      this.decodedString = ''
      for (let i = 0; i < this.array.length; i++) {
        this.decodedString += String.fromCharCode(this.array[i])
      }
    }
  }

  splitLines(): string[] {
    if (this.decodedString) {
      return this.decodedString.split('\n')
    }

    const lines: string[] = []

    return lines
  }

  asString(): string {
    if (this.decodedString) {
      return this.decodedString
    }
    throw new Error(`String exceeds maximum string length. Buffer size is: ${this.array.length} bytes`)
  }

  parseAsJSON(): any {
    /*
    if (this.decodedString) {
      return JSON.parse(this.decodedString)
    }
    */
    return JSON_parse(this.array)
  }
}

class StringBackedTextFileContent implements TextFileContent {
  constructor(private s: string) {}
  splitLines(): string[] {
    return this.s.split('\n')
  }
  asString(): string {
    return this.s
  }
  parseAsJSON(): any {
    return JSON.parse(this.s)
  }
}

export class TextProfileDataSource implements ProfileDataSource {
  constructor(private fileName: string, private contents: string) {}
  async name() {
    return this.fileName
  }
 // TODO(jlfwong): Figure out proper type annotations

  async readAsArrayBuffer() {
    // JavaScript strings are UTF-16 encoded, but if this string is
    // constructed based on

    // TODO(jlfwong): Might want to make this construct an array
    // buffer based on the text
    return new ArrayBuffer(0)
  }
  async readAsText() {
    return new StringBackedTextFileContent(this.contents)
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

  async readAsText(): Promise<TextFileContent> {
    const buffer = await this.readAsArrayBuffer()
    return new BufferBackedTextFileContent(buffer)
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
