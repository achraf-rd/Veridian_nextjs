import { create } from 'zustand'
import type { ConversationPipeline, NLPTaskProgress, ScenarioResult, ExecutionResult, ReportResult, LogLine, PipelineRound } from '@/types/pipeline'
import type { RefinementResult, ValidRequirement, IncompleteRequirement } from '@/types/requirements'
import { MOCK_REFINEMENT } from '@/components/requirements-review/mockData'
import { MOCK_DEMO_PIPELINE } from '@/stores/mockData'
import { streamRefineRequirements } from '@/services/api'

function normalizeValidRequirement(raw: Record<string, unknown>, index: number): ValidRequirement {
  return {
    id:                      (raw.id as string) ?? `req-${String(index + 1).padStart(3, '0')}`,
    original:                (raw.original as string) ?? '',
    issues_found:            (raw.issues_found as string[]) ?? [],
    status:                  'valid',
    overlap_with:            (raw.overlap_with as string[]) ?? [],
    conflict_flag:           (raw.conflict_flag as boolean) ?? false,
    conflict_id:             (raw.conflict_id as string | null) ?? null,
    complexity:              (raw.complexity as ValidRequirement['complexity']) ?? 'LOW',
    complexity_justification:(raw.complexity_justification as string) ?? '',
    num_scenarios:           (raw.num_scenarios as number) ?? 1,
  }
}

function normalizeIncompleteRequirement(raw: Record<string, unknown>, index: number): IncompleteRequirement {
  return {
    id:           (raw.id as string) ?? `req-incomplete-${index + 1}`,
    original:     (raw.original as string) ?? '',
    issues_found: (raw.issues_found as string[]) ?? [],
    status:       'incomplete',
  }
}

function normalizeResult(raw: unknown): RefinementResult {
  const r = (raw ?? {}) as Record<string, unknown>
  const rawReqs = (r.requirements as Record<string, unknown>[]) ?? []
  const rawIncomplete = (r.incomplete as Record<string, unknown>[]) ?? []
  const requirements = rawReqs.map(normalizeValidRequirement)
  const incomplete = rawIncomplete.map(normalizeIncompleteRequirement)
  const summary = (r.summary as Record<string, unknown>) ?? {}

  // Compute total_overlaps from data if not provided
  const overlapPairs = new Set<string>()
  for (const req of requirements) {
    for (const other of req.overlap_with) {
      const key = [req.id, other].sort().join('|')
      overlapPairs.add(key)
    }
  }

  return {
    refining_id:     (r.refining_id as string) ?? '',
    feature:         (r.feature as string) ?? undefined,
    source_file:     (r.source_file as string) ?? undefined,
    generated_at:    (r.generated_at as string) ?? undefined,
    pipeline_status: (r.pipeline_status as RefinementResult['pipeline_status']) ?? { status: 'ready', reason: null, blocked_by: [] },
    summary: {
      total_raw:        (summary.total_raw as number)        ?? (requirements.length + incomplete.length),
      total_valid:      (summary.total_valid as number)      ?? requirements.length,
      total_incomplete: (summary.total_incomplete as number) ?? incomplete.length,
      total_removed:    (summary.total_removed as number)    ?? 0,
      total_conflicts:  (summary.total_conflicts as number)  ?? 0,
      total_overlaps:   (summary.total_overlaps as number)   ?? overlapPairs.size,
    },
    requirements,
    incomplete,
    removed:   (r.removed as RefinementResult['removed'])     ?? [],
    conflicts: (r.conflicts as RefinementResult['conflicts']) ?? [],
  }
}

const SCENARIO_RESULT: ScenarioResult = {
  total: 47, warnings: 2,
  scenarios: [
    { id: 's-001', filename: 'AEB_ped_15m_50kph.xosc', type: 'xosc', warnings: [] },
    { id: 's-002', filename: 'AEB_ped_15m_30kph.xosc', type: 'xosc', warnings: ['ASAM: Missing TriggerCondition for ego velocity'] },
    { id: 's-003', filename: 'AEB_city_ttc2s.xosc', type: 'xosc', warnings: [] },
    { id: 's-004', filename: 'AEB_city_reaction_250ms.xosc', type: 'xosc', warnings: [] },
    { id: 's-005', filename: 'LKA_highway_70kph.xosc', type: 'xosc', warnings: ['ASAM: ActorRef ambiguity in condition group'] },
    { id: 's-006', filename: 'ego_route_renault.xodr', type: 'xodr', warnings: [] },
  ],
}

// Updated scenario result for refactored runs
const SCENARIO_RESULT_V2: ScenarioResult = {
  total: 52, warnings: 1,
  scenarios: [
    { id: 's-001', filename: 'AEB_ped_25m_50kph.xosc', type: 'xosc', warnings: [] },
    { id: 's-002', filename: 'AEB_ped_25m_30kph.xosc', type: 'xosc', warnings: [] },
    { id: 's-003', filename: 'AEB_city_ttc2s_aggressive.xosc', type: 'xosc', warnings: [] },
    { id: 's-004', filename: 'AEB_bicycle_intersection.xosc', type: 'xosc', warnings: ['ASAM: Missing TriggerCondition for ego velocity'] },
    { id: 's-005', filename: 'LKA_highway_70kph.xosc', type: 'xosc', warnings: [] },
    { id: 's-006', filename: 'AEB_stationary_city.xosc', type: 'xosc', warnings: [] },
    { id: 's-007', filename: 'ego_route_renault_v2.xodr', type: 'xodr', warnings: [] },
  ],
}

const MOCK_LOGS: LogLine[] = [
  { id: 'l1',  type: 'ok',   text: 'RUN-0001 — AEB_ped_15m_50kph · passed · TTC min: 1.82 s',       timestamp: '09:14:01' },
  { id: 'l2',  type: 'ok',   text: 'RUN-0002 — AEB_ped_15m_30kph · passed · TTC min: 2.11 s',       timestamp: '09:14:08' },
  { id: 'l3',  type: 'err',  text: 'RUN-0003 — AEB_ped_25m_city · CARLA crash, auto-requeue',       timestamp: '09:14:15' },
  { id: 'l4',  type: 'info', text: 'Worker pool: 3 active · queue: 44 remaining',                    timestamp: '09:14:15' },
  { id: 'l5',  type: 'ok',   text: 'RUN-0004 — LKA_highway_70kph · passed · deviation: 0.07 m',     timestamp: '09:14:23' },
  { id: 'l6',  type: 'ok',   text: 'RUN-0005 — LKA_highway_100kph · passed · deviation: 0.09 m',    timestamp: '09:14:31' },
  { id: 'l7',  type: 'err',  text: 'RUN-0007 — AEB_bicycle_intersection · latency 287 ms > 250 ms', timestamp: '09:15:02' },
  { id: 'l8',  type: 'ok',   text: 'RUN-0008 — AEB_city_ttc2s · passed',                            timestamp: '09:15:10' },
  { id: 'l9',  type: 'info', text: 'RUN-0003 requeued → executing',                                 timestamp: '09:15:10' },
  { id: 'l10', type: 'ok',   text: 'RUN-0003 — AEB_ped_25m_city · passed · TTC min: 1.44 s',        timestamp: '09:15:22' },
  { id: 'l11', type: 'info', text: 'All scenarios complete. Generating report…',                     timestamp: '09:15:30' },
]

const MOCK_LOGS_V2: LogLine[] = [
  { id: 'r2l1',  type: 'info', text: 'Spawning CARLA worker pool (3 workers)…',                              timestamp: '10:22:00' },
  { id: 'r2l2',  type: 'ok',   text: 'RUN-0001 — AEB_ped_25m_50kph · passed · TTC min: 2.14 s',             timestamp: '10:22:05' },
  { id: 'r2l3',  type: 'ok',   text: 'RUN-0002 — AEB_ped_25m_30kph · passed · TTC min: 2.83 s',             timestamp: '10:22:12' },
  { id: 'r2l4',  type: 'ok',   text: 'RUN-0003 — AEB_city_ttc2s_aggressive · passed · TTC min: 1.91 s',     timestamp: '10:22:19' },
  { id: 'r2l5',  type: 'ok',   text: 'RUN-0004 — AEB_bicycle_intersection · passed · TTC min: 1.67 s',      timestamp: '10:22:28' },
  { id: 'r2l6',  type: 'ok',   text: 'RUN-0005 — LKA_highway_70kph · passed · deviation: 0.06 m',           timestamp: '10:22:36' },
  { id: 'r2l7',  type: 'ok',   text: 'RUN-0006 — AEB_stationary_city · passed · stop distance: 4.1 m',      timestamp: '10:22:44' },
  { id: 'r2l8',  type: 'err',  text: 'RUN-0007 — AEB_wet_road_braking · CARLA physics timeout, auto-requeue', timestamp: '10:22:51' },
  { id: 'r2l9',  type: 'info', text: 'Worker pool: 3 active · queue: 45 remaining',                          timestamp: '10:22:51' },
  { id: 'r2l10', type: 'ok',   text: 'RUN-0007 — AEB_wet_road_braking · passed · latency: 178 ms',          timestamp: '10:23:04' },
  { id: 'r2l11', type: 'info', text: 'All 52 scenarios complete. Generating report…',                        timestamp: '10:23:11' },
]

const REPORT_RESULT: ReportResult = {
  verdict: 'pass', score: 93.6,
  kpis: [
    { name: 'TTC min',              value: '0.42', unit: 's',  status: 'pass' },
    { name: 'Min braking distance', value: '3.2',  unit: 'm',  status: 'pass' },
    { name: 'Reaction latency',     value: '187',  unit: 'ms', status: 'pass' },
    { name: 'Lane deviation',       value: '0.08', unit: 'm',  status: 'pass' },
    { name: 'False positive rate',  value: '0.02', unit: '%',  status: 'warn' },
  ],
}

const REPORT_RESULT_V2: ReportResult = {
  verdict: 'pass', score: 98.1,
  kpis: [
    { name: 'TTC min',              value: '0.51', unit: 's',  status: 'pass' },
    { name: 'Min braking distance', value: '2.9',  unit: 'm',  status: 'pass' },
    { name: 'Reaction latency',     value: '178',  unit: 'ms', status: 'pass' },
    { name: 'Lane deviation',       value: '0.06', unit: 'm',  status: 'pass' },
    { name: 'False positive rate',  value: '0.01', unit: '%',  status: 'pass' },
  ],
}

const BLANK: ConversationPipeline = {
  stage: 0, round: 1, entryStage: 1, agentMessage: null,
  nlp: 'idle', scenario: 'idle', execution: 'idle', report: 'idle',
  engineerInput: null, nlpResult: null, nlpProgress: {}, scenarioResult: null,
  executionResult: null, reportResult: null, priorRounds: [],
}

/** Detect which stage a refactor instruction targets based on keyword analysis */
function detectEntryStage(instruction: string): 1 | 2 {
  const lower = instruction.toLowerCase()
  const nlpKeywords = ['criteria', 'pass criteria', 'requirement', 'add more', 'add edge', 'remove all', 'remove the', 'edge case', 'latency should', 'latency must', 'pull from', 'import']
  return nlpKeywords.some(kw => lower.includes(kw)) ? 1 : 2
}

function buildAgentMessage(entryStage: 1 | 2): string {
  if (entryStage === 1) return 'Detected change in requirements — re-running from NLP Interpreter.'
  return 'Detected change in scenario parameters — re-running from Scenario Generator.'
}

interface PipelineStore {
  pipelines: Record<string, ConversationPipeline>
  hasHydrated: boolean
  hydrate: () => void
  getPipeline: (id: string) => ConversationPipeline
  submit: (id: string, requirements: string[], label?: string) => void
  approveNLP: (id: string) => void
  approveScenario: (id: string) => void
  refactor: (id: string, instruction: string) => void
}

export const usePipelineStore = create<PipelineStore>((set, get) => {
  return {
    pipelines: {},
    hasHydrated: false,

    hydrate: () => {
      if (typeof window === 'undefined') return
      if (get().hasHydrated) return
      try {
        const stored = localStorage.getItem('veridian-pipelines')
        let pipelines = stored ? JSON.parse(stored) : {}
        // Reseed demo conv-1 if missing or using stale (pre-incomplete) shape
        const existing = pipelines['conv-1']
        const isStale = existing?.nlpResult && !('incomplete' in existing.nlpResult)
        if (!existing || isStale) {
          pipelines['conv-1'] = MOCK_DEMO_PIPELINE
        }
        set({ pipelines, hasHydrated: true })
      } catch {
        set({ hasHydrated: true })
      }
    },

    getPipeline: (id) => get().pipelines[id] ?? BLANK,

  submit: (id, requirements, label) => {
    const engineerInput = label ?? requirements.join('\n')
    set((s) => {
      const newState = { pipelines: { ...s.pipelines, [id]: { ...BLANK, stage: 1, nlp: 'processing' as const, engineerInput } } }
      localStorage.setItem('veridian-pipelines', JSON.stringify(newState.pipelines))
      return newState as Partial<PipelineStore>
    })

    ;(async () => {
      const updateProgress = (nodeName: string, patch: Partial<NLPTaskProgress>) => {
        set((s) => {
          const p = s.pipelines[id]
          if (!p || p.nlp !== 'processing') return s
          const existing = p.nlpProgress[nodeName] ?? { stageNum: 0, status: 'running', attempt: 1, maxAttempts: 1 }
          const nlpProgress = { ...p.nlpProgress, [nodeName]: { ...existing, ...patch } }
          return { pipelines: { ...s.pipelines, [id]: { ...p, nlpProgress } } } as Partial<PipelineStore>
        })
      }

      try {
        for await (const event of streamRefineRequirements(requirements)) {
          // Log SSE events in development
          if (process.env.NODE_ENV === 'development') {
            console.log(`[SSE] ${event.type}`, event)
          }

          if (event.type === 'stage') {
            updateProgress(event.name, {
              stageNum: event.stage,
              status: event.status,
              ...(event.max_attempts ? { maxAttempts: event.max_attempts } : {}),
              ...(event.status === 'completed' && event.message ? { message: event.message } : {}),
            })
          } else if (event.type === 'attempt') {
            updateProgress(event.name, { attempt: event.attempt, maxAttempts: event.max })
          } else if (event.type === 'validation_failed') {
            updateProgress(event.name, { status: 'running', attempt: event.attempt, maxAttempts: event.max })
          } else if (event.type === 'result') {
            set((s) => {
              const p = s.pipelines[id]
              if (!p || p.nlp !== 'processing') return s
              const updated = { ...p, nlp: 'awaiting' as const, nlpResult: normalizeResult(event.output), nlpProgress: {} }
              const pipelines = { ...s.pipelines, [id]: updated }
              localStorage.setItem('veridian-pipelines', JSON.stringify(pipelines))
              return { pipelines } as Partial<PipelineStore>
            })
          } else if (event.type === 'error') {
            set((s) => {
              const p = s.pipelines[id]
              if (!p) return s
              const pipelines = { ...s.pipelines, [id]: { ...p, nlp: 'failed' as const, nlpProgress: {} } }
              localStorage.setItem('veridian-pipelines', JSON.stringify(pipelines))
              return { pipelines } as Partial<PipelineStore>
            })
          }
        }
      } catch (err) {
        console.error('[pipeline] SSE stream error:', err)
        set((s) => {
          const p = s.pipelines[id]
          if (!p) return s
          const pipelines = { ...s.pipelines, [id]: { ...p, nlp: 'failed' as const, nlpProgress: {} } }
          localStorage.setItem('veridian-pipelines', JSON.stringify(pipelines))
          return { pipelines } as Partial<PipelineStore>
        })
      }
    })()
  },

  approveNLP: (id) => {
    set((s) => {
      const p = s.pipelines[id]
      if (!p) return s
      const newState = { pipelines: { ...s.pipelines, [id]: { ...p, nlp: 'approved' as const, stage: 2, scenario: 'processing' as const } } }
      localStorage.setItem('veridian-pipelines', JSON.stringify(newState.pipelines))
      return newState as Partial<PipelineStore>
    })
    setTimeout(() => {
      set((s) => {
        const p = s.pipelines[id]
        if (!p || p.scenario !== 'processing') return s
        const result = p.round > 1 ? SCENARIO_RESULT_V2 : SCENARIO_RESULT
        const newState = { pipelines: { ...s.pipelines, [id]: { ...p, scenario: 'awaiting' as const, scenarioResult: result } } }
        localStorage.setItem('veridian-pipelines', JSON.stringify(newState.pipelines))
        return newState as Partial<PipelineStore>
      })
    }, 2500)
  },

  approveScenario: (id) => {
    set((s) => {
      const p = s.pipelines[id]
      if (!p) return s
      const newState = { pipelines: { ...s.pipelines, [id]: { ...p, scenario: 'approved' as const, stage: 3, execution: 'processing' as const } } }
      localStorage.setItem('veridian-pipelines', JSON.stringify(newState.pipelines))
      return newState as Partial<PipelineStore>
    })
    setTimeout(() => {
      set((s) => {
        const p = s.pipelines[id]
        if (!p || p.execution !== 'processing') return s
        const logs = p.round > 1 ? MOCK_LOGS_V2 : MOCK_LOGS
        const report = p.round > 1 ? REPORT_RESULT_V2 : REPORT_RESULT
        const newState = {
          pipelines: {
            ...s.pipelines,
            [id]: {
              ...p,
              execution: 'approved' as const,
              executionResult: { total: p.scenarioResult?.total ?? 47, passed: p.round > 1 ? 51 : 44, failed: p.round > 1 ? 1 : 2, requeued: 1, logs },
              stage: 4 as const,
              report: 'awaiting' as const,
              reportResult: report,
            },
          },
        }
        localStorage.setItem('veridian-pipelines', JSON.stringify(newState.pipelines))
        return newState as Partial<PipelineStore>
      })
    }, 8000)
  },

  refactor: (id, instruction) => {
    const p = get().pipelines[id]
    if (!p || p.stage !== 4 || p.report !== 'awaiting') return

    const entryStage = detectEntryStage(instruction)
    const agentMessage = buildAgentMessage(entryStage)

    // Freeze current round into history
    const completedRound: PipelineRound = {
      round: p.round,
      completedAt: new Date().toISOString(),
      engineerInput: p.engineerInput!,
      nlpResult: p.nlpResult,
      scenarioResult: p.scenarioResult,
      executionResult: p.executionResult,
      reportResult: p.reportResult,
    }

    const newPipeline: ConversationPipeline = {
      ...BLANK,
      round: p.round + 1,
      entryStage,
      agentMessage,
      engineerInput: instruction,
      priorRounds: [...p.priorRounds, completedRound],
      // Inherit NLP if re-entering at scenario stage or later
      nlp: entryStage > 1 ? 'approved' : 'processing',
      nlpResult: entryStage > 1 ? p.nlpResult : null,
      stage: entryStage,
      scenario: entryStage === 2 ? 'processing' : 'idle',
    }

    set((s) => {
      const newState = { pipelines: { ...s.pipelines, [id]: newPipeline } }
      localStorage.setItem('veridian-pipelines', JSON.stringify(newState.pipelines))
      return newState as Partial<PipelineStore>
    })

    if (entryStage === 1) {
      // Re-run from NLP
      setTimeout(() => {
        set((s) => {
          const cur = s.pipelines[id]
          if (!cur || cur.nlp !== 'processing') return s
          const newState = { pipelines: { ...s.pipelines, [id]: { ...cur, nlp: 'awaiting' as const, nlpResult: MOCK_REFINEMENT } } }
          localStorage.setItem('veridian-pipelines', JSON.stringify(newState.pipelines))
          return newState as Partial<PipelineStore>
        })
      }, 2500)
    } else {
      // Re-run from Scenario Generator
      setTimeout(() => {
        set((s) => {
          const cur = s.pipelines[id]
          if (!cur || cur.scenario !== 'processing') return s
          const newState = { pipelines: { ...s.pipelines, [id]: { ...cur, scenario: 'awaiting' as const, scenarioResult: SCENARIO_RESULT_V2 } } }
          localStorage.setItem('veridian-pipelines', JSON.stringify(newState.pipelines))
          return newState as Partial<PipelineStore>
        })
      }, 2500)
    }
  },
  }
})
