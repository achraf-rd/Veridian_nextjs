import type { ConversationPipeline } from '@/types/pipeline'
import type { RefinementResult } from '@/types/requirements'

export const MOCK_DEMO_NLP_RESULT: RefinementResult = {
  refining_id: 'f884ec8d-6b25-43ea-8a7e-84f0ff6d9dfa',
  feature: 'LKA (Lane Keeping Assistance)',
  source_file: 'lka_requirements_veridian.xlsx',
  generated_at: '2026-04-28T15:11:28.862851',
  pipeline_status: { status: 'ready', reason: null, blocked_by: [] },
  summary: {
    total_raw: 20,
    total_testable: 13,
    total_incomplete: 7,
    total_duplicates: 0,
    total_conflicts: 0,
    total_overlaps: 1,
  },
  testable: [
    {
      id: 'req-001',
      original:
        '1. The vehicle shall remain within its lane boundaries when traveling at 110 km/h on a straight 3-lane motorway with clear lane markings under daylight conditions. The vehicle must not deviate more than 0.3 m from the lane centerline at any point during a 2-minute run. Pass if maximum lateral offset < 0.3 m throughout; fail otherwise.',
      issues_found: [],
      status: 'valid',
      overlap_with: [],
      conflict_flag: false,
      conflict_id: null,
      complexity: 'MEDIUM',
      complexity_justification:
        'Straight road, clear weather, single-actor lane-keeping validation without edge cases.',
      num_scenarios: 3,
    },
    {
      id: 'req-002',
      original:
        '2. The system shall apply a corrective steering torque within 200 ms of detecting a lane departure event when the vehicle drifts toward the right lane boundary at 90 km/h on a rural highway. The corrective torque must return the vehicle to within 0.15 m of the centerline within 2 seconds of activation. Pass if both timing and re-centering conditions are met simultaneously.',
      issues_found: [],
      status: 'valid',
      overlap_with: [],
      conflict_flag: false,
      conflict_id: null,
      complexity: 'HIGH',
      complexity_justification:
        'Emergency corrective action with tight timing; failure could lead to lane departure and collision risk.',
      num_scenarios: 5,
    },
    {
      id: 'req-005',
      original:
        '5. The vehicle must maintain lane centering through a constant-radius right curve (radius = 300 m) at 80 km/h with no driver steering input. Lateral deviation from the theoretical lane centerline must remain below 0.25 m throughout the curve. Pass if deviation < 0.25 m for the entire 30-second curve traversal.',
      issues_found: [],
      status: 'valid',
      overlap_with: ['req-012'],
      conflict_flag: false,
      conflict_id: null,
      complexity: 'MEDIUM',
      complexity_justification:
        'Single-actor curve maneuver under normal conditions; moderate difficulty but no adverse weather.',
      num_scenarios: 3,
    },
    {
      id: 'req-007',
      original:
        '7. In rain with moderate intensity (25 mm/h), the LKA system must continue to provide lane keeping assistance on a motorway at 100 km/h. Maximum allowable lateral deviation is 0.4 m (relaxed from the 0.3 m dry threshold). The system must not self-deactivate due to weather alone. Pass if the system remains active and deviation stays below 0.4 m for a 90-second run.',
      issues_found: [],
      status: 'valid',
      overlap_with: [],
      conflict_flag: false,
      conflict_id: null,
      complexity: 'HIGH',
      complexity_justification:
        'Adverse weather (rain) adds sensor degradation risk and potential safety impact.',
      num_scenarios: 5,
    },
    {
      id: 'req-009',
      original:
        '9. When road camber exceeds 4 degrees on a banked motorway on-ramp at 70 km/h, the system must compensate for gravitational lateral drift and maintain the vehicle within 0.35 m of the lane centerline. Pass if deviation < 0.35 m for a 20-second banked section; fail if the vehicle reaches within 0.3 m of either lane boundary without corrective input.',
      issues_found: [],
      status: 'valid',
      overlap_with: [],
      conflict_flag: false,
      conflict_id: null,
      complexity: 'MEDIUM',
      complexity_justification:
        'Banked road adds an edge case but still single-actor and clear weather.',
      num_scenarios: 3,
    },
    {
      id: 'req-010',
      original:
        '10. On a straight road at 120 km/h, a 5-second crosswind gust of 80 km/h lateral wind speed is applied. The LKA system must counteract the resulting lateral drift and prevent a lane departure. Maximum allowable peak lateral displacement is 0.5 m, and the vehicle must return to within 0.2 m of centerline within 4 seconds of gust onset. Both conditions must be met simultaneously to pass.',
      issues_found: [],
      status: 'valid',
      overlap_with: [],
      conflict_flag: false,
      conflict_id: null,
      complexity: 'HIGH',
      complexity_justification:
        'Strong crosswind is an extreme external disturbance, high safety impact if not corrected.',
      num_scenarios: 5,
    },
    {
      id: 'req-012',
      original:
        '12. The LKA system must maintain stable operation through a 500 m S-curve segment (first curve radius = 250 m left, second = 300 m right, transition zone = 50 m) at 75 km/h. Lateral deviation must remain below 0.3 m throughout both curves and the transition. Fail if deviation exceeds 0.3 m at any point or if the system deactivates mid-maneuver.',
      issues_found: [],
      status: 'valid',
      overlap_with: ['req-005'],
      conflict_flag: false,
      conflict_id: null,
      complexity: 'MEDIUM',
      complexity_justification:
        'Multiple curves increase maneuver complexity but no adverse environment.',
      num_scenarios: 3,
    },
    {
      id: 'req-013',
      original:
        '13. At vehicle speeds below 60 km/h (LKA low-speed boundary), the system must gracefully deactivate and display an HMI notification within 1 second of speed dropping below threshold. On re-acceleration above 65 km/h, the system must re-engage automatically. Fail if the system remains active below 55 km/h or if HMI notification is delayed beyond 1 second.',
      issues_found: [],
      status: 'valid',
      overlap_with: [],
      conflict_flag: false,
      conflict_id: null,
      complexity: 'LOW',
      complexity_justification:
        'Simple speed-based deactivation/activation logic, single-actor, clear conditions.',
      num_scenarios: 1,
    },
    {
      id: 'req-015',
      original:
        '15. In a night driving scenario with low ambient light (luminance < 3 lux) and headlights active, the system must maintain lane keeping on a motorway at 100 km/h using camera-based lane detection. Deviation must remain below 0.35 m. Pass if system stays active and within deviation threshold for a 60-second run; fail if the system deactivates citing insufficient light when markings are physically visible.',
      issues_found: [],
      status: 'valid',
      overlap_with: [],
      conflict_flag: false,
      conflict_id: null,
      complexity: 'HIGH',
      complexity_justification:
        'Nighttime low-light camera operation is an adverse condition affecting sensor reliability.',
      num_scenarios: 5,
    },
    {
      id: 'req-017',
      original:
        '17. The LKA system must correctly identify and track a dashed lane marking at 130 km/h where the gap between dashes is 12 m. The system must not falsely lose tracking between dashes and must maintain centering within 0.3 m. Fail if more than 2 momentary tracking losses (each defined as confidence drop below 40% for > 150 ms) are recorded in a 1-minute run.',
      issues_found: [],
      status: 'valid',
      overlap_with: [],
      conflict_flag: false,
      conflict_id: null,
      complexity: 'MEDIUM',
      complexity_justification:
        'High speed and dashed markings increase perception difficulty but no external hazards.',
      num_scenarios: 3,
    },
    {
      id: 'req-018',
      original:
        '18. When the vehicle is on a motorway with a roadworks narrowing reducing lane width from 3.75 m to 2.9 m, the LKA system must adapt its centering target to the available lane width and maintain the vehicle at least 0.2 m from each barrier. Pass if the ego vehicle maintains the 0.2 m buffer on both sides throughout a 200 m narrow section at 90 km/h.',
      issues_found: [],
      status: 'valid',
      overlap_with: [],
      conflict_flag: false,
      conflict_id: null,
      complexity: 'MEDIUM',
      complexity_justification:
        'Dynamic lane width change adds complexity but occurs under normal weather and single-actor.',
      num_scenarios: 3,
    },
    {
      id: 'req-019',
      original:
        '19. The system must not false-trigger a lane departure warning or corrective intervention when the vehicle crosses a level crossing (with embedded rail grooves in the road surface) at 60 km/h. Rail grooves must not be misidentified as lane markings. Fail if any LKA warning or torque intervention occurs within the 20 m level crossing zone.',
      issues_found: [],
      status: 'valid',
      overlap_with: [],
      conflict_flag: false,
      conflict_id: null,
      complexity: 'MEDIUM',
      complexity_justification:
        'Specific sensor edge case (rail grooves) but no adverse weather or multi-actor risk.',
      num_scenarios: 3,
    },
    {
      id: 'req-020',
      original:
        '20. Over a continuous 30-minute motorway run at 110 km/h in mixed conditions (dry → light rain → tunnel → exit), the LKA system must maintain an overall availability rate of ≥ 95% (defined as time actively tracking and controlling divided by total run time). Each individual condition segment must not cause a deactivation lasting longer than 5 seconds. Fail if overall availability drops below 95% or if any single gap exceeds 5 seconds.',
      issues_found: [],
      status: 'valid',
      overlap_with: [],
      conflict_flag: false,
      conflict_id: null,
      complexity: 'HIGH',
      complexity_justification:
        'Multiple environmental transitions and stringent availability requirements increase safety impact.',
      num_scenarios: 5,
    },
  ],
  incomplete: [
    {
      id: 'req-003',
      original:
        '3. When the driver applies a turn signal prior to a lane change, the LKA system must disengage within 500 ms and must not apply any counteracting torque during the maneuver. The vehicle may cross the lane marking intentionally. Fail if any LKA steering torque above 0.5 Nm is detected after turn signal activation.',
      issues_found: ['missing speed', 'missing road type'],
      status: 'incomplete',
    },
    {
      id: 'req-004',
      original:
        '4. On a two-lane rural road with faded lane markings (lane visibility confidence below 60%), the LKA system must either maintain lane keeping with the same 0.3 m deviation threshold or gracefully degrade and notify the driver via HMI within 3 seconds of marking confidence dropping below threshold. Fail if the system maintains a false-confidence lane keep that deviates > 0.5 m without a driver alert.',
      issues_found: ['missing speed'],
      status: 'incomplete',
    },
    {
      id: 'req-006',
      original:
        '6. When a construction zone with temporary lane markings overlays original painted markings, the LKA system must correctly follow the temporary yellow markings rather than the legacy white markings. The vehicle must stay within the temporary lane boundaries (width = 3.2 m) with no more than 0.2 m deviation. Fail if the vehicle tracks the legacy markings instead.',
      issues_found: ['missing speed', 'missing road type'],
      status: 'incomplete',
    },
    {
      id: 'req-008',
      original:
        '8. The LKA system shall not produce a lane departure event when a large truck overtakes the ego vehicle in the adjacent lane on a motorway. The passing truck\'s lateral proximity must not trigger a false corrective intervention. Fail if LKA steering torque exceeds 2 Nm during the overtake window (defined as ±2 seconds around maximum truck-to-ego lateral proximity).',
      issues_found: ['missing speed'],
      status: 'incomplete',
    },
    {
      id: 'req-011',
      original:
        '11. When the driver applies hands-on steering input that overrides LKA, the system shall detect the override within 100 ms, suspend LKA authority, and restore LKA within 2 seconds of the driver releasing the wheel. No abrupt torque transition shall occur on handover. Fail if re-engagement torque step exceeds 3 Nm in under 200 ms.',
      issues_found: ['missing speed'],
      status: 'incomplete',
    },
    {
      id: 'req-014',
      original:
        '14. When lane markings are completely absent for a segment of 80 m (motorway under repair), the LKA system must pause lane keeping, alert the driver via HMI, and prevent any autonomous lateral control during the unmarked section. The system must re-engage within 2 seconds of re-detecting valid markings. Fail if any LKA lateral torque is applied during the unmarked segment.',
      issues_found: ['missing speed'],
      status: 'incomplete',
    },
    {
      id: 'req-016',
      original:
        '16. During a gentle lane change initiated by LKA after detecting a stationary obstacle partially in the ego lane, the system must complete the lane change within 4 seconds, not encroach on the adjacent lane by more than 0.1 m beyond the target lane\'s boundary, and not exceed a lateral jerk of 2 m/s³. All three conditions must be met simultaneously to pass.',
      issues_found: ['missing speed', 'missing road type'],
      status: 'incomplete',
    },
  ],
  duplicates: [],
  conflicts: [],
}

export const MOCK_DEMO_PIPELINE: ConversationPipeline = {
  stage: 1,
  round: 1,
  entryStage: 1,
  agentMessage: null,
  nlp: 'awaiting',
  scenario: 'idle',
  execution: 'idle',
  report: 'idle',
  engineerInput: 'Loaded from: lka_requirements_veridian.xlsx (20 raw requirements)',
  nlpResult: MOCK_DEMO_NLP_RESULT,
  nlpProgress: {},
  nlpEventQueue: [],
  scenarioResult: null,
  executionResult: null,
  reportResult: null,
  priorRounds: [],
}
