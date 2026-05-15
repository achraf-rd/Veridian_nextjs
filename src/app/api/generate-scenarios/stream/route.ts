import { type NextRequest } from 'next/server'
import { createRequestLogger } from '@/lib/api-logger'

// Co-locate with the Fly.io backend (deployed in cdg1 / Paris)
export const preferredRegion = ['cdg1']

const AGENT2_URL = process.env.AGENT2_URL ?? 'https://agenticve-testing.fly.dev'

export async function POST(request: NextRequest) {
  const logger = createRequestLogger('POST', '/api/generate-scenarios/stream')
  const body = await request.json()
  const reqCount = (body.requirements as unknown[])?.length ?? 0
  logger.success(200, { requirements_count: reqCount }, { backend_url: AGENT2_URL, streaming: true })

  let backendResponse: Response
  try {
    backendResponse = await fetch(`${AGENT2_URL}/generate/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify(body),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.error(502, `Agent2 stream connection failed: ${msg}`, { requirements_count: reqCount }, { error: msg })
    return new Response(JSON.stringify({ error: msg }), { status: 502 })
  }

  if (!backendResponse.ok) {
    logger.error(backendResponse.status, 'Agent2 stream returned error', { requirements_count: reqCount }, { status: backendResponse.status })
    return new Response(`Agent2 stream error: ${backendResponse.status}`, { status: backendResponse.status })
  }

  const reader = backendResponse.body!.getReader()
  const stream = new ReadableStream({
    async pull(controller) {
      const { done, value } = await reader.read()
      if (done) { controller.close(); return }
      controller.enqueue(value)
    },
    cancel() { reader.cancel() },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
