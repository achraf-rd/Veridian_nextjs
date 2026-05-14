'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ChevronDown, ChevronUp, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react'
import { useState, useMemo } from 'react'
import { usePipelineStore } from '@/stores/pipelineStore'
import { Badge, Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { CardState, ScenarioResult } from '@/types/pipeline'

interface Props {
  state: CardState
  result: ScenarioResult | null
}

function ComplexityChip({ level, count }: { level: string; count: number }) {
  const cls =
    level === 'LOW'
      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      : level === 'MEDIUM'
      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
  return (
    <span className={cn('inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium', cls)}>
      {level} · {count}
    </span>
  )
}

function PhaseChip({ phase, count }: { phase: string; count: number }) {
  const cls =
    phase === 'SIL'
      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
  return (
    <span className={cn('inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium', cls)}>
      {phase} · {count}
    </span>
  )
}

export default function ScenarioCard({ state, result }: Props) {
  const [expanded, setExpanded] = useState(false)
  const params = useParams() as { projectId?: string; conversationId?: string } | null
  const convId = params?.conversationId ?? ''
  const projectId = params?.projectId ?? ''
  const { approveScenario } = usePipelineStore()

  const isProcessing = state === 'processing'
  const isAwaiting = state === 'awaiting'
  const isApproved = state === 'approved'
  const isIdle = state === 'idle'

  const testCases = result?.testCases ?? []

  const stats = useMemo(() => {
    if (!testCases.length) return null
    const complexity = { LOW: 0, MEDIUM: 0, HIGH: 0 }
    const phase = { SIL: 0, 'SIL+HIL': 0 }
    const tags: Record<string, number> = {}
    const reqSet = new Set<string>()

    for (const tc of testCases) {
      complexity[tc.complexity] = (complexity[tc.complexity] ?? 0) + 1
      phase[tc.test_phase] = (phase[tc.test_phase] ?? 0) + 1
      for (const t of tc.tags) tags[t] = (tags[t] ?? 0) + 1
      for (const r of tc.covers_requirements) reqSet.add(r)
    }
    return { complexity, phase, tags, reqCount: reqSet.size }
  }, [testCases])

  if (isIdle) return null

  return (
    <div
      className={cn(
        'rounded-xl border transition-all duration-300 animate-fade-up',
        isProcessing && 'border-primary/30 bg-vrd-card animate-pulse-ring',
        isAwaiting && 'border-warning/30 bg-vrd-card',
        isApproved && 'border-success/20 bg-vrd-card',
      )}
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <div className="mt-0.5">
          {isProcessing && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
          {isAwaiting && <AlertTriangle className="w-4 h-4 text-warning" />}
          {isApproved && <CheckCircle2 className="w-4 h-4 text-success" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-mono font-medium text-vrd-text-muted uppercase tracking-wider">Scenario Generator</span>
            {isApproved && <Badge variant="success">Approved</Badge>}
            {isAwaiting && <Badge variant="warning">Awaiting approval</Badge>}
          </div>

          {isProcessing && (
            <p className="text-sm text-vrd-text-muted">Generating test plan…</p>
          )}

          {(isAwaiting || isApproved) && result && stats && (
            <div className="space-y-2">
              <p className="text-sm text-vrd-text">
                <span className="font-medium">{testCases.length} scenarios</span> generated across{' '}
                <span className="font-medium">{stats.reqCount} requirements</span>.
              </p>

              {/* Complexity chips */}
              <div className="flex flex-wrap gap-1.5">
                {(['LOW', 'MEDIUM', 'HIGH'] as const).map((lvl) =>
                  stats.complexity[lvl] > 0 ? (
                    <ComplexityChip key={lvl} level={lvl} count={stats.complexity[lvl]} />
                  ) : null,
                )}
                {(['SIL', 'SIL+HIL'] as const).map((ph) =>
                  stats.phase[ph] > 0 ? (
                    <PhaseChip key={ph} phase={ph} count={stats.phase[ph]} />
                  ) : null,
                )}
              </div>

              {/* Tag chips */}
              {Object.keys(stats.tags).length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {Object.entries(stats.tags).map(([tag, count]) => (
                    <span key={tag} className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] bg-vrd-card-hover text-vrd-text-muted">
                      {tag} · {count}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {(isAwaiting || isApproved) && result && !stats && (
            <p className="text-sm text-vrd-text">
              Scenario generation complete — <span className="font-medium">{result.total} scenarios</span> generated
              {result.warnings > 0 && (
                <>, <span className="text-warning font-medium">{result.warnings} ASAM warnings</span></>
              )}.
            </p>
          )}
        </div>

        {(isAwaiting || isApproved) && result && !stats && (
          <button onClick={() => setExpanded((v) => !v)} className="text-vrd-text-muted hover:text-vrd-text transition-colors flex-shrink-0">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Legacy file list (only when no testCases) */}
      {expanded && result && !stats && (
        <div className="border-t border-vrd-border px-4 py-3">
          <div className="max-h-48 overflow-y-auto space-y-1.5">
            {result.scenarios.map((s) => (
              <div
                key={s.id}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-xs',
                  s.warnings.length > 0 ? 'bg-warning/5 border border-warning/20' : 'bg-vrd-card-hover',
                )}
              >
                <span className="font-mono text-vrd-text flex-1">{s.filename}</span>
                <Badge variant={s.type === 'xosc' ? 'info' : 'default'}>{s.type}</Badge>
                {s.warnings.length > 0 && (
                  <Badge variant="warning">
                    <AlertTriangle className="w-2.5 h-2.5" /> {s.warnings.length}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {(isAwaiting || isApproved) && (
        <div className="flex items-center gap-2 px-4 py-3 border-t border-vrd-border">
          <Link
            href={`/project/${projectId}/conversation/${convId}/scenarios`}
            className="text-xs font-medium text-primary-light hover:underline"
          >
            Review scenarios →
          </Link>
          {isAwaiting && (
            <Button size="sm" onClick={() => approveScenario(convId)} className="ml-auto animate-pulse-amber">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Approve &amp; execute
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
