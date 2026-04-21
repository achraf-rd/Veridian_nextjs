'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ChevronDown, ChevronUp, CheckCircle2, Loader2, AlertTriangle, GitMerge } from 'lucide-react'
import { usePipelineStore } from '@/stores/pipelineStore'
import { Badge, Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { CardState, NLPResult } from '@/types/pipeline'

interface Props {
  state: CardState
  result: NLPResult | null
}

export default function NLPCard({ state, result }: Props) {
  const [expanded, setExpanded] = useState(false)
  const params = useParams() as { projectId?: string; conversationId?: string } | null
  const convId = params?.conversationId ?? ''
  const projectId = params?.projectId ?? ''
  const { approveNLP } = usePipelineStore()

  const isProcessing = state === 'processing'
  const isAwaiting = state === 'awaiting'
  const isApproved = state === 'approved'

  return (
    <div
      className={cn(
        'rounded-xl border transition-all duration-300 animate-fade-up',
        isProcessing && 'border-primary/30 bg-vrd-card animate-pulse-ring',
        isAwaiting && 'border-warning/30 bg-vrd-card',
        isApproved && 'border-success/20 bg-vrd-card',
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3 px-4 py-3">
        <div className="mt-0.5">
          {isProcessing && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
          {isAwaiting && <AlertTriangle className="w-4 h-4 text-warning" />}
          {isApproved && <CheckCircle2 className="w-4 h-4 text-success" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-mono font-medium text-vrd-text-muted uppercase tracking-wider">NLP Interpreter</span>
            {isApproved && <Badge variant="success">Approved</Badge>}
            {isAwaiting && <Badge variant="warning">Awaiting approval</Badge>}
          </div>
          <p className="text-sm text-vrd-text">
            {isProcessing && (
              <span className="text-vrd-text-muted">Extracting parameters from requirements…</span>
            )}
            {(isAwaiting || isApproved) && result && (
              <>
                NLP complete —{' '}
                <span className="font-medium">{result.total} requirements</span> processed,{' '}
                {result.conflicts > 0 && (
                  <span className="text-danger font-medium">{result.conflicts} conflicts</span>
                )}
                {result.conflicts > 0 && result.overlaps > 0 && ' detected, '}
                {result.overlaps > 0 && (
                  <span className="text-warning font-medium">{result.overlaps} overlaps</span>
                )}
                {result.overlaps > 0 && ' flagged.'}
              </>
            )}
          </p>
        </div>

        {(isAwaiting || isApproved) && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-vrd-text-muted hover:text-vrd-text transition-colors flex-shrink-0"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Expanded body */}
      {expanded && result && (
        <div className="border-t border-vrd-border px-4 py-3 space-y-2">
          <div className="max-h-48 overflow-y-auto space-y-1.5">
            {result.requirements.map((req) => (
              <div
                key={req.id}
                className={cn(
                  'flex items-start gap-2 px-3 py-2 rounded-lg text-xs',
                  req.conflict && 'bg-danger/5 border border-danger/20',
                  req.overlap && !req.conflict && 'bg-warning/5 border border-warning/20',
                  !req.conflict && !req.overlap && 'bg-vrd-card-hover',
                )}
              >
                <span className="font-mono text-vrd-text-dim mt-0.5">{req.id}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-vrd-text leading-relaxed">{req.text}</p>
                  <p className="text-vrd-text-dim mt-0.5">Pass: {req.passCriteria}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {req.conflict && <Badge variant="danger"><AlertTriangle className="w-2.5 h-2.5" /> Conflict</Badge>}
                  {req.overlap && <Badge variant="warning"><GitMerge className="w-2.5 h-2.5" /> Overlap</Badge>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {(isAwaiting || isApproved) && (
        <div className="flex items-center gap-2 px-4 py-3 border-t border-vrd-border">
          <Link
            href={`/project/${projectId}/conversation/${convId}/requirements`}
            className="text-xs text-primary-light hover:underline"
          >
            Review batch →
          </Link>
          {isAwaiting && (
            <Button
              size="sm"
              onClick={() => approveNLP(convId)}
              className="ml-auto animate-pulse-amber"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Approve &amp; continue
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
