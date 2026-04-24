'use client'

import { AlertTriangle, CheckCircle2, Edit3, XCircle, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge, Button } from '@/components/ui'
import type {
  ConflictEntry,
  RefinedRequirement,
} from '@/types/requirements'

interface Props {
  conflict: ConflictEntry
  involvedRequirements: RefinedRequirement[]
  editedIds: Set<string>
  isResolved: boolean
  isDismissed: boolean
  onEditRequirement: (reqId: string) => void
  onDismissConflict: (conflictId: string) => void
}

export default function ConflictPanel({
  conflict,
  involvedRequirements,
  editedIds,
  isResolved,
  isDismissed,
  onEditRequirement,
  onDismissConflict,
}: Props) {
  const bothEdited = involvedRequirements.every((r) => editedIds.has(r.id))

  return (
    <aside className="w-[380px] flex-shrink-0 border-l border-vrd-border bg-vrd-sidebar flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-vrd-border flex-shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle
            className={cn(
              'w-4 h-4',
              isResolved ? 'text-success' : 'text-danger',
            )}
          />
          <span className="font-mono text-sm font-semibold text-vrd-text">
            {conflict.conflict_id}
          </span>
          {isResolved ? (
            <Badge variant="success">Resolved</Badge>
          ) : isDismissed ? (
            <Badge variant="default">Dismissed</Badge>
          ) : (
            <Badge variant="danger">Unresolved</Badge>
          )}
        </div>
        <p className="text-xs text-vrd-text-muted">
          Conflict between {conflict.requirements.join(' and ')}
        </p>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Involved requirements */}
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-vrd-text-dim mb-2">
            Involved requirements
          </p>
          <div className="space-y-2">
            {involvedRequirements.map((req) => (
              <div
                key={req.id}
                className={cn(
                  'rounded-lg border p-3',
                  editedIds.has(req.id)
                    ? 'border-primary/40 bg-primary/5'
                    : 'border-danger/30 bg-danger/5',
                )}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-xs font-semibold text-vrd-text">
                    {req.id}
                  </span>
                  {editedIds.has(req.id) ? (
                    <Badge variant="info" className="text-[10px] py-0">
                      edited
                    </Badge>
                  ) : (
                    <Badge variant="danger" className="text-[10px] py-0">
                      needs edit
                    </Badge>
                  )}
                </div>
                <p
                  className={cn(
                    'text-xs leading-relaxed',
                    editedIds.has(req.id)
                      ? 'text-vrd-text'
                      : 'text-vrd-text',
                  )}
                >
                  {req.refined}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-vrd-text-dim mb-1.5">
            Why this is a conflict
          </p>
          <p className="text-xs text-vrd-text leading-relaxed">
            {conflict.description}
          </p>
        </div>

        {/* Resolution suggestion */}
        <div className="rounded-lg border border-warning/30 bg-warning/5 p-3">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-3.5 h-3.5 text-warning flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wide text-warning mb-1">
                Suggested resolution
              </p>
              <p className="text-xs text-vrd-text leading-relaxed">
                {conflict.resolution}
              </p>
            </div>
          </div>
        </div>

        {/* Resolution progress */}
        {!isResolved && !isDismissed && (
          <div className="rounded-lg border border-dashed border-vrd-border p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-vrd-text-dim mb-2">
              Resolution progress
            </p>
            <div className="space-y-1.5">
              {involvedRequirements.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center gap-2 text-xs"
                >
                  {editedIds.has(req.id) ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-success flex-shrink-0" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-vrd-border-light flex-shrink-0" />
                  )}
                  <span className="font-mono text-vrd-text-muted">{req.id}</span>
                  <span
                    className={cn(
                      editedIds.has(req.id) ? 'text-success' : 'text-vrd-text-muted',
                    )}
                  >
                    {editedIds.has(req.id) ? 'edited' : 'pending edit'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-vrd-border flex-shrink-0 space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-vrd-text-dim">
          Resolution actions
        </p>
        {involvedRequirements.map((req) => (
          <Button
            key={req.id}
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => onEditRequirement(req.id)}
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit {req.id}
            {editedIds.has(req.id) && (
              <CheckCircle2 className="w-3.5 h-3.5 text-success ml-auto" />
            )}
          </Button>
        ))}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          disabled={!bothEdited || isDismissed}
          onClick={() => onDismissConflict(conflict.conflict_id)}
          title={
            bothEdited
              ? 'Mark conflict as acknowledged'
              : 'Both requirements must be edited first'
          }
        >
          <XCircle className="w-3.5 h-3.5" />
          {isDismissed ? 'Dismissed' : 'Dismiss conflict'}
        </Button>
      </div>
    </aside>
  )
}
