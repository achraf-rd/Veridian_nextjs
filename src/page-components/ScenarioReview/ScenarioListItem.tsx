'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { TestCase } from '@/types/agent2'
import { cn } from '@/lib/utils'
import TestStepsTable from './TestStepsTable'
import ActorsPanel from './ActorsPanel'

interface Props {
  tc: TestCase
  onViewed: (id: string) => void
}

function ComplexityChip({ level }: { level: string }) {
  const cls =
    level === 'LOW'
      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      : level === 'MEDIUM'
      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
  return (
    <span className={cn('inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium', cls)}>
      {level}
    </span>
  )
}

function PhaseChip({ phase }: { phase: string }) {
  const cls =
    phase === 'SIL'
      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
  return (
    <span className={cn('inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium', cls)}>
      {phase}
    </span>
  )
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 text-xs">
      <span className="text-vrd-text-dim w-24 flex-shrink-0">{label}</span>
      <span className="text-vrd-text">{value}</span>
    </div>
  )
}

export default function ScenarioListItem({ tc, onViewed }: Props) {
  const [open, setOpen] = useState(false)

  function handleToggle() {
    if (!open) onViewed(tc.scenario_id)
    setOpen((v) => !v)
  }

  return (
    <div className="rounded-lg border border-vrd-border bg-vrd-card overflow-hidden">
      {/* Header strip */}
      <button
        onClick={handleToggle}
        className="w-full flex items-start gap-3 px-4 py-3 hover:bg-vrd-card-hover transition-colors text-left"
      >
        <span className="mt-0.5 text-vrd-text-dim flex-shrink-0">
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </span>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs bg-vrd-card-hover px-1.5 py-0.5 rounded text-vrd-text">
              {tc.scenario_id}
            </span>
            <ComplexityChip level={tc.complexity} />
            <PhaseChip phase={tc.test_phase} />
          </div>

          <p className="text-sm text-vrd-text font-medium">{tc.feature_under_test}</p>

          <p className={cn('text-xs text-vrd-text-muted', !open && 'truncate')}>{tc.description}</p>

          <div className="flex flex-wrap gap-1">
            {tc.tags.map((tag) => (
              <span key={tag} className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] bg-vrd-card-hover text-vrd-text-dim">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </button>

      {/* Expanded detail */}
      {open && (
        <div className="border-t border-vrd-border px-4 py-4 space-y-5">
          {/* Two-column: environment+ego | actors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left: environment & ego vehicle */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-medium text-vrd-text-muted uppercase tracking-wider mb-2">Environment &amp; Ego</p>
              <DetailRow label="Map" value={tc.environment.map} />
              <DetailRow label="Weather" value={tc.environment.weather} />
              <DetailRow label="Lighting" value={tc.environment.lighting} />
              <DetailRow label="Ego state" value={tc.ego_vehicle.state} />
              <DetailRow label="Initial speed" value={`${tc.ego_vehicle.initial_speed} km/h`} />
              <DetailRow
                label="Set speed"
                value={tc.ego_vehicle.set_speed != null ? `${tc.ego_vehicle.set_speed} km/h` : '—'}
              />
              <DetailRow label="Lane" value={tc.ego_vehicle.lane} />
              <DetailRow
                label="Covers"
                value={tc.covers_requirements.join(', ')}
              />
            </div>

            {/* Right: actors */}
            <div>
              <p className="text-[11px] font-medium text-vrd-text-muted uppercase tracking-wider mb-2">Actors</p>
              <ActorsPanel actors={tc.actors} />
            </div>
          </div>

          {/* Preconditions */}
          {(tc.preconditions ?? []).length > 0 && (
            <div>
              <p className="text-[11px] font-medium text-vrd-text-muted uppercase tracking-wider mb-2">Preconditions</p>
              <ul className="list-disc list-inside space-y-1">
                {(tc.preconditions ?? []).map((p, i) => (
                  <li key={i} className="text-xs text-vrd-text-muted">{p}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Test steps */}
          <div>
            <p className="text-[11px] font-medium text-vrd-text-muted uppercase tracking-wider mb-2">Test Steps</p>
            <TestStepsTable steps={tc['test case']} />
          </div>
        </div>
      )}
    </div>
  )
}
