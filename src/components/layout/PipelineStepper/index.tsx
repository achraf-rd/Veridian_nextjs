'use client'

import { useParams } from 'next/navigation'
import { Check, Loader2 } from 'lucide-react'
import { usePipelineStore } from '@/stores/pipelineStore'
import { cn } from '@/lib/utils'

const STAGES = [
  { key: 'nlp',       label: 'NLP',       step: 1 },
  { key: 'scenario',  label: 'Scenarios',  step: 2 },
  { key: 'execution', label: 'Execution',  step: 3 },
  { key: 'report',    label: 'Report',     step: 4 },
] as const

export default function PipelineStepper() {
  const params = useParams() as { conversationId?: string } | null
  const convId = params?.conversationId ?? ''
  const { getPipeline } = usePipelineStore()
  const pipeline = getPipeline(convId)

  return (
    <div className="flex items-center justify-center gap-0 px-6 py-3 border-b border-vrd-border bg-vrd-sidebar flex-shrink-0">
      {STAGES.map((s, i) => {
        const state = pipeline[s.key]
        const isApproved = state === 'approved'
        const isActive = state === 'processing' || state === 'awaiting'
        const isWaiting = state === 'idle'

        return (
          <div key={s.key} className="flex items-center">
            {/* Step circle */}
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300',
                  isApproved && 'bg-success',
                  isActive && 'bg-primary animate-pulse-ring',
                  isWaiting && 'border-2 border-vrd-border',
                )}
              >
                {isApproved && <Check className="w-3.5 h-3.5 text-white" />}
                {state === 'processing' && <Loader2 className="w-3 h-3 text-white animate-spin" />}
                {state === 'awaiting' && <span className="w-2 h-2 rounded-full bg-white" />}
              </div>
              <span
                className={cn(
                  'text-[10px] font-medium whitespace-nowrap',
                  isApproved && 'text-success',
                  isActive && 'text-primary-light',
                  isWaiting && 'text-vrd-text-dim',
                )}
              >
                {s.label}
              </span>
            </div>

            {/* Connector */}
            {i < STAGES.length - 1 && (
              <div className="w-16 h-px mx-1 mb-4 bg-vrd-border relative overflow-hidden">
                {isApproved && (
                  <div className="absolute inset-0 bg-success animate-fill-line" />
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
