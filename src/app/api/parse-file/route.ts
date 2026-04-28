import { type NextRequest, NextResponse } from 'next/server'
import { getParser } from '@/lib/file-parsers'
import { createRequestLogger } from '@/lib/api-logger'

export async function POST(request: NextRequest) {
  const logger = createRequestLogger('POST', '/api/parse-file')
  const formData = await request.formData()
  const file = formData.get('file')

  if (!file || typeof file === 'string') {
    logger.error(400, 'No file provided', { file: typeof file })
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  logger.success(200, {
    filename: file.name,
    file_size: file.size,
  })

  const parser = getParser(file.name)
  if (!parser) {
    const ext = file.name.slice(file.name.lastIndexOf('.'))
    logger.error(415, `Unsupported file type: ${ext}`, { filename: file.name }, { error: `Unsupported: ${ext}` })
    return NextResponse.json(
      { error: `Unsupported file type: ${ext}` },
      { status: 415 },
    )
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  try {
    const requirements = await parser(buffer)
    if (requirements.length === 0) {
      logger.error(422, 'No requirements found in file', { filename: file.name }, { error: 'Empty file' })
      return NextResponse.json({ error: 'No requirements found in file' }, { status: 422 })
    }
    logger.success(200, { filename: file.name, file_size: file.size }, { requirements_count: requirements.length, sample: requirements.slice(0, 3) })
    return NextResponse.json({ requirements })
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    logger.error(500, `Parser failed: ${errorMsg}`, { filename: file.name }, { error: errorMsg })
    return NextResponse.json({ error: 'Failed to parse file' }, { status: 500 })
  }
}
