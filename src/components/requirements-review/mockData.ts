import type { RefinementResult } from '@/types/requirements'

/** Used by the post-completion refactor flow as a stand-in for a re-run. */
export const MOCK_REFINEMENT: RefinementResult = {
  refining_id: 'refactor-mock-001',
  feature: 'LKA',
  source_file: 'requirements_v2.xlsx',
  pipeline_status: { status: 'ready', reason: null, blocked_by: [] },
  summary: {
    total_raw: 20,
    total_testable: 18,
    total_incomplete: 2,
    total_duplicates: 0,
    total_conflicts: 0,
    total_overlaps: 1,
  },
  testable: [
    {
      id: 'req-001',
      original:
        'The vehicle shall remain within its lane boundaries at 110 km/h on a 3-lane motorway with clear markings under daylight conditions, with maximum lateral offset < 0.3 m for a 2-minute run.',
      issues_found: [],
      status: 'valid',
      overlap_with: [],
      conflict_flag: false,
      conflict_id: null,
      complexity: 'MEDIUM',
      complexity_justification: 'Single-actor lane keeping under nominal conditions.',
      num_scenarios: 3,
    },
    {
      id: 'req-002',
      original:
        'On a rural highway at 90 km/h, the system shall apply corrective steering torque within 200 ms of detecting a right-side lane departure and re-center within 0.15 m within 2 s.',
      issues_found: [],
      status: 'valid',
      overlap_with: [],
      conflict_flag: false,
      conflict_id: null,
      complexity: 'HIGH',
      complexity_justification: 'Tight timing on emergency corrective intervention.',
      num_scenarios: 5,
    },
    {
      id: 'req-005',
      original:
        'On a constant-radius right curve (R = 300 m) at 80 km/h, the vehicle shall maintain lane centering with deviation < 0.25 m for the entire 30-second curve traversal.',
      issues_found: [],
      status: 'valid',
      overlap_with: ['req-012'],
      conflict_flag: false,
      conflict_id: null,
      complexity: 'MEDIUM',
      complexity_justification: 'Single-actor curve maneuver under normal conditions.',
      num_scenarios: 3,
    },
    {
      id: 'req-012',
      original:
        'Through a 500 m S-curve (R1 = 250 m left, R2 = 300 m right, 50 m transition) at 75 km/h, deviation shall remain below 0.3 m and the system shall not deactivate.',
      issues_found: [],
      status: 'valid',
      overlap_with: ['req-005'],
      conflict_flag: false,
      conflict_id: null,
      complexity: 'MEDIUM',
      complexity_justification: 'Multiple curves increase maneuver complexity.',
      num_scenarios: 3,
    },
  ],
  incomplete: [
    {
      id: 'req-003',
      original:
        'When the driver applies a turn signal prior to a lane change, the LKA system shall disengage within 500 ms.',
      issues_found: ['missing speed', 'missing road type'],
      status: 'incomplete',
    },
    {
      id: 'req-008',
      original:
        'The LKA system shall not produce a lane departure event when a large truck overtakes the ego vehicle in the adjacent lane on a motorway.',
      issues_found: ['missing speed'],
      status: 'incomplete',
    },
  ],
  duplicates: [],
  conflicts: [],
}
