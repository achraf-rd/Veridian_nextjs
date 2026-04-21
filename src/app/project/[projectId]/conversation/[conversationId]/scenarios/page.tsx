'use client'

import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, FileCode, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { usePipelineStore } from '@/stores/pipelineStore'
import { Badge, Button } from '@/components/ui'
import { cn } from '@/lib/utils'

export default function ScenariosPage() {
  const params = useParams() as { projectId?: string; conversationId?: string } | null
  const router = useRouter()
  const convId = params?.conversationId ?? ''
  const projectId = params?.projectId ?? ''
  const { getPipeline, approveScenario } = usePipelineStore()
  const pipeline = getPipeline(convId)
  const result = pipeline.scenarioResult

  const handleApprove = () => {
    approveScenario(convId)
    router.push(`/project/${projectId}/conversation/${convId}`)
  }

  return (
    <div className="h-full overflow-y-auto px-6 py-6">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-vrd-text-muted hover:text-vrd-text transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to thread
        </button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold text-vrd-text">Scenario Review</h1>
            {result && (
              <p className="text-sm text-vrd-text-muted mt-0.5">
                {result.total} scenarios generated · {result.warnings} ASAM warnings
              </p>
            )}
          </div>
          {pipeline.scenario === 'awaiting' && (
            <Button onClick={handleApprove} className="animate-pulse-amber">
              <CheckCircle2 className="w-4 h-4" />
              Approve all &amp; execute
            </Button>
          )}
        </div>

        {!result ? (
          <p className="text-sm text-vrd-text-muted">Scenario generation not yet complete.</p>
        ) : (
          <div className="space-y-2">
            {result.scenarios.map((s) => (
              <div
                key={s.id}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl border text-sm',
                  s.warnings.length > 0 ? 'border-warning/30 bg-warning/5' : 'border-vrd-border bg-vrd-card',
                )}
              >
                <FileCode className="w-4 h-4 text-vrd-text-muted flex-shrink-0" />
                <span className="font-mono text-vrd-text flex-1">{s.filename}</span>
                <Badge variant={s.type === 'xosc' ? 'info' : 'default'}>{s.type.toUpperCase()}</Badge>
                {s.warnings.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-warning">
                    <AlertTriangle className="w-3 h-3" />
                    <span>{s.warnings[0]}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
