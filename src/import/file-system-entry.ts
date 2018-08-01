// The bits of this API that we care about. This is implemented by WebKitEntry
// https://wicg.github.io/entries-api/#api-entry
export interface FileSystemDirectoryReader {
  readEntries(cb: (entries: FileSystemEntry[]) => void, error: (err: Error) => void): void
}
export interface FileSystemEntry {
  readonly isFile: boolean
  readonly isDirectory: boolean
  readonly name: string
  readonly fullPath: string
}
export interface FileSystemDirectoryEntry extends FileSystemEntry {
  createReader(): FileSystemDirectoryReader
}
export interface FileSystemFileEntry extends FileSystemEntry {
  file(cb: (file: File) => void, errCb: (err: Error) => void): void
}
