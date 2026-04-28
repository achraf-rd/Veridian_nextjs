import { type NextRequest } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://adas-req-refiner.fly.dev'

export async function POST(request: NextRequest) {
  const body = await request.json()

  let backendResponse: Response
  try {
    backendResponse = await fetch(`${BACKEND_URL}/refine/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify(body),
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 502 })
  }

  if (!backendResponse.ok) {
    return new Response(`Backend error: ${backendResponse.status}`, { status: backendResponse.status })
  }

  return new Response(backendResponse.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  })
}
