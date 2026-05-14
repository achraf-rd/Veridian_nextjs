import { useState, useMemo } from 'react'
import type { TestCase } from '@/types/agent2'

interface Filters {
  complexity: string[]
  testPhase: string[]
  tags: string[]
}

export function useScenariosFilter(scenarios: TestCase[]) {
  const [filters, setFilters] = useState<Filters>({ complexity: [], testPhase: [], tags: [] })

  const filtered = useMemo(() => {
    return scenarios.filter((tc) => {
      if (filters.complexity.length > 0 && !filters.complexity.includes(tc.complexity)) return false
      if (filters.testPhase.length > 0 && !filters.testPhase.includes(tc.test_phase)) return false
      if (filters.tags.length > 0 && !filters.tags.every((t) => tc.tags.includes(t))) return false
      return true
    })
  }, [scenarios, filters])

  function setComplexity(value: string) {
    setFilters((f) => ({ ...f, complexity: f.complexity[0] === value ? [] : [value] }))
  }

  function setTestPhase(value: string) {
    setFilters((f) => ({ ...f, testPhase: f.testPhase[0] === value ? [] : [value] }))
  }

  function toggleTag(tag: string) {
    setFilters((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }))
  }

  function resetFilters() {
    setFilters({ complexity: [], testPhase: [], tags: [] })
  }

  return { filtered, filters, setComplexity, setTestPhase, toggleTag, resetFilters }
}
