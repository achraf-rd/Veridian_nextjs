import type { TestStep } from '@/types/agent2'
import { cn } from '@/lib/utils'

interface Props {
  steps: TestStep[]
}

export default function TestStepsTable({ steps }: Props) {
  if (!steps.length) return null

  return (
    <div className="overflow-x-auto rounded-lg border border-vrd-border">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-vrd-border bg-vrd-card-hover">
            <th className="px-3 py-2 text-left font-medium text-vrd-text-muted w-8">#</th>
            <th className="px-3 py-2 text-left font-medium text-vrd-text-muted">Action</th>
            <th className="px-3 py-2 text-left font-medium text-vrd-text-muted">Expected reaction</th>
            <th className="px-3 py-2 text-left font-medium text-vrd-text-muted">Pass criteria</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-vrd-border">
          {steps.map((s) => (
            <tr key={s.step}>
              <td className="px-3 py-2 text-vrd-text-dim font-mono">{s.step}</td>
              <td className="px-3 py-2 text-vrd-text">{s.action}</td>
              <td className="px-3 py-2 text-vrd-text-muted">{s.reaction}</td>
              <td className={cn('px-3 py-2 font-mono text-vrd-text', 'bg-green-50 dark:bg-green-950/20')}>
                {s.pass_criteria}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
