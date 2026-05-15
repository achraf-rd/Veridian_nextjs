import { flushSync } from 'react-dom'
import { create } from 'zustand'
import type { ConversationPipeline, NLPTaskProgress, ScenarioResult, ExecutionResult, ReportResult, LogLine, PipelineRound } from '@/types/pipeline'
import type { RefinementResult, ValidRequirement, IncompleteRequirement, DuplicateRequirement } from '@/types/requirements'
import type { TestCase } from '@/types/agent2'
import { MOCK_REFINEMENT } from '@/components/requirements-review/mockData'
import { MOCK_DEMO_PIPELINE } from '@/stores/mockData'
import { streamRefineRequirements, streamGenerateScenarios } from '@/services/api'

const waitForPaint = () =>
  new Promise<void>((resolve) => {
    if (typeof window === 'undefined') {
      resolve()
      return
    }
    requestAnimationFrame(() => resolve())
  })

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

function normalizeDuplicateRequirement(raw: Record<string, unknown>, index: number): DuplicateRequirement {
  return {
    id:           (raw.id as string) ?? `req-dup-${index + 1}`,
    original:     (raw.original as string) ?? '',
    reason:       (raw.reason as string) ?? 'duplicate',
    duplicate_of: (raw.duplicate_of as string | undefined) ?? undefined,
  }
}

function normalizeResult(raw: unknown): RefinementResult {
  const r = (raw ?? {}) as Record<string, unknown>
  // Support both old field name (requirements) and new (testable)
  const rawTestable = ((r.testable ?? r.requirements) as Record<string, unknown>[]) ?? []
  const rawIncomplete = (r.incomplete as Record<string, unknown>[]) ?? []
  const rawDuplicates = ((r.duplicates ?? r.removed) as Record<string, unknown>[]) ?? []
  const testable = rawTestable.map(normalizeValidRequirement)
  const incomplete = rawIncomplete.map(normalizeIncompleteRequirement)
  const duplicates = rawDuplicates.map(normalizeDuplicateRequirement)
  const summary = (r.summary as Record<string, unknown>) ?? {}

  // Compute total_overlaps from data if not provided
  const overlapPairs = new Set<string>()
  for (const req of testable) {
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
      total_raw:        (summary.total_raw as number)        ?? (testable.length + incomplete.length),
      total_testable:   ((summary.total_testable ?? summary.total_valid) as number) ?? testable.length,
      total_incomplete: (summary.total_incomplete as number) ?? incomplete.length,
      total_duplicates: ((summary.total_duplicates ?? summary.total_removed) as number) ?? duplicates.length,
      total_conflicts:  (summary.total_conflicts as number)  ?? 0,
      total_overlaps:   (summary.total_overlaps as number)   ?? overlapPairs.size,
    },
    testable,
    incomplete,
    duplicates,
    conflicts: (r.conflicts as RefinementResult['conflicts']) ?? [],
  }
}

function normalizeTestCase(raw: Record<string, unknown>, index: number): TestCase {
  return {
    scenario_id:         (raw.scenario_id as string)               ?? `TC-${String(index + 1).padStart(3, '0')}`,
    covers_requirements: (raw.covers_requirements as string[])     ?? [],
    feature_under_test:  (raw.feature_under_test as string)        ?? '',
    complexity:          (raw.complexity as TestCase['complexity']) ?? 'MEDIUM',
    test_phase:          (raw.test_phase as TestCase['test_phase']) ?? 'SIL',
    tags:                (raw.tags as string[])                    ?? [],
    description:         (raw.description as string)               ?? '',
    preconditions:       (raw.preconditions as string[] | undefined),
    environment:         (raw.environment as TestCase['environment']) ?? { map: 'Town03', weather: 'clear', lighting: 'daylight' },
    ego_vehicle:         (raw.ego_vehicle as TestCase['ego_vehicle']) ?? { state: 'driving', lane: '1', initial_speed: 50, set_speed: null, parameters: {} },
    actors:              (raw.actors as TestCase['actors'])         ?? [],
    'test case':         (raw['test case'] as TestCase['test case']) ?? [],
    type:                'test_case',
  }
}

function testCaseToScenarioFile(tc: TestCase, index: number) {
  return {
    id:       `s-${String(index + 1).padStart(3, '0')}`,
    filename: `${tc.scenario_id}.xosc`,
    type:     'xosc' as const,
    warnings: [] as string[],
  }
}

const MOCK_TEST_CASES: TestCase[] = [
  {
    scenario_id: 'TC-req-001-01',
    covers_requirements: ['req-001'],
    feature_under_test: 'AEB pedestrian detection at 50 km/h',
    complexity: 'MEDIUM',
    test_phase: 'SIL',
    tags: ['nominal', 'pedestrian'],
    description: 'Ego vehicle approaches a crossing pedestrian at 50 km/h; AEB must activate and stop before contact.',
    preconditions: ['Ego speed stabilized at 50 km/h', 'No prior brake application', 'Clear lane ahead'],
    environment: { map: 'Town03', weather: 'clear', lighting: 'daylight' },
    ego_vehicle: { state: 'driving', lane: '1', initial_speed: 50, set_speed: null, parameters: {} },
    actors: [
      { id: 'ped-001', type: 'pedestrian', lane: 'crossing', initial_distance: 15, speed: 3, behavior: 'cross_left_to_right' },
    ],
    'test case': [
      { step: 1, action: 'Ego approaches pedestrian at 50 km/h', reaction: 'AEB system pre-charges brakes', pass_criteria: 'TTC ≤ 2.0 s triggers pre-charge' },
      { step: 2, action: 'AEB applies emergency braking', reaction: 'Vehicle decelerates at ≥ 8 m/s²', pass_criteria: 'Deceleration ≥ 8 m/s²' },
      { step: 3, action: 'Vehicle comes to full stop', reaction: 'Pedestrian passes unharmed', pass_criteria: 'Stop distance ≤ 12 m from pedestrian' },
    ],
    type: 'test_case',
  },
  {
    scenario_id: 'TC-req-002-01',
    covers_requirements: ['req-002'],
    feature_under_test: 'AEB city stop — stationary obstacle',
    complexity: 'LOW',
    test_phase: 'SIL',
    tags: ['nominal', 'boundary'],
    description: 'Ego approaches a stationary vehicle in urban environment at 30 km/h; must stop within 5 m.',
    preconditions: ['Ego speed at 30 km/h', 'Stationary target vehicle placed 20 m ahead'],
    environment: { map: 'Town04', weather: 'cloudy', lighting: 'daylight' },
    ego_vehicle: { state: 'driving', lane: '1', initial_speed: 30, set_speed: 30, parameters: {} },
    actors: [
      { id: 'veh-001', type: 'car', lane: '1', initial_distance: 20, speed: 0, behavior: 'stationary' },
    ],
    'test case': [
      { step: 1, action: 'Ego drives at 30 km/h toward stationary car', reaction: 'ADAS detects obstacle', pass_criteria: 'Detection at ≥ 15 m distance' },
      { step: 2, action: 'AEB triggers emergency stop', reaction: 'Ego decelerates', pass_criteria: 'No collision — ego stops ≤ 5 m from target' },
    ],
    type: 'test_case',
  },
  {
    scenario_id: 'TC-req-005-01',
    covers_requirements: ['req-005'],
    feature_under_test: 'Lane Keeping Assist — highway drift correction',
    complexity: 'LOW',
    test_phase: 'SIL',
    tags: ['nominal'],
    description: 'Ego drifts toward lane boundary at 70 km/h; LKA must apply corrective steering within 200 ms.',
    environment: { map: 'Town06', weather: 'clear', lighting: 'daylight' },
    ego_vehicle: { state: 'drifting_right', lane: '2', initial_speed: 70, set_speed: 70, parameters: {} },
    actors: [],
    'test case': [
      { step: 1, action: 'Ego begins rightward drift at 70 km/h', reaction: 'LKA detects lane departure', pass_criteria: 'Lane departure detected within 100 ms' },
      { step: 2, action: 'LKA applies corrective steering torque', reaction: 'Ego returns to lane center', pass_criteria: 'Lateral deviation ≤ 0.3 m from center' },
    ],
    type: 'test_case',
  },
  {
    scenario_id: 'TC-req-007-01',
    covers_requirements: ['req-007'],
    feature_under_test: 'AEB — bicycle cut-in at intersection',
    complexity: 'HIGH',
    test_phase: 'SIL+HIL',
    tags: ['edge_case', 'boundary'],
    description: 'Cyclist cuts into ego lane from right at intersection; ego must brake to avoid collision in < 250 ms.',
    preconditions: ['Ego speed 50 km/h', 'Intersection T-junction', 'Cyclist initially out of sensor range'],
    environment: { map: 'Town05', weather: 'rain', lighting: 'overcast' },
    ego_vehicle: { state: 'driving', lane: '1', initial_speed: 50, set_speed: null, parameters: {} },
    actors: [
      { id: 'cyc-001', type: 'bicycle', lane: 'crossing', initial_distance: 8, speed: 5, behavior: 'cut_in_right' },
    ],
    'test case': [
      { step: 1, action: 'Cyclist enters sensor FOV at 8 m', reaction: 'ADAS classifies object as bicycle', pass_criteria: 'Classification latency ≤ 80 ms' },
      { step: 2, action: 'AEB emergency stop triggered', reaction: 'Ego decelerates at max rate', pass_criteria: 'Full stop within 7 m of cyclist' },
      { step: 3, action: 'Post-stop stability check', reaction: 'Ego remains in lane', pass_criteria: 'No lane departure after stop' },
    ],
    type: 'test_case',
  },
  {
    scenario_id: 'TC-req-009-01',
    covers_requirements: ['req-009'],
    feature_under_test: 'Adaptive Cruise Control — following distance maintenance',
    complexity: 'MEDIUM',
    test_phase: 'SIL',
    tags: ['nominal', 'performance'],
    description: 'Ego follows a lead vehicle at 100 km/h; ACC must maintain 2 s headway when lead decelerates.',
    preconditions: ['Lead vehicle 50 m ahead', 'Highway, no lane changes'],
    environment: { map: 'Town06', weather: 'clear', lighting: 'daylight' },
    ego_vehicle: { state: 'cruising', lane: '1', initial_speed: 100, set_speed: 100, parameters: {} },
    actors: [
      { id: 'veh-lead', type: 'car', lane: '1', initial_distance: 50, speed: 100, behavior: 'decelerate_to_60' },
    ],
    'test case': [
      { step: 1, action: 'Lead vehicle decelerates from 100 to 60 km/h', reaction: 'ACC detects speed change', pass_criteria: 'Speed change detected within 150 ms' },
      { step: 2, action: 'ACC reduces ego speed proportionally', reaction: 'Headway increases then stabilizes', pass_criteria: 'Headway 1.8 – 2.2 s during deceleration' },
      { step: 3, action: 'Lead vehicle holds 60 km/h', reaction: 'Ego settles at 60 km/h', pass_criteria: 'Ego speed within ±2 km/h of lead' },
    ],
    type: 'test_case',
  },
  {
    scenario_id: 'TC-req-012-01',
    covers_requirements: ['req-012'],
    feature_under_test: 'AEB — wet road braking performance',
    complexity: 'HIGH',
    test_phase: 'SIL+HIL',
    tags: ['performance', 'boundary'],
    description: 'Ego brakes on wet road at 80 km/h; AEB must compensate for reduced friction and avoid collision.',
    preconditions: ['Road surface wet (µ = 0.5)', 'No ABS activation before test'],
    environment: { map: 'Town03', weather: 'heavy_rain', lighting: 'overcast' },
    ego_vehicle: { state: 'driving', lane: '1', initial_speed: 80, set_speed: null, parameters: { road_friction: 0.5 } },
    actors: [
      { id: 'veh-002', type: 'car', lane: '1', initial_distance: 25, speed: 0, behavior: 'stationary' },
    ],
    'test case': [
      { step: 1, action: 'Ego approaches stationary car at 80 km/h on wet surface', reaction: 'AEB pre-charges and activates ABS', pass_criteria: 'ABS activated within 50 ms of AEB trigger' },
      { step: 2, action: 'Controlled deceleration on wet road', reaction: 'Ego decelerates without skid', pass_criteria: 'Yaw rate ≤ 5°/s during braking' },
      { step: 3, action: 'Vehicle stops before obstacle', reaction: 'No collision', pass_criteria: 'Stop distance ≤ 30 m from obstacle' },
    ],
    type: 'test_case',
  },
  {
    scenario_id: 'TC-req-015-01',
    covers_requirements: ['req-015'],
    feature_under_test: 'LKA — false positive suppression on lane merge',
    complexity: 'MEDIUM',
    test_phase: 'SIL+HIL',
    tags: ['edge_case', 'nominal'],
    description: 'Ego performs intentional lane change; LKA must not apply corrective steering when turn signal is active.',
    preconditions: ['Turn signal active for ≥ 0.5 s before maneuver', 'Adjacent lane clear'],
    environment: { map: 'Town06', weather: 'clear', lighting: 'daylight' },
    ego_vehicle: { state: 'lane_change_signaled', lane: '2', initial_speed: 90, set_speed: 90, parameters: {} },
    actors: [],
    'test case': [
      { step: 1, action: 'Ego activates right turn signal', reaction: 'LKA suppression engaged', pass_criteria: 'LKA torque = 0 within 100 ms of signal' },
      { step: 2, action: 'Ego crosses lane marking', reaction: 'No corrective steering applied', pass_criteria: 'Steering torque from LKA < 0.5 Nm' },
      { step: 3, action: 'Ego settles in lane 3, signal off', reaction: 'LKA resumes normal operation', pass_criteria: 'LKA active within 1.0 s of signal off' },
    ],
    type: 'test_case',
  },
  {
    scenario_id: 'TC-req-016-01',
    covers_requirements: ['req-016'],
    feature_under_test: 'AEB — night-time pedestrian detection',
    complexity: 'LOW',
    test_phase: 'SIL',
    tags: ['nominal', 'edge_case'],
    description: 'Ego approaches pedestrian at night with headlights active; AEB must trigger within TTC threshold.',
    environment: { map: 'Town03', weather: 'clear', lighting: 'night' },
    ego_vehicle: { state: 'driving', lane: '1', initial_speed: 40, set_speed: null, parameters: { headlights: true } },
    actors: [
      { id: 'ped-002', type: 'pedestrian', lane: 'crossing', initial_distance: 12, speed: 1.5, behavior: 'cross_left_to_right' },
    ],
    'test case': [
      { step: 1, action: 'Ego headlights illuminate pedestrian at 12 m', reaction: 'Camera and radar detect pedestrian', pass_criteria: 'Detection within 200 ms at 12 m range' },
      { step: 2, action: 'AEB triggers', reaction: 'Emergency braking applied', pass_criteria: 'TTC at trigger ≥ 1.2 s' },
    ],
    type: 'test_case',
  },
  {
    scenario_id: 'TC-req-016-02',
    covers_requirements: ['req-016'],
    feature_under_test: 'AEB — night-time pedestrian, oncoming glare',
    complexity: 'HIGH',
    test_phase: 'SIL+HIL',
    tags: ['edge_case', 'boundary'],
    description: 'Oncoming headlights cause sensor glare; AEB must still detect pedestrian and brake in time.',
    preconditions: ['Oncoming vehicle 40 m ahead with high-beam lights', 'Pedestrian in ego lane'],
    environment: { map: 'Town03', weather: 'clear', lighting: 'night' },
    ego_vehicle: { state: 'driving', lane: '1', initial_speed: 40, set_speed: null, parameters: { headlights: true } },
    actors: [
      { id: 'ped-003', type: 'pedestrian', lane: '1', initial_distance: 10, speed: 0, behavior: 'stationary' },
      { id: 'veh-oncoming', type: 'car', lane: 'oncoming', initial_distance: 40, speed: 50, behavior: 'approach_high_beam' },
    ],
    'test case': [
      { step: 1, action: 'Oncoming vehicle triggers glare on ego sensors', reaction: 'Radar continues tracking, camera degrades', pass_criteria: 'Radar maintains object lock through glare' },
      { step: 2, action: 'AEB triggers on radar track alone', reaction: 'Emergency braking', pass_criteria: 'Braking initiated within 300 ms of radar-only detection' },
      { step: 3, action: 'Ego stops before pedestrian', reaction: 'No collision', pass_criteria: 'Stopping distance ≤ 8 m' },
    ],
    type: 'test_case',
  },
  {
    scenario_id: 'TC-req-016-03',
    covers_requirements: ['req-016'],
    feature_under_test: 'AEB — night-time, pedestrian in dark clothing',
    complexity: 'MEDIUM',
    test_phase: 'SIL',
    tags: ['boundary', 'performance'],
    description: 'Pedestrian wearing dark clothes at night; tests camera minimum detection threshold.',
    environment: { map: 'Town03', weather: 'clear', lighting: 'night' },
    ego_vehicle: { state: 'driving', lane: '1', initial_speed: 35, set_speed: 35, parameters: { headlights: true } },
    actors: [
      { id: 'ped-004', type: 'pedestrian', lane: 'crossing', initial_distance: 10, speed: 2, behavior: 'cross_right_to_left' },
    ],
    'test case': [
      { step: 1, action: 'Ego approaches low-reflectivity pedestrian at night', reaction: 'Sensor fusion detects partial signature', pass_criteria: 'Object classified within 250 ms at 10 m' },
      { step: 2, action: 'AEB triggers', reaction: 'Full emergency braking', pass_criteria: 'No collision; TTC at trigger ≥ 1.0 s' },
    ],
    type: 'test_case',
  },
  {
    scenario_id: 'TC-req-016-04',
    covers_requirements: ['req-016'],
    feature_under_test: 'AEB — night-time, group of pedestrians',
    complexity: 'HIGH',
    test_phase: 'SIL+HIL',
    tags: ['edge_case'],
    description: 'Multiple pedestrians crossing at night; AEB targets nearest and avoids false prioritization.',
    preconditions: ['3 pedestrians at staggered distances: 8 m, 12 m, 18 m'],
    environment: { map: 'Town03', weather: 'clear', lighting: 'night' },
    ego_vehicle: { state: 'driving', lane: '1', initial_speed: 40, set_speed: null, parameters: { headlights: true } },
    actors: [
      { id: 'ped-005', type: 'pedestrian', lane: 'crossing', initial_distance: 8, speed: 1, behavior: 'cross_left_to_right' },
      { id: 'ped-006', type: 'pedestrian', lane: 'crossing', initial_distance: 12, speed: 2, behavior: 'stationary' },
      { id: 'ped-007', type: 'pedestrian', lane: 'crossing', initial_distance: 18, speed: 3, behavior: 'cross_right_to_left' },
    ],
    'test case': [
      { step: 1, action: 'Sensor identifies 3 pedestrian signatures', reaction: 'Tracker assigns threat levels', pass_criteria: 'Nearest pedestrian (8 m) has highest threat score' },
      { step: 2, action: 'AEB brakes for nearest pedestrian', reaction: 'Ego stops before 8 m pedestrian', pass_criteria: 'No contact with any pedestrian' },
    ],
    type: 'test_case',
  },
  {
    scenario_id: 'TC-req-016-05',
    covers_requirements: ['req-016'],
    feature_under_test: 'AEB — night-time, high-speed approach',
    complexity: 'HIGH',
    test_phase: 'SIL',
    tags: ['performance', 'boundary'],
    description: 'Ego approaches pedestrian at 60 km/h at night; validates extended braking distance margin.',
    environment: { map: 'Town06', weather: 'clear', lighting: 'night' },
    ego_vehicle: { state: 'driving', lane: '1', initial_speed: 60, set_speed: null, parameters: { headlights: true } },
    actors: [
      { id: 'ped-008', type: 'pedestrian', lane: '1', initial_distance: 20, speed: 0, behavior: 'stationary' },
    ],
    'test case': [
      { step: 1, action: 'Ego travels 60 km/h toward stationary pedestrian at night', reaction: 'Detection at headlight range limit', pass_criteria: 'Detection at ≥ 18 m distance' },
      { step: 2, action: 'AEB full activation', reaction: 'Maximum deceleration applied', pass_criteria: 'Deceleration ≥ 9 m/s²' },
      { step: 3, action: 'Ego stops before pedestrian', reaction: 'No collision', pass_criteria: 'Stop within 19 m from start of braking' },
    ],
    type: 'test_case',
  },
]

const MOCK_TEST_CASES_V2: TestCase[] = [
  ...MOCK_TEST_CASES,
  {
    scenario_id: 'TC-req-020-01',
    covers_requirements: ['req-020'],
    feature_under_test: 'AEB — motorcycle detection at highway speeds',
    complexity: 'HIGH',
    test_phase: 'SIL+HIL',
    tags: ['edge_case', 'performance'],
    description: 'Ego approaches a slow-moving motorcycle at 110 km/h on highway; narrow profile challenges radar.',
    preconditions: ['Ego in cruise at 110 km/h', 'Motorcycle 40 m ahead at 40 km/h'],
    environment: { map: 'Town06', weather: 'clear', lighting: 'daylight' },
    ego_vehicle: { state: 'cruising', lane: '1', initial_speed: 110, set_speed: 110, parameters: {} },
    actors: [
      { id: 'moto-001', type: 'motorcycle', lane: '1', initial_distance: 40, speed: 40, behavior: 'constant_speed' },
    ],
    'test case': [
      { step: 1, action: 'Radar tracks narrow motorcycle at 40 m', reaction: 'Object classified as motorcycle', pass_criteria: 'Classification confidence ≥ 85 %' },
      { step: 2, action: 'ACC/AEB hand-off: closing speed > threshold', reaction: 'AEB takes over from ACC', pass_criteria: 'Hand-off latency ≤ 50 ms' },
      { step: 3, action: 'Emergency braking from 110 km/h', reaction: 'Ego decelerates', pass_criteria: 'No collision; TTC at intervention ≥ 1.5 s' },
    ],
    type: 'test_case',
  },
  {
    scenario_id: 'TC-req-022-01',
    covers_requirements: ['req-022'],
    feature_under_test: 'Driver monitoring — attention alert',
    complexity: 'LOW',
    test_phase: 'SIL',
    tags: ['nominal'],
    description: 'Driver gaze leaves road for > 3 s; DMS must trigger audible and visual alert.',
    preconditions: ['Ego in highway cruise at 90 km/h', 'DMS camera active'],
    environment: { map: 'Town06', weather: 'clear', lighting: 'daylight' },
    ego_vehicle: { state: 'cruising', lane: '1', initial_speed: 90, set_speed: 90, parameters: { dms_active: true } },
    actors: [],
    'test case': [
      { step: 1, action: 'Simulated driver gaze off-road for 3.1 s', reaction: 'DMS detects inattention', pass_criteria: 'Inattention flag set within 100 ms of 3 s threshold' },
      { step: 2, action: 'Alert triggered', reaction: 'Audio + HMI visual alert', pass_criteria: 'Alert latency ≤ 200 ms from flag' },
    ],
    type: 'test_case',
  },
]

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
  testCases: MOCK_TEST_CASES,
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
  testCases: MOCK_TEST_CASES_V2,
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

type SetFn = (fn: (s: PipelineStore) => Partial<PipelineStore>) => void
type GetFn = () => PipelineStore

async function runScenarioGeneration(id: string, set: SetFn, get: GetFn) {
  const nlpResult = get().pipelines[id]?.nlpResult
  if (!nlpResult) return

  // Reset the live event queue and mark the start of this run
  set((s) => {
    const p = s.pipelines[id]
    if (!p) return s
    return { pipelines: { ...s.pipelines, [id]: { ...p, scenarioEventQueue: [], scenarioStartedAt: new Date().toISOString() } } }
  })

  try {
    for await (const event of streamGenerateScenarios({
      refining_id:  nlpResult.refining_id ?? null,
      feature:      nlpResult.feature     ?? null,
      requirements: nlpResult.testable    as unknown as Record<string, unknown>[],
    })) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[SSE agent2] ${event.type}`, event)
      }

      if (event.type === 'progress') {
        set((s) => {
          const p = s.pipelines[id]
          if (!p || p.scenario !== 'processing') return s
          const scenarioEventQueue = [...(p.scenarioEventQueue ?? []), { message: event.message }]
          return { pipelines: { ...s.pipelines, [id]: { ...p, scenarioEventQueue } } }
        })
      } else if (event.type === 'result') {
        const testCases = event.output.scenarios.map(normalizeTestCase)
        const scenarioResult: ScenarioResult = {
          total:    event.output.total_scenarios,
          warnings: 0,
          scenarios: testCases.map(testCaseToScenarioFile),
          testCases,
        }
        set((s) => {
          const p = s.pipelines[id]
          if (!p || p.scenario !== 'processing') return s
          return { pipelines: { ...s.pipelines, [id]: { ...p, scenario: 'awaiting' as const, scenarioResult, scenarioFinishedAt: new Date().toISOString() } } }
        })
      } else if (event.type === 'error') {
        set((s) => {
          const p = s.pipelines[id]
          if (!p) return s
          return { pipelines: { ...s.pipelines, [id]: { ...p, scenario: 'failed' as const } } }
        })
      }
    }
  } catch (err) {
    console.error('[pipeline] Scenario generation stream failed:', err)
    set((s) => {
      const p = s.pipelines[id]
      if (!p) return s
      return { pipelines: { ...s.pipelines, [id]: { ...p, scenario: 'failed' as const } } }
    })
  }

  const updated = get().pipelines[id]
  if (updated) {
    fetch(`/api/conversations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pipeline: updated }),
    }).catch((err) => console.error('Failed to sync scenario result:', err))
  }
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
  hydrate: (conversationId?: string) => Promise<void>
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

    hydrate: async (conversationId?: string) => {
      if (typeof window === 'undefined') return
      try {
        if (conversationId) {
          // Skip if already loaded for this conversation (e.g. set by submit())
          if (get().pipelines[conversationId] !== undefined) {
            set({ hasHydrated: true })
            return
          }
          const response = await fetch(`/api/conversations/${conversationId}`)
          if (response.ok) {
            const conv = await response.json()
            const pipeline = conv.pipeline || BLANK
            set((s) => ({
              pipelines: { ...s.pipelines, [conversationId]: pipeline },
              hasHydrated: true,
            }))
            return
          }
          // API failed — seed blank so the composer shows
          set((s) => ({
            pipelines: { ...s.pipelines, [conversationId]: BLANK },
            hasHydrated: true,
          }))
          return
        }

        // No ID: load all from localStorage once (demo / legacy)
        if (get().hasHydrated) return
        const stored = localStorage.getItem('veridian-pipelines')
        let pipelines = stored ? JSON.parse(stored) : {}
        const existing = pipelines['conv-1']
        const isStale = existing?.nlpResult && !('incomplete' in existing.nlpResult)
        if (!existing || isStale) {
          pipelines['conv-1'] = MOCK_DEMO_PIPELINE
        }
        set({ pipelines, hasHydrated: true })
      } catch (err) {
        console.error('Error hydrating pipeline:', err)
        set({ hasHydrated: true })
      }
    },

    getPipeline: (id) => get().pipelines[id] ?? BLANK,

  submit: (id, requirements, label) => {
    const engineerInput = label ?? requirements.join('\n')
    set((s) => {
      const existing = s.pipelines[id]
      let priorRounds = existing?.priorRounds ?? []
      let round = existing?.round ?? 1

      // Freeze current round into history if it has any data, so thread is not lost.
      if (existing?.nlpResult) {
        const frozen: PipelineRound = {
          round: existing.round,
          completedAt: new Date().toISOString(),
          engineerInput: existing.engineerInput ?? '',
          nlpResult: existing.nlpResult,
          scenarioResult: existing.scenarioResult,
          executionResult: existing.executionResult,
          reportResult: existing.reportResult,
        }
        priorRounds = [...priorRounds, frozen]
        round = existing.round + 1
      }

      return {
        hasHydrated: true,
        pipelines: {
          ...s.pipelines,
          [id]: { ...BLANK, stage: 1 as const, nlp: 'processing' as const, engineerInput, priorRounds, round, nlpStartedAt: new Date().toISOString() },
        },
      }
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
              const updated = { ...p, nlp: 'awaiting' as const, nlpResult: normalizeResult(event.output), nlpProgress: {}, nlpFinishedAt: new Date().toISOString() }
              return { pipelines: { ...s.pipelines, [id]: updated } }
            })

            // Sync to API after NLP result
            const p = get().pipelines[id]
            if (p) {
              fetch(`/api/conversations/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pipeline: p }),
              }).catch((err) => console.error('Failed to sync NLP result:', err))
            }
          } else if (event.type === 'error') {
            set((s) => {
              const p = s.pipelines[id]
              if (!p) return s
              const updated = { ...p, nlp: 'failed' as const, nlpProgress: {} }
              return { pipelines: { ...s.pipelines, [id]: updated } }
            })
          }
        }
      } catch (err) {
        console.error('[pipeline] SSE stream error:', err)
        set((s) => {
          const p = s.pipelines[id]
          if (!p) return s
          const updated = { ...p, nlp: 'failed' as const, nlpProgress: {} }
          return { pipelines: { ...s.pipelines, [id]: updated } }
        })
      }
    })()
  },

  approveNLP: (id) => {
    set((s) => {
      const p = s.pipelines[id]
      if (!p) return s
      const updated = { ...p, nlp: 'approved' as const, stage: 2 as const, scenario: 'processing' as const, scenarioStartedAt: new Date().toISOString() }
      return { pipelines: { ...s.pipelines, [id]: updated } }
    })

    // Sync to API
    const p = get().pipelines[id]
    if (p) {
      fetch(`/api/conversations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipeline: get().pipelines[id] }),
      }).catch((err) => console.error('Failed to sync NLP approval:', err))
    }

    runScenarioGeneration(id, set, get)
  },

  approveScenario: (id) => {
    set((s) => {
      const p = s.pipelines[id]
      if (!p) return s
      const updated = { ...p, scenario: 'approved' as const, stage: 3 as const, execution: 'processing' as const, executionStartedAt: new Date().toISOString() }
      return { pipelines: { ...s.pipelines, [id]: updated } }
    })

    // Sync to API
    const p = get().pipelines[id]
    if (p) {
      fetch(`/api/conversations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipeline: get().pipelines[id] }),
      }).catch((err) => console.error('Failed to sync scenario approval:', err))
    }

    setTimeout(() => {
      set((s) => {
        const p = s.pipelines[id]
        if (!p || p.execution !== 'processing') return s
        const logs = p.round > 1 ? MOCK_LOGS_V2 : MOCK_LOGS
        const report = p.round > 1 ? REPORT_RESULT_V2 : REPORT_RESULT
        const updated = {
          ...p,
          execution: 'approved' as const,
          executionResult: { total: p.scenarioResult?.total ?? 47, passed: p.round > 1 ? 51 : 44, failed: p.round > 1 ? 1 : 2, requeued: 1, logs },
          executionFinishedAt: new Date().toISOString(),
          stage: 4 as const,
          report: 'awaiting' as const,
          reportResult: report,
          reportStartedAt: new Date().toISOString(),
          reportFinishedAt: new Date().toISOString(),
        }
        return { pipelines: { ...s.pipelines, [id]: updated } }
      })

      // Sync execution complete state
      const updated = get().pipelines[id]
      if (updated) {
        fetch(`/api/conversations/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pipeline: updated }),
        }).catch((err) => console.error('Failed to sync execution complete:', err))
      }
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
      return newState as Partial<PipelineStore>
    })

    // Sync to API
    fetch(`/api/conversations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pipeline: newPipeline }),
    }).catch((err) => console.error('Failed to sync refactor:', err))

    if (entryStage === 1) {
      // Re-run from NLP
      setTimeout(() => {
        set((s) => {
          const cur = s.pipelines[id]
          if (!cur || cur.nlp !== 'processing') return s
          const updated = { ...cur, nlp: 'awaiting' as const, nlpResult: MOCK_REFINEMENT }
          return { pipelines: { ...s.pipelines, [id]: updated } }
        })

        // Sync NLP result
        const updated = get().pipelines[id]
        if (updated) {
          fetch(`/api/conversations/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pipeline: updated }),
          }).catch((err) => console.error('Failed to sync NLP refactor result:', err))
        }
      }, 2500)
    } else {
      // Re-run from Scenario Generator
      runScenarioGeneration(id, set, get)
    }
  },
  }
})
