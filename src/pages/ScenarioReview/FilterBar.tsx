import type { TestCase } from '@/types/agent2'
import { cn } from '@/lib/utils'

interface Filters {
  complexity: string[]
  testPhase: string[]
  tags: string[]
}

interface Props {
  scenarios: TestCase[]
  filters: Filters
  onComplexity: (v: string) => void
  onTestPhase: (v: string) => void
  onToggleTag: (t: string) => void
  onReset: () => void
}

const COMPLEXITIES = ['LOW', 'MEDIUM', 'HIGH'] as const
const PHASES = ['SIL', 'SIL+HIL'] as const
const TAGS = ['nominal', 'boundary', 'performance', 'edge_case'] as const

function countComplexity(scenarios: TestCase[], value: string) {
  return scenarios.filter((s) => s.complexity === value).length
}
function countPhase(scenarios: TestCase[], value: string) {
  return scenarios.filter((s) => s.test_phase === value).length
}
function countTag(scenarios: TestCase[], tag: string) {
  return scenarios.filter((s) => s.tags.includes(tag)).length
}

function Chip({
  label,
  count,
  active,
  colorClass,
  onClick,
}: {
  label: string
  count: number
  active: boolean
  colorClass?: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-colors',
        active
          ? colorClass ?? 'bg-primary text-white border-primary'
          : 'bg-transparent text-vrd-text-muted border-vrd-border hover:border-primary/50 hover:text-vrd-text',
      )}
    >
      {label}
      <span className={cn('text-[10px]', active ? 'opacity-80' : 'text-vrd-text-dim')}>{count}</span>
    </button>
  )
}

export default function FilterBar({ scenarios, filters, onComplexity, onTestPhase, onToggleTag, onReset }: Props) {
  const hasActive =
    filters.complexity.length > 0 || filters.testPhase.length > 0 || filters.tags.length > 0

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-vrd-text-muted uppercase tracking-wider">Filters</span>
        {hasActive && (
          <button onClick={onReset} className="text-[11px] text-primary-light hover:underline">
            Clear all
          </button>
        )}
      </div>

      <div>
        <p className="text-[10px] text-vrd-text-dim mb-1.5 uppercase tracking-wider">Complexity</p>
        <div className="flex flex-wrap gap-1.5">
          {COMPLEXITIES.map((lvl) => {
            const colorMap: Record<string, string> = {
              LOW: 'bg-green-600 text-white border-green-600',
              MEDIUM: 'bg-amber-500 text-white border-amber-500',
              HIGH: 'bg-red-600 text-white border-red-600',
            }
            return (
              <Chip
                key={lvl}
                label={lvl}
                count={countComplexity(scenarios, lvl)}
                active={filters.complexity.includes(lvl)}
                colorClass={colorMap[lvl]}
                onClick={() => onComplexity(lvl)}
              />
            )
          })}
        </div>
      </div>

      <div>
        <p className="text-[10px] text-vrd-text-dim mb-1.5 uppercase tracking-wider">Test Phase</p>
        <div className="flex flex-wrap gap-1.5">
          {PHASES.map((ph) => {
            const colorMap: Record<string, string> = {
              'SIL': 'bg-blue-600 text-white border-blue-600',
              'SIL+HIL': 'bg-purple-600 text-white border-purple-600',
            }
            return (
              <Chip
                key={ph}
                label={ph}
                count={countPhase(scenarios, ph)}
                active={filters.testPhase.includes(ph)}
                colorClass={colorMap[ph]}
                onClick={() => onTestPhase(ph)}
              />
            )
          })}
        </div>
      </div>

      <div>
        <p className="text-[10px] text-vrd-text-dim mb-1.5 uppercase tracking-wider">Tags</p>
        <div className="flex flex-wrap gap-1.5">
          {TAGS.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              count={countTag(scenarios, tag)}
              active={filters.tags.includes(tag)}
              onClick={() => onToggleTag(tag)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
