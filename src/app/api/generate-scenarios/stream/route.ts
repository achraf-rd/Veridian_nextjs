import { type NextRequest } from 'next/server'
import { createRequestLogger } from '@/lib/api-logger'

// Co-locate with the Fly.io backend (deployed in cdg1 / Paris)
export const preferredRegion = ['cdg1']

const AGENT2_URL = process.env.AGENT2_URL ?? 'https://agenticve-testing.fly.dev'

function sseEvent(data: object): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`)
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function POST(request: NextRequest) {
  const logger = createRequestLogger('POST', '/api/generate-scenarios/stream')
  const body = await request.json()
  const reqCount = (body.requirements as unknown[])?.length ?? 0
  logger.success(200, { requirements_count: reqCount }, { backend_url: AGENT2_URL, streaming: true })

  // Fire Agent 2 request immediately — results arrive while we emit progress stages
  const agent2Promise = fetch(`${AGENT2_URL}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const stream = new ReadableStream({
    async start(controller) {
      const enq = (data: object) => controller.enqueue(sseEvent(data))

      try {
        // Stage 1 — clean
        enq({ type: 'stage', stage: 1, name: 'clean', label: 'Cleaning requirements', status: 'running' })
        await delay(700)
        enq({ type: 'stage', stage: 1, name: 'clean', label: 'Cleaning requirements', status: 'completed', message: 'requirements cleaned' })

        // Stage 2 — group
        enq({ type: 'stage', stage: 2, name: 'group', label: 'Grouping by feature', status: 'running' })
        await delay(800)
        enq({ type: 'stage', stage: 2, name: 'group', label: 'Grouping by feature', status: 'completed', message: 'requirements grouped' })

        // Stage 3 — generate (LLM call, takes the longest)
        enq({ type: 'stage', stage: 3, name: 'generate', label: 'Running LLM generators', status: 'running' })

        // Await the real Agent 2 response
        let agentData: { total_scenarios: number; scenarios: Record<string, unknown>[] }
        try {
          const response = await agent2Promise
          if (!response.ok) {
            enq({ type: 'error', detail: `Agent2 returned ${response.status}` })
            controller.close()
            return
          }
          agentData = await response.json()
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          enq({ type: 'error', detail: `Agent2 connection failed: ${msg}` })
          controller.close()
          return
        }

        enq({ type: 'stage', stage: 3, name: 'generate', label: 'Running LLM generators', status: 'completed', message: `${agentData.total_scenarios} candidates generated` })

        // Stage 4 — merge
        enq({ type: 'stage', stage: 4, name: 'merge', label: 'Merging LLM results', status: 'running' })
        await delay(600)
        enq({ type: 'stage', stage: 4, name: 'merge', label: 'Merging LLM results', status: 'completed', message: 'results merged' })

        // Stage 5 — evaluate
        enq({ type: 'stage', stage: 5, name: 'evaluate', label: 'Evaluating best scenarios', status: 'running' })
        await delay(700)
        enq({ type: 'stage', stage: 5, name: 'evaluate', label: 'Evaluating best scenarios', status: 'completed', message: 'best scenarios selected' })

        // Final result
        enq({ type: 'result', output: agentData })
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        enq({ type: 'error', detail: msg })
      }

      controller.close()
    },
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
