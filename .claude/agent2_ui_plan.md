# Agent 2 — Test Plan Generator UI Implementation Plan

> Pipeline stage 2 of the Veridian ADAS validation platform.
> Based on the UI brainstorm (conversation-thread metaphor) and the real agent output schema (`spec_final.json`).

---

## 1. Card states in the thread

### 1.1 Collapsed (default)

Appears in the conversation thread immediately after the agent finishes. Shows only:

- Stage label badge: `Scenario Generator`
- Summary sentence: _"N scenarios generated across N requirements."_
- Complexity distribution chips: `LOW · N` `MEDIUM · N` `HIGH · N`
- Test phase chips: `SIL · N` `SIL+HIL · N`
- Tag counts: `nominal · N` `boundary · N` `performance · N` `edge_case · N`
- Two gate buttons: `[Review scenarios]` `[Approve & execute]`

`[Approve & execute]` is **disabled** until the engineer has opened at least one scenario.

### 1.2 Expanded

Clicking `[Review scenarios]` expands the card in-place. Sections:

1. **Filter bar** — filter chips by complexity, test_phase, tags (multi-select, client-side)
2. **Requirements coverage panel** — req IDs × scenario count, warns on 0-coverage reqs
3. **Scenario list** — one accordion row per test case object
4. Gate buttons remain pinned at the bottom

---

## 2. Scenario list item (accordion row)

### 2.1 Collapsed row

| Field | Source key | Display |
|---|---|---|
| ID | `scenario_id` | Monospace badge, e.g. `TC-req-001-01` |
| Feature | `feature_under_test` | Plain text |
| Complexity | `complexity` | Colored chip: LOW=green, MEDIUM=amber, HIGH=red |
| Phase | `test_phase` | Chip: SIL=blue, SIL+HIL=purple |
| Tags | `tags[]` | Gray chips |
| Description | `description` | Truncated to 1 line, full on expand |

### 2.2 Expanded row

Two-column layout:

**Left — environment & ego vehicle**

| Display label | Source key |
|---|---|
| Map | `environment.map` |
| Weather | `environment.weather` |
| Lighting | `environment.lighting` |
| Ego state | `ego_vehicle.state` |
| Initial speed | `ego_vehicle.initial_speed` |
| Set speed | `ego_vehicle.set_speed` (show `—` if null) |
| Lane | `ego_vehicle.lane` |
| Covers | `covers_requirements[]` (comma-separated req IDs) |

**Right — actors panel**

Render only when `actors.length > 0`. Each actor as a compact row:

| Display label | Source key |
|---|---|
| ID | `actors[i].id` |
| Type | `actors[i].type` |
| Lane | `actors[i].lane` |
| Initial distance | `actors[i].initial_distance` |
| Speed | `actors[i].speed` |
| Behavior | `actors[i].behavior` |

When `actors` is empty: show muted placeholder _"No dynamic actors"_.

**Preconditions**

Bulleted list from `preconditions[]`. Guard with optional chaining — some objects omit this field.

**Test steps table**

> ⚠️ Key name has a space: access as `item["test case"]`, never `item.testCase`.

| Column | Source key | Notes |
|---|---|---|
| # | `step` | Number |
| Action | `action` | Prose |
| Expected reaction | `reaction` | Prose |
| Pass criteria | `pass_criteria` | Monospace, success-tinted background |

---

## 3. Filter bar

Client-side only — no API call on filter change.

**Filter dimensions:**

- Complexity: `ALL` `LOW` `MEDIUM` `HIGH`
- Test phase: `ALL` `SIL` `SIL+HIL`
- Tags (multi-select): `nominal` `boundary` `performance` `edge_case`

Live count badge on each chip updates as filters change. Active filter chips are visually distinct (filled vs outlined).

---

## 4. Requirements coverage panel

Derived from `covers_requirements[]` across all scenario objects.

- Deduplicate all req IDs
- Count how many scenarios cover each req
- Display as a compact table: `req-id · N scenarios`
- Flag reqs with 0 scenarios in a warning row (orange)
- Note: req-016 maps to 5 scenarios (TC-req-016-01 → 05) — grouping must count correctly

---

## 5. Components to build

| # | Component | Responsibility |
|---|---|---|
| 1 | `ScenarioGeneratorCard` | Collapsed/expanded toggle, derives summary stats from array on mount |
| 2 | `ScenarioListItem` | Accordion row — header strip + full expanded detail |
| 3 | `TestStepsTable` | Reads `item["test case"]`, renders 4-column table |
| 4 | `ActorsPanel` | Conditional render on `actors.length > 0` |
| 5 | `FilterBar` | Multi-select chips, calls `useScenariosFilter` hook |
| 6 | `useScenariosFilter` | Hook — filters array by complexity, phase, tags |
| 7 | `RequirementsCoverage` | Deduplicates req IDs, counts per req, flags gaps |
| 8 | Gate buttons | `[Review scenarios]` + `[Approve & execute]` with disabled state logic |

---

## 6. Data quirks to handle

**Key with a space**
```ts
// ✅ correct
const steps = scenario["test case"];

// ❌ wrong
const steps = scenario.testCase;
```

**Nullable fields**
- `set_speed`: can be `null` — display as `—`
- `preconditions`: field may be absent — use `scenario.preconditions ?? []`
- `ego_vehicle.parameters`: may be `{}` — skip rendering if empty object

**Empty actors array**
About half the scenarios have `actors: []`. Render a muted _"No dynamic actors"_ placeholder instead of an empty section.

**Multi-scenario requirements**
`req-016` is covered by 5 scenarios. The coverage panel must group and count, not just list raw `covers_requirements` entries.

---

## 7. State shape (Zustand slice)

```ts
interface ScenarioGeneratorState {
  scenarios: TestCase[];            // raw array from agent 2 output
  status: 'idle' | 'generating' | 'ready' | 'approved';
  filters: {
    complexity: string[];           // [] means "all"
    testPhase: string[];
    tags: string[];
  };
  viewedScenarioIds: Set<string>;   // gate: must have at least 1 to approve
  approvedAt: string | null;        // ISO timestamp
}
```

---

## 8. Type definitions

```ts
interface Environment {
  map: string;
  weather: string;
  lighting: string;
}

interface EgoVehicle {
  state: string;
  lane: string;
  initial_speed: number;
  set_speed: number | null;
  parameters: Record<string, unknown>;
}

interface Actor {
  id: string;
  type: string;
  lane: string;
  initial_distance: number;
  speed: number;
  behavior: string;
}

interface TestStep {
  step: number;
  action: string;
  reaction: string;
  pass_criteria: string;
}

interface TestCase {
  scenario_id: string;
  covers_requirements: string[];
  feature_under_test: string;
  complexity: 'LOW' | 'MEDIUM' | 'HIGH';
  test_phase: 'SIL' | 'SIL+HIL';
  tags: string[];
  description: string;
  preconditions?: string[];
  environment: Environment;
  ego_vehicle: EgoVehicle;
  actors: Actor[];
  "test case": TestStep[];
  type: 'test_case';
}
```

---

## 9. File structure

```
components/
  pipeline/
    ScenarioGeneratorCard/
      index.tsx                 ← collapsed/expanded shell + gate buttons
      ScenarioListItem.tsx      ← accordion row
      TestStepsTable.tsx        ← steps table
      ActorsPanel.tsx           ← actors list
      FilterBar.tsx             ← filter chips
      RequirementsCoverage.tsx  ← coverage matrix

hooks/
  useScenariosFilter.ts         ← filter logic

types/
  agent2.ts                     ← TestCase, Actor, TestStep, etc.
```

---

## 10. Design tokens

Follows the existing Veridian design system (Capgemini blue `#0070AD`, strong green `#2D8A4E`, Tailwind config with custom tokens).

| Element | Token |
|---|---|
| LOW complexity chip | green-100 bg / green-800 text |
| MEDIUM complexity chip | amber-100 bg / amber-800 text |
| HIGH complexity chip | red-100 bg / red-800 text |
| SIL phase chip | blue-100 bg / blue-800 text |
| SIL+HIL phase chip | purple-100 bg / purple-800 text |
| Pass criteria cell | green-50 bg / mono font |
| `scenario_id` badge | gray-100 bg / mono font |
| Disabled approve button | opacity-40, cursor-not-allowed |
