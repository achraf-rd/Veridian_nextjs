import type { RefinementEvent } from '@/types/pipeline'

export async function* streamRefineRequirements(
  requirements: string[],
): AsyncGenerator<RefinementEvent> {
  const response = await fetch('/api/refine/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify({ requirements }),
  })

  if (!response.ok) throw new Error(`HTTP ${response.status}`)

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop()!

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const event = JSON.parse(line.slice(6)) as RefinementEvent
          yield event
        } catch {
          // skip malformed lines
        }
      }
    }
  }
}
