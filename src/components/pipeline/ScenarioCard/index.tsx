'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ChevronDown, ChevronUp, CheckCircle2, Loader2, AlertTriangle, FileCode } from 'lucide-react'
import { usePipelineStore } from '@/stores/pipelineStore'
import { Badge, Button } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { CardState, ScenarioResult } from '@/types/pipeline'

interface Props {
  state: CardState
  result: ScenarioResult | null
}

export default function ScenarioCard({ state, result }: Props) {
  const [expanded, setExpanded] = useState(false)
  const params = useParams() as { projectId?: string; conversationId?: string } | null
  const convId = params?.conversationId ?? ''
  const projectId = params?.projectId ?? ''
  const { approveScenario } = usePipelineStore()

  const isProcessing = state === 'processing'
  const isAwaiting = state === 'awaiting'
  const isApproved = state === 'approved'
  const isIdle = state === 'idle'

  if (isIdle) return null

  return (
    <div
      className={cn(
        'rounded-xl border transition-all duration-300 animate-fade-up',
        isProcessing && 'border-primary/30 bg-vrd-card animate-pulse-ring',
        isAwaiting && 'border-warning/30 bg-vrd-card',
        isApproved && 'border-success/20 bg-vrd-card',
      )}
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <div className="mt-0.5">
          {isProcessing && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
          {isAwaiting && <AlertTriangle className="w-4 h-4 text-warning" />}
          {isApproved && <CheckCircle2 className="w-4 h-4 text-success" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs font-mono font-medium text-vrd-text-muted uppercase tracking-wider">Scenario Generator</span>
            {isApproved && <Badge variant="success">Approved</Badge>}
            {isAwaiting && <Badge variant="warning">Awaiting approval</Badge>}
          </div>
          <p className="text-sm text-vrd-text">
            {isProcessing && <span className="text-vrd-text-muted">Generating OpenSCENARIO files…</span>}
            {(isAwaiting || isApproved) && result && (
              <>
                Scenario generation complete —{' '}
                <span className="font-medium">{result.total} scenarios</span> generated
                {result.warnings > 0 && (
                  <>, <span className="text-warning font-medium">{result.warnings} ASAM warnings</span></>
                )}.
              </>
            )}
          </p>
        </div>

        {(isAwaiting || isApproved) && (
          <button onClick={() => setExpanded((v) => !v)} className="text-vrd-text-muted hover:text-vrd-text transition-colors flex-shrink-0">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      {expanded && result && (
        <div className="border-t border-vrd-border px-4 py-3">
          <div className="max-h-48 overflow-y-auto space-y-1.5">
            {result.scenarios.map((s) => (
              <div
                key={s.id}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-xs',
                  s.warnings.length > 0 ? 'bg-warning/5 border border-warning/20' : 'bg-vrd-card-hover',
                )}
              >
                <FileCode className="w-3.5 h-3.5 text-vrd-text-muted flex-shrink-0" />
                <span className="font-mono text-vrd-text flex-1">{s.filename}</span>
                <Badge variant={s.type === 'xosc' ? 'info' : 'default'}>{s.type}</Badge>
                {s.warnings.length > 0 && <Badge variant="warning"><AlertTriangle className="w-2.5 h-2.5" /> {s.warnings.length}</Badge>}
              </div>
            ))}
          </div>
        </div>
      )}

      {(isAwaiting || isApproved) && (
        <div className="flex items-center gap-2 px-4 py-3 border-t border-vrd-border">
          <Link href={`/project/${projectId}/conversation/${convId}/scenarios`} className="text-xs text-primary-light hover:underline">
            Review scenarios →
          </Link>
          {isAwaiting && (
            <Button size="sm" onClick={() => approveScenario(convId)} className="ml-auto animate-pulse-amber">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Approve &amp; execute
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
