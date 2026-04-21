'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { usePipelineStore } from '@/stores/pipelineStore'
import { cn } from '@/lib/utils'
import type { LogLine } from '@/types/pipeline'

const LIVE_STREAM: LogLine[] = [
  { id: 'l1',  type: 'info', text: 'Spawning CARLA worker pool (3 workers)…',                        timestamp: '09:14:00' },
  { id: 'l2',  type: 'ok',   text: 'RUN-0001 — AEB_ped_15m_50kph · passed · TTC min: 1.82 s',       timestamp: '09:14:01' },
  { id: 'l3',  type: 'ok',   text: 'RUN-0002 — AEB_ped_15m_30kph · passed · TTC min: 2.11 s',       timestamp: '09:14:08' },
  { id: 'l4',  type: 'err',  text: 'RUN-0003 — AEB_ped_25m_city · CARLA crash, auto-requeue',       timestamp: '09:14:15' },
  { id: 'l5',  type: 'info', text: 'Worker pool: 3 active · queue: 44 remaining',                    timestamp: '09:14:15' },
  { id: 'l6',  type: 'ok',   text: 'RUN-0004 — LKA_highway_70kph · passed · deviation: 0.07 m',     timestamp: '09:14:23' },
  { id: 'l7',  type: 'ok',   text: 'RUN-0005 — LKA_highway_100kph · passed · deviation: 0.09 m',    timestamp: '09:14:31' },
  { id: 'l8',  type: 'err',  text: 'RUN-0007 — AEB_bicycle_intersection · latency 287 ms > 250 ms', timestamp: '09:15:02' },
  { id: 'l9',  type: 'ok',   text: 'RUN-0008 — AEB_city_ttc2s · passed',                            timestamp: '09:15:10' },
  { id: 'l10', type: 'info', text: 'RUN-0003 requeued → executing',                                 timestamp: '09:15:10' },
  { id: 'l11', type: 'ok',   text: 'RUN-0003 — AEB_ped_25m_city · passed · TTC min: 1.44 s',        timestamp: '09:15:22' },
  { id: 'l12', type: 'info', text: 'All scenarios complete. Generating report…',                     timestamp: '09:15:30' },
]

export default function SimulationPage() {
  const params = useParams() as { projectId?: string; conversationId?: string } | null
  const router = useRouter()
  const convId = params?.conversationId ?? ''
  const projectId = params?.projectId ?? ''
  const { getPipeline } = usePipelineStore()
  const pipeline = getPipeline(convId)

  const isLive = pipeline.execution === 'processing'
  const isDone = pipeline.execution === 'approved'

  const [lines, setLines] = useState<LogLine[]>(isDone ? (pipeline.executionResult?.logs ?? LIVE_STREAM) : [])
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isLive) return
    let i = 0
    const interval = setInterval(() => {
      if (i < LIVE_STREAM.length) { setLines((p) => [...p, LIVE_STREAM[i]]); i++ }
      else clearInterval(interval)
    }, 600)
    return () => clearInterval(interval)
  }, [isLive])

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [lines])

  return (
    <div className="h-full overflow-y-auto px-6 py-6">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-vrd-text-muted hover:text-vrd-text transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to thread
        </button>

        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold text-vrd-text">
            {isLive ? 'Live Simulation' : 'Execution Log'}
          </h1>
          {isLive && (
            <span className="flex items-center gap-1.5 text-xs text-primary-light">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              CARLA running
            </span>
          )}
          {isDone && (
            <button
              onClick={() => router.push(`/project/${projectId}/conversation/${convId}`)}
              className="flex items-center gap-1 text-xs text-primary-light hover:underline"
            >
              Return to thread <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        <div ref={logRef} className="rounded-xl border border-vrd-border bg-vrd-card p-4 h-96 overflow-y-auto font-mono text-xs space-y-1 leading-relaxed">
          {lines.map((line) => (
            <div key={line.id} className="flex items-start gap-3">
              <span className="text-vrd-text-dim flex-shrink-0">{line.timestamp}</span>
              <span className={cn(
                'font-semibold flex-shrink-0',
                line.type === 'ok' && 'text-success',
                line.type === 'err' && 'text-danger',
                line.type === 'info' && 'text-primary-light',
              )}>
                [{line.type.toUpperCase().padEnd(4)}]
              </span>
              <span className="text-vrd-text-muted">{line.text}</span>
            </div>
          ))}
          {isLive && <div className="text-vrd-text-dim animate-pulse">▌</div>}
        </div>
      </div>
    </div>
  )
}
