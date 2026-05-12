'use client'

import { useState, useMemo } from 'react'
import { ChevronDown, ChevronRight, AlertCircle, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui'
import type {
  Complexity,
  ValidRequirement,
  IncompleteRequirement,
  DuplicateRequirement,
  RequirementStatus,
} from '@/types/requirements'

type Filter = 'all' | 'valid' | 'incomplete' | 'conflict' | 'overlap' | 'duplicates'

interface Props {
  testable: ValidRequirement[]
  incomplete: IncompleteRequirement[]
  duplicates: DuplicateRequirement[]
  editedIds: Set<string>
  resolvedConflictIds: Set<string>
  selectedReqId: string | null
  highlightedReqIds: Set<string>
  onSelectRequirement: (id: string) => void
}

export default function RequirementsSidebar({
  testable,
  incomplete,
  duplicates,
  editedIds,
  resolvedConflictIds,
  selectedReqId,
  highlightedReqIds,
  onSelectRequirement,
}: Props) {
  const [filter, setFilter] = useState<Filter>('all')
  const [duplicatesOpen, setDuplicatesOpen] = useState(false)
  const [incompleteOpen, setIncompleteOpen] = useState(true)

  const visibleValid = useMemo(() => {
    return testable.filter((r) => {
      if (filter === 'all' || filter === 'valid') return true
      if (filter === 'conflict') return r.conflict_flag
      if (filter === 'overlap') return r.overlap_with.length > 0
      return false
    })
  }, [testable, filter])

  const visibleIncomplete = useMemo(() => {
    if (filter === 'all' || filter === 'incomplete') return incomplete
    return []
  }, [incomplete, filter])

  const showDuplicateSection = filter === 'all' || filter === 'duplicates'
  const totalShown =
    filter === 'duplicates'
      ? duplicates.length
      : visibleValid.length + visibleIncomplete.length
  const totalAll = testable.length + incomplete.length

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'valid', label: 'Testable' },
    { key: 'incomplete', label: 'Incomplete' },
    { key: 'conflict', label: 'Conflict' },
    { key: 'overlap', label: 'Overlap' },
    { key: 'duplicates', label: `Duplicates${duplicates.length > 0 ? ` (${duplicates.length})` : ''}` },
  ]

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
          {filter === 'duplicates'
            ? `${duplicates.length} duplicates`
            : `${totalShown} of ${totalAll} shown`}
        </p>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">

        {/* Duplicates-only filter view */}
        {filter === 'duplicates' && (
          duplicates.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-vrd-text-muted">
              No duplicates detected.
            </div>
          ) : (
            <ul className="px-2 py-2 space-y-1">
              {duplicates.map((dup) => (
                <DuplicateRow
                  key={dup.id}
                  dup={dup}
                  isSelected={selectedReqId === dup.id}
                  onClick={() => onSelectRequirement(dup.id)}
                />
              ))}
            </ul>
          )
        )}

        {/* Normal views (all / valid / incomplete / conflict / overlap) */}
        {filter !== 'duplicates' && (
          <>
            {/* Valid / Testable section */}
            {visibleValid.length > 0 && (
              <>
                <p className="px-3 pt-2.5 pb-1.5 text-[11px] font-medium uppercase tracking-wide text-vrd-text-dim">
                  Testable ({visibleValid.length})
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

            {/* Duplicates collapsible (in 'all' view only) */}
            {showDuplicateSection && duplicates.length > 0 && (
              <div className="border-t border-vrd-border mt-2">
                <button
                  onClick={() => setDuplicatesOpen((v) => !v)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium text-vrd-text-muted hover:text-vrd-text hover:bg-vrd-card-hover transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    {duplicatesOpen ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                    <Copy className="w-3.5 h-3.5" />
                    Duplicates ({duplicates.length})
                  </span>
                </button>
                {duplicatesOpen && (
                  <ul className="px-2 pb-2 space-y-1">
                    {duplicates.map((dup) => (
                      <DuplicateRow
                        key={dup.id}
                        dup={dup}
                        isSelected={selectedReqId === dup.id}
                        onClick={() => onSelectRequirement(dup.id)}
                      />
                    ))}
                  </ul>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  )
}

// ─── Row sub-components ───────────────────────────────────────────────────────

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

function DuplicateRow({
  dup,
  isSelected,
  onClick,
}: {
  dup: DuplicateRequirement
  isSelected: boolean
  onClick: () => void
}) {
  const snippet =
    dup.original.length > 70 ? dup.original.slice(0, 70).trim() + '…' : dup.original

  return (
    <li>
      <button
        onClick={onClick}
        className={cn(
          'w-full text-left px-2.5 py-2 rounded-lg border transition-colors flex items-start gap-2',
          isSelected
            ? 'border-vrd-text-dim/40 bg-vrd-card-hover'
            : 'border-transparent hover:bg-vrd-card-hover',
        )}
      >
        <Copy className="w-3 h-3 text-vrd-text-dim flex-shrink-0 mt-1.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
            <span className="font-mono text-[11px] text-vrd-text-muted">{dup.id}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-vrd-card-hover text-vrd-text-dim font-medium">
              {dup.reason}
            </span>
            {dup.duplicate_of && (
              <span className="text-[10px] text-vrd-text-dim font-mono">
                → {dup.duplicate_of}
              </span>
            )}
          </div>
          <p className="text-xs text-vrd-text-muted line-clamp-2 leading-snug">{snippet}</p>
        </div>
      </button>
    </li>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
