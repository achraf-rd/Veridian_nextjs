import type { RefinementResult } from '@/types/requirements'

export const MOCK_REFINEMENT: RefinementResult = {
  refining_id: '102253fd',
  feature: 'LKA',
  source_file: 'requirements_v2.xlsx',
  pipeline_status: {
    status: 'blocked',
    reason: '1 conflict must be resolved before proceeding to Scenario Generator.',
    blocked_by: ['conflict-001'],
  },
  summary: {
    total_raw: 20,
    total_refined: 19,
    total_removed: 1,
    total_conflicts: 1,
    total_overlaps: 2,
  },
  requirements: [
    {
      id: 'req-001',
      original:
        'The vehicle shall remain within its lane boundaries when traveling at 110 km/h on highways.',
      refined:
        'The vehicle shall remain within its lane boundaries when traveling at speeds between 70 km/h and 110 km/h on highways.',
      issues_found: ['ambiguous speed range'],
      status: 'conflict',
      overlap_with: [],
      conflict_flag: true,
      conflict_id: 'conflict-001',
      complexity: 'HIGH',
      complexity_justification:
        'Multiple speed bands and continuous lane-keeping behavior require sweep scenarios across the operating envelope.',
      num_scenarios: 5,
    },
    {
      id: 'req-002',
      original:
        'The system shall apply a corrective steering torque within 200 ms when lane departure is predicted.',
      refined:
        'The system shall apply a corrective steering torque within 200 ms of predicted lane departure.',
      issues_found: ['ambiguous phrasing'],
      status: 'refined',
      overlap_with: [],
      conflict_flag: false,
      conflict_id: null,
      complexity: 'MEDIUM',
      complexity_justification:
        'A single timing requirement verified under normal driving — 3 scenarios cover nominal, boundary, and degraded conditions.',
      num_scenarios: 3,
    },
    {
      id: 'req-003',
      original:
        'The LKA shall disengage when the driver applies steering torque above 3 Nm.',
      refined:
        'The LKA shall disengage when the driver applies steering torque above 3 Nm for longer than 500 ms.',
      issues_found: ['missing temporal qualifier'],
      status: 'refined',
      overlap_with: [],
      conflict_flag: false,
      conflict_id: null,
      complexity: 'LOW',
      complexity_justification:
        'Discrete boolean disengagement event — 1 scenario verifies the override threshold.',
      num_scenarios: 1,
    },
    {
      id: 'req-004',
      original:
        'The system shall operate on straight and curved road segments with radius ≥ 250 m.',
      refined:
        'The system shall operate on straight and curved road segments with radius ≥ 250 m.',
      issues_found: [],
      status: 'unchanged',
      overlap_with: [],
      conflict_flag: false,
      conflict_id: null,
      complexity: 'MEDIUM',
      complexity_justification:
        'Two distinct geometry classes (straight, curved) require separate coverage.',
      num_scenarios: 3,
    },
    {
      id: 'req-005',
      original:
        'The lateral deviation from lane center shall not exceed 0.3 m during steady-state driving.',
      refined:
        'The lateral deviation from lane center shall not exceed 0.3 m during steady-state driving on straight sections.',
      issues_found: ['unspecified road geometry'],
      status: 'overlap',
      overlap_with: ['req-012'],
      conflict_flag: false,
      conflict_id: null,
      complexity: 'MEDIUM',
      complexity_justification:
        'Steady-state performance requires varied speeds and wind conditions — 3 scenarios.',
      num_scenarios: 3,
    },
    {
      id: 'req-006',
      original:
        'The system shall emit a visual warning to the driver when lane departure is imminent.',
      refined:
        'The system shall emit a visual warning to the driver when lane departure is imminent.',
      issues_found: [],
      status: 'unchanged',
      overlap_with: [],
      conflict_flag: false,
      conflict_id: null,
      complexity: 'LOW',
      complexity_justification:
        'Single HMI event triggered by a known predicate — 1 scenario.',
      num_scenarios: 1,
    },
    {
      id: 'req-007',
      original:
        'The lane keeping assist shall only operate above 60 km/h and shall disengage below 65 km/h.',
      refined:
        'The lane keeping assist shall operate at speeds above 60 km/h and shall disengage when vehicle speed drops below 65 km/h.',
      issues_found: ['ambiguous speed range'],
      status: 'conflict',
      overlap_with: [],
      conflict_flag: true,
      conflict_id: 'conflict-001',
      complexity: 'HIGH',
      complexity_justification:
        'Covers engagement and disengagement across a narrow hysteresis band — 5 scenarios required.',
      num_scenarios: 5,
    },
    {
      id: 'req-008',
      original:
        'The system shall use camera and radar fusion for lane detection.',
      refined:
        'The system shall use camera and radar sensor fusion for lane detection.',
      issues_found: ['minor phrasing'],
      status: 'refined',
      overlap_with: [],
      conflict_flag: false,
      conflict_id: null,
      complexity: 'LOW',
      complexity_justification:
        'Architectural constraint, verified indirectly via detection performance — 1 scenario.',
      num_scenarios: 1,
    },
    {
      id: 'req-009',
      original:
        'The system shall reduce torque assistance gradually when approaching system limits.',
      refined:
        'The system shall reduce torque assistance gradually over no less than 1.5 s when approaching system operational limits.',
      issues_found: ['unquantified ramp-down'],
      status: 'refined',
      overlap_with: [],
      conflict_flag: false,
      conflict_id: null,
      complexity: 'MEDIUM',
      complexity_justification:
        'Ramp-down behavior needs verification near multiple boundary conditions — 3 scenarios.',
      num_scenarios: 3,
    },
    {
      id: 'req-010',
      original:
        'The system shall log all disengagement events to the vehicle data recorder.',
      refined:
        'The system shall log all disengagement events to the vehicle data recorder.',
      issues_found: [],
      status: 'unchanged',
      overlap_with: [],
      conflict_flag: false,
      conflict_id: null,
      complexity: 'LOW',
      complexity_justification:
        'Passive logging requirement verified via a single end-to-end scenario.',
      num_scenarios: 1,
    },
    {
      id: 'req-011',
      original:
        'The system shall not apply steering assistance when the driver has their hands off the wheel for more than 10 seconds.',
      refined:
        'The system shall suspend steering assistance when the driver keeps their hands off the wheel for more than 10 seconds continuously.',
      issues_found: ['ambiguous phrasing'],
      status: 'refined',
      overlap_with: [],
      conflict_flag: false,
      conflict_id: null,
      complexity: 'MEDIUM',
      complexity_justification:
        'Hands-off detection and timeout behavior under varied attention states — 3 scenarios.',
      num_scenarios: 3,
    },
    {
      id: 'req-012',
      original:
        'The lateral deviation from the lane centerline shall remain under 0.3 m.',
      refined:
        'The lateral deviation from the lane centerline shall remain under 0.3 m during curved segments of radius ≥ 250 m.',
      issues_found: ['unspecified road geometry'],
      status: 'overlap',
      overlap_with: ['req-005'],
      conflict_flag: false,
      conflict_id: null,
      complexity: 'MEDIUM',
      complexity_justification:
        'Curved geometry and variable speeds require multiple scenarios — 3 runs.',
      num_scenarios: 3,
    },
    {
      id: 'req-013',
      original:
        'The system shall be deactivated automatically when the turn indicator is engaged.',
      refined:
        'The system shall deactivate automatically when the turn indicator is engaged by the driver.',
      issues_found: ['passive voice'],
      status: 'refined',
      overlap_with: [],
      conflict_flag: false,
      conflict_id: null,
      complexity: 'LOW',
      complexity_justification:
        'Deactivation triggered by a single input event — 1 scenario.',
      num_scenarios: 1,
    },
    {
      id: 'req-014',
      original:
        'The LKA shall function in daylight and night-time conditions.',
      refined:
        'The LKA shall function in daylight and night-time conditions with working headlights.',
      issues_found: ['incomplete environmental conditions'],
      status: 'refined',
      overlap_with: [],
      conflict_flag: false,
      conflict_id: null,
      complexity: 'MEDIUM',
      complexity_justification:
        'Covers two lighting conditions — 3 scenarios spanning transitions and extremes.',
      num_scenarios: 3,
    },
    {
      id: 'req-015',
      original:
        'The system shall provide a self-diagnostic on vehicle startup.',
      refined:
        'The system shall execute a self-diagnostic routine during vehicle startup before enabling LKA functionality.',
      issues_found: ['ambiguous phrasing'],
      status: 'refined',
      overlap_with: [],
      conflict_flag: false,
      conflict_id: null,
      complexity: 'LOW',
      complexity_justification:
        'Startup check verified via a single cold-boot scenario.',
      num_scenarios: 1,
    },
    {
      id: 'req-016',
      original:
        'The system shall be disabled in poor weather conditions.',
      refined:
        'The system shall disable LKA functionality when heavy rain, snow, or fog reduce lane marking visibility below operational thresholds.',
      issues_found: ['undefined weather thresholds'],
      status: 'refined',
      overlap_with: [],
      conflict_flag: false,
      conflict_id: null,
      complexity: 'HIGH',
      complexity_justification:
        'Multiple weather conditions and visibility thresholds — 5 scenarios required to cover the space.',
      num_scenarios: 5,
    },
    {
      id: 'req-017',
      original:
        'The system shall respect national speed limits where applicable.',
      refined:
        'The system shall operate only within the posted speed limit for the current road segment, as identified by map data.',
      issues_found: ['ambiguous phrasing', 'missing data source'],
      status: 'refined',
      overlap_with: [],
      conflict_flag: false,
      conflict_id: null,
      complexity: 'MEDIUM',
      complexity_justification:
        'Depends on map data accuracy across multiple road types — 3 scenarios.',
      num_scenarios: 3,
    },
    {
      id: 'req-018',
      original:
        'The system shall support over-the-air updates for lane-detection models.',
      refined:
        'The system shall support over-the-air updates for lane-detection models.',
      issues_found: [],
      status: 'unchanged',
      overlap_with: [],
      conflict_flag: false,
      conflict_id: null,
      complexity: 'LOW',
      complexity_justification:
        'Non-runtime capability verified via a single deployment scenario.',
      num_scenarios: 1,
    },
    {
      id: 'req-019',
      original:
        'The system shall record and report performance metrics for each activation.',
      refined:
        'The system shall record and report lateral deviation, torque output, and duration metrics for each LKA activation.',
      issues_found: ['unspecified metrics'],
      status: 'refined',
      overlap_with: [],
      conflict_flag: false,
      conflict_id: null,
      complexity: 'LOW',
      complexity_justification:
        'Metric-logging requirement verified alongside a nominal activation scenario.',
      num_scenarios: 1,
    },
  ],
  removed: [
    {
      id: 'req-020',
      original:
        'The vehicle shall remain inside the lane markings when driving on the motorway.',
      reason: 'Duplicate of req-001',
      duplicate_of: 'req-001',
    },
  ],
  conflicts: [
    {
      conflict_id: 'conflict-001',
      requirements: ['req-001', 'req-007'],
      description:
        'req-001 requires LKA to operate from 70 km/h upward, while req-007 specifies a 60 km/h engagement threshold with disengagement below 65 km/h. The operating envelopes overlap and disagree on the lower bound of lane-keeping activation.',
      resolution:
        'Align the lower operating bound between the two requirements. Either (a) widen req-001 to start at 60 km/h, (b) raise req-007 to 70 km/h engagement, or (c) split the behavior into highway (req-001) and rural (req-007) modes with non-overlapping envelopes.',
    },
  ],
}
