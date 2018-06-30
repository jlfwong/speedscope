import {Profile} from '../profile'
import {FileSystemDirectoryEntry} from './file-system-entry'

import {importFromChromeCPUProfile, importFromChromeTimeline} from './chrome'
import {importFromStackprof} from './stackprof'
import {importFromInstrumentsDeepCopy, importFromInstrumentsTrace} from './instruments'
import {importFromBGFlameGraph} from './bg-flamegraph'
import {importFromFirefox} from './firefox'

export async function importProfile(fileName: string, contents: string): Promise<Profile | null> {
  try {
    // First pass: Check known file format names to infer the file type
    if (fileName.endsWith('.cpuprofile')) {
      console.log('Importing as Chrome CPU Profile')
      return importFromChromeCPUProfile(JSON.parse(contents))
    } else if (fileName.endsWith('.chrome.json') || /Profile-\d{8}T\d{6}/.exec(fileName)) {
      console.log('Importing as Chrome Timeline')
      return importFromChromeTimeline(JSON.parse(contents))
    } else if (fileName.endsWith('.stackprof.json')) {
      console.log('Importing as stackprof profile')
      return importFromStackprof(JSON.parse(contents))
    } else if (fileName.endsWith('.instruments.txt')) {
      console.log('Importing as Instruments.app deep copy')
      return importFromInstrumentsDeepCopy(contents)
    } else if (fileName.endsWith('.collapsedstack.txt')) {
      console.log('Importing as collapsed stack format')
      return importFromBGFlameGraph(contents)
    }

    // Second pass: Try to guess what file format it is based on structure
    try {
      const parsed = JSON.parse(contents)
      if (parsed['systemHost'] && parsed['systemHost']['name'] == 'Firefox') {
        console.log('Importing as Firefox profile')
        return importFromFirefox(parsed)
      } else if (Array.isArray(parsed) && parsed[parsed.length - 1].name === 'CpuProfile') {
        console.log('Importing as Chrome CPU Profile')
        return importFromChromeTimeline(parsed)
      } else if ('nodes' in parsed && 'samples' in parsed && 'timeDeltas' in parsed) {
        console.log('Importing as Chrome Timeline')
        return importFromChromeCPUProfile(parsed)
      } else if ('mode' in parsed && 'frames' in parsed) {
        console.log('Importing as stackprof profile')
        return importFromStackprof(parsed)
      }
    } catch (e) {
      // Format is not JSON

      // If the first line contains "Symbol Name", preceded by a tab, it's probably
      // a deep copy from OS X Instruments.app
      if (/^[\w \t\(\)]*\tSymbol Name/.exec(contents)) {
        console.log('Importing as Instruments.app deep copy')
        return importFromInstrumentsDeepCopy(contents)
      }

      // If every line ends with a space followed by a number, it's probably
      // the collapsed stack format.
      const lineCount = contents.split(/\n/).length
      if (lineCount >= 1 && lineCount === contents.split(/ \d+\n/).length) {
        console.log('Importing as collapsed stack format')
        return importFromBGFlameGraph(contents)
      }
    }

    return null
  } catch (e) {
    console.error(e)
    return null
  }
}

export async function importFromFileSystemDirectoryEntry(entry: FileSystemDirectoryEntry) {
  return importFromInstrumentsTrace(entry)
}
