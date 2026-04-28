'use client'

import { useMemo, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, CheckCircle2, AlertTriangle, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui'
import StatsRow from '@/components/requirements-review/StatsRow'
import RequirementsSidebar from '@/components/requirements-review/RequirementsSidebar'
import RequirementDetail from '@/components/requirements-review/RequirementDetail'
import ConflictPanel from '@/components/requirements-review/ConflictPanel'
import { usePipelineStore } from '@/stores/pipelineStore'

export default function RequirementsReviewPage() {
  const router = useRouter()
  const params = useParams() as { projectId?: string; conversationId?: string } | null
  const projectId = params?.projectId ?? ''
  const convId = params?.conversationId ?? ''

  const { getPipeline } = usePipelineStore()
  const data = getPipeline(convId).nlpResult

  const [selectedReqId, setSelectedReqId] = useState<string | null>(
    data?.requirements[0]?.id ?? null,
  )
  const [selectedConflictId, setSelectedConflictId] = useState<string | null>(null)
  const [editedTexts, setEditedTexts] = useState<Record<string, string>>({})
  const [dismissedConflicts, setDismissedConflicts] = useState<Set<string>>(new Set())
  const [restoredIds, setRestoredIds] = useState<Set<string>>(new Set())
  const [pendingEditFocus, setPendingEditFocus] = useState<string | null>(null)

  const editedIds = useMemo(() => new Set(Object.keys(editedTexts)), [editedTexts])

  const resolvedConflictIds = useMemo(() => {
    const resolved = new Set<string>()
    for (const c of (data?.conflicts ?? [])) {
      const allEdited = c.requirements.every((rid) => editedIds.has(rid))
      if (allEdited || dismissedConflicts.has(c.conflict_id)) {
        resolved.add(c.conflict_id)
      }
    }
    return resolved
  }, [data?.conflicts, editedIds, dismissedConflicts])

  const effectiveConflicts = (data?.summary.total_conflicts ?? 0) - resolvedConflictIds.size
  const isReady = effectiveConflicts === 0
  const totalScenarios = data?.requirements.reduce((sum, r) => sum + r.num_scenarios, 0) ?? 0
  const allReqs = useMemo(
    () => [...(data?.requirements ?? []), ...(data?.incomplete ?? [])],
    [data?.requirements, data?.incomplete],
  )

  const activeConflict = useMemo(() => {
    if (!data) return null
    if (selectedConflictId) {
      return data.conflicts.find((c) => c.conflict_id === selectedConflictId) ?? null
    }
    const req = data.requirements.find((r) => r.id === selectedReqId)
    if (req?.conflict_id) {
      return data.conflicts.find((c) => c.conflict_id === req.conflict_id) ?? null
    }
    return null
  }, [data, selectedReqId, selectedConflictId])

  const highlightedReqIds = useMemo(() => {
    if (!activeConflict) return new Set<string>()
    return new Set(activeConflict.requirements)
  }, [activeConflict])

  const selectedReq = allReqs.find((r) => r.id === selectedReqId) ?? null

  if (!data) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-vrd-text-muted">
        No requirements data yet — submit and process a batch first.
      </div>
    )
  }

  const handleSelectRequirement = (id: string) => {
    setSelectedReqId(id)
    setSelectedConflictId(null)
    setPendingEditFocus(null)
  }

  const handleJumpToConflict = (conflictId: string) => {
    const conflict = data.conflicts.find((c) => c.conflict_id === conflictId)
    if (!conflict) return
    setSelectedConflictId(conflictId)
    const firstReqId = conflict.requirements[0]
    if (firstReqId) setSelectedReqId(firstReqId)
  }

  const handleEditRequirementFromConflict = (reqId: string) => {
    setSelectedReqId(reqId)
    setPendingEditFocus(reqId)
  }

  const handleSaveEdit = (reqId: string, newText: string) => {
    setEditedTexts((prev) => ({ ...prev, [reqId]: newText }))
    setPendingEditFocus(null)
  }

  const handleDismissConflict = (conflictId: string) => {
    setDismissedConflicts((prev) => {
      const next = new Set(prev)
      next.add(conflictId)
      return next
    })
  }

  const handleRestore = (removedId: string) => {
    setRestoredIds((prev) => {
      const next = new Set(prev)
      next.add(removedId)
      return next
    })
  }

  const handleApproveContinue = () => {
    if (!isReady) return
    router.push(`/project/${projectId}/conversation/${convId}`)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-vrd-bg">
      <div className="flex-shrink-0 border-b border-vrd-border bg-vrd-card px-5 py-3 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs text-vrd-text-muted hover:text-vrd-text transition-colors flex-shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to thread
        </button>

        <nav className="flex items-center gap-1.5 text-xs text-vrd-text-muted min-w-0 flex-1">
          {data.feature && (
            <>
              <span className="hover:text-vrd-text transition-colors cursor-pointer truncate">
                {data.feature}
              </span>
              <ChevronRight className="w-3 h-3 flex-shrink-0" />
            </>
          )}
          <span className="hover:text-vrd-text transition-colors cursor-pointer truncate">
            {data.source_file ?? 'input'} — {data.summary.total_raw} reqs
          </span>
          <ChevronRight className="w-3 h-3 flex-shrink-0" />
          <span className="text-vrd-text flex-shrink-0">Review</span>
          <span className="ml-auto font-mono text-[11px] text-vrd-text-dim hidden md:inline flex-shrink-0">
            refining_id: {data.refining_id}
          </span>
        </nav>

        <StatusPill
          isReady={isReady}
          effectiveConflicts={effectiveConflicts}
          blockedBy={data.pipeline_status.blocked_by.filter(
            (cid) => !resolvedConflictIds.has(cid),
          )}
          onJumpToConflict={handleJumpToConflict}
        />

        <div className="flex items-center gap-3 flex-shrink-0">
          {isReady && (
            <span className="text-[11px] text-vrd-text-muted hidden lg:inline">
              Approving will queue {totalScenarios} scenarios
            </span>
          )}
          <Button
            onClick={handleApproveContinue}
            disabled={!isReady}
            title={
              !isReady
                ? data.pipeline_status.reason ?? 'Conflicts must be resolved before continuing'
                : `Approving will queue ${totalScenarios} scenarios`
            }
            className={cn(isReady && 'animate-pulse-ring')}
          >
            <CheckCircle2 className="w-4 h-4" />
            Approve &amp; continue
          </Button>
        </div>
      </div>

      <div className="flex-shrink-0 px-5 py-4 border-b border-vrd-border">
        <StatsRow summary={data.summary} effectiveConflicts={effectiveConflicts} />
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0">
        <RequirementsSidebar
          requirements={data.requirements}
          incomplete={data.incomplete}
          removed={data.removed}
          restoredIds={restoredIds}
          editedIds={editedIds}
          resolvedConflictIds={resolvedConflictIds}
          selectedReqId={selectedReqId}
          highlightedReqIds={highlightedReqIds}
          onSelectRequirement={handleSelectRequirement}
          onRestore={handleRestore}
        />

        {selectedReq ? (
          <RequirementDetail
            req={selectedReq}
            editedText={editedTexts[selectedReq.id] ?? null}
            conflict={
              selectedReq.status === 'valid' && selectedReq.conflict_id
                ? data.conflicts.find(
                    (c) => c.conflict_id === selectedReq.conflict_id,
                  ) ?? null
                : null
            }
            isResolved={
              selectedReq.status === 'valid' && selectedReq.conflict_id
                ? resolvedConflictIds.has(selectedReq.conflict_id)
                : false
            }
            autoFocusEdit={pendingEditFocus === selectedReq.id}
            onSaveEdit={handleSaveEdit}
            onJumpToConflict={handleJumpToConflict}
            onJumpToRequirement={handleSelectRequirement}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-vrd-text-muted">
            Select a requirement to review
          </div>
        )}

        {activeConflict && (
          <ConflictPanel
            conflict={activeConflict}
            involvedRequirements={activeConflict.requirements
              .map((rid) => data.requirements.find((r) => r.id === rid))
              .filter((r): r is NonNullable<typeof r> => r !== undefined)}
            editedIds={editedIds}
            isResolved={resolvedConflictIds.has(activeConflict.conflict_id)}
            isDismissed={dismissedConflicts.has(activeConflict.conflict_id)}
            onEditRequirement={handleEditRequirementFromConflict}
            onDismissConflict={handleDismissConflict}
          />
        )}
      </div>
    </div>
  )
}

function StatusPill({
  isReady,
  effectiveConflicts,
  blockedBy,
  onJumpToConflict,
}: {
  isReady: boolean
  effectiveConflicts: number
  blockedBy: string[]
  onJumpToConflict: (conflictId: string) => void
}) {
  if (isReady) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 border border-success/30 flex-shrink-0">
        <CheckCircle2 className="w-3.5 h-3.5 text-success" />
        <span className="text-xs font-medium text-success">Ready to proceed</span>
      </div>
    )
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-danger/10 border border-danger/30 flex-shrink-0">
      <AlertTriangle className="w-3.5 h-3.5 text-danger" />
      <span className="text-xs font-medium text-danger">
        Blocked — {effectiveConflicts}{' '}
        {effectiveConflicts === 1 ? 'conflict' : 'conflicts'}
      </span>
      {blockedBy.length > 0 && (
        <div className="flex items-center gap-1 border-l border-danger/30 pl-2">
          {blockedBy.map((cid) => (
            <button
              key={cid}
              onClick={() => onJumpToConflict(cid)}
              className="font-mono text-[10px] text-danger hover:underline"
            >
              {cid}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
