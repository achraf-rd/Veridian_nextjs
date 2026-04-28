import { parseExcel } from './excel'
import { parseMarkdown } from './markdown'

export type FileParser = (buffer: Buffer) => Promise<string[]>

export const FILE_PARSERS: Record<string, FileParser> = {
  '.xlsx': parseExcel,
  '.xls':  parseExcel,
  '.md':   parseMarkdown,
  '.txt':  parseMarkdown, // plain text: one requirement per line
}

export const ACCEPTED_EXTENSIONS = Object.keys(FILE_PARSERS)

export function getParser(filename: string): FileParser | null {
  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase()
  return FILE_PARSERS[ext] ?? null
}
