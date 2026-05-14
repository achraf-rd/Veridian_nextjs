import { type NextRequest, NextResponse } from 'next/server'
import { createRequestLogger } from '@/lib/api-logger'

const AGENT2_URL = process.env.AGENT2_URL ?? 'https://agenticve-testing.fly.dev'

export async function POST(request: NextRequest) {
  const logger = createRequestLogger('POST', '/api/generate-scenarios')
  const body = await request.json()

  const reqCount = (body.requirements as unknown[])?.length ?? 0
  logger.success(200, { requirements_count: reqCount }, { backend_url: AGENT2_URL })

  let response: Response
  try {
    response = await fetch(`${AGENT2_URL}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.error(502, `Agent2 connection failed: ${msg}`, { requirements_count: reqCount }, { error: msg })
    return NextResponse.json({ error: msg }, { status: 502 })
  }

  if (!response.ok) {
    logger.error(response.status, 'Agent2 returned error', { requirements_count: reqCount }, { status: response.status })
    return NextResponse.json({ error: `Agent2 error: ${response.status}` }, { status: response.status })
  }

  const data = await response.json()
  return NextResponse.json(data)
}
