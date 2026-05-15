'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ChevronDown, ChevronUp, Download, ExternalLink, TrendingUp, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui'
import { cn } from '@/lib/utils'
import { usePipelineStore } from '@/stores/pipelineStore'
import type { CardState, ReportResult } from '@/types/pipeline'

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

interface Props {
  state: CardState
  result: ReportResult | null
}

export default function ReportCard({ state, result }: Props) {
  const [expanded, setExpanded] = useState(false)
  const params = useParams() as { projectId?: string; conversationId?: string } | null
  const convId = params?.conversationId ?? ''
  const projectId = params?.projectId ?? ''
  const reportStartedAt = usePipelineStore(s => s.pipelines[convId]?.reportStartedAt)
  const reportFinishedAt = usePipelineStore(s => s.pipelines[convId]?.reportFinishedAt)

  if (state === 'idle') return null

  const isPassing = result?.verdict === 'pass'

  return (
    <div className={cn(
      'rounded-xl border transition-all duration-300 animate-fade-up',
      isPassing ? 'border-success/20 bg-vrd-card' : 'border-danger/20 bg-vrd-card',
    )}>
      <div className="flex items-start gap-3 px-4 py-3">
        <TrendingUp className={cn('w-4 h-4 mt-0.5', isPassing ? 'text-success' : 'text-danger')} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-mono font-medium text-vrd-text-muted uppercase tracking-wider">Report Generator</span>
            {result && (
              <Badge variant={isPassing ? 'success' : 'danger'}>
                {isPassing ? 'Pass' : 'Fail'} — {result.score}%
              </Badge>
            )}
          </div>
          <p className="text-sm text-vrd-text">
            {result
              ? <div className="space-y-1">
                  <div>Report ready — Overall verdict: <span className={cn('font-semibold', isPassing ? 'text-success' : 'text-danger')}>{isPassing ? 'Pass' : 'Fail'}</span> ({result.score}%). PDF generated.</div>
                  {reportFinishedAt && reportStartedAt && (
                    <div className="text-[11px] text-vrd-text-muted font-mono">
                      ⏱ Took {formatDuration(reportStartedAt, reportFinishedAt)}
                    </div>
                  )}
                </div>
              : 'Generating report…'}
          </p>
        </div>
        {result && (
          <button onClick={() => setExpanded((v) => !v)} className="text-vrd-text-muted hover:text-vrd-text transition-colors flex-shrink-0">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      {expanded && result && (
        <div className="border-t border-vrd-border px-4 py-3">
          <p className="text-xs text-vrd-text-muted mb-2">KPI Summary</p>
          <div className="space-y-1.5">
            {result.kpis.map((kpi) => (
              <div key={kpi.name} className="flex items-center justify-between px-3 py-2 rounded-lg bg-vrd-card-hover text-xs">
                <span className="text-vrd-text-muted">{kpi.name}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium text-vrd-text">{kpi.value} {kpi.unit}</span>
                  {kpi.status === 'pass' && <CheckCircle2 className="w-3.5 h-3.5 text-success" />}
                  {kpi.status === 'warn' && <AlertTriangle className="w-3.5 h-3.5 text-warning" />}
                  {kpi.status === 'fail' && <XCircle className="w-3.5 h-3.5 text-danger" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 px-4 py-3 border-t border-vrd-border">
        <Link href={`/project/${projectId}/conversation/${convId}/report`} className="flex items-center gap-1 text-xs text-primary-light hover:underline">
          <ExternalLink className="w-3 h-3" />
          View report
        </Link>
        <button className="flex items-center gap-1 text-xs text-vrd-text-muted hover:text-vrd-text transition-colors">
          <Download className="w-3 h-3" />
          Download PDF
        </button>
      </div>
    </div>
  )
}
