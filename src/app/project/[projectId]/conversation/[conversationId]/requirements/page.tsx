'use client'

import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, AlertTriangle, GitMerge, CheckCircle2 } from 'lucide-react'
import { usePipelineStore } from '@/stores/pipelineStore'
import { Badge, Button } from '@/components/ui'
import { cn } from '@/lib/utils'

export default function RequirementsPage() {
  const params = useParams() as { projectId?: string; conversationId?: string } | null
  const router = useRouter()
  const convId = params?.conversationId ?? ''
  const projectId = params?.projectId ?? ''
  const { getPipeline, approveNLP } = usePipelineStore()
  const pipeline = getPipeline(convId)
  const result = pipeline.nlpResult

  const handleApprove = () => {
    approveNLP(convId)
    router.push(`/project/${projectId}/conversation/${convId}`)
  }

  return (
    <div className="h-full overflow-y-auto px-6 py-6">
      <div className="max-w-3xl mx-auto">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-vrd-text-muted hover:text-vrd-text transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to thread
        </button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold text-vrd-text">Requirements Review</h1>
            {result && (
              <p className="text-sm text-vrd-text-muted mt-0.5">
                {result.total} requirements · {result.conflicts} conflicts · {result.overlaps} overlaps
              </p>
            )}
          </div>
          {pipeline.nlp === 'awaiting' && (
            <Button onClick={handleApprove} className="animate-pulse-amber">
              <CheckCircle2 className="w-4 h-4" />
              Approve &amp; continue
            </Button>
          )}
        </div>

        {!result ? (
          <p className="text-sm text-vrd-text-muted">NLP processing not yet complete.</p>
        ) : (
          <div className="space-y-2">
            {result.requirements.map((req) => (
              <div
                key={req.id}
                className={cn(
                  'flex items-start gap-3 px-4 py-3 rounded-xl border text-sm',
                  req.conflict && 'border-danger/30 bg-danger/5',
                  req.overlap && !req.conflict && 'border-warning/30 bg-warning/5',
                  !req.conflict && !req.overlap && 'border-vrd-border bg-vrd-card',
                )}
              >
                <span className="font-mono text-xs text-vrd-text-dim mt-0.5 flex-shrink-0">{req.id}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-vrd-text">{req.text}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-vrd-text-muted">
                    {req.scenarioType && <span>Type: <strong>{req.scenarioType}</strong></span>}
                    {req.speed && <span>Speed: <strong>{req.speed} km/h</strong></span>}
                    {req.distance && <span>Distance: <strong>{req.distance} m</strong></span>}
                    <span>Pass: {req.passCriteria}</span>
                  </div>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  {req.conflict && <Badge variant="danger"><AlertTriangle className="w-3 h-3" /> Conflict</Badge>}
                  {req.overlap && <Badge variant="warning"><GitMerge className="w-3 h-3" /> Overlap</Badge>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
