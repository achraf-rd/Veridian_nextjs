'use client'

import { Copy, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui'
import type { DuplicateRequirement } from '@/types/requirements'

interface Props {
  dup: DuplicateRequirement
  onJumpToRequirement: (id: string) => void
}

export default function DuplicateDetail({ dup, onJumpToRequirement }: Props) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-6 space-y-5">
        {/* Header */}
        <div className="flex items-center flex-wrap gap-2">
          <span className="font-mono text-base font-semibold text-vrd-text">{dup.id}</span>
          <Badge variant="warning">duplicate</Badge>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-vrd-card-hover text-vrd-text-dim font-medium border border-vrd-border">
            {dup.reason}
          </span>
        </div>

        {/* Info banner */}
        <div className="rounded-xl border border-vrd-border bg-vrd-card p-4 flex items-start gap-3">
          <Copy className="w-4 h-4 text-vrd-text-muted flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-vrd-text font-medium mb-1">
              Flagged as duplicate
            </p>
            <p className="text-xs text-vrd-text-muted leading-relaxed">
              The agent identified this requirement as redundant. It is shown here for
              review only — no action is required. If you want to remove or modify it,
              update your requirements and resubmit.
            </p>

            {dup.duplicate_of && (
              <div className="mt-3 flex items-center gap-2 text-xs text-vrd-text-muted">
                <ArrowRight className="w-3.5 h-3.5 text-vrd-text-dim flex-shrink-0" />
                <span>Duplicate of</span>
                <button
                  onClick={() => onJumpToRequirement(dup.duplicate_of!)}
                  className="font-mono text-primary hover:text-primary-hover underline underline-offset-2"
                >
                  {dup.duplicate_of}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Original text */}
        <div className="rounded-xl border border-vrd-border bg-vrd-card p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-vrd-text-dim mb-1.5">
            Requirement text
          </p>
          <p className="text-sm text-vrd-text leading-relaxed">{dup.original}</p>
        </div>
      </div>
    </div>
  )
}
