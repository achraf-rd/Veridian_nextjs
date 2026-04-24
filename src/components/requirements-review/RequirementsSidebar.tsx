'use client'

import { useState, useMemo } from 'react'
import { ChevronDown, ChevronRight, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui'
import type {
  Complexity,
  RefinedRequirement,
  RemovedRequirement,
  RequirementStatus,
} from '@/types/requirements'

type Filter = 'all' | 'conflict' | 'overlap' | 'refined' | 'ok'

interface Props {
  requirements: RefinedRequirement[]
  removed: RemovedRequirement[]
  restoredIds: Set<string>
  editedIds: Set<string>
  resolvedConflictIds: Set<string>
  selectedReqId: string | null
  highlightedReqIds: Set<string>
  onSelectRequirement: (id: string) => void
  onRestore: (id: string) => void
}

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'conflict', label: 'Conflict' },
  { key: 'overlap', label: 'Overlap' },
  { key: 'refined', label: 'Refined' },
  { key: 'ok', label: 'OK' },
]

export default function RequirementsSidebar({
  requirements,
  removed,
  restoredIds,
  editedIds,
  resolvedConflictIds,
  selectedReqId,
  highlightedReqIds,
  onSelectRequirement,
  onRestore,
}: Props) {
  const [filter, setFilter] = useState<Filter>('all')
  const [removedOpen, setRemovedOpen] = useState(false)

  const visibleRequirements = useMemo(() => {
    return requirements.filter((r) => {
      if (filter === 'all') return true
      if (filter === 'conflict') return r.conflict_flag
      if (filter === 'overlap') return r.overlap_with.length > 0
      if (filter === 'refined') return r.status === 'refined'
      if (filter === 'ok') return r.status === 'unchanged'
      return true
    })
  }, [requirements, filter])

  const activeRemoved = removed.filter((r) => !restoredIds.has(r.id))

  return (
    <aside className="w-[320px] flex-shrink-0 border-r border-vrd-border bg-vrd-sidebar flex flex-col overflow-hidden">
      {/* Filters */}
      <div className="p-3 border-b border-vrd-border flex-shrink-0">
        <div className="flex items-center gap-1 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap',
                filter === f.key
                  ? 'bg-primary text-white'
                  : 'text-vrd-text-muted hover:text-vrd-text hover:bg-vrd-card-hover',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-vrd-text-dim">
          {visibleRequirements.length} of {requirements.length} shown
        </p>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        <ul className="p-2 space-y-1">
          {visibleRequirements.map((req) => (
            <RequirementRow
              key={req.id}
              req={req}
              isSelected={selectedReqId === req.id}
              isHighlighted={highlightedReqIds.has(req.id)}
              isEdited={editedIds.has(req.id)}
              isResolved={
                req.conflict_id != null && resolvedConflictIds.has(req.conflict_id)
              }
              onClick={() => onSelectRequirement(req.id)}
            />
          ))}
        </ul>

        {/* Removed collapsible */}
        {activeRemoved.length > 0 && (
          <div className="border-t border-vrd-border mt-2">
            <button
              onClick={() => setRemovedOpen((v) => !v)}
              className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium text-vrd-text-muted hover:text-vrd-text hover:bg-vrd-card-hover transition-colors"
            >
              <span className="flex items-center gap-1.5">
                {removedOpen ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
                Show removed ({activeRemoved.length})
              </span>
            </button>
            {removedOpen && (
              <ul className="pb-2">
                {activeRemoved.map((r) => (
                  <li
                    key={r.id}
                    className="mx-2 mb-1.5 px-3 py-2 rounded-lg border border-dashed border-vrd-border bg-vrd-card/40"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[11px] text-vrd-text-dim line-through">
                        {r.id}
                      </span>
                      <button
                        onClick={() => onRestore(r.id)}
                        className="inline-flex items-center gap-1 text-[11px] text-primary hover:text-primary-hover font-medium"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Restore
                      </button>
                    </div>
                    <p className="text-xs text-vrd-text-dim line-through line-clamp-2 mb-1">
                      {r.original}
                    </p>
                    <p className="text-[11px] text-vrd-text-muted">{r.reason}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Restored items section */}
        {removed.some((r) => restoredIds.has(r.id)) && (
          <div className="border-t border-vrd-border">
            <p className="px-3 pt-2.5 pb-1.5 text-[11px] font-medium uppercase tracking-wide text-vrd-text-dim">
              Restored
            </p>
            <ul className="px-2 pb-2">
              {removed
                .filter((r) => restoredIds.has(r.id))
                .map((r) => (
                  <li
                    key={r.id}
                    className="mb-1 px-3 py-2 rounded-lg border border-primary/30 bg-primary/5"
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-mono text-[11px] text-primary">{r.id}</span>
                      <Badge variant="info" className="text-[10px] py-0">
                        Restored
                      </Badge>
                    </div>
                    <p className="text-xs text-vrd-text line-clamp-2">{r.original}</p>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>
    </aside>
  )
}

function RequirementRow({
  req,
  isSelected,
  isHighlighted,
  isEdited,
  isResolved,
  onClick,
}: {
  req: RefinedRequirement
  isSelected: boolean
  isHighlighted: boolean
  isEdited: boolean
  isResolved: boolean
  onClick: () => void
}) {
  const dotColor = statusDotColor(req, isResolved)
  const complexityTone = complexityToneClass(req.complexity)
  const snippet =
    req.refined.length > 70 ? req.refined.slice(0, 70).trim() + '…' : req.refined

  return (
    <li>
      <button
        onClick={onClick}
        className={cn(
          'w-full text-left px-2.5 py-2 rounded-lg border transition-colors flex items-start gap-2',
          isSelected
            ? 'border-primary/60 bg-primary/10'
            : isHighlighted
              ? 'border-danger/40 bg-danger/5'
              : 'border-transparent hover:bg-vrd-card-hover',
        )}
      >
        {/* Status dot */}
        <span
          className={cn(
            'mt-1.5 w-2 h-2 rounded-full flex-shrink-0',
            dotColor,
          )}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="font-mono text-[11px] text-vrd-text-muted">
              {req.id}
            </span>
            {isEdited && (
              <Badge variant="info" className="text-[10px] px-1.5 py-0">
                edited
              </Badge>
            )}
            {req.conflict_flag && !isResolved && (
              <Badge variant="danger" className="text-[10px] px-1.5 py-0">
                conflict
              </Badge>
            )}
            {req.conflict_flag && isResolved && (
              <Badge variant="success" className="text-[10px] px-1.5 py-0">
                resolved
              </Badge>
            )}
            {req.overlap_with.length > 0 && (
              <Badge variant="warning" className="text-[10px] px-1.5 py-0">
                overlap
              </Badge>
            )}
          </div>
          <p className="text-xs text-vrd-text line-clamp-2 leading-snug">
            {snippet}
          </p>
        </div>

        <span
          className={cn(
            'font-mono text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5',
            complexityTone,
          )}
        >
          {req.complexity}
        </span>
      </button>
    </li>
  )
}

function statusDotColor(req: RefinedRequirement, isResolved: boolean): string {
  if (req.conflict_flag && !isResolved) return 'bg-danger'
  if (req.overlap_with.length > 0) return 'bg-warning'
  if (req.status === 'refined') return 'bg-primary'
  return 'bg-success'
}

function complexityToneClass(c: Complexity): string {
  if (c === 'HIGH') return 'bg-danger/15 text-danger'
  if (c === 'MEDIUM') return 'bg-warning/15 text-warning'
  return 'bg-success/15 text-success'
}

export type { Filter, RequirementStatus }
