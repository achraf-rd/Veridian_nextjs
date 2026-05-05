'use client'

import { useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Bot } from 'lucide-react'
import { usePipelineStore } from '@/stores/pipelineStore'
import { useProjectStore } from '@/stores/projectStore'
import Composer from '@/components/composer'
import NLPCard from '@/components/pipeline/NLPCard'
import ScenarioCard from '@/components/pipeline/ScenarioCard'
import ExecutionCard from '@/components/pipeline/ExecutionCard'
import ReportCard from '@/components/pipeline/ReportCard'
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

function PriorRound({ round }: { round: PipelineRound }) {
  return (
    <div className="space-y-4 opacity-75">
      <EngineerBubble input={round.engineerInput} />
      <NLPCard state="approved" result={round.nlpResult} />
      <ScenarioCard state="approved" result={round.scenarioResult} />
      <ExecutionCard state="approved" result={round.executionResult} />
      <ReportCard state="approved" result={round.reportResult} />
    </div>
  )
}

export default function ThreadPage() {
  const params = useParams() as { conversationId?: string } | null
  const convId = params?.conversationId ?? ''
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
              <PriorRound round={round} />
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
