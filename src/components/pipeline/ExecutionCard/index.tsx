'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { CheckCircle2, Loader2, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui'
import { cn } from '@/lib/utils'
import { usePipelineStore } from '@/stores/pipelineStore'
import type { CardState, ExecutionResult, LogLine } from '@/types/pipeline'

// ─── Utilities ────────────────────────────────────────────────────────────────

function formatDuration(startISO: string | undefined, endISO: string | undefined): string {
  if (!startISO || !endISO) return ''
  const start = new Date(startISO)
  const end = new Date(endISO)
  const ms = end.getTime() - start.getTime()
  if (ms < 1000) return `${ms}ms`
  const sec = (ms / 1000).toFixed(1)
  return `${sec}s`
}

const LIVE_LOGS: LogLine[] = [
  { id: 'l1', type: 'info', text: 'Spawning CARLA worker pool (3 workers)…',                        timestamp: '09:14:00' },
  { id: 'l2', type: 'ok',   text: 'RUN-0001 — AEB_ped_15m_50kph · passed · TTC min: 1.82 s',       timestamp: '09:14:01' },
  { id: 'l3', type: 'ok',   text: 'RUN-0002 — AEB_ped_15m_30kph · passed · TTC min: 2.11 s',       timestamp: '09:14:08' },
  { id: 'l4', type: 'err',  text: 'RUN-0003 — AEB_ped_25m_city · CARLA crash, auto-requeue',       timestamp: '09:14:15' },
  { id: 'l5', type: 'info', text: 'Worker pool: 3 active · queue: 44 remaining',                    timestamp: '09:14:15' },
  { id: 'l6', type: 'ok',   text: 'RUN-0004 — LKA_highway_70kph · passed · deviation: 0.07 m',     timestamp: '09:14:23' },
  { id: 'l7', type: 'ok',   text: 'RUN-0005 — LKA_highway_100kph · passed · deviation: 0.09 m',    timestamp: '09:14:31' },
  { id: 'l8', type: 'err',  text: 'RUN-0007 — AEB_bicycle · latency 287 ms > 250 ms threshold',    timestamp: '09:15:02' },
]

interface Props {
  state: CardState
  result: ExecutionResult | null
}

export default function ExecutionCard({ state, result }: Props) {
  const params = useParams() as { projectId?: string; conversationId?: string } | null
  const convId = params?.conversationId ?? ''
  const projectId = params?.projectId ?? ''
  const executionStartedAt = usePipelineStore(s => s.pipelines[convId]?.executionStartedAt)
  const executionFinishedAt = usePipelineStore(s => s.pipelines[convId]?.executionFinishedAt)

  const [visibleLogs, setVisibleLogs] = useState<LogLine[]>([])
  const [liveCount, setLiveCount] = useState(0)
  const logRef = useRef<HTMLDivElement>(null)
  const indexRef = useRef(0)

  const isProcessing = state === 'processing'
  const isApproved = state === 'approved'

  useEffect(() => {
    if (!isProcessing) {
      indexRef.current = 0
      setVisibleLogs([])
      setLiveCount(0)
      return
    }
    indexRef.current = 0
    setVisibleLogs([])
    setLiveCount(0)

    const interval = setInterval(() => {
      const i = indexRef.current
      if (i < LIVE_LOGS.length) {
        const entry = LIVE_LOGS[i]
        if (entry) {
          setVisibleLogs((prev) => [...prev, entry])
          setLiveCount((c) => c + 1)
        }
        indexRef.current = i + 1
      } else {
        clearInterval(interval)
      }
    }, 700)

    return () => {
      clearInterval(interval)
    }
  }, [isProcessing])

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [visibleLogs])

  if (state === 'idle') return null

  const rawLogs = isApproved && result ? result.logs : visibleLogs
  const displayLogs = rawLogs.filter((l): l is LogLine => l != null)
  const progress = isProcessing ? Math.round((liveCount / LIVE_LOGS.length) * 47) : result?.passed ?? 0

  return (
    <div className={cn(
      'rounded-xl border transition-all duration-300 animate-fade-up',
      isProcessing && 'border-primary/30 bg-vrd-card',
      isApproved && 'border-success/20 bg-vrd-card',
    )}>
      <div className="flex items-start gap-3 px-4 py-3">
        <div className="mt-0.5">
          {isProcessing && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
          {isApproved && <CheckCircle2 className="w-4 h-4 text-success" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-mono font-medium text-vrd-text-muted uppercase tracking-wider">Execution</span>
            {isApproved && <Badge variant="success">Complete</Badge>}
            {isProcessing && <Badge variant="info">Running in CARLA</Badge>}
          </div>
          <p className="text-sm text-vrd-text">
            {isProcessing && (
              <>Executing in CARLA — <span className="font-medium">{progress} / 47</span> scenarios complete</>
            )}
            {isApproved && result && (
              <div className="space-y-1">
                <div>
                  Execution complete —{' '}
                  <span className="text-success font-medium">{result.passed} passed</span>,{' '}
                  <span className="text-danger font-medium">{result.failed} failed</span>,{' '}
                  {result.requeued} requeued.
                </div>
                {executionFinishedAt && executionStartedAt && (
                  <div className="text-[11px] text-vrd-text-muted font-mono">
                    ⏱ Took {formatDuration(executionStartedAt, executionFinishedAt)}
                  </div>
                )}
              </div>
            )}
          </p>
        </div>
      </div>

      {isProcessing && (
        <div className="px-4 pb-2">
          <div className="h-1 bg-vrd-border rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-700 rounded-full"
              style={{ width: `${(liveCount / LIVE_LOGS.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="border-t border-vrd-border px-4 py-2">
        <div
          ref={logRef}
          className="max-h-36 overflow-y-auto space-y-0.5 font-mono text-[11px] leading-relaxed"
        >
          {displayLogs.map((line, idx) => (
            <div key={`${line.id}-${idx}`} className="flex items-start gap-2">
              <span className="text-vrd-text-dim flex-shrink-0">{line.timestamp}</span>
              <span className={cn(
                'font-medium flex-shrink-0',
                line.type === 'ok'   && 'text-success',
                line.type === 'err'  && 'text-danger',
                line.type === 'info' && 'text-primary-light',
              )}>
                [{line.type.toUpperCase()}]
              </span>
              <span className="text-vrd-text-muted">{line.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-3 border-t border-vrd-border">
        <Link
          href={`/project/${projectId}/conversation/${convId}/simulation`}
          className="flex items-center gap-1 text-xs text-primary-light hover:underline"
        >
          <ExternalLink className="w-3 h-3" />
          {isProcessing ? 'Watch simulation' : 'View execution log'}
        </Link>
      </div>
    </div>
  )
}
