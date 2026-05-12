'use client'

import { useEffect } from 'react'

export default function DevFetchLogger() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return
    if ((window as any).__fetchPatched) return
    ;(window as any).__fetchPatched = true

    const original = window.fetch

    window.fetch = async function (input, init) {
      const method = (init?.method ?? 'GET').toUpperCase()
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url

      // Log request
      const reqGroup = `%c⬆ ${method} ${url}`
      const reqStyle = 'color:#60a5fa;font-weight:bold'
      let body: unknown = undefined
      if (init?.body) {
        try { body = JSON.parse(init.body as string) } catch { body = init.body }
      }
      console.groupCollapsed(reqGroup, reqStyle)
      if (body !== undefined) console.log('%cBody', 'color:#94a3b8', body)
      console.groupEnd()

      const start = performance.now()
      let response: Response

      try {
        response = await original.call(this, input, init)
      } catch (err) {
        const ms = Math.round(performance.now() - start)
        console.groupCollapsed(`%c✖ ${method} ${url} (${ms}ms — network error)`, 'color:#f87171;font-weight:bold')
        console.error(err)
        console.groupEnd()
        throw err
      }

      const ms = Math.round(performance.now() - start)
      const ok = response.ok
      const statusColor = ok ? '#34d399' : '#f87171'
      const arrow = ok ? '⬇' : '✖'

      // Clone so we can read body without consuming the original
      const clone = response.clone()
      let resBody: unknown = undefined
      const ct = response.headers.get('content-type') ?? ''
      if (ct.includes('application/json')) {
        try { resBody = await clone.json() } catch { resBody = '(unreadable)' }
      } else if (ct.includes('text/')) {
        try { resBody = await clone.text() } catch { resBody = '(unreadable)' }
      }

      console.groupCollapsed(
        `%c${arrow} ${method} ${url} — ${response.status} (${ms}ms)`,
        `color:${statusColor};font-weight:bold`,
      )
      if (resBody !== undefined) console.log('%cResponse', 'color:#94a3b8', resBody)
      console.groupEnd()

      return response
    }
  }, [])

  return null
}
