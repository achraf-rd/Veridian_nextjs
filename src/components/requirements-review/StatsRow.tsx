'use client'

import { CheckCircle2, AlertCircle, AlertTriangle, GitMerge, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RefinementSummary } from '@/types/requirements'

interface Props {
  summary: RefinementSummary
  effectiveConflicts: number
}

export default function StatsRow({ summary, effectiveConflicts }: Props) {
  const conflictTone = effectiveConflicts > 0 ? 'danger' : 'success'
  const overlapTone = summary.total_overlaps > 0 ? 'warning' : 'neutral'
  const incompleteTone = summary.total_incomplete > 0 ? 'warning' : 'success'
  const duplicateTone = summary.total_duplicates > 0 ? 'warning' : 'neutral'

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      <StatCard
        label="Testable"
        value={summary.total_testable}
        icon={<CheckCircle2 className="w-4 h-4" />}
        tone="success"
      />
      <StatCard
        label="Incomplete"
        value={summary.total_incomplete}
        icon={<AlertCircle className="w-4 h-4" />}
        tone={incompleteTone}
      />
      <StatCard
        label="Duplicates"
        value={summary.total_duplicates}
        icon={<Copy className="w-4 h-4" />}
        tone={duplicateTone}
      />
      <StatCard
        label="Conflicts"
        value={effectiveConflicts}
        icon={<AlertTriangle className="w-4 h-4" />}
        tone={conflictTone}
      />
      <StatCard
        label="Overlaps"
        value={summary.total_overlaps}
        icon={<GitMerge className="w-4 h-4" />}
        tone={overlapTone}
      />
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string
  value: number
  icon: React.ReactNode
  tone: 'neutral' | 'success' | 'warning' | 'danger'
}) {
  return (
    <div
      className={cn(
        'rounded-xl border p-4 flex items-start gap-3 bg-vrd-card',
        tone === 'neutral' && 'border-vrd-border',
        tone === 'success' && 'border-success/30 bg-success/5',
        tone === 'warning' && 'border-warning/30 bg-warning/5',
        tone === 'danger' && 'border-danger/30 bg-danger/5',
      )}
    >
      <div
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
          tone === 'neutral' && 'bg-vrd-card-hover text-vrd-text-muted',
          tone === 'success' && 'bg-success/15 text-success',
          tone === 'warning' && 'bg-warning/15 text-warning',
          tone === 'danger' && 'bg-danger/15 text-danger',
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-vrd-text-muted uppercase tracking-wide font-medium">
          {label}
        </p>
        <p
          className={cn(
            'text-2xl font-semibold mt-0.5',
            tone === 'neutral' && 'text-vrd-text',
            tone === 'success' && 'text-success',
            tone === 'warning' && 'text-warning',
            tone === 'danger' && 'text-danger',
          )}
        >
          {value}
        </p>
      </div>
    </div>
  )
}
