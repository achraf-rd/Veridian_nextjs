export type RequirementStatus = 'unchanged' | 'refined' | 'conflict' | 'overlap'
export type Complexity = 'HIGH' | 'MEDIUM' | 'LOW'
export type RefinerPipelineStatus = 'blocked' | 'ready'

export interface RefinedRequirement {
  id: string
  original: string
  refined: string
  issues_found: string[]
  status: RequirementStatus
  overlap_with: string[]
  conflict_flag: boolean
  conflict_id: string | null
  complexity: Complexity
  complexity_justification: string
  num_scenarios: number
}

export interface RemovedRequirement {
  id: string
  original: string
  reason: string
  duplicate_of: string
}

export interface ConflictEntry {
  conflict_id: string
  requirements: string[]
  description: string
  resolution: string
}

export interface PipelineStatusEnvelope {
  status: RefinerPipelineStatus
  reason: string
  blocked_by: string[]
}

export interface RefinementSummary {
  total_raw: number
  total_refined: number
  total_removed: number
  total_conflicts: number
  total_overlaps: number
}

export interface RefinementResult {
  refining_id: string
  feature: string
  source_file: string
  pipeline_status: PipelineStatusEnvelope
  summary: RefinementSummary
  requirements: RefinedRequirement[]
  removed: RemovedRequirement[]
  conflicts: ConflictEntry[]
}
