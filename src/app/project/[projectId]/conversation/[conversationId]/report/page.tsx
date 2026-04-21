'use client'

import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Download, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import { usePipelineStore } from '@/stores/pipelineStore'
import { Badge } from '@/components/ui'
import { cn } from '@/lib/utils'

export default function ReportPage() {
  const params = useParams() as { conversationId?: string } | null
  const router = useRouter()
  const convId = params?.conversationId ?? ''
  const { getPipeline } = usePipelineStore()
  const result = getPipeline(convId).reportResult

  const isPassing = result?.verdict === 'pass'

  return (
    <div className="h-full overflow-y-auto px-6 py-6">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-vrd-text-muted hover:text-vrd-text transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to thread
        </button>

        {!result ? (
          <p className="text-sm text-vrd-text-muted">Report not yet generated.</p>
        ) : (
          <div className="space-y-6">
            {/* Verdict */}
            <div className={cn(
              'flex items-center justify-between p-6 rounded-xl border',
              isPassing ? 'border-success/30 bg-success/5' : 'border-danger/30 bg-danger/5',
            )}>
              <div>
                <p className="text-xs text-vrd-text-muted uppercase tracking-wider mb-1">Overall Verdict</p>
                <p className={cn('text-3xl font-bold', isPassing ? 'text-success' : 'text-danger')}>
                  {isPassing ? 'Pass' : 'Fail'}
                </p>
                <p className="text-sm text-vrd-text-muted mt-1">{result.score}% scenarios passed</p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-vrd-border text-sm text-vrd-text hover:bg-vrd-card-hover transition-colors">
                <Download className="w-4 h-4" />
                Download PDF
              </button>
            </div>

            {/* KPI Table */}
            <div>
              <h2 className="text-sm font-medium text-vrd-text mb-3">KPI Summary</h2>
              <div className="rounded-xl border border-vrd-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-vrd-border bg-vrd-card">
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-vrd-text-muted">Metric</th>
                      <th className="text-right px-4 py-2.5 text-xs font-medium text-vrd-text-muted">Value</th>
                      <th className="text-right px-4 py-2.5 text-xs font-medium text-vrd-text-muted">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.kpis.map((kpi, i) => (
                      <tr
                        key={kpi.name}
                        className={cn('border-b border-vrd-border last:border-0', i % 2 === 0 ? 'bg-vrd-bg' : 'bg-vrd-card')}
                      >
                        <td className="px-4 py-3 text-vrd-text-muted">{kpi.name}</td>
                        <td className="px-4 py-3 text-right font-mono font-medium text-vrd-text">
                          {kpi.value} <span className="text-vrd-text-dim">{kpi.unit}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {kpi.status === 'pass' && <><CheckCircle2 className="w-3.5 h-3.5 text-success" /><Badge variant="success">Pass</Badge></>}
                            {kpi.status === 'warn' && <><AlertTriangle className="w-3.5 h-3.5 text-warning" /><Badge variant="warning">Warn</Badge></>}
                            {kpi.status === 'fail' && <><XCircle className="w-3.5 h-3.5 text-danger" /><Badge variant="danger">Fail</Badge></>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
