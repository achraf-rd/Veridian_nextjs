'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Circle,
  Loader2,
} from 'lucide-react'
import { usePipelineStore } from '@/stores/pipelineStore'
import { Badge, Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { CardState, NLPTaskProgress } from '@/types/pipeline'
import type { RefinementResult } from '@/types/requirements'

// ─── Task definitions (mirrors SSE task_name values) ─────────────────────────

const TASKS = [
  { num: 1, name: 'clean',            fn: 'clean()',            done: 'requirements cleaned' },
  { num: 2, name: 'deduplicate',      fn: 'deduplicate()',      done: 'duplicates identified' },
  { num: 3, name: 'detect_overlaps',  fn: 'detect_overlaps()',  done: 'overlap analysis done' },
  { num: 4, name: 'detect_conflicts', fn: 'detect_conflicts()', done: 'conflict analysis done' },
  { num: 5, name: 'classify',         fn: 'classify()',         done: 'complexity classified' },
] as const

type TaskStatus = 'idle' | 'running' | 'done'

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  state: CardState
  result: RefinementResult | null
}

export default function NLPCard({ state, result }: Props) {
  const [expanded, setExpanded] = useState(false)

  const params = useParams() as { projectId?: string; conversationId?: string } | null
  const convId    = params?.conversationId ?? ''
  const projectId = params?.projectId ?? ''
  const approveNLP    = usePipelineStore(s => s.approveNLP)
  const nlpEventQueue = usePipelineStore(s => s.pipelines[convId]?.nlpEventQueue ?? [])
  const round         = usePipelineStore(s => s.pipelines[convId]?.round ?? 1)

  // Local display state — animated from the queue one entry per rAF
  const [displayProgress, setDisplayProgress] = useState<Record<string, NLPTaskProgress>>({})
  const processedCountRef = useRef(0)

  // Reset display whenever a new pipeline round starts
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[NLPCard] round changed → ${round}, resetting display`, performance.now().toFixed(1))
    }
    processedCountRef.current = 0
    setDisplayProgress({})
  }, [round])

  // Drain the event queue one entry per animation frame
  useEffect(() => {
    if (processedCountRef.current >= nlpEventQueue.length) return

    const rafId = requestAnimationFrame(() => {
      const idx = processedCountRef.current
      if (idx >= nlpEventQueue.length) return
      const entry = nlpEventQueue[idx]
      processedCountRef.current = idx + 1

      if (process.env.NODE_ENV === 'development') {
        console.log(`[NLPCard] rAF ${idx} → ${entry.name}`, entry.patch, performance.now().toFixed(1))
      }

      setDisplayProgress(prev => {
        const existing = prev[entry.name] ?? { stageNum: 0, status: 'running' as const, attempt: 1, maxAttempts: 1 }
        return { ...prev, [entry.name]: { ...existing, ...entry.patch } }
      })
    })

    return () => cancelAnimationFrame(rafId)
  // Re-run whenever the queue grows or after each display update
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nlpEventQueue, displayProgress])

  const summary = result?.summary
  // Only conflicts block the gate — duplicates are informational and never block.
  const isBlocked = (result?.summary.total_conflicts ?? 0) > 0

  // displayProgress is keyed by event.name
  const getTaskProgress = (taskName: string) => displayProgress[taskName]

  const getTaskStatus = (taskName: string): TaskStatus => {
    const p = displayProgress[taskName]
    if (!p) return 'idle'
    return p.status === 'completed' ? 'done' : 'running'
  }

  // ── Collapsed approved ──────────────────────────────────────────────────────
  if (state === 'approved') {
    return (
      <div className="rounded-xl border border-success/20 bg-vrd-card animate-fade-up">
        <div className="flex items-center gap-3 px-4 py-3">
          <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-xs font-mono font-medium text-vrd-text-muted uppercase tracking-wider">
              Requirements Refiner
            </span>
            <p className="text-sm text-vrd-text mt-0.5">
              Approved —{' '}
              <span className="text-vrd-text-muted">
                {summary?.total_testable ?? 0} testable · {summary?.total_raw ?? 0} raw input ·{' '}
                {result?.testable.reduce((s, r) => s + r.num_scenarios, 0) ?? 0} scenarios queued
              </span>
            </p>
          </div>
          <Badge variant="success">Approved</Badge>
        </div>
      </div>
    )
  }

  // ── Processing — SSE-like task log ─────────────────────────────────────────
  if (state === 'processing') {
    return (
      <div className="rounded-xl border border-primary/30 bg-vrd-card animate-fade-up">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-vrd-border">
          <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-xs font-mono font-medium text-vrd-text-muted uppercase tracking-wider">
              Requirements Refiner
            </span>
            <p className="text-sm text-vrd-text-muted mt-0.5">Running pipeline…</p>
          </div>
          <Badge variant="info">Processing</Badge>
        </div>

        {/* Task rows */}
        <div className="px-4 py-3 space-y-2.5 font-mono">
          {TASKS.map((task) => {
            const status = getTaskStatus(task.name)
            const progress = getTaskProgress(task.name)
            return (
              <TaskRow
                key={task.num}
                task={task}
                status={status}
                attempt={progress?.attempt}
                maxAttempts={progress?.maxAttempts}
                message={progress?.message}
              />
            )
          })}
        </div>
      </div>
    )
  }

  // ── Failed ─────────────────────────────────────────────────────────────────
  if (state === 'failed') {
    return (
      <div className="rounded-xl border border-danger/20 bg-vrd-card animate-fade-up">
        <div className="flex items-center gap-3 px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-danger flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-xs font-mono font-medium text-vrd-text-muted uppercase tracking-wider">
              Requirements Refiner
            </span>
            <p className="text-sm text-vrd-text mt-0.5">
              Pipeline failed —{' '}
              <span className="text-vrd-text-muted">check the console and resubmit.</span>
            </p>
          </div>
          <Badge variant="danger">Failed</Badge>
        </div>
      </div>
    )
  }

  // ── Awaiting approval ──────────────────────────────────────────────────────
  if (!result) return null
  const totalScenarios = result.testable.reduce((s, r) => s + r.num_scenarios, 0)

  return (
    <div
      className={cn(
        'rounded-xl border bg-vrd-card animate-fade-up transition-all duration-300',
        isBlocked ? 'border-danger/30' : 'border-success/25',
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3 px-4 py-3">
        {isBlocked ? (
          <AlertTriangle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs font-mono font-medium text-vrd-text-muted uppercase tracking-wider">
              Requirements Refiner
            </span>
            {isBlocked ? (
              <Badge variant="danger">BLOCKED</Badge>
            ) : (
              <Badge variant="success">Ready</Badge>
            )}
          </div>

          {/* Summary line */}
          <p className="text-sm text-vrd-text leading-snug">
            {isBlocked ? (
              <>
                <span className="text-danger font-medium">
                  {result.summary.total_conflicts} conflict{result.summary.total_conflicts !== 1 ? 's' : ''}
                </span>
                {' '}must be resolved before proceeding.
              </>
            ) : (
              <>All checks passed — ready to generate scenarios.</>
            )}
          </p>

          {/* Stats strip */}
          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-vrd-text-muted font-mono flex-wrap">
            <span>{result.summary.total_raw} raw</span>
            <span className="text-vrd-text-dim">→</span>
            <span className="text-success">{result.summary.total_testable} testable</span>
            {result.summary.total_incomplete > 0 && (
              <>
                <span className="text-vrd-text-dim">·</span>
                <span className="text-warning">{result.summary.total_incomplete} incomplete</span>
              </>
            )}
            {result.summary.total_duplicates > 0 && (
              <>
                <span className="text-vrd-text-dim">·</span>
                <span className="text-vrd-text-muted">{result.summary.total_duplicates} duplicates</span>
              </>
            )}
            {result.summary.total_conflicts > 0 && (
              <>
                <span className="text-vrd-text-dim">·</span>
                <span className="text-danger">{result.summary.total_conflicts} conflict</span>
              </>
            )}
            {result.summary.total_overlaps > 0 && (
              <>
                <span className="text-vrd-text-dim">·</span>
                <span className="text-warning">{result.summary.total_overlaps} overlaps</span>
              </>
            )}
          </div>
        </div>

        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-vrd-text-muted hover:text-vrd-text transition-colors flex-shrink-0 mt-0.5"
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-vrd-border">
          {/* Metric tiles */}
          <div className="grid grid-cols-5 divide-x divide-vrd-border border-b border-vrd-border">
            <MetricTile label="Testable"   value={result.summary.total_testable}   tone="success" />
            <MetricTile label="Incomplete" value={result.summary.total_incomplete} tone={result.summary.total_incomplete > 0 ? 'warning' : 'neutral'} />
            <MetricTile label="Duplicates" value={result.summary.total_duplicates} tone={result.summary.total_duplicates > 0 ? 'warning' : 'neutral'} />
            <MetricTile label="Conflicts"  value={result.summary.total_conflicts}  tone={result.summary.total_conflicts > 0 ? 'danger' : 'success'} />
            <MetricTile label="Overlaps"   value={result.summary.total_overlaps}   tone={result.summary.total_overlaps > 0 ? 'warning' : 'neutral'} />
          </div>

          {/* Conflict rows */}
          {result.conflicts.length > 0 && (
            <div className="px-4 py-3 border-b border-vrd-border space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-danger/80">
                Conflicts requiring resolution
              </p>
              {result.conflicts.map((c) => (
                <div
                  key={c.conflict_id}
                  className="flex items-start gap-3 px-3 py-2.5 rounded-lg bg-danger/5 border border-danger/20"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-danger flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-[11px] font-semibold text-vrd-text">
                        {c.conflict_id}
                      </span>
                      <span className="text-[11px] text-vrd-text-muted">
                        {c.requirements.join(' × ')}
                      </span>
                    </div>
                    <p className="text-xs text-vrd-text-muted line-clamp-2 leading-relaxed">
                      {c.description}
                    </p>
                  </div>
                  <Link
                    href={`/project/${projectId}/conversation/${convId}/requirements`}
                    className="text-[11px] font-medium text-danger hover:text-danger/80 transition-colors flex-shrink-0 whitespace-nowrap mt-0.5"
                  >
                    Go to conflict →
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* Testable requirements table */}
          <div className="px-4 py-3 max-h-56 overflow-y-auto">
            <p className="text-[11px] font-medium uppercase tracking-wide text-vrd-text-dim mb-2">
              Testable requirements ({result.testable.length})
            </p>
            <div className="space-y-1">
              {result.testable.map((req) => (
                <Link
                  key={req.id}
                  href={`/project/${projectId}/conversation/${convId}/requirements`}
                  className={cn(
                    'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs hover:bg-vrd-card-hover transition-colors group',
                    req.conflict_flag && 'bg-danger/5',
                    req.overlap_with.length > 0 && !req.conflict_flag && 'bg-warning/5',
                  )}
                >
                  <span className="font-mono text-[11px] text-vrd-text-dim w-14 flex-shrink-0">
                    {req.id}
                  </span>
                  <ReqStatusBadge req={req} />
                  <ComplexityChip complexity={req.complexity} />
                  <span className="text-[10px] text-vrd-text-dim flex-shrink-0 w-12 text-right">
                    {req.num_scenarios}×
                  </span>
                  <span className="text-vrd-text-muted flex-1 min-w-0 truncate leading-none group-hover:text-vrd-text transition-colors">
                    {req.original}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Incomplete requirements */}
          {result.incomplete.length > 0 && (
            <div className="px-4 py-3 border-t border-vrd-border max-h-48 overflow-y-auto">
              <p className="text-[11px] font-medium uppercase tracking-wide text-warning mb-2 flex items-center gap-1.5">
                <AlertCircle className="w-3 h-3" />
                Incomplete requirements ({result.incomplete.length})
              </p>
              <div className="space-y-1">
                {result.incomplete.map((req) => (
                  <Link
                    key={req.id}
                    href={`/project/${projectId}/conversation/${convId}/requirements`}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs hover:bg-vrd-card-hover transition-colors group bg-warning/5"
                  >
                    <span className="font-mono text-[11px] text-vrd-text-dim w-14 flex-shrink-0">
                      {req.id}
                    </span>
                    <Badge variant="warning" className="text-[10px] px-1.5 py-0">incomplete</Badge>
                    <span className="text-[10px] text-warning flex-shrink-0 truncate max-w-[120px]">
                      {req.issues_found.join(', ')}
                    </span>
                    <span className="text-vrd-text-muted flex-1 min-w-0 truncate leading-none group-hover:text-vrd-text transition-colors">
                      {req.original}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Gate actions */}
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-3 border-t border-vrd-border',
          isBlocked && 'bg-danger/5',
        )}
      >
        <Link
          href={`/project/${projectId}/conversation/${convId}/requirements`}
          className={cn(
            'text-xs font-medium transition-colors',
            isBlocked
              ? 'text-danger hover:text-danger/80'
              : 'text-vrd-text-muted hover:text-vrd-text',
          )}
        >
          {isBlocked ? 'Review & resolve →' : 'Review requirements →'}
        </Link>

        <div className="ml-auto flex items-center gap-2">
          {!isBlocked && (
            <span className="text-[11px] text-vrd-text-dim hidden sm:inline">
              Queues {totalScenarios} scenarios
            </span>
          )}
          <Button
            size="sm"
            onClick={() => !isBlocked && approveNLP(convId)}
            disabled={isBlocked}
            title={
              isBlocked
                ? result.pipeline_status.reason ?? 'Conflicts must be resolved before continuing'
                : `Approve — will queue ${totalScenarios} scenarios`
            }
            className={cn(!isBlocked && 'animate-pulse-ring')}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approve &amp; continue
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TaskRow({
  task,
  status,
  attempt,
  maxAttempts,
  message,
}: {
  task: (typeof TASKS)[number]
  status: TaskStatus
  attempt?: number
  maxAttempts?: number
  message?: string
}) {
  const isRetrying = status === 'running' && attempt !== undefined && attempt > 1
  return (
    <div
      className={cn(
        'flex items-center gap-3 text-[12px] transition-opacity duration-200',
        status === 'idle' && 'opacity-35',
      )}
    >
      {/* Icon */}
      <span className="w-4 flex-shrink-0 flex items-center justify-center">
        {status === 'done' && (
          <CheckCircle2 className="w-3.5 h-3.5 text-success" />
        )}
        {status === 'running' && (
          <Loader2 className={cn('w-3.5 h-3.5 animate-spin', isRetrying ? 'text-warning' : 'text-primary')} />
        )}
        {status === 'idle' && (
          <Circle className="w-3.5 h-3.5 text-vrd-border" />
        )}
      </span>

      {/* Task number + name */}
      <span
        className={cn(
          'font-mono',
          status === 'done'    && 'text-vrd-text-muted',
          status === 'running' && (isRetrying ? 'text-warning' : 'text-primary'),
          status === 'idle'    && 'text-vrd-text-dim',
        )}
      >
        Task {task.num}
      </span>
      <span
        className={cn(
          'font-mono',
          status === 'done'    && 'text-vrd-text',
          status === 'running' && 'text-vrd-text font-semibold',
          status === 'idle'    && 'text-vrd-text-dim',
        )}
      >
        {task.fn}
      </span>

      {/* Trailing info */}
      <span className="ml-auto font-mono text-[11px] flex items-center gap-2">
        {status === 'running' && (
          <>
            {maxAttempts && maxAttempts > 1 && (
              <span className={cn(isRetrying ? 'text-warning' : 'text-primary')}>
                attempt {attempt}/{maxAttempts}
              </span>
            )}
            <span className="text-primary animate-pulse">{isRetrying ? 'retrying…' : 'running…'}</span>
          </>
        )}
        {status === 'done' && (
          <span className="text-success">{message ?? task.done}</span>
        )}
      </span>
    </div>
  )
}

function MetricTile({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'neutral' | 'success' | 'warning' | 'danger'
}) {
  return (
    <div className="flex flex-col items-center justify-center py-3 px-2 gap-0.5">
      <span
        className={cn(
          'text-xl font-semibold',
          tone === 'neutral' && 'text-vrd-text',
          tone === 'success' && 'text-success',
          tone === 'warning' && 'text-warning',
          tone === 'danger'  && 'text-danger',
        )}
      >
        {value}
      </span>
      <span className="text-[10px] text-vrd-text-dim uppercase tracking-wide">{label}</span>
    </div>
  )
}

function ReqStatusBadge({ req }: { req: { conflict_flag: boolean; overlap_with: string[] } }) {
  if (req.conflict_flag)
    return <Badge variant="danger"    className="text-[10px] px-1.5 py-0">conflict</Badge>
  if (req.overlap_with.length > 0)
    return <Badge variant="warning"   className="text-[10px] px-1.5 py-0">overlap</Badge>
  return       <Badge variant="success" className="text-[10px] px-1.5 py-0">testable</Badge>
}

function ComplexityChip({ complexity }: { complexity: 'HIGH' | 'MEDIUM' | 'LOW' }) {
  return (
    <span
      className={cn(
        'font-mono text-[10px] px-1.5 py-0.5 rounded flex-shrink-0',
        complexity === 'HIGH'   && 'bg-danger/15 text-danger',
        complexity === 'MEDIUM' && 'bg-warning/15 text-warning',
        complexity === 'LOW'    && 'bg-success/15 text-success',
      )}
    >
      {complexity}
    </span>
  )
}
