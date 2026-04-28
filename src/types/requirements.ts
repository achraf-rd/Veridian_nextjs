export type RequirementStatus = 'valid' | 'incomplete'
export type Complexity = 'HIGH' | 'MEDIUM' | 'LOW'
export type RefinerPipelineStatus = 'blocked' | 'ready'

/** A fully-validated requirement returned in the `requirements[]` array. */
export interface ValidRequirement {
  id: string
  original: string
  issues_found: string[]
  status: 'valid'
  overlap_with: string[]
  conflict_flag: boolean
  conflict_id: string | null
  complexity: Complexity
  complexity_justification: string
  num_scenarios: number
}

/** A requirement flagged as incomplete — returned in the `incomplete[]` array. */
export interface IncompleteRequirement {
  id: string
  original: string
  issues_found: string[]
  status: 'incomplete'
}

/** Convenience union — used by components that handle both kinds. */
export type AnyRequirement = ValidRequirement | IncompleteRequirement

export interface RemovedRequirement {
  id: string
  original: string
  reason: string
  duplicate_of?: string
}

export interface ConflictEntry {
  conflict_id: string
  requirements: string[]
  description: string
  resolution?: string
}

export interface PipelineStatusEnvelope {
  status: RefinerPipelineStatus
  reason: string | null
  blocked_by: string[]
}

export interface RefinementSummary {
  total_raw: number
  total_valid: number
  total_incomplete: number
  total_removed: number
  total_conflicts: number
  total_overlaps: number
}

export interface RefinementResult {
  refining_id: string
  feature?: string
  source_file?: string
  generated_at?: string
  pipeline_status: PipelineStatusEnvelope
  summary: RefinementSummary
  requirements: ValidRequirement[]
  incomplete: IncompleteRequirement[]
  removed: RemovedRequirement[]
  conflicts: ConflictEntry[]
}
