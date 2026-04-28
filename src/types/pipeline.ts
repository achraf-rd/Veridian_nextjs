import type { RefinementResult } from '@/types/requirements'

export type CardState = 'idle' | 'processing' | 'awaiting' | 'approved' | 'failed'

export interface NLPTaskProgress {
  stageNum: number
  status: 'running' | 'completed'
  attempt: number
  maxAttempts: number
  message?: string
}

export type RefinementEvent =
  | { type: 'stage'; stage: number; name: string; label: string; status: 'running' | 'completed'; message?: string; attempt?: number; max_attempts?: number }
  | { type: 'attempt'; name: string; attempt: number; max: number }
  | { type: 'validation_failed'; name: string; attempt: number; max: number }
  | { type: 'result'; output: RefinementResult }
  | { type: 'error'; detail: string }

export interface ScenarioFile {
  id: string
  filename: string
  type: 'xosc' | 'xodr'
  warnings: string[]
}

export interface ScenarioResult {
  total: number
  warnings: number
  scenarios: ScenarioFile[]
}

export interface LogLine {
  id: string
  type: 'ok' | 'err' | 'info'
  text: string
  timestamp: string
}

export interface ExecutionResult {
  total: number
  passed: number
  failed: number
  requeued: number
  logs: LogLine[]
}

export interface KPI {
  name: string
  value: string
  unit: string
  status: 'pass' | 'fail' | 'warn'
}

export interface ReportResult {
  verdict: 'pass' | 'fail'
  score: number
  kpis: KPI[]
}

/** A fully completed pipeline round, preserved in history */
export interface PipelineRound {
  round: number
  completedAt: string
  engineerInput: string
  nlpResult: RefinementResult | null
  scenarioResult: ScenarioResult | null
  executionResult: ExecutionResult | null
  reportResult: ReportResult | null
}

export interface ConversationPipeline {
  stage: 0 | 1 | 2 | 3 | 4
  /** Which round this is (1-indexed) */
  round: number
  /** Which stage this round re-entered from (1=NLP, 2=Scenario, etc.) */
  entryStage: 1 | 2 | 3 | 4
  /** Agent's analysis message shown before pipeline cards in a refactor round */
  agentMessage: string | null
  engineerInput: string | null
  nlp: CardState
  scenario: CardState
  execution: CardState
  report: CardState
  nlpResult: RefinementResult | null
  nlpProgress: Record<string, NLPTaskProgress>
  scenarioResult: ScenarioResult | null
  executionResult: ExecutionResult | null
  reportResult: ReportResult | null
  /** All fully completed prior rounds */
  priorRounds: PipelineRound[]
}
