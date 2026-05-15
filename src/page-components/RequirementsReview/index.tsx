'use client'

import { useMemo, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { ArrowLeft, CheckCircle2, AlertTriangle, ChevronRight, Download, History } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui'
import StatsRow from '@/components/requirements-review/StatsRow'
import RequirementsSidebar from '@/components/requirements-review/RequirementsSidebar'
import RequirementDetail from '@/components/requirements-review/RequirementDetail'
import DuplicateDetail from '@/components/requirements-review/DuplicateDetail'
import ConflictPanel from '@/components/requirements-review/ConflictPanel'
import { usePipelineStore } from '@/stores/pipelineStore'
import type { RefinementResult } from '@/types/requirements'

export default function RequirementsReviewPage() {
  const router = useRouter()
  const params = useParams() as { projectId?: string; conversationId?: string } | null
  const projectId = params?.projectId ?? ''
  const convId = params?.conversationId ?? ''

  const searchParams = useSearchParams()
  const roundParam = searchParams?.get('round') ?? null

  const { getPipeline, approveNLP } = usePipelineStore()
  const pipeline = getPipeline(convId)

  // If ?round=N is in the URL, serve data from that prior round (read-only view).
  const priorRound = roundParam
    ? pipeline.priorRounds.find((r) => r.round === Number(roundParam)) ?? null
    : null
  const isHistorical = priorRound !== null
  const data = isHistorical ? priorRound.nlpResult : pipeline.nlpResult

  const [selectedReqId, setSelectedReqId] = useState<string | null>(
    data?.testable[0]?.id ?? null,
  )
  const [selectedConflictId, setSelectedConflictId] = useState<string | null>(null)
  const [editedTexts, setEditedTexts] = useState<Record<string, string>>({})
  const [dismissedConflicts, setDismissedConflicts] = useState<Set<string>>(new Set())
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
  const totalScenarios = data?.testable?.reduce((sum, r) => sum + r.num_scenarios, 0) ?? 0
  const allReqs = useMemo(
    () => [...(data?.testable ?? []), ...(data?.incomplete ?? [])],
    [data?.testable, data?.incomplete],
  )

  const activeConflict = useMemo(() => {
    if (!data) return null
    if (selectedConflictId) {
      return data.conflicts.find((c) => c.conflict_id === selectedConflictId) ?? null
    }
    const req = data.testable.find((r) => r.id === selectedReqId)
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

  const selectedDuplicate = data.duplicates.find((d) => d.id === selectedReqId) ?? null

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

  const handleApproveContinue = () => {
    approveNLP(convId)
    router.push(`/project/${projectId}/conversation/${convId}`)
  }

  const handleDownloadReport = () => {
    const html = buildRequirementsReportHtml(data, editedTexts, resolvedConflictIds)
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `requirements-analysis-${(data.feature ?? 'report').replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.html`
    a.click()
    URL.revokeObjectURL(url)
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
        </nav>

        {isHistorical ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-vrd-card border border-vrd-border flex-shrink-0">
            <History className="w-3.5 h-3.5 text-vrd-text-muted" />
            <span className="text-xs font-medium text-vrd-text-muted">Round {roundParam} — read-only</span>
          </div>
        ) : (
          <StatusPill
            isReady={isReady}
            effectiveConflicts={effectiveConflicts}
            blockedBy={data.pipeline_status.blocked_by.filter(
              (cid) => !resolvedConflictIds.has(cid),
            )}
            onJumpToConflict={handleJumpToConflict}
          />
        )}

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={handleDownloadReport}>
            <Download className="w-3.5 h-3.5" />
            Download report
          </Button>

          {!isHistorical && (
            <>
              <span className="text-[11px] text-vrd-text-muted hidden lg:inline">
                {isReady
                  ? `Approving will queue ${totalScenarios} scenarios`
                  : `${effectiveConflicts} conflict(s) — approve anyway?`}
              </span>
              <Button
                variant={isReady ? 'primary' : 'outline'}
                onClick={handleApproveContinue}
                title={isReady
                  ? `Approving will queue ${totalScenarios} scenarios`
                  : `${effectiveConflicts} conflict(s) detected — click to approve anyway`}
                className={cn(isReady && 'animate-pulse-ring')}
              >
                <CheckCircle2 className="w-4 h-4" />
                {isReady ? 'Approve & continue' : 'Approve anyway'}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex-shrink-0 px-5 py-4 border-b border-vrd-border">
        <StatsRow summary={data.summary} effectiveConflicts={effectiveConflicts} />
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0">
        <RequirementsSidebar
          testable={data.testable}
          incomplete={data.incomplete}
          duplicates={data.duplicates}
          editedIds={editedIds}
          resolvedConflictIds={resolvedConflictIds}
          selectedReqId={selectedReqId}
          highlightedReqIds={highlightedReqIds}
          onSelectRequirement={handleSelectRequirement}
        />

        {selectedDuplicate ? (
          <DuplicateDetail
            dup={selectedDuplicate}
            onJumpToRequirement={handleSelectRequirement}
          />
        ) : selectedReq ? (
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
              .map((rid) => data.testable.find((r) => r.id === rid))
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

// ─── StatusPill ───────────────────────────────────────────────────────────────

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
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-warning/10 border border-warning/30 flex-shrink-0">
      <AlertTriangle className="w-3.5 h-3.5 text-warning" />
      <span className="text-xs font-medium text-warning">
        {effectiveConflicts}{' '}
        {effectiveConflicts === 1 ? 'conflict' : 'conflicts'} detected
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

// ─── Report generator ─────────────────────────────────────────────────────────

function buildRequirementsReportHtml(
  result: RefinementResult,
  editedTexts: Record<string, string>,
  resolvedConflictIds: Set<string>,
): string {
  const date = new Date().toLocaleDateString('en-GB', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
  const feature = result.feature ?? 'N/A'
  const sourceFile = result.source_file ?? 'N/A'

  const cell = (text: string, bold = false) =>
    `<td style="padding:8px 12px;border:1px solid #e2e8f0;${bold ? 'font-weight:600;' : ''}">${escHtml(text)}</td>`
  const th = (text: string) =>
    `<th style="padding:8px 12px;border:1px solid #e2e8f0;background:#f8fafc;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#64748b;">${escHtml(text)}</th>`

  const summaryRows = [
    ['Raw input', String(result.summary.total_raw)],
    ['Testable', String(result.summary.total_testable)],
    ['Incomplete', String(result.summary.total_incomplete)],
    ['Duplicates', String(result.summary.total_duplicates)],
    ['Conflicts', String(result.summary.total_conflicts)],
    ['Overlaps', String(result.summary.total_overlaps)],
  ].map(([k, v]) => `<tr>${cell(k, true)}${cell(v)}</tr>`).join('')

  const conflictRows = result.conflicts.map((c) => {
    const status = resolvedConflictIds.has(c.conflict_id) ? '✓ Resolved' : '⚠ Unresolved'
    return `
      <tr>
        <td style="padding:10px 12px;border:1px solid #e2e8f0;font-family:monospace;font-size:12px;">${escHtml(c.conflict_id)}</td>
        <td style="padding:10px 12px;border:1px solid #e2e8f0;font-family:monospace;font-size:12px;">${c.requirements.map(escHtml).join(', ')}</td>
        <td style="padding:10px 12px;border:1px solid #e2e8f0;font-size:13px;">${escHtml(c.description)}</td>
        <td style="padding:10px 12px;border:1px solid #e2e8f0;font-size:13px;">${escHtml(c.resolution ?? '—')}</td>
        <td style="padding:10px 12px;border:1px solid #e2e8f0;font-size:12px;white-space:nowrap;">${status}</td>
      </tr>`
  }).join('')

  const overlapPairs = new Set<string>()
  for (const req of result.testable) {
    for (const other of req.overlap_with) {
      overlapPairs.add([req.id, other].sort().join(' ↔ '))
    }
  }
  const overlapRows = [...overlapPairs].map((pair) =>
    `<tr><td style="padding:8px 12px;border:1px solid #e2e8f0;font-family:monospace;font-size:12px;">${escHtml(pair)}</td></tr>`
  ).join('')

  const testableRows = result.testable.map((req) => {
    const text = editedTexts[req.id] ?? req.original
    const flags = [
      req.conflict_flag ? '⚠ conflict' : '',
      req.overlap_with.length > 0 ? '~ overlap' : '',
    ].filter(Boolean).join(' ')
    return `
      <tr>
        <td style="padding:8px 12px;border:1px solid #e2e8f0;font-family:monospace;font-size:12px;white-space:nowrap;">${escHtml(req.id)}</td>
        <td style="padding:8px 12px;border:1px solid #e2e8f0;font-size:13px;">${escHtml(text)}</td>
        <td style="padding:8px 12px;border:1px solid #e2e8f0;font-size:12px;text-align:center;">${escHtml(req.complexity)}</td>
        <td style="padding:8px 12px;border:1px solid #e2e8f0;font-size:12px;text-align:center;">${req.num_scenarios}</td>
        <td style="padding:8px 12px;border:1px solid #e2e8f0;font-size:12px;color:#64748b;">${escHtml(flags)}</td>
      </tr>`
  }).join('')

  const incompleteRows = result.incomplete.map((req) =>
    `<tr>
      <td style="padding:8px 12px;border:1px solid #e2e8f0;font-family:monospace;font-size:12px;white-space:nowrap;">${escHtml(req.id)}</td>
      <td style="padding:8px 12px;border:1px solid #e2e8f0;font-size:13px;">${escHtml(req.original)}</td>
      <td style="padding:8px 12px;border:1px solid #e2e8f0;font-size:12px;color:#d97706;">${req.issues_found.map(escHtml).join(', ')}</td>
    </tr>`
  ).join('')

  const duplicateRows = result.duplicates.map((dup) =>
    `<tr>
      <td style="padding:8px 12px;border:1px solid #e2e8f0;font-family:monospace;font-size:12px;white-space:nowrap;">${escHtml(dup.id)}</td>
      <td style="padding:8px 12px;border:1px solid #e2e8f0;font-size:13px;">${escHtml(dup.original)}</td>
      <td style="padding:8px 12px;border:1px solid #e2e8f0;font-size:12px;">${escHtml(dup.reason)}</td>
      <td style="padding:8px 12px;border:1px solid #e2e8f0;font-family:monospace;font-size:12px;">${dup.duplicate_of ? escHtml(dup.duplicate_of) : '—'}</td>
    </tr>`
  ).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Requirements Analysis — ${escHtml(feature)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0f172a; margin: 0; padding: 32px 48px; background: #fff; font-size: 14px; line-height: 1.6; }
  h1 { font-size: 22px; font-weight: 700; margin: 0 0 4px; color: #0f172a; }
  h2 { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #64748b; margin: 32px 0 12px; padding-bottom: 6px; border-bottom: 2px solid #e2e8f0; }
  .meta { font-size: 12px; color: #64748b; margin-bottom: 4px; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600; margin-left: 8px; }
  .badge-danger { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
  .badge-success { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
  table { border-collapse: collapse; width: 100%; font-size: 13px; margin-bottom: 8px; }
  .summary-table { max-width: 340px; }
  .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; }
  @media print {
    body { padding: 20px 32px; font-size: 12px; }
    h2 { page-break-before: always; }
    h2:first-of-type { page-break-before: avoid; }
    table { page-break-inside: auto; }
    tr { page-break-inside: avoid; }
  }
</style>
</head>
<body>
  <h1>Requirements Analysis Report
    <span class="badge ${resolvedConflictIds.size >= result.summary.total_conflicts && result.summary.total_conflicts === 0 ? 'badge-success' : 'badge-danger'}">
      ${result.summary.total_conflicts === 0 ? 'No conflicts' : `${result.summary.total_conflicts} conflict${result.summary.total_conflicts !== 1 ? 's' : ''}`}
    </span>
  </h1>
  <p class="meta">Feature: <strong>${escHtml(feature)}</strong></p>
  <p class="meta">Source: ${escHtml(sourceFile)}</p>
  <p class="meta">Generated: ${date} · Refining ID: <code>${escHtml(result.refining_id)}</code></p>
  <p class="meta">Generated by <strong>Veridian</strong> — ADAS Validation Platform</p>

  <h2>Summary</h2>
  <table class="summary-table">
    <tbody>${summaryRows}</tbody>
  </table>

  ${result.conflicts.length > 0 ? `
  <h2>Conflicts</h2>
  <table>
    <thead><tr>${th('ID')}${th('Requirements')}${th('Description')}${th('Resolution')}${th('Status')}</tr></thead>
    <tbody>${conflictRows}</tbody>
  </table>` : ''}

  ${overlapPairs.size > 0 ? `
  <h2>Overlaps</h2>
  <table>
    <thead><tr>${th('Overlapping pair')}</tr></thead>
    <tbody>${overlapRows}</tbody>
  </table>` : ''}

  ${result.testable.length > 0 ? `
  <h2>Testable Requirements (${result.testable.length})</h2>
  <table>
    <thead><tr>${th('ID')}${th('Requirement')}${th('Complexity')}${th('Scenarios')}${th('Flags')}</tr></thead>
    <tbody>${testableRows}</tbody>
  </table>` : ''}

  ${result.incomplete.length > 0 ? `
  <h2>Incomplete Requirements (${result.incomplete.length})</h2>
  <table>
    <thead><tr>${th('ID')}${th('Requirement')}${th('Issues found')}</tr></thead>
    <tbody>${incompleteRows}</tbody>
  </table>` : ''}

  ${result.duplicates.length > 0 ? `
  <h2>Duplicates (${result.duplicates.length})</h2>
  <table>
    <thead><tr>${th('ID')}${th('Requirement')}${th('Reason')}${th('Duplicate of')}</tr></thead>
    <tbody>${duplicateRows}</tbody>
  </table>` : ''}

  <div class="footer">This report was generated automatically by Veridian · ADAS Validation Platform · ${date}</div>
</body>
</html>`
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
