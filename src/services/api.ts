import type { RefinementEvent, ScenarioEvent } from '@/types/pipeline'
import type { GenerateRequest, GenerateResponse } from '@/types/agent2'

export async function* streamRefineRequirements(
  requirements: string[],
): AsyncGenerator<RefinementEvent> {
  const response = await fetch('/api/refine/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify({ requirements }),
  })

  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  console.log('response', response)
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

export async function generateScenarios(payload: GenerateRequest): Promise<GenerateResponse> {
  const response = await fetch('/api/generate-scenarios', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json() as Promise<GenerateResponse>
}

export async function* streamGenerateScenarios(
  payload: GenerateRequest,
): AsyncGenerator<ScenarioEvent> {
  const response = await fetch('/api/generate-scenarios/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify(payload),
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
          const event = JSON.parse(line.slice(6)) as ScenarioEvent
          yield event
        } catch {
          // skip malformed lines
        }
      }
    }
  }
}

export async function* streamExecution(
  conversationId: string,
  scenarioData?: Record<string, any>,
): AsyncGenerator<{ type: string; [key: string]: any }> {
  const response = await fetch('/api/execution/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify({ conversationId, scenarioData }),
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
          const event = JSON.parse(line.slice(6))
          yield event
        } catch {
          // skip malformed lines
        }
      }
    }
  }
}
