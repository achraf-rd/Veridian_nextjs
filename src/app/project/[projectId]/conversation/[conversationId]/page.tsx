'use client'

import { useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Bot, CheckCircle2, Circle, FileSearch } from 'lucide-react'
import { usePipelineStore } from '@/stores/pipelineStore'
import { useProjectStore } from '@/stores/projectStore'
import Composer from '@/components/composer'
import NLPCard from '@/components/pipeline/NLPCard'
import ScenarioCard from '@/components/pipeline/ScenarioCard'
import ExecutionCard from '@/components/pipeline/ExecutionCard'
import ReportCard from '@/components/pipeline/ReportCard'
import { cn } from '@/lib/utils'
import type { PipelineRound } from '@/types/pipeline'

function RoundDivider({ round, completedAt }: { round: number; completedAt: string }) {
  const time = new Date(completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 h-px bg-vrd-border" />
      <span className="text-[10px] font-medium text-vrd-text-dim px-2 flex-shrink-0">
        Round {round + 1} · {time}
      </span>
      <div className="flex-1 h-px bg-vrd-border" />
    </div>
  )
}

function AgentMessage({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2.5 animate-fade-up">
      <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Bot className="w-3.5 h-3.5 text-primary-light" />
      </div>
      <div className="bg-vrd-card border border-vrd-border rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-md">
        <p className="text-sm text-vrd-text-muted italic">{message}</p>
      </div>
    </div>
  )
}

function EngineerBubble({ input }: { input: string }) {
  return (
    <div className="flex justify-end animate-fade-up">
      <div className="bg-primary/10 border border-primary/20 rounded-2xl rounded-tr-sm px-4 py-3 max-w-md">
        <p className="text-sm text-vrd-text font-mono">{input}</p>
      </div>
    </div>
  )
}

function PriorRound({
  round,
  projectId,
  convId,
}: {
  round: PipelineRound
  projectId: string
  convId: string
}) {
  const nlp = round.nlpResult
  const testable = nlp?.summary.total_testable ?? 0
  const incomplete = nlp?.summary.total_incomplete ?? 0
  const conflicts = nlp?.summary.total_conflicts ?? 0
  const scenarios = nlp?.testable.reduce((s, r) => s + r.num_scenarios, 0) ?? 0
  const verdict = round.reportResult?.verdict

  const stages: { label: string; done: boolean }[] = [
    { label: 'NLP',       done: !!round.nlpResult },
    { label: 'Scenarios', done: !!round.scenarioResult },
    { label: 'Execution', done: !!round.executionResult },
    { label: 'Report',    done: !!round.reportResult },
  ]

  return (
    <div className="space-y-3 opacity-70">
      <EngineerBubble input={round.engineerInput} />

      <div className="rounded-xl border border-vrd-border bg-vrd-card/40 overflow-hidden">
        {/* Stage mini-stepper */}
        <div className="flex divide-x divide-vrd-border">
          {stages.map((s) => (
            <div key={s.label} className="flex-1 flex items-center justify-center gap-1.5 py-2">
              {s.done
                ? <CheckCircle2 className="w-3 h-3 text-success flex-shrink-0" />
                : <Circle className="w-3 h-3 text-vrd-border flex-shrink-0" />}
              <span className={cn('text-[11px]', s.done ? 'text-vrd-text-muted' : 'text-vrd-text-dim')}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Metrics strip + link */}
        <div className="flex items-center gap-3 px-4 py-2 border-t border-vrd-border text-[11px] text-vrd-text-muted font-mono flex-wrap">
          <span className="text-vrd-text-dim">round {round.round}</span>
          {testable > 0 && (
            <span><span className="text-success font-medium">{testable}</span> testable</span>
          )}
          {incomplete > 0 && (
            <span><span className="text-warning font-medium">{incomplete}</span> incomplete</span>
          )}
          {conflicts > 0 && (
            <span><span className="text-danger font-medium">{conflicts}</span> conflicts</span>
          )}
          {scenarios > 0 && (
            <span><span className="font-medium text-vrd-text">{scenarios}</span> scenarios</span>
          )}
          {verdict && (
            <span className={cn('font-semibold', verdict === 'pass' ? 'text-success' : 'text-danger')}>
              {verdict === 'pass' ? '✓ Pass' : '✗ Fail'}
            </span>
          )}

          {nlp && (
            <Link
              href={`/project/${projectId}/conversation/${convId}/requirements?round=${round.round}`}
              className="ml-auto flex items-center gap-1 text-vrd-text-muted hover:text-primary-light transition-colors font-sans"
            >
              <FileSearch className="w-3 h-3" />
              Requirements
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ThreadPage() {
  const params = useParams() as { projectId?: string; conversationId?: string } | null
  const convId = params?.conversationId ?? ''
  const projectId = params?.projectId ?? ''
  const { getPipeline, hasHydrated, hydrate } = usePipelineStore()
  const { conversations, renameConversation } = useProjectStore()
  const renamedRef = useRef(false)

  useEffect(() => {
    if (convId) hydrate(convId)
  }, [convId, hydrate])

  const pipeline = getPipeline(convId)

  // Auto-name the conversation from the first requirement when NLP starts (once per conv)
  useEffect(() => {
    if (
      pipeline.nlp === 'processing' &&
      pipeline.round === 1 &&
      pipeline.engineerInput &&
      !renamedRef.current
    ) {
      renamedRef.current = true
      const conv = conversations[convId]
      const currentTitle = conv?.title ?? ''
      const autoTitle = pipeline.engineerInput.split('\n')[0]?.slice(0, 60) ?? ''
      if (autoTitle && (currentTitle === 'New conversation' || currentTitle === autoTitle)) {
        renameConversation(convId, autoTitle)
      }
    }
  }, [pipeline.nlp, pipeline.round]) // eslint-disable-line react-hooks/exhaustive-deps

  // Until localStorage has been read on the client, render the SSR-matching
  // empty-stage shell so hydration doesn't diverge.
  if (!hasHydrated || pipeline.stage === 0) {
    return (
      <div className="flex h-full items-center justify-center px-4">
        <Composer conversationId={convId} centered />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-2xl mx-auto space-y-4">

          {/* Prior completed rounds */}
          {pipeline.priorRounds.map((round) => (
            <div key={round.round}>
              <PriorRound round={round} projectId={projectId} convId={convId} />
              <RoundDivider round={round.round} completedAt={round.completedAt} />
            </div>
          ))}

          {/* Active round — agent message (refactor only) */}
          {pipeline.agentMessage && (
            <AgentMessage message={pipeline.agentMessage} />
          )}

          {/* Active round — engineer input */}
          {pipeline.engineerInput && (
            <EngineerBubble input={pipeline.engineerInput} />
          )}

          {/* Active round — pipeline cards from entryStage onward */}
          {pipeline.entryStage <= 1 && (
            <NLPCard state={pipeline.nlp} result={pipeline.nlpResult} />
          )}
          <ScenarioCard state={pipeline.scenario} result={pipeline.scenarioResult} />
          <ExecutionCard state={pipeline.execution} result={pipeline.executionResult} />
          <ReportCard state={pipeline.report} result={pipeline.reportResult} />

        </div>
      </div>

      <div className="flex-shrink-0 border-t border-vrd-border bg-vrd-bg px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <Composer conversationId={convId} />
        </div>
      </div>
    </div>
  )
}
