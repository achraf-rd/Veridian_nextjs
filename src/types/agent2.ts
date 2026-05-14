export interface Environment {
  map: string
  weather: string
  lighting: string
}

export interface EgoVehicle {
  state: string
  lane: string
  initial_speed: number
  set_speed: number | null
  parameters: Record<string, unknown>
}

export interface Actor {
  id: string
  type: string
  lane: string
  initial_distance: number
  speed: number
  behavior: string
}

export interface TestStep {
  step: number
  action: string
  reaction: string
  pass_criteria: string
}

export interface TestCase {
  scenario_id: string
  covers_requirements: string[]
  feature_under_test: string
  complexity: 'LOW' | 'MEDIUM' | 'HIGH'
  test_phase: 'SIL' | 'SIL+HIL'
  tags: string[]
  description: string
  preconditions?: string[]
  environment: Environment
  ego_vehicle: EgoVehicle
  actors: Actor[]
  'test case': TestStep[]
  type: 'test_case'
}
