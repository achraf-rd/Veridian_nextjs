'use client'

import { useState, useMemo } from 'react'
import { ChevronDown, ChevronRight, RotateCcw, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui'
import type {
  Complexity,
  ValidRequirement,
  IncompleteRequirement,
  RemovedRequirement,
  RequirementStatus,
} from '@/types/requirements'

type Filter = 'all' | 'valid' | 'incomplete' | 'conflict' | 'overlap'

interface Props {
  requirements: ValidRequirement[]
  incomplete: IncompleteRequirement[]
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
  { key: 'valid', label: 'Valid' },
  { key: 'incomplete', label: 'Incomplete' },
  { key: 'conflict', label: 'Conflict' },
  { key: 'overlap', label: 'Overlap' },
]

export default function RequirementsSidebar({
  requirements,
  incomplete,
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
  const [incompleteOpen, setIncompleteOpen] = useState(true)

  const visibleValid = useMemo(() => {
    return requirements.filter((r) => {
      if (filter === 'all') return true
      if (filter === 'valid') return true
      if (filter === 'conflict') return r.conflict_flag
      if (filter === 'overlap') return r.overlap_with.length > 0
      return false
    })
  }, [requirements, filter])

  const visibleIncomplete = useMemo(() => {
    if (filter === 'all' || filter === 'incomplete') return incomplete
    return []
  }, [incomplete, filter])

  const totalShown = visibleValid.length + visibleIncomplete.length
  const totalAll = requirements.length + incomplete.length

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
          {totalShown} of {totalAll} shown
        </p>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {/* Valid section */}
        {visibleValid.length > 0 && (
          <>
            <p className="px-3 pt-2.5 pb-1.5 text-[11px] font-medium uppercase tracking-wide text-vrd-text-dim">
              Valid ({visibleValid.length})
            </p>
            <ul className="px-2 space-y-1">
              {visibleValid.map((req) => (
                <ValidRow
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
          </>
        )}

        {/* Incomplete section */}
        {visibleIncomplete.length > 0 && (
          <div className="border-t border-vrd-border mt-2">
            <button
              onClick={() => setIncompleteOpen((v) => !v)}
              className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium text-warning hover:bg-vrd-card-hover transition-colors"
            >
              <span className="flex items-center gap-1.5">
                {incompleteOpen ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
                <AlertCircle className="w-3.5 h-3.5" />
                Incomplete ({visibleIncomplete.length})
              </span>
            </button>
            {incompleteOpen && (
              <ul className="px-2 space-y-1 pb-2">
                {visibleIncomplete.map((req) => (
                  <IncompleteRow
                    key={req.id}
                    req={req}
                    isSelected={selectedReqId === req.id}
                    isEdited={editedIds.has(req.id)}
                    onClick={() => onSelectRequirement(req.id)}
                  />
                ))}
              </ul>
            )}
          </div>
        )}

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

function ValidRow({
  req,
  isSelected,
  isHighlighted,
  isEdited,
  isResolved,
  onClick,
}: {
  req: ValidRequirement
  isSelected: boolean
  isHighlighted: boolean
  isEdited: boolean
  isResolved: boolean
  onClick: () => void
}) {
  const dotColor = statusDotColor(req, isResolved)
  const complexityTone = complexityToneClass(req.complexity)
  const snippet =
    req.original.length > 70 ? req.original.slice(0, 70).trim() + '…' : req.original

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
        <span className={cn('mt-1.5 w-2 h-2 rounded-full flex-shrink-0', dotColor)} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="font-mono text-[11px] text-vrd-text-muted">{req.id}</span>
            {isEdited && (
              <Badge variant="info" className="text-[10px] px-1.5 py-0">edited</Badge>
            )}
            {req.conflict_flag && !isResolved && (
              <Badge variant="danger" className="text-[10px] px-1.5 py-0">conflict</Badge>
            )}
            {req.conflict_flag && isResolved && (
              <Badge variant="success" className="text-[10px] px-1.5 py-0">resolved</Badge>
            )}
            {req.overlap_with.length > 0 && (
              <Badge variant="warning" className="text-[10px] px-1.5 py-0">overlap</Badge>
            )}
          </div>
          <p className="text-xs text-vrd-text line-clamp-2 leading-snug">{snippet}</p>
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

function IncompleteRow({
  req,
  isSelected,
  isEdited,
  onClick,
}: {
  req: IncompleteRequirement
  isSelected: boolean
  isEdited: boolean
  onClick: () => void
}) {
  const snippet =
    req.original.length > 70 ? req.original.slice(0, 70).trim() + '…' : req.original

  return (
    <li>
      <button
        onClick={onClick}
        className={cn(
          'w-full text-left px-2.5 py-2 rounded-lg border transition-colors flex items-start gap-2',
          isSelected
            ? 'border-warning/60 bg-warning/10'
            : 'border-transparent hover:bg-vrd-card-hover',
        )}
      >
        <span className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0 bg-warning" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="font-mono text-[11px] text-vrd-text-muted">{req.id}</span>
            {isEdited ? (
              <Badge variant="info" className="text-[10px] px-1.5 py-0">edited</Badge>
            ) : (
              <Badge variant="warning" className="text-[10px] px-1.5 py-0">incomplete</Badge>
            )}
          </div>
          <p className="text-xs text-vrd-text line-clamp-2 leading-snug">{snippet}</p>
          {req.issues_found.length > 0 && (
            <p className="text-[10px] text-warning mt-0.5 truncate">
              {req.issues_found.join(' · ')}
            </p>
          )}
        </div>
      </button>
    </li>
  )
}

function statusDotColor(req: ValidRequirement, isResolved: boolean): string {
  if (req.conflict_flag && !isResolved) return 'bg-danger'
  if (req.overlap_with.length > 0) return 'bg-warning'
  return 'bg-success'
}

function complexityToneClass(c: Complexity): string {
  if (c === 'HIGH') return 'bg-danger/15 text-danger'
  if (c === 'MEDIUM') return 'bg-warning/15 text-warning'
  return 'bg-success/15 text-success'
}

export type { Filter, RequirementStatus }
