import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function POST(req: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { conversationId, scenarioData } = await req.json()

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      )
    }

    // Stream response headers for SSE
    const responseHeaders = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    }

    // Create a readable stream
    const encoder = new TextEncoder()
    const customReadable = new ReadableStream({
      async start(controller) {
        try {
          // TODO: Replace with actual Python CARLA backend call
          // This is a placeholder that demonstrates the SSE format
          
          controller.enqueue(
            encoder.encode(
              'event: start\ndata: ' +
                JSON.stringify({
                  status: 'execution_started',
                  conversationId,
                  timestamp: new Date().toISOString(),
                }) +
                '\n\n'
            )
          )

          // Simulate execution events
          const mockEvents = [
            {
              level: 'INFO',
              message: 'Scenario initialization complete',
              timestamp: new Date().toISOString(),
            },
            {
              level: 'INFO',
              message: 'CARLA simulation started',
              timestamp: new Date().toISOString(),
            },
            {
              level: 'OK',
              message: 'Vehicle spawned successfully',
              timestamp: new Date().toISOString(),
            },
            {
              level: 'OK',
              message: 'Test completed with no errors',
              timestamp: new Date().toISOString(),
            },
          ]

          for (const event of mockEvents) {
            await new Promise((resolve) => setTimeout(resolve, 500))
            controller.enqueue(
              encoder.encode(
                'event: log\ndata: ' + JSON.stringify(event) + '\n\n'
              )
            )
          }

          controller.enqueue(
            encoder.encode(
              'event: complete\ndata: ' +
                JSON.stringify({
                  status: 'execution_complete',
                  conversationId,
                  timestamp: new Date().toISOString(),
                }) +
                '\n\n'
            )
          )

          controller.close()
        } catch (error) {
          controller.enqueue(
            encoder.encode(
              'event: error\ndata: ' +
                JSON.stringify({
                  error: 'Execution failed',
                  message: error instanceof Error ? error.message : 'Unknown error',
                }) +
                '\n\n'
            )
          )
          controller.close()
        }
      },
    })

    return new NextResponse(customReadable, { headers: responseHeaders })
  } catch (error) {
    console.error('Error in execution stream:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
