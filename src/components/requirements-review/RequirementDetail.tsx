'use client'

import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, GitMerge, Info, Save, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge, Button } from '@/components/ui'
import type {
  ConflictEntry,
  RefinedRequirement,
} from '@/types/requirements'

interface Props {
  req: RefinedRequirement
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
  const [draft, setDraft] = useState(editedText ?? req.refined)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Sync draft when req changes or edited text updates externally
  useEffect(() => {
    setDraft(editedText ?? req.refined)
  }, [req.id, editedText, req.refined])

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
  const hasUnsavedChanges = draft !== (editedText ?? req.refined)

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-6 space-y-5">
        {/* Header */}
        <div className="flex items-center flex-wrap gap-2">
          <span className="font-mono text-base font-semibold text-vrd-text">
            {req.id}
          </span>
          <StatusBadge req={req} isResolved={isResolved} edited={editedText != null} />
          <ComplexityBadge complexity={req.complexity} />
          <span className="text-xs text-vrd-text-muted ml-1">
            {req.num_scenarios}{' '}
            {req.num_scenarios === 1 ? 'scenario' : 'scenarios'}
          </span>
        </div>

        {/* Issues chips */}
        {hasIssues && (
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

        {/* Diff or single block */}
        {req.status === 'unchanged' || !hasIssues ? (
          <SingleTextBlock text={editedText ?? req.refined} edited={editedText != null} />
        ) : (
          <DiffBlock
            original={req.original}
            refined={editedText ?? req.refined}
            edited={editedText != null}
          />
        )}

        {/* Conflict warning */}
        {req.conflict_flag && conflict && (
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
                <p className="text-xs text-vrd-text-muted leading-relaxed">
                  <span className="font-medium">Suggestion: </span>
                  {conflict.resolution}
                </p>
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

        {/* Overlap warning */}
        {req.overlap_with.length > 0 && (
          <div className="rounded-xl border border-warning/30 bg-warning/5 p-4">
            <div className="flex items-start gap-2.5">
              <GitMerge className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-vrd-text font-medium mb-1">
                  Overlaps with {req.overlap_with.length === 1 ? '' : 'requirements'}{' '}
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
        <div className="rounded-xl border border-vrd-border bg-vrd-card p-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-vrd-text-muted uppercase tracking-wide">
              Edit requirement
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
            rows={4}
            className="w-full rounded-lg bg-vrd-bg border border-vrd-border px-3 py-2 text-sm text-vrd-text resize-y focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 font-sans leading-relaxed"
          />
          <div className="flex items-center justify-between mt-2.5">
            <p className="text-[11px] text-vrd-text-dim">
              {draft.length} characters
            </p>
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

        {/* Complexity justification */}
        <div className="rounded-xl border border-dashed border-vrd-border bg-vrd-card/40 p-3.5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-vrd-text-dim mb-1">
            Complexity justification
          </p>
          <p className="text-xs text-vrd-text-muted leading-relaxed">
            {req.complexity_justification}
          </p>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({
  req,
  isResolved,
  edited,
}: {
  req: RefinedRequirement
  isResolved: boolean
  edited: boolean
}) {
  if (req.conflict_flag) {
    return isResolved ? (
      <Badge variant="success">resolved</Badge>
    ) : (
      <Badge variant="danger">conflict</Badge>
    )
  }
  if (req.overlap_with.length > 0) return <Badge variant="warning">overlap</Badge>
  if (edited) return <Badge variant="info">edited</Badge>
  if (req.status === 'refined') return <Badge variant="info">refined</Badge>
  return <Badge variant="success">unchanged</Badge>
}

function ComplexityBadge({ complexity }: { complexity: RefinedRequirement['complexity'] }) {
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

function SingleTextBlock({ text, edited }: { text: string; edited: boolean }) {
  return (
    <div
      className={cn(
        'rounded-xl border p-4',
        edited ? 'border-primary/30 bg-primary/5' : 'border-vrd-border bg-vrd-card',
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-vrd-text-dim mb-1.5">
        {edited ? 'Edited' : 'Refined text'}
      </p>
      <p className="text-sm text-vrd-text leading-relaxed">{text}</p>
    </div>
  )
}

function DiffBlock({
  original,
  refined,
  edited,
}: {
  original: string
  refined: string
  edited: boolean
}) {
  return (
    <div className="grid md:grid-cols-2 gap-3">
      <div className="rounded-xl border border-vrd-border bg-vrd-card p-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-vrd-text-dim mb-1.5">
          Original
        </p>
        <p className="text-sm text-vrd-text-muted leading-relaxed">
          <span className="decoration-warning decoration-wavy underline underline-offset-4">
            {original}
          </span>
        </p>
      </div>
      <div
        className={cn(
          'rounded-xl border p-4',
          edited ? 'border-primary/40 bg-primary/5' : 'border-primary/30 bg-primary/5',
        )}
      >
        <p className="text-[11px] font-medium uppercase tracking-wide text-primary mb-1.5">
          {edited ? 'Refined + edited' : 'Refined'}
        </p>
        <p className="text-sm text-vrd-text leading-relaxed">
          <span className="decoration-primary decoration-dotted underline underline-offset-4">
            {refined}
          </span>
        </p>
      </div>
    </div>
  )
}
