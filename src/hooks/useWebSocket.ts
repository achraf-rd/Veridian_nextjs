import { useEffect, useState } from 'react'

export function useWebSocket(url: string, active: boolean) {
  const [messages, setMessages] = useState<string[]>([])
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!active || !url) return
    let ws: WebSocket
    try {
      ws = new WebSocket(url)
      ws.onopen = () => setConnected(true)
      ws.onmessage = (e) => setMessages((prev) => [...prev, e.data as string])
      ws.onclose = () => setConnected(false)
    } catch {
      // WebSocket not available in this environment
    }
    return () => ws?.close()
  }, [url, active])

  return { messages, connected }
}
