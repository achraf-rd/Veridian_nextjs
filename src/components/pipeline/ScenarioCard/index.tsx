'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import { useState, useEffect, useRef, useMemo } from 'react'
import { usePipelineStore } from '@/stores/pipelineStore'
import { Badge, Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { CardState, ScenarioResult } from '@/types/pipeline'

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

// ─── Sub-components ───────────────────────────────────────────────────────────

function MessageRow({ message, isCurrent }: { message: string; isCurrent: boolean }) {
  return (
    <div className="flex items-center gap-3 text-[12px]">
      <span className="w-4 flex-shrink-0 flex items-center justify-center">
        {isCurrent
          ? <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
          : <CheckCircle2 className="w-3.5 h-3.5 text-success" />}
      </span>
      <span className={cn('font-mono flex-1', isCurrent ? 'text-vrd-text font-semibold' : 'text-vrd-text-muted')}>
        {message}
      </span>
      <span className="font-mono text-[11px]">
        {isCurrent
          ? <span className="text-primary animate-pulse">running…</span>
          : <span className="text-success">done</span>}
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
  const scenarioStartedAt = usePipelineStore(s => s.pipelines[convId]?.scenarioStartedAt)
  const scenarioFinishedAt = usePipelineStore(s => s.pipelines[convId]?.scenarioFinishedAt)
  const round              = usePipelineStore(s => s.pipelines[convId]?.round ?? 1)

  // Local message list — drained from the queue one entry per rAF
  const [displayMessages, setDisplayMessages] = useState<string[]>([])
  const processedCountRef = useRef(0)

  // Reset when a new round starts
  useEffect(() => {
    processedCountRef.current = 0
    setDisplayMessages([])
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
        console.log(`[ScenarioCard] rAF ${idx} → ${entry.message}`, performance.now().toFixed(1))
      }

      setDisplayMessages(prev => [...prev, entry.message])
    })

    return () => cancelAnimationFrame(rafId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenarioEventQueue, displayMessages])

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
            {scenarioStartedAt && scenarioFinishedAt && (
              <p className="text-[11px] text-vrd-text-muted font-mono mt-0.5">
                ⏱ Generated in {formatDuration(scenarioStartedAt, scenarioFinishedAt)}
              </p>
            )}
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

        <div className="px-4 py-3 space-y-2.5">
          {displayMessages.length === 0 ? (
            <div className="flex items-center gap-3 text-[12px]">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary flex-shrink-0" />
              <span className="font-mono text-vrd-text-muted animate-pulse">Connecting to agent…</span>
            </div>
          ) : (
            displayMessages.map((msg, idx) => (
              <MessageRow
                key={idx}
                message={msg}
                isCurrent={idx === displayMessages.length - 1}
              />
            ))
          )}
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

              {scenarioStartedAt && scenarioFinishedAt && (
                <p className="text-[11px] text-vrd-text-muted font-mono">
                  ⏱ Generated in {formatDuration(scenarioStartedAt, scenarioFinishedAt)}
                </p>
              )}

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
            <div className="space-y-1">
              <p className="text-sm text-vrd-text">
                Scenario generation complete —{' '}
                <span className="font-medium">{result.total} scenarios</span> generated
                {result.warnings > 0 && (
                  <>, <span className="text-warning font-medium">{result.warnings} ASAM warnings</span></>
                )}.
              </p>
              {scenarioFinishedAt && scenarioStartedAt && (
                <p className="text-[11px] text-vrd-text-muted font-mono">
                  ⏱ Took {formatDuration(scenarioStartedAt, scenarioFinishedAt)}
                </p>
              )}
            </div>
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
