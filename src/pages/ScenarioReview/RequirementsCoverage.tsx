import type { TestCase } from '@/types/agent2'

interface Props {
  scenarios: TestCase[]
}

export default function RequirementsCoverage({ scenarios }: Props) {
  const coverage = new Map<string, number>()

  for (const tc of scenarios) {
    for (const req of tc.covers_requirements) {
      coverage.set(req, (coverage.get(req) ?? 0) + 1)
    }
  }

  const sorted = Array.from(coverage.entries()).sort(([a], [b]) => a.localeCompare(b))

  if (!sorted.length) return null

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-medium text-vrd-text-muted uppercase tracking-wider">Requirements Coverage</p>
      <div className="rounded-lg border border-vrd-border overflow-hidden">
        <table className="w-full text-xs">
          <tbody className="divide-y divide-vrd-border">
            {sorted.map(([req, count]) => (
              <tr key={req} className={count === 0 ? 'bg-orange-500/5' : ''}>
                <td className="px-3 py-1.5 font-mono text-vrd-text">{req}</td>
                <td className="px-3 py-1.5 text-right">
                  {count === 0 ? (
                    <span className="text-orange-400 font-medium">0 scenarios</span>
                  ) : (
                    <span className="text-vrd-text-muted">
                      {count} scenario{count > 1 ? 's' : ''}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
