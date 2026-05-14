'use client'

import { useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2, FlaskConical } from 'lucide-react'
import { usePipelineStore } from '@/stores/pipelineStore'
import { Badge, Button } from '@/components/ui'
import { useScenariosFilter } from '@/hooks/useScenariosFilter'
import FilterBar from './FilterBar'
import RequirementsCoverage from './RequirementsCoverage'
import ScenarioListItem from './ScenarioListItem'

export default function ScenarioReviewPage() {
  const params = useParams() as { projectId?: string; conversationId?: string } | null
  const convId = params?.conversationId ?? ''
  const projectId = params?.projectId ?? ''
  const router = useRouter()
  const { getPipeline, approveScenario } = usePipelineStore()

  const pipeline = getPipeline(convId)
  const result = pipeline.scenarioResult
  const testCases = result?.testCases ?? []

  const isAwaiting = pipeline.scenario === 'awaiting'
  const isApproved = pipeline.scenario === 'approved'

  const [viewedScenarioIds, setViewedScenarioIds] = useState<Set<string>>(new Set())

  function handleViewed(id: string) {
    setViewedScenarioIds((prev) => {
      if (prev.has(id)) return prev
      return new Set([...prev, id])
    })
  }

  const { filtered, filters, setComplexity, setTestPhase, toggleTag, resetFilters } =
    useScenariosFilter(testCases)

  const reqCount = useMemo(() => {
    const s = new Set<string>()
    for (const tc of testCases) for (const r of tc.covers_requirements) s.add(r)
    return s.size
  }, [testCases])

  const canApprove = viewedScenarioIds.size > 0

  function handleApprove() {
    approveScenario(convId)
    router.push(`/project/${projectId}/conversation/${convId}`)
  }

  return (
    <div className="flex flex-col h-full bg-vrd-bg">
      {/* Top bar */}
      <div className="flex-shrink-0 border-b border-vrd-border bg-vrd-card px-6 py-3 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-vrd-text-muted hover:text-vrd-text transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <FlaskConical className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="text-sm font-semibold text-vrd-text truncate">Scenario Review</span>
          <span className="text-vrd-text-dim text-xs">/</span>
          <span className="text-xs text-vrd-text-muted font-mono">
            {testCases.length} scenarios · {reqCount} requirements
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {isApproved && <Badge variant="success">Approved</Badge>}
          {isAwaiting && <Badge variant="warning">Awaiting approval</Badge>}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left sidebar: filters + coverage */}
        <aside className="w-64 flex-shrink-0 border-r border-vrd-border bg-vrd-card overflow-y-auto px-4 py-5 space-y-6">
          <FilterBar
            scenarios={testCases}
            filters={filters}
            onComplexity={setComplexity}
            onTestPhase={setTestPhase}
            onToggleTag={toggleTag}
            onReset={resetFilters}
          />
          <RequirementsCoverage scenarios={testCases} />
        </aside>

        {/* Main: scenario list */}
        <main className="flex-1 overflow-y-auto px-6 py-5">
          {testCases.length === 0 ? (
            <div className="flex items-center justify-center h-full text-vrd-text-muted text-sm">
              No scenarios available.
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-3">
              {filtered.length === 0 ? (
                <div className="text-center py-10 text-vrd-text-muted text-sm">
                  No scenarios match the current filters.
                </div>
              ) : (
                filtered.map((tc) => (
                  <ScenarioListItem key={tc.scenario_id} tc={tc} onViewed={handleViewed} />
                ))
              )}
            </div>
          )}
        </main>
      </div>

      {/* Bottom bar: gate action */}
      {(isAwaiting || isApproved) && (
        <div className="flex-shrink-0 border-t border-vrd-border bg-vrd-card px-6 py-3 flex items-center justify-between gap-4">
          <p className="text-xs text-vrd-text-muted">
            {isApproved
              ? 'Scenarios approved — execution is running.'
              : canApprove
              ? `${viewedScenarioIds.size} of ${testCases.length} scenario${viewedScenarioIds.size > 1 ? 's' : ''} reviewed.`
              : 'Open at least one scenario to enable approval.'}
          </p>

          {isAwaiting && (
            <Button size="sm" onClick={handleApprove} disabled={!canApprove}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              Approve &amp; execute
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
