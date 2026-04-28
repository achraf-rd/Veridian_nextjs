import * as XLSX from 'xlsx'

const PRIMARY_KEYWORDS = ['natural language requirement', 'description', 'statement', 'requirement text']
const SECONDARY_KEYWORDS = ['requirement']
const EXCLUDE_KEYWORDS = ['id', 'ref', 'reference', 'status', 'priority']

export async function parseExcel(buffer: Buffer): Promise<string[]> {
  const wb = XLSX.read(buffer, { type: 'buffer' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: '' })

  if (rows.length === 0) return []

  // Find the header row and requirement column with priority matching
  let headerRowIndex = -1
  let requirementColIndex = -1

  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    const row = rows[i]

    // First pass: try to find primary keywords
    for (let j = 0; j < row.length; j++) {
      const cell = String(row[j]).toLowerCase().trim()
      if (!cell) continue

      const matchesPrimary = PRIMARY_KEYWORDS.some((kw) => cell.includes(kw))
      const matchesExclude = EXCLUDE_KEYWORDS.some((kw) => cell.includes(kw))

      if (matchesPrimary && !matchesExclude) {
        headerRowIndex = i
        requirementColIndex = j
        break
      }
    }

    // Second pass: if no primary match, try secondary keywords while excluding ID columns
    if (headerRowIndex === -1) {
      for (let j = 0; j < row.length; j++) {
        const cell = String(row[j]).toLowerCase().trim()
        if (!cell) continue

        const matchesSecondary = SECONDARY_KEYWORDS.some((kw) => cell.includes(kw))
        const matchesExclude = EXCLUDE_KEYWORDS.some((kw) => cell.includes(kw))

        if (matchesSecondary && !matchesExclude) {
          headerRowIndex = i
          requirementColIndex = j
          break
        }
      }
    }

    if (headerRowIndex !== -1) break
  }

  // Fallback: use the column with the longest average content
  if (headerRowIndex === -1 || requirementColIndex === -1) {
    const colLengths: number[] = []
    for (const row of rows) {
      row.forEach((cell, j) => {
        colLengths[j] = (colLengths[j] ?? 0) + String(cell).length
      })
    }
    requirementColIndex = colLengths.indexOf(Math.max(...colLengths))
    headerRowIndex = 0
  }

  // Extract requirement texts, skip header row and empty cells
  return rows
    .slice(headerRowIndex + 1)
    .map((row) => String(row[requirementColIndex] ?? '').trim())
    .filter((text) => text.length > 0)
}
