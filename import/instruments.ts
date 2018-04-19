import {Profile} from '../profile'

// Import from a .trace file saved from Mac Instruments.app
export function importFromInstrumentsTrace(buffer: ArrayBuffer): Profile {
  const profile = new Profile(0)
  const byteArray = new Uint8Array(buffer)
  const parsedPlist = parseBinaryPlist(byteArray)
  const data = expandKeyedArchive(parsedPlist)
  const version = data['com.apple.xray.owner.template.version']
  console.log(`com.apple.xray.owner.template.version=${version}`)
  console.log(data['com.apple.xray.run.data'])
  return profile
}

////////////////////////////////////////////////////////////////////////////////

export class Dictionary {
  keys: any[] = []
  values: any[] = []

  get(key: any): any {
    for (let i = 0; i < this.keys.length; i++) {
      if (this.keys[i] === key) {
        return this.values[i]
      }
    }
    return null
  }

  set(key: any, value: any): Dictionary {
    this.keys.push(key)
    this.values.push(value)
    return this
  }

  static from(object: Object): Dictionary {
    const dictionary = new Dictionary()
    for (const key in object) {
      dictionary.keys.push(key)
      dictionary.values.push((object as any)[key])
    }
    return dictionary
  }
}

export function decodeUTF8(bytes: Uint8Array): string {
  let text = String.fromCharCode.apply(String, bytes)
  if (text.slice(-1) === '\0') text = text.slice(0, -1) // Remove a single trailing null character if present
  return decodeURIComponent(escape(text))
}

function isArray(value: any): boolean {
  return value instanceof Array
}

function isDictionary(value: any): boolean {
  return value !== null && typeof value === 'object' && Object.getPrototypeOf(value) === null
}

function followUID(objects: any[], value: any): any {
  return value instanceof UID ? objects[value.index] : value
}

function expandKeyedArchive(root: any): any {
  // Sanity checks
  if (
    root.$version !== 100000 ||
    (root.$archiver !== 'MSArchiver' && root.$archiver !== 'NSKeyedArchiver') ||
    !isDictionary(root.$top) ||
    !isArray(root.$objects)
  ) {
    throw new Error('Invalid keyed archive')
  }

  // Substitute NSNull
  if (root.$objects[0] === '$null') {
    root.$objects[0] = null
  }

  // Pattern-match Objective-C constructs
  for (let i = 0; i < root.$objects.length; i++) {
    root.$objects[i] = paternMatchObjectiveC(root.$objects, root.$objects[i])
  }

  // Reconstruct the DAG from the parse tree
  let visit = (object: any) => {
    if (object instanceof UID) {
      return root.$objects[object.index]
    } else if (isArray(object)) {
      for (let i = 0; i < object.length; i++) {
        object[i] = visit(object[i])
      }
    } else if (isDictionary(object)) {
      for (let key in object) {
        object[key] = visit(object[key])
      }
    } else if (object instanceof Dictionary) {
      for (let i = 0; i < object.keys.length; i++) {
        object.keys[i] = visit(object.keys[i])
      }
      for (let i = 0; i < object.values.length; i++) {
        object.values[i] = visit(object.values[i])
      }
    }
    return object
  }
  for (let i = 0; i < root.$objects.length; i++) {
    visit(root.$objects[i])
  }
  return visit(root.$top)
}

function paternMatchObjectiveC(objects: any[], value: any): any {
  if (isDictionary(value) && value.$class) {
    let name = followUID(objects, value.$class).$classname
    switch (name) {
      case 'NSDecimalNumberPlaceholder': {
        let length: number = value['NS.length']
        let exponent: number = value['NS.exponent']
        let byteOrder: number = value['NS.mantissa.bo']
        let negative: boolean = value['NS.negative']
        let mantissa = new Uint16Array(new Uint8Array(value['NS.mantissa']).buffer)
        let decimal = 0

        for (let i = 0; i < length; i++) {
          let digit = mantissa[i]

          if (byteOrder !== 1) {
            // I assume this is how this works but I am unable to test it
            digit = ((digit & 0xff00) >> 8) | ((digit & 0x00ff) << 8)
          }

          decimal += digit * Math.pow(65536, i)
        }

        decimal *= Math.pow(10, exponent)
        return negative ? -decimal : decimal
      }

      // Replace NSData with a Uint8Array
      case 'NSData':
      case 'NSMutableData':
        return value['NS.bytes'] || value['NS.data']

      // Replace NSString with a string
      case 'NSString':
      case 'NSMutableString':
        return decodeUTF8(value['NS.bytes'])

      // Replace NSArray with an Array
      case 'NSArray':
      case 'NSMutableArray':
        if ('NS.objects' in value) {
          return value['NS.objects']
        }
        let array: any[] = []
        while (true) {
          let object = 'NS.object.' + array.length
          if (!(object in value)) {
            break
          }
          array.push(value[object])
        }
        return array

      // Replace NSDictionary with a Dictionary (not an Object because the keys aren't always strings)
      case 'NSDictionary':
      case 'NSMutableDictionary':
        let dictionary = new Dictionary()
        if ('NS.keys' in value && 'NS.objects' in value) {
          dictionary.keys = value['NS.keys']
          dictionary.values = value['NS.objects']
        } else {
          while (true) {
            let key = 'NS.key.' + dictionary.keys.length
            let object = 'NS.object.' + dictionary.values.length
            if (!(key in value) || !(object in value)) {
              break
            }
            dictionary.keys.push(value[key])
            dictionary.values.push(value[object])
          }
        }
        return dictionary

      default:
        console.log('Unknown class', name, value)
    }
  }
  return value
}

////////////////////////////////////////////////////////////////////////////////

export class UID {
  constructor(public index: number) {}
}

function parseBinaryPlist(bytes: Uint8Array): any {
  let text = 'bplist00'
  for (let i = 0; i < 8; i++) {
    if (bytes[i] !== text.charCodeAt(i)) {
      throw new Error('File is not a binary plist')
    }
  }
  return new BinaryPlistParser(
    new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength),
  ).parseRoot()
}

interface LengthAndOffset {
  length: number
  offset: number
}

// See http://opensource.apple.com/source/CF/CF-550/CFBinaryPList.c for details
class BinaryPlistParser {
  referenceSize = 0
  objects: number[] = []
  offsetTable: number[] = []

  constructor(public view: DataView) {}

  parseRoot(): any {
    let trailer = this.view.byteLength - 32
    let offsetSize = this.view.getUint8(trailer + 6)
    this.referenceSize = this.view.getUint8(trailer + 7)

    // Just use the last 32-bits of these 64-bit big-endian values
    let objectCount = this.view.getUint32(trailer + 12, false)
    let rootIndex = this.view.getUint32(trailer + 20, false)
    let tableOffset = this.view.getUint32(trailer + 28, false)

    // Parse all offsets before starting to parse objects
    for (let i = 0; i < objectCount; i++) {
      this.offsetTable.push(this.parseInteger(tableOffset, offsetSize))
      tableOffset += offsetSize
    }

    // Parse the root object assuming the graph is a tree
    return this.parseObject(this.offsetTable[rootIndex])
  }

  parseLengthAndOffset(offset: number, extra: number): LengthAndOffset {
    if (extra !== 0x0f) return {length: extra, offset: 0}
    let marker = this.view.getUint8(offset++)
    if ((marker & 0xf0) !== 0x10)
      throw new Error('Unexpected non-integer length at offset ' + offset)
    let size = 1 << (marker & 0x0f)
    return {length: this.parseInteger(offset, size), offset: size + 1}
  }

  parseSingleton(offset: number, extra: number): any {
    if (extra === 0) return null
    if (extra === 8) return false
    if (extra === 9) return true
    throw new Error('Unexpected extra value ' + extra + ' at offset ' + offset)
  }

  parseInteger(offset: number, size: number): number {
    if (size === 1) return this.view.getUint8(offset)
    if (size === 2) return this.view.getUint16(offset, false)
    if (size === 4) return this.view.getUint32(offset, false)
    if (size === 8) return this.view.getInt32(offset + 4, false) // Ignore the upper 32 bits of this 64-bit signed big-endian value

    // TODO(jlfwong): Not sure if this is right
    if (size === 16) return this.view.getInt32(offset + 12, false) // Ignore the upper 32 bits of this 64-bit signed big-endian value

    throw new Error('Unexpected integer of size ' + size + ' at offset ' + offset)
  }

  parseFloat(offset: number, size: number): number {
    if (size === 4) return this.view.getFloat32(offset, false)
    if (size === 8) return this.view.getFloat64(offset, false)
    throw new Error('Unexpected float of size ' + size + ' at offset ' + offset)
  }

  parseDate(offset: number, size: number): Date {
    if (size !== 8) throw new Error('Unexpected date of size ' + size + ' at offset ' + offset)
    let seconds = this.view.getFloat64(offset, false)
    return new Date(978307200000 + seconds * 1000) // Starts from January 1st, 2001
  }

  parseData(offset: number, extra: number): Uint8Array {
    let both = this.parseLengthAndOffset(offset, extra)
    return new Uint8Array(this.view.buffer, offset + both.offset, both.length)
  }

  parseStringASCII(offset: number, extra: number): string {
    let both = this.parseLengthAndOffset(offset, extra)
    let text = ''
    offset += both.offset
    for (let i = 0; i < both.length; i++) {
      text += String.fromCharCode(this.view.getUint8(offset++))
    }
    return text
  }

  parseStringUTF16(offset: number, extra: number): string {
    let both = this.parseLengthAndOffset(offset, extra)
    let text = ''
    offset += both.offset
    for (let i = 0; i < both.length; i++) {
      text += String.fromCharCode(this.view.getUint16(offset, false))
      offset += 2
    }
    return text
  }

  parseUID(offset: number, size: number): UID {
    return new UID(this.parseInteger(offset, size))
  }

  parseArray(offset: number, extra: number): any[] {
    let both = this.parseLengthAndOffset(offset, extra)
    let array: any[] = []
    let size = this.referenceSize
    offset += both.offset
    for (let i = 0; i < both.length; i++) {
      array.push(this.parseObject(this.offsetTable[this.parseInteger(offset, size)]))
      offset += size
    }
    return array
  }

  parseDictionary(offset: number, extra: number): Object {
    let both = this.parseLengthAndOffset(offset, extra)
    let dictionary = Object.create(null)
    let size = this.referenceSize
    let nextKey = offset + both.offset
    let nextValue = nextKey + both.length * size
    for (let i = 0; i < both.length; i++) {
      let key = this.parseObject(this.offsetTable[this.parseInteger(nextKey, size)])
      let value = this.parseObject(this.offsetTable[this.parseInteger(nextValue, size)])
      if (typeof key !== 'string') throw new Error('Unexpected non-string key at offset ' + nextKey)
      dictionary[key] = value
      nextKey += size
      nextValue += size
    }
    return dictionary
  }

  parseObject(offset: number): any {
    let marker = this.view.getUint8(offset++)
    let extra = marker & 0x0f
    switch (marker >> 4) {
      case 0x0:
        return this.parseSingleton(offset, extra)
      case 0x1:
        return this.parseInteger(offset, 1 << extra)
      case 0x2:
        return this.parseFloat(offset, 1 << extra)
      case 0x3:
        return this.parseDate(offset, 1 << extra)
      case 0x4:
        return this.parseData(offset, extra)
      case 0x5:
        return this.parseStringASCII(offset, extra)
      case 0x6:
        return this.parseStringUTF16(offset, extra)
      case 0x8:
        return this.parseUID(offset, extra + 1)
      case 0xa:
        return this.parseArray(offset, extra)
      case 0xd:
        return this.parseDictionary(offset, extra)
    }
    throw new Error('Unexpected marker ' + marker + ' at offset ' + --offset)
  }
}
