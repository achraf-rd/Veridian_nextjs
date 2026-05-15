'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  Circle,
} from 'lucide-react'
import { useState, useEffect, useRef, useMemo } from 'react'
import { usePipelineStore } from '@/stores/pipelineStore'
import { Badge, Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { CardState, ScenarioResult, ScenarioTaskProgress } from '@/types/pipeline'

// ─── Task definitions (mirrors Agent 2 internal pipeline stages) ──────────────

const TASKS = [
  { num: 1, name: 'clean',    fn: 'clean()',    done: 'requirements cleaned' },
  { num: 2, name: 'group',    fn: 'group()',    done: 'requirements grouped' },
  { num: 3, name: 'generate', fn: 'generate()', done: 'scenarios generated'  },
  { num: 4, name: 'merge',    fn: 'merge()',    done: 'results merged'        },
  { num: 5, name: 'evaluate', fn: 'evaluate()', done: 'best scenarios selected' },
] as const

type TaskStatus = 'idle' | 'running' | 'done'

// ─── Sub-components ───────────────────────────────────────────────────────────

function TaskRow({
  task,
  status,
  message,
}: {
  task: (typeof TASKS)[number]
  status: TaskStatus
  message?: string
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 text-[12px] transition-opacity duration-200',
        status === 'idle' && 'opacity-35',
      )}
    >
      <span className="w-4 flex-shrink-0 flex items-center justify-center">
        {status === 'done'    && <CheckCircle2 className="w-3.5 h-3.5 text-success" />}
        {status === 'running' && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />}
        {status === 'idle'    && <Circle className="w-3.5 h-3.5 text-vrd-border" />}
      </span>

      <span
        className={cn(
          'font-mono',
          status === 'done'    && 'text-vrd-text-muted',
          status === 'running' && 'text-primary',
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

      <span className="ml-auto font-mono text-[11px] flex items-center gap-2">
        {status === 'running' && (
          <span className="text-primary animate-pulse">running…</span>
        )}
        {status === 'done' && (
          <span className="text-success">{message ?? task.done}</span>
        )}
      </span>
    </div>
  )
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

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  state: CardState
  result: ScenarioResult | null
}

export default function ScenarioCard({ state, result }: Props) {
  const [expanded, setExpanded] = useState(false)

  const params = useParams() as { projectId?: string; conversationId?: string } | null
  const convId    = params?.conversationId ?? ''
  const projectId = params?.projectId ?? ''
  const { approveScenario } = usePipelineStore()
  const scenarioEventQueue = usePipelineStore(s => s.pipelines[convId]?.scenarioEventQueue ?? [])
  const round              = usePipelineStore(s => s.pipelines[convId]?.round ?? 1)

  // Local display state — drained from the queue one entry per rAF
  const [displayProgress, setDisplayProgress] = useState<Record<string, ScenarioTaskProgress>>({})
  const processedCountRef = useRef(0)

  // Reset when a new round starts
  useEffect(() => {
    processedCountRef.current = 0
    setDisplayProgress({})
  }, [round])

  // Drain queue one entry per animation frame
  useEffect(() => {
    if (processedCountRef.current >= scenarioEventQueue.length) return

    const rafId = requestAnimationFrame(() => {
      const idx = processedCountRef.current
      if (idx >= scenarioEventQueue.length) return
      const entry = scenarioEventQueue[idx]
      processedCountRef.current = idx + 1

      if (process.env.NODE_ENV === 'development') {
        console.log(`[ScenarioCard] rAF ${idx} → ${entry.name}`, entry.patch, performance.now().toFixed(1))
      }

      setDisplayProgress(prev => {
        const existing = prev[entry.name] ?? { stageNum: 0, status: 'running' as const }
        return { ...prev, [entry.name]: { ...existing, ...entry.patch } }
      })
    })

    return () => cancelAnimationFrame(rafId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioEventQueue, displayProgress])

  const getTaskStatus = (taskName: string): TaskStatus => {
    const p = displayProgress[taskName]
    if (!p) return 'idle'
    return p.status === 'completed' ? 'done' : 'running'
  }

  const getTaskMessage = (taskName: string) => displayProgress[taskName]?.message

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

  if (state === 'idle') return null

  // ── Approved (collapsed) ───────────────────────────────────────────────────
  if (state === 'approved') {
    return (
      <div className="rounded-xl border border-success/20 bg-vrd-card animate-fade-up">
        <div className="flex items-center gap-3 px-4 py-3">
          <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-xs font-mono font-medium text-vrd-text-muted uppercase tracking-wider">
              Scenario Generator
            </span>
            <p className="text-sm text-vrd-text mt-0.5">
              Approved —{' '}
              <span className="text-vrd-text-muted">
                {testCases.length > 0
                  ? `${testCases.length} scenarios across ${stats?.reqCount ?? 0} requirements`
                  : `${result?.total ?? 0} scenarios generated`}
              </span>
            </p>
          </div>
          <Badge variant="success">Approved</Badge>
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
              Scenario Generator
            </span>
            <p className="text-sm text-vrd-text mt-0.5">
              Generation failed —{' '}
              <span className="text-vrd-text-muted">check console and retry.</span>
            </p>
          </div>
          <Badge variant="danger">Failed</Badge>
        </div>
      </div>
    )
  }

  // ── Processing — SSE task log ──────────────────────────────────────────────
  if (state === 'processing') {
    return (
      <div className="rounded-xl border border-primary/30 bg-vrd-card animate-fade-up">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-vrd-border">
          <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-xs font-mono font-medium text-vrd-text-muted uppercase tracking-wider">
              Scenario Generator
            </span>
            <p className="text-sm text-vrd-text-muted mt-0.5">Running pipeline…</p>
          </div>
          <Badge variant="info">Processing</Badge>
        </div>

        <div className="px-4 py-3 space-y-2.5 font-mono">
          {TASKS.map((task) => (
            <TaskRow
              key={task.num}
              task={task}
              status={getTaskStatus(task.name)}
              message={getTaskMessage(task.name)}
            />
          ))}
        </div>
      </div>
    )
  }

  // ── Awaiting approval ──────────────────────────────────────────────────────
  if (!result) return null

  return (
    <div className="rounded-xl border border-warning/30 bg-vrd-card animate-fade-up transition-all duration-300">
      <div className="flex items-start gap-3 px-4 py-3">
        <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-mono font-medium text-vrd-text-muted uppercase tracking-wider">
              Scenario Generator
            </span>
            <Badge variant="warning">Awaiting approval</Badge>
          </div>

          {stats ? (
            <div className="space-y-2">
              <p className="text-sm text-vrd-text">
                <span className="font-medium">{testCases.length} scenarios</span> generated across{' '}
                <span className="font-medium">{stats.reqCount} requirements</span>.
              </p>

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

              {Object.keys(stats.tags).length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {Object.entries(stats.tags).map(([tag, count]) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] bg-vrd-card-hover text-vrd-text-muted"
                    >
                      {tag} · {count}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-vrd-text">
              Scenario generation complete —{' '}
              <span className="font-medium">{result.total} scenarios</span> generated
              {result.warnings > 0 && (
                <>, <span className="text-warning font-medium">{result.warnings} ASAM warnings</span></>
              )}.
            </p>
          )}
        </div>

        {result && !stats && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-vrd-text-muted hover:text-vrd-text transition-colors flex-shrink-0"
          >
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

      <div className="flex items-center gap-2 px-4 py-3 border-t border-vrd-border">
        <Link
          href={`/project/${projectId}/conversation/${convId}/scenarios`}
          className="text-xs font-medium text-primary-light hover:underline"
        >
          Review scenarios →
        </Link>
        <Button size="sm" onClick={() => approveScenario(convId)} className="ml-auto animate-pulse-amber">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Approve &amp; execute
        </Button>
      </div>
    </div>
  )
}
