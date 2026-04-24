# Veridian — Requirements Refiner: UI Analysis

*Analysis of the Requirements Refiner agent API response and architecture diagram,
translated into concrete UI design decisions for the Requirements Review page and the
NLP Interpreter pipeline card.*

---

## 1. What the agent actually does (from the architecture)

The Requirements Refiner is a **5-task sequential pipeline** orchestrated before the
rest of the Veridian pipeline runs. It is a pre-processing step that transforms raw
natural-language requirements into a clean, validated, classified list ready for
scenario generation.

| Task | Function | What it produces |
|---|---|---|
| TASK 1 | `clean()` | Refined text per requirement — fixes ambiguous phrasing, preserves meaning |
| TASK 2 | `deduplicate()` | Removes redundant requirements, records which was kept and why |
| TASK 3 | `overlap_detector()` | Flags semantically similar (but not identical) requirements with `overlap_with` links |
| TASK 4 | `conflict_detector()` | Flags contradictory requirements with a structured conflict object |
| TASK 5 | `classifier()` | Assigns complexity (HIGH / MEDIUM / LOW) and `num_scenarios` per requirement |

The **Orchestration Hook** wraps the full output into a single JSON envelope containing
`pipeline_status`, `summary`, `requirements`, `removed`, and `conflicts`.

### Key API contract facts

- `pipeline_status.status` is either `"blocked"` or `"ready"`.
  - `"blocked"` means at least one conflict exists — the pipeline **must not proceed** until resolved.
  - `"ready"` means zero conflicts — overlaps are informational only, they do not block.
- `pipeline_status.blocked_by` is a list of `conflict_id` strings — there can be multiple.
- A requirement can carry `conflict_flag: true` and a `conflict_id` linking it to a
  `conflicts[]` entry. Both involved requirements share the same `conflict_id`.
- `overlap_with` is a list of `req-id` strings. Overlaps are non-blocking warnings.
- `removed[]` entries include `duplicate_of` pointing to the kept requirement.
- `complexity` drives scenario generation cost — HIGH = 5 scenarios, MEDIUM = 3, LOW = 1.
- `issues_found` is a list of human-readable strings ("ambiguous phrasing", etc.) that
  explain why a requirement was refined.

---

## 2. NLP Interpreter card — revised design

The NLP Interpreter card in the conversation thread must now reflect the full
Requirements Refiner output, not just a simple "parsed" message.

### 2.1 Collapsed state

The headline must encode the most important signal first: **blocked or ready**.

**Blocked example:**
```
Requirements Refiner — BLOCKED  ·  1 conflict requires resolution before proceeding.
20 raw → 19 kept, 1 removed, 1 conflict, 0 overlaps
[Review & resolve →]   [Expand ▾]
```

The `[Review & resolve →]` button navigates to the Requirements Review page.
It is the **primary CTA** when blocked — more prominent than "Expand".

**Ready example:**
```
Requirements Refiner — Ready  ·  20 raw → 19 kept, 1 removed, 0 conflicts, 2 overlaps
[Review overlaps]   [Approve & continue →]
```

When ready, `[Approve & continue →]` is the primary CTA. Overlaps are optional review.

### 2.2 Expanded state (inline summary inside the card)

When expanded, the card shows three sections:

**Summary strip** — 4 metric tiles:
- Total kept / Total removed / Conflicts / Overlaps

**Conflicts section** (shown only if `total_conflicts > 0`, red-tinted):
- One row per conflict with: conflict ID, both involved req IDs, one-line description, resolution hint.
- Each row has a `[Go to conflict →]` link that navigates to the Requirements Review page
  pre-scrolled to that conflict.

**Refined requirements list** — compact table:
- Columns: ID · Status badge (unchanged / refined / conflict / overlap) · Complexity badge (HIGH / MEDIUM / LOW) · Scenarios count · Short snippet of refined text
- Rows are clickable → opens full req detail on the Requirements Review page.

**Gate action** at the bottom of the card:
- If `pipeline_status.status === "blocked"`: button is **disabled** with tooltip "Resolve all conflicts before continuing".
- If `pipeline_status.status === "ready"`: `[Approve & continue]` is active.

---

## 3. Requirements Review page — complete design spec

### 3.1 Page entry points

- From the NLP card collapsed state: `[Review & resolve →]` button.
- From the NLP card expanded conflicts section: `[Go to conflict →]` per conflict.
- From the NLP card expanded req list: click any requirement row.

### 3.2 Page layout: three-panel

```
┌──────────────────┬──────────────────────────────┬─────────────────────┐
│  LEFT SIDEBAR    │  CENTER — Detail panel        │  RIGHT — Resolution │
│  Requirement     │  Selected requirement or      │  panel (conflicts   │
│  list            │  conflict detail              │  only)              │
│  (filterable)    │                               │                     │
└──────────────────┴──────────────────────────────┴─────────────────────┘
```

The right panel is only visible when a conflict is selected. For non-conflict
requirements it collapses and the center panel expands.

### 3.3 Top bar

- Breadcrumb: `Renault AEB Suite v2  /  requirements_v2.xlsx — 20 reqs  /  Review`
- Left: `refining_id` in monospace (for traceability)
- Center: pipeline status pill — red "Blocked — 1 conflict" or green "Ready to proceed"
- Right: `[Back to thread]`  `[Approve & continue]` (disabled if blocked)

### 3.4 Stats row (below top bar)

Four metric cards:

| Card | Value source | Color |
|---|---|---|
| Total requirements | `summary.total_refined` | Neutral |
| Removed (duplicates) | `summary.total_removed` | Amber |
| Conflicts | `summary.total_conflicts` | Red — 0 = green |
| Overlaps | `summary.total_overlaps` | Amber — 0 = neutral |

### 3.5 Left sidebar — requirement list

**Filter buttons:** All · Conflict · Overlap · Refined · OK

Each requirement row shows:
- Status indicator dot (red = conflict, amber = overlap, blue = refined, green = unchanged)
- `req-id` in monospace
- First ~60 chars of refined text
- Complexity badge (HIGH / MEDIUM / LOW) right-aligned

Removed requirements are shown at the bottom in a collapsed "Removed (1)" group,
styled with strikethrough and muted color.

Clicking a row loads it in the center panel and highlights it in the sidebar.

### 3.6 Center panel — requirement detail

For a selected requirement, the center panel shows:

**Header:**
- `req-001` in monospace · Status badge · Complexity badge · `{num_scenarios} scenarios`

**Two-column diff (if status === "refined"):**
- Left: "Original" — original text, issues highlighted in amber underline
- Right: "Refined" — refined text, changes highlighted in blue underline
- `issues_found` chips above the diff (e.g. "ambiguous phrasing")

**Single block (if status === "unchanged"):**
- Just the requirement text. No diff needed.

**Conflict warning block (if `conflict_flag === true`):**
- Red-tinted inset block: conflict ID, description, resolution suggestion from the API.
- `[See conflict →]` button scrolls to / opens the conflict detail in the right panel.

**Overlap warning block (if `overlap_with.length > 0`):**
- Amber-tinted inset block: "Overlaps with req-XXX" links to those requirements.

**Edit field:**
- Below the display, an editable textarea pre-populated with the refined text.
- The engineer can adjust the text manually.
- `[Save edit]` marks the requirement as manually edited.

**Complexity justification:**
- Small muted block: `complexity_justification` text from the API, explaining why this
  complexity level was assigned. Helps the engineer understand scenario count.

### 3.7 Right panel — conflict resolution (conflict selected only)

Appears when a conflict is active. Contains:

**Conflict header:**
- `conflict-001` · "Unresolved" badge (red) or "Resolved" badge (green)

**Involved requirements:**
- Two requirement cards side by side, each showing their refined text.
- The contradicting portion highlighted in red in each card.

**Conflict description:**
- Full `description` string from the API — explains the contradiction in plain language.

**Resolution suggestion:**
- Full `resolution` string from the API — concrete options for fixing the conflict.
- Styled as a callout (light amber background, not red — it is guidance, not an error).

**Resolution actions:**
Three resolution paths, each as a distinct button:

| Action | What it does |
|---|---|
| Edit req-001 | Opens req-001 in center panel edit mode, pre-focused |
| Edit req-007 | Opens req-007 in center panel edit mode, pre-focused |
| Dismiss conflict | Marks the conflict as acknowledged — only available if both reqs are manually edited |

Once both requirements involved in a conflict have been edited (or one is accepted as
authoritative and the other edited), the conflict is marked resolved. When all conflicts
are resolved, the top-bar status pill flips to green and `[Approve & continue]` activates.

### 3.8 Removed requirements section

Accessible via a `[Show removed (1) ▾]` toggle at the bottom of the sidebar.

Each removed requirement shows:
- Original text (strikethrough)
- Reason: "Duplicate of req-011"
- `[Restore]` button — reinstates it into the active list if the engineer disagrees

---

## 4. Data → UI field mapping

Complete mapping from API JSON fields to UI elements.

| JSON field | UI location | Treatment |
|---|---|---|
| `pipeline_status.status` | Top bar pill, NLP card headline, Approve button state | Blocks or enables |
| `pipeline_status.reason` | Tooltip on disabled Approve button | Plain text |
| `pipeline_status.blocked_by[]` | Links from top bar pill to specific conflicts | Each ID navigates |
| `summary.total_raw` | NLP card headline "20 raw" | Display |
| `summary.total_refined` | Stats card | Display |
| `summary.total_removed` | Stats card (amber) | Display |
| `summary.total_conflicts` | Stats card (red/green) | Color changes at 0 |
| `summary.total_overlaps` | Stats card (amber/neutral) | Color changes at 0 |
| `requirements[].id` | Sidebar row, center panel header | Monospace font |
| `requirements[].original` | Center panel diff — left column | Shown only if refined |
| `requirements[].refined` | Center panel diff — right column + editable textarea | Always shown |
| `requirements[].issues_found[]` | Chips above diff | "ambiguous phrasing" etc. |
| `requirements[].status` | Badge in sidebar and center panel header | unchanged / refined / conflict / overlap |
| `requirements[].overlap_with[]` | Amber inset block in center panel | Links to those reqs |
| `requirements[].conflict_flag` | Red dot in sidebar, conflict block in center panel | Boolean |
| `requirements[].conflict_id` | Links to conflict entry in right panel | Navigation |
| `requirements[].complexity` | Badge in sidebar + center panel | HIGH=red, MEDIUM=amber, LOW=green |
| `requirements[].complexity_justification` | Muted text block in center panel | Informational |
| `requirements[].num_scenarios` | Center panel header chip | "{n} scenarios" |
| `removed[].id` | Removed section in sidebar | Strikethrough |
| `removed[].original` | Removed section | Strikethrough text |
| `removed[].reason` | Removed section | "Duplicate of req-XXX" |
| `removed[].duplicate_of` | Link to the kept requirement | Navigation |
| `conflicts[].conflict_id` | Right panel header, conflict section in center panel | Monospace |
| `conflicts[].requirements[]` | Right panel — two side-by-side req cards | Both reqs shown |
| `conflicts[].description` | Right panel description block | Plain text |
| `conflicts[].resolution` | Right panel resolution callout | Amber-tinted guidance |

---

## 5. Page states

| State | Trigger | UI behavior |
|---|---|---|
| **Blocked — conflicts** | `pipeline_status.status === "blocked"` | Red pill in top bar. Approve button disabled. Conflict section prominent in sidebar. |
| **Ready — clean** | No conflicts, no overlaps | Green pill. Approve button active. Req list shown directly. |
| **Ready — with overlaps** | No conflicts, overlaps exist | Green pill. Approve active. Overlap section shown in sidebar with amber badge. |
| **Conflict resolved** | Engineer edits both reqs in a conflict | Conflict badge clears. If last conflict resolved, status flips to Ready. |
| **Requirement edited** | Engineer saves manual edit | Row in sidebar gets "edited" badge (blue). Diff panel shows original → edited. |
| **Duplicate restored** | Engineer clicks Restore on a removed req | Req moves back into active list with "restored" badge. |

---

## 6. Design decisions derived from the API

### No static thresholds — respect the API contract
The conflict detector (TASK 4) makes the blocking decision. The UI never re-implements
conflict logic. It consumes `conflict_flag` and `conflicts[]` as authoritative.

### Complexity drives scenario count expectations
`num_scenarios` (1, 3, or 5) must be visible on every requirement row. Engineers need
to understand the simulation cost of each requirement before approving. Total scenario
count for the batch = sum of all `num_scenarios` — display this total in the top bar
alongside the Approve button: "Approving will queue 51 scenarios."

### issues_found drives diff visibility
If `issues_found` is empty, the requirement is `unchanged` — show no diff, just the
text. Only show the before/after diff UI when `issues_found.length > 0`. This avoids
visual noise for the 60–70% of requirements that need no refinement.

### conflict_id is the join key
Both `req-001` and `req-007` carry `conflict_id: "conflict-001"`. The UI uses this to:
1. Group them together in the right panel.
2. Highlight both in the sidebar simultaneously when the conflict is selected.
3. Track resolution: when both have been edited, the conflict is resolvable.

### Removed requirements are advisory, not final
The engineer may disagree with `deduplicate()`. The `[Restore]` action must be available
without requiring a full re-run. Restored requirements are included in the approved batch
with a `"restored"` status flag sent back to the pipeline.

---

## 7. What this page does NOT do

- It does not re-run any agent task. It is a **review and edit** surface only.
- It does not show CARLA scenarios, XML, or KPIs — those belong to later pipeline cards.
- It does not allow adding new requirements from scratch — the composer in the thread
  handles new input.
- It does not replace the agent's conflict detection with UI-level logic.

---

*Analysis derived from: requirements_refiner API response (refining_id: 102253fd),
architecture diagram (5-task pipeline), and veridian_ui_brainstorm.md section 7.*
*Ready to be used as the design spec for the Requirements Review page wireframe and
component implementation.*

---

## 8. API integration spec

### 8.1 Base URL

```
https://agentic-ai-adas-requirements-refiner.onrender.com
```

No authentication observed on the deployed instance (Render free tier, open for now).
Add a header slot for future `Authorization: Bearer <token>` when auth is added.

---

### 8.2 Excel parsing — frontend responsibility

The frontend parses the `.xlsx` before sending to the API. The file must NOT be sent
as multipart/form-data — the API accepts a plain JSON array of requirement strings.

**Expected Excel structure** (confirmed from `lka_requirements_veridian.xlsx`):

| Column | Name | Content |
|---|---|---|
| A | REQ ID | e.g. `LKA-REQ-001` — used for display only, not sent to API |
| B | Natural Language Requirement | Full requirement text — this is what gets sent |

The sheet may have a title row before the header row (row 1 = title, row 2 = `REQ ID / Natural Language Requirement`, data from row 3). The parser must handle this gracefully.

**Frontend parsing logic (TypeScript):**

```typescript
import * as XLSX from 'xlsx';

interface ParsedRequirement {
  id: string;        // from column A — kept locally for display
  text: string;      // from column B — sent to API
}

export function parseRequirementsXlsx(file: File): Promise<ParsedRequirement[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // Use first sheet
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: string[][] = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: '',
        });

        // Find the header row — look for "REQ ID" in column A
        const headerRowIndex = rows.findIndex(
          (row) => typeof row[0] === 'string' && row[0].trim().toUpperCase().includes('REQ')
        );

        if (headerRowIndex === -1) throw new Error('Header row not found');

        const dataRows = rows.slice(headerRowIndex + 1);

        const requirements: ParsedRequirement[] = dataRows
          .filter((row) => row[0] && row[1]) // skip empty rows
          .map((row) => ({
            id: String(row[0]).trim(),
            text: String(row[1]).trim(),
          }));

        if (requirements.length === 0) throw new Error('No requirements found in file');

        resolve(requirements);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsArrayBuffer(file);
  });
}
```

**Preview before send:** After parsing, show the engineer a compact list of parsed
requirements (ID + truncated text) with the count — "20 requirements detected" — before
they confirm the submission. This is the pre-send confirmation step described in section 3.1
of the UI brainstorm.

---

### 8.3 API transport — Server-Sent Events (SSE)

**The Requirements Refiner API uses Server-Sent Events, not a single JSON response.**

This means:
- The client opens a persistent HTTP connection to the API endpoint.
- The server streams progress events as the 5 tasks complete one by one.
- The final event carries the full consolidated JSON envelope (the object from section 1).
- The connection closes after the final event.

**Why this matters for the UI:**
- The NLP Interpreter card must show a live progress state while the pipeline runs.
- Each of the 5 tasks should update the card progressively, not just show a spinner.
- The engineer sees the pipeline advancing in real time before the gate appears.

**SSE client implementation (TypeScript):**

```typescript
interface RefinementProgressEvent {
  type: 'task_start' | 'task_complete' | 'result' | 'error';
  task?: number;          // 1–5
  task_name?: string;     // e.g. "conflict_detector"
  data?: unknown;         // partial result per task
  result?: RefinementResult; // full envelope — only on type === 'result'
  message?: string;       // on type === 'error'
}

export function streamRefinement(
  feature: string,
  requirements: string[],
  onProgress: (event: RefinementProgressEvent) => void,
  onComplete: (result: RefinementResult) => void,
  onError: (error: Error) => void
): () => void {
  // SSE requires GET with query params, or POST — check which the API uses.
  // Pattern A: POST body → SSE response (fetch-based, most common for FastAPI)
  const controller = new AbortController();

  fetch('https://agentic-ai-adas-requirements-refiner.onrender.com/refine/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
    },
    body: JSON.stringify({ feature, requirements }),
    signal: controller.signal,
  })
    .then((response) => {
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      function processBuffer() {
        // SSE format: "data: {...}\n\n"
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? ''; // keep incomplete last line

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') return;
            try {
              const event: RefinementProgressEvent = JSON.parse(jsonStr);
              if (event.type === 'result' && event.result) {
                onComplete(event.result);
              } else if (event.type === 'error') {
                onError(new Error(event.message ?? 'Unknown API error'));
              } else {
                onProgress(event);
              }
            } catch {
              // malformed chunk — skip
            }
          }
        }
      }

      function pump(): Promise<void> {
        return reader.read().then(({ done, value }) => {
          if (done) return;
          buffer += decoder.decode(value, { stream: true });
          processBuffer();
          return pump();
        });
      }

      return pump();
    })
    .catch((err) => {
      if (err.name !== 'AbortError') onError(err);
    });

  // Return cleanup function — call on component unmount
  return () => controller.abort();
}
```

**NOTE — endpoint path to verify:** The exact path (`/refine/stream`, `/refine`, `/process`, etc.)
must be confirmed by checking `/openapi.json` or `/docs` on the live server from a browser.
The implementation above uses `/refine/stream` as a placeholder. Adjust after confirming.

---

### 8.4 Request body shape

Based on the JSON response envelope (`feature`, `requirements[]`):

```json
{
  "feature": "LKA",
  "requirements": [
    "The vehicle shall remain within its lane boundaries when traveling at 110 km/h...",
    "The system shall apply a corrective steering torque within 200 ms...",
    "..."
  ]
}
```

- `feature`: short string identifying the ADAS function (e.g. "ACC", "LKA", "AEB").
  The UI should let the engineer set this — default to the project name or prompt for it
  before submission.
- `requirements`: plain array of requirement text strings — no IDs, no metadata. The IDs
  (`LKA-REQ-001` etc.) are local to the Excel file and not sent.

**ID reconciliation after response:**
The API assigns its own IDs (`req-001`, `req-002`...) sequentially. The frontend must
maintain a local map of `api_id → excel_id` built during the submission flow:

```typescript
// Built at submission time, preserved for the session
const idMap: Record<string, string> = {};
parsedRequirements.forEach((req, index) => {
  const apiId = `req-${String(index + 1).padStart(3, '0')}`;
  idMap[apiId] = req.id; // e.g. idMap['req-001'] = 'LKA-REQ-001'
});
```

Display `LKA-REQ-001` in the UI everywhere; use `req-001` only for internal API cross-references.

---

### 8.5 Live progress UI — task-by-task card state

While the SSE stream is open, the NLP Interpreter card shows a running pipeline visualization:

```
Requirements Refiner — Running...

  [✓] Task 1 · clean()               — 20 requirements refined
  [✓] Task 2 · deduplicate()          — 1 removed
  [●] Task 3 · overlap_detector()     — running...
  [ ] Task 4 · conflict_detector()
  [ ] Task 5 · classifier()
```

Each `task_complete` SSE event advances one row from `●` (running) to `✓` (done) and
shows the key output stat inline. This gives the engineer visibility into a process that
may take 15–60 seconds on a 20-requirement batch.

**State machine for the card during streaming:**

| State | Trigger | Card appearance |
|---|---|---|
| `idle` | Before submission | Composer only |
| `parsing` | File dropped | "Parsing Excel… 20 requirements detected" |
| `confirming` | Parse complete | Preview list + [Send to refiner] button |
| `streaming` | POST sent | Live task progress rows |
| `blocked` | `result` event, status=blocked | Red header, conflict list, gate disabled |
| `ready` | `result` event, status=ready | Green header, gate enabled |
| `error` | `error` event or network failure | Error message + [Retry] button |

---

### 8.6 Error handling

| Error scenario | Detection | UI response |
|---|---|---|
| Server cold start (Render free tier sleeps) | HTTP 502 or timeout > 30s | "Refiner is waking up — this may take 30 s on first run" with a progress indicator |
| Malformed Excel (no REQ ID / requirement columns) | Parse-time exception | Inline error before submission: "Could not find requirement columns" |
| Empty requirement text in a row | Filter at parse time | Skip the row; show "2 rows skipped (empty)" in preview |
| API returns HTTP 4xx | Non-ok response status | "Submission rejected: {status}" + raw error message |
| SSE stream drops mid-way | `reader.read()` rejects | "Connection lost after task {n}" + [Retry from here] if the API supports resume, else [Retry from start] |
| `conflict_detector` returns conflicts | `pipeline_status.status === "blocked"` | Block the Approve gate, surface the Review page CTA |
| Zero requirements after filtering | Caught at parse time | "No valid requirements found in this file" — do not submit |

---

### 8.7 Excel structure validation (client-side, pre-send)

Run these checks after parsing, before showing the preview:

```typescript
function validateParsedRequirements(reqs: ParsedRequirement[]): string[] {
  const errors: string[] = [];

  if (reqs.length === 0) {
    errors.push('No requirements found. Check that column B contains requirement text.');
  }
  if (reqs.length > 100) {
    errors.push(`${reqs.length} requirements detected. Maximum batch size is 100.`);
  }
  const emptyTexts = reqs.filter((r) => r.text.length < 10);
  if (emptyTexts.length > 0) {
    errors.push(`${emptyTexts.length} requirement(s) have very short text (< 10 chars) and will be skipped.`);
  }

  return errors; // empty = valid
}
```

---

### 8.8 What to confirm on the live API (browser devtools)

Before implementing, open the Swagger UI at:
```
https://agentic-ai-adas-requirements-refiner.onrender.com/docs
```

Confirm:
1. **Exact endpoint path** — `/refine`, `/refine/stream`, `/process`, or other
2. **HTTP method** — POST (most likely) vs GET with query params
3. **SSE or polling** — check the response `Content-Type` header (`text/event-stream` = SSE, `application/json` = single response)
4. **SSE event names** — what fields each streamed event carries (`event:`, `data:`)
5. **Auth header** — if `401` is returned, add `Authorization: Bearer <token>`
6. **Feature field** — confirm the exact field name (`feature`, `adas_feature`, `system`, etc.)

