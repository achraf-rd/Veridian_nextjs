'use client'

import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, GitMerge, Info, Save, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge, Button } from '@/components/ui'
import type {
  AnyRequirement,
  ConflictEntry,
  ValidRequirement,
  IncompleteRequirement,
} from '@/types/requirements'

interface Props {
  req: AnyRequirement
  editedText: string | null
  conflict: ConflictEntry | null
  isResolved: boolean
  autoFocusEdit: boolean
  onSaveEdit: (reqId: string, newText: string) => void
  onJumpToConflict: (conflictId: string) => void
  onJumpToRequirement: (reqId: string) => void
}

export default function RequirementDetail({
  req,
  editedText,
  conflict,
  isResolved,
  autoFocusEdit,
  onSaveEdit,
  onJumpToConflict,
  onJumpToRequirement,
}: Props) {
  const [draft, setDraft] = useState(editedText ?? req.original)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setDraft(editedText ?? req.original)
  }, [req.id, editedText, req.original])

  useEffect(() => {
    if (autoFocusEdit && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length,
      )
    }
  }, [autoFocusEdit, req.id])

  const hasIssues = req.issues_found.length > 0
  const hasUnsavedChanges = draft !== (editedText ?? req.original)
  const isIncomplete = req.status === 'incomplete'
  const isValid = req.status === 'valid'

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-6 space-y-5">
        {/* Header */}
        <div className="flex items-center flex-wrap gap-2">
          <span className="font-mono text-base font-semibold text-vrd-text">
            {req.id}
          </span>
          <StatusBadge req={req} isResolved={isResolved} edited={editedText != null} />
          {isValid && <ComplexityBadge complexity={req.complexity} />}
          {isValid && (
            <span className="text-xs text-vrd-text-muted ml-1">
              {req.num_scenarios}{' '}
              {req.num_scenarios === 1 ? 'scenario' : 'scenarios'}
            </span>
          )}
        </div>

        {/* Incomplete banner */}
        {isIncomplete && (
          <div className="rounded-xl border border-warning/30 bg-warning/5 p-4">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-vrd-text font-medium mb-1">
                  This requirement is incomplete
                </p>
                <p className="text-xs text-vrd-text-muted leading-relaxed mb-2">
                  The agent flagged missing information that prevents this requirement
                  from generating valid scenarios. Edit the text below to add the
                  missing details, then save.
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {req.issues_found.map((issue) => (
                    <span
                      key={issue}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-warning/15 text-warning border border-warning/30"
                    >
                      <Info className="w-3 h-3" />
                      {issue}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Issues chips for valid (still surfaced if any) */}
        {isValid && hasIssues && (
          <div className="flex flex-wrap gap-1.5">
            {req.issues_found.map((issue) => (
              <span
                key={issue}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-warning/10 text-warning border border-warning/25"
              >
                <Info className="w-3 h-3" />
                {issue}
              </span>
            ))}
          </div>
        )}

        {/* Requirement text block */}
        <RequirementBlock
          text={editedText ?? req.original}
          edited={editedText != null}
          incomplete={isIncomplete}
        />

        {/* Conflict warning (valid only) */}
        {isValid && req.conflict_flag && conflict && (
          <div
            className={cn(
              'rounded-xl border p-4',
              isResolved
                ? 'border-success/30 bg-success/5'
                : 'border-danger/30 bg-danger/5',
            )}
          >
            <div className="flex items-start gap-2.5">
              {isResolved ? (
                <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-semibold text-vrd-text">
                    {conflict.conflict_id}
                  </span>
                  <Badge variant={isResolved ? 'success' : 'danger'}>
                    {isResolved ? 'Resolved' : 'Unresolved'}
                  </Badge>
                </div>
                <p className="text-sm text-vrd-text leading-relaxed mb-2">
                  {conflict.description}
                </p>
                {conflict.resolution && (
                  <p className="text-xs text-vrd-text-muted leading-relaxed">
                    <span className="font-medium">Suggestion: </span>
                    {conflict.resolution}
                  </p>
                )}
                <button
                  onClick={() => onJumpToConflict(conflict.conflict_id)}
                  className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover"
                >
                  See conflict →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Overlap warning (valid only) */}
        {isValid && req.overlap_with.length > 0 && (
          <div className="rounded-xl border border-warning/30 bg-warning/5 p-4">
            <div className="flex items-start gap-2.5">
              <GitMerge className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-vrd-text font-medium mb-1">
                  Overlaps with{' '}
                  {req.overlap_with.map((id, idx) => (
                    <span key={id}>
                      <button
                        onClick={() => onJumpToRequirement(id)}
                        className="font-mono text-primary hover:text-primary-hover underline underline-offset-2"
                      >
                        {id}
                      </button>
                      {idx < req.overlap_with.length - 1 && ', '}
                    </span>
                  ))}
                </p>
                <p className="text-xs text-vrd-text-muted leading-relaxed">
                  Semantically similar requirements — informational only, does not block
                  the pipeline.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Edit field */}
        <div
          className={cn(
            'rounded-xl border bg-vrd-card p-4',
            isIncomplete ? 'border-warning/30' : 'border-vrd-border',
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-vrd-text-muted uppercase tracking-wide">
              {isIncomplete ? 'Complete the requirement' : 'Edit requirement'}
            </label>
            {editedText != null && (
              <Badge variant="info" className="text-[10px] py-0">
                manually edited
              </Badge>
            )}
          </div>
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={5}
            className={cn(
              'w-full rounded-lg bg-vrd-bg border px-3 py-2 text-sm text-vrd-text resize-y focus:outline-none font-sans leading-relaxed',
              isIncomplete
                ? 'border-warning/30 focus:ring-2 focus:ring-warning/40 focus:border-warning/40'
                : 'border-vrd-border focus:ring-2 focus:ring-primary/40 focus:border-primary/40',
            )}
          />
          <div className="flex items-center justify-between mt-2.5">
            <p className="text-[11px] text-vrd-text-dim">{draft.length} characters</p>
            <Button
              size="sm"
              onClick={() => onSaveEdit(req.id, draft.trim())}
              disabled={!hasUnsavedChanges || draft.trim().length === 0}
            >
              <Save className="w-3.5 h-3.5" />
              Save edit
            </Button>
          </div>
        </div>

        {/* Complexity justification (valid only) */}
        {isValid && req.complexity_justification && (
          <div className="rounded-xl border border-dashed border-vrd-border bg-vrd-card/40 p-3.5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-vrd-text-dim mb-1">
              Complexity justification
            </p>
            <p className="text-xs text-vrd-text-muted leading-relaxed">
              {req.complexity_justification}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({
  req,
  isResolved,
  edited,
}: {
  req: AnyRequirement
  isResolved: boolean
  edited: boolean
}) {
  if (req.status === 'incomplete') {
    if (edited) return <Badge variant="info">edited</Badge>
    return <Badge variant="warning">incomplete</Badge>
  }

  // valid
  if (req.conflict_flag) {
    return isResolved ? (
      <Badge variant="success">resolved</Badge>
    ) : (
      <Badge variant="danger">conflict</Badge>
    )
  }
  if (req.overlap_with.length > 0) return <Badge variant="warning">overlap</Badge>
  if (edited) return <Badge variant="info">edited</Badge>
  return <Badge variant="success">valid</Badge>
}

function ComplexityBadge({ complexity }: { complexity: ValidRequirement['complexity'] }) {
  const tone =
    complexity === 'HIGH' ? 'danger' : complexity === 'MEDIUM' ? 'warning' : 'success'
  return (
    <span
      className={cn(
        'font-mono text-[10px] px-2 py-0.5 rounded-full font-semibold',
        tone === 'danger' && 'bg-danger/15 text-danger',
        tone === 'warning' && 'bg-warning/15 text-warning',
        tone === 'success' && 'bg-success/15 text-success',
      )}
    >
      {complexity}
    </span>
  )
}

function RequirementBlock({
  text,
  edited,
  incomplete,
}: {
  text: string
  edited: boolean
  incomplete: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-xl border p-4',
        edited
          ? 'border-primary/30 bg-primary/5'
          : incomplete
            ? 'border-warning/30 bg-warning/5'
            : 'border-vrd-border bg-vrd-card',
      )}
    >
      <p
        className={cn(
          'text-[11px] font-medium uppercase tracking-wide mb-1.5',
          edited
            ? 'text-primary'
            : incomplete
              ? 'text-warning'
              : 'text-vrd-text-dim',
        )}
      >
        {edited ? 'Edited text' : incomplete ? 'Original (incomplete)' : 'Requirement text'}
      </p>
      <p className="text-sm text-vrd-text leading-relaxed">{text}</p>
    </div>
  )
}
