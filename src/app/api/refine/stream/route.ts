import { type NextRequest } from 'next/server'
import { createRequestLogger } from '@/lib/api-logger'

export const preferredRegion = ['cdg1']

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://adas-req-refiner.fly.dev'

export async function POST(request: NextRequest) {
  const logger = createRequestLogger('POST', '/api/refine/stream')
  const body = await request.json()

  const reqCount = (body.requirements as unknown[])?.length ?? 0
  logger.success(200, { requirements_count: reqCount }, { backend_url: BACKEND_URL, streaming: true })

  let backendResponse: Response
  try {
    backendResponse = await fetch(`${BACKEND_URL}/refine/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify(body),
    })
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    logger.error(502, `Backend connection failed: ${errorMsg}`, { requirements_count: reqCount }, { error: errorMsg })
    return new Response(JSON.stringify({ error: String(err) }), { status: 502 })
  }

  if (!backendResponse.ok) {
    logger.error(
      backendResponse.status,
      `Backend returned error`,
      { requirements_count: reqCount },
      { status: backendResponse.status, statusText: backendResponse.statusText },
    )
    return new Response(`Backend error: ${backendResponse.status}`, { status: backendResponse.status })
  }

  const reader = backendResponse.body!.getReader()

  const stream = new ReadableStream({
    async pull(controller) {
      const { done, value } = await reader.read()
      if (done) {
        controller.close()
        return
      }
      controller.enqueue(value)
    },
    cancel() {
      reader.cancel()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
