# Veridian — UI Brainstorm Plan

*Conversation-driven design for the Veridian ADAS validation platform.*
*Primary user: ADAS validation engineer. Context: real MVP for Capgemini engineers. Single user role — no role-based access in MVP.*
*Design direction: technical engineering tool, Claude-style conversation metaphor.*

---

## 1. Overall mental model

The UI is modeled directly on Claude's interface — projects on the left, conversations inside each project, and a chat-like thread as the main workspace. The engineer never navigates to a separate "run" page; everything unfolds in the thread.

| Claude concept | Veridian equivalent |
|---|---|
| Projects | Veridian projects (e.g. "Renault AEB Suite v2") |
| Conversations | Test batch submissions (one send = one conversation) |
| Messages | Engineer inputs + pipeline stage cards |
| New chat | New batch submission |

---

## 2. Left sidebar

Identical structure to Claude:

- **Projects** at top level — each is a named validation project per customer / campaign
- **Conversations** inside each project — named automatically from the first requirement or uploaded filename (e.g. "requirements_v2.xlsx — 47 reqs")
- Engineer can open any past conversation to see its full history and continue iterating
- "New conversation" button starts a fresh batch in the same project

---

## 3. Home page — the composer

When the engineer opens a conversation, they see a blank or continued thread with a composer at the bottom. The composer is the single entry point for all input types.

### 3.1 Input modes (unified composer)

| Mode | How it works |
|---|---|
| **Type directly** | Free text — one or multiple requirements, or a natural language instruction |
| **File upload** | Drag and drop Excel (.xlsx) or Markdown (.md) — system parses and shows a preview ("23 requirements detected") before sending |
| **Tool connect** | A connector button opens a mini panel — link Jira via MCP, pick a sprint or epic, pull issues as requirements |

After importing from file or Jira, the engineer sees a compact preview list of the requirements before sending — so they feel in control of the batch scope.

### 3.2 Blank state

On a new conversation, the composer is centered on the page with a short prompt and the three input options visible. No clutter. The text area is large and prominent — it is the primary action.

---

## 4. After hitting send — the thread unfolds

The composer moves to the bottom and the thread grows downward. Two types of "messages" appear:

| Message type | Description |
|---|---|
| **Engineer input** | Shows the requirements text, filename, or "Pulled 23 issues from Jira sprint 14" |
| **System pipeline card** | One card per pipeline stage — result, gate, or final output |

The pipeline stages are: **NLP Interpreter → Scenario Generator → Execution → Report**

---

## 5. Pipeline cards — collapsed / expanded states

Each stage produces a card in the thread. Cards are **collapsed by default** — just the headline and action. The engineer clicks to expand for details.

### 5.1 NLP Interpreter card (Requirements Refiner)

**Collapsed (awaiting approval):**
> Requirements Refiner — 13 valid · 7 incomplete · 1 overlap · ready to generate scenarios.
> `[Review requirements →]` `[Approve & continue]` `[Expand ▾]`

**Validation model:**
The agent classifies every input requirement into one of two buckets:
- **Valid** — the requirement passed all completeness checks and has been classified (HIGH/MEDIUM/LOW complexity), with a scenario count assigned.
- **Incomplete** — the requirement is missing structured information needed to generate a scenario (e.g. `missing speed`, `missing road type`). The original text is preserved verbatim and listed in a separate `incomplete[]` array, alongside the `issues_found` chips that explain *why* it was flagged.

Nothing is silently rewritten. The agent does not produce a "refined" version — the engineer sees the original text and either accepts it as valid or completes the missing details on incomplete entries. Removed/duplicate detection is a separate downstream concern and lives in its own collapsible section.

**Expanded:**
- 4 metric tiles: **Valid · Incomplete · Conflicts · Overlaps**
- Valid requirements table — id, badge (valid / conflict / overlap), complexity chip, scenario count, original text
- Incomplete requirements list (warning-tinted) — id, `issues_found` chips inline, original text
- Conflict rows (if any) with `[Go to conflict →]` deep link to the requirements review page

**Gate action:** `[Approve & continue]` — only enabled when no conflicts are blocking. Incomplete requirements do not block approval (they are skipped from scenario generation), but the engineer is encouraged to complete them on the review page first.

---

### 5.2 Scenario Generator card

**Collapsed:**
> Scenario generation complete — 47 scenarios generated, 2 ASAM validation warnings.
> `[Expand ▾]`

**Expanded:**
- List of generated scenarios with their `.xosc` / `.xodr` filenames
- Validation warnings highlighted
- Option to view raw XML for any scenario
- Inline adjustment of parameters before approval

**Gate action:** `[Approve & execute]` — CARLA execution starts only after approval.

---

### 5.3 Execution card (live)

**While running:**
> Executing in CARLA — 12 / 47 scenarios complete (25%)
> Live event stream (monospace log lines, color-coded):
> `[OK]  RUN-0012 — AEB scenario passed · TTC min: 0.42 s`
> `[ERR] RUN-0009 — CARLA crash, auto-requeue`
> `[INFO] Worker pool: 3 active`

No approval gate here — execution is fully automatic. The card stays live until all scenarios finish.

**Collapsed (after completion):**
> Execution complete — 44 passed, 2 failed, 1 requeued.

---

### 5.4 Report card

**Collapsed:**
> Report ready — Overall verdict: Pass (93.6%). PDF generated.
> `[View report]` `[Download PDF]`

**Expanded:**
- KPI summary table (TTC, min distance, lane deviation, reaction latency, etc.)
- Per-scenario verdict breakdown
- Link to full report page

---

## 6. Iterative conversation — two types of follow-up

After any stage or after completion, the composer remains active at the bottom. The engineer can continue the conversation in two ways:

### 6.1 Mid-pipeline adjustment
If a gate card is active, the engineer can edit the stage output inline (NLP parameters, scenario XML) before clicking approve. This stays within the same "round."

### 6.2 Post-completion refactor (new round)
After the pipeline is fully complete, the engineer types a free-text instruction:

> *"Increase the pedestrian detection distance from 15 m to 25 m in all AEB scenarios and re-run"*

The agent identifies the affected stage (Scenario Generator in this case) and re-runs the pipeline from that point. The thread shows:

> *Agent: Detected change in scenario parameters — re-running from Scenario Generator.*

Then only the affected stages animate. Earlier cards from round 1 stay visible above, clearly marked as a prior round (subtle divider + timestamp).

**More examples of post-completion refactor instructions:**

| Instruction | Entry point |
|---|---|
| "Increase pedestrian detection from 15 m to 25 m in AEB scenarios" | Scenario Generator |
| "The pass criteria for reaction latency should be ≤200 ms not ≤250 ms" | NLP Interpreter |
| "Add 5 more edge cases for highway lane keeping" | NLP Interpreter |
| "Make the pedestrian scenarios more aggressive" | Scenario Generator |
| "Remove all highway scenarios from the batch" | NLP Interpreter |

### 6.3 Thread structure per round

Each round is visually separated by a subtle divider and timestamp. Scrolling up shows the complete history of every gate decision, adjustment, and re-run — this is the audit trail, built naturally into the UI.

---

## 7. Requirements review page (validation analysis)

Accessible from the "Review requirements →" link on the NLP card. Separate page, not inline. The full design is documented in section 8.1; this section describes the *intent*.

This screen is the dedicated analysis view of the full requirement batch. It surfaces three orthogonal concerns:

1. **Completeness** — which requirements are missing structured information (`incomplete[]`) and what specifically is missing (`issues_found`). The engineer completes these inline.
2. **Conflicts** — pairs/groups of requirements that contradict each other; both must be edited (or one dismissed) before approval is unblocked.
3. **Overlaps** — informational, non-blocking. Two requirements that cover similar ground are cross-linked but neither requires action.

The engineer can edit any requirement here. Approving on this page redirects back to the thread, where the next pipeline card opens.

---

## 8. Dedicated pages per pipeline stage

Every pipeline stage card in the thread has a button that opens a dedicated page for that stage. The thread is the overview — the dedicated page is the detail. After the engineer approves on a dedicated page, they are redirected back to the thread where the next stage card appears.

| Pipeline stage | Card button | Dedicated page |
|---|---|---|
| NLP Interpreter | "Review batch" | Requirements review |
| Scenario Generator | "Review scenarios" | Scenario review |
| Execution | "Watch simulation" | Live simulation |
| Report Generator | "View report" | Report |

### 8.1 Requirements review page

Triggered from the NLP Interpreter card. Shows the full requirement batch with completeness, conflict, and overlap analysis.

**Layout:** three-column — sidebar (filterable list) · detail pane (selected requirement + edit) · conflict pane (when applicable).

**Sidebar sections:**
- **Valid (n)** — requirements that passed all checks. Each row shows id, status badge (valid / conflict / overlap / resolved / edited), complexity chip, and a 70-char snippet of the original text.
- **Incomplete (n)** — collapsible section, warning-tinted. Each row shows the id, an `incomplete` badge, and the comma-separated `issues_found` chips. Editing one of these in the detail pane upgrades it to `edited`.
- **Removed (n)** — collapsible, dimmed. Each entry has a `[Restore]` action.
- **Restored** — items the engineer brought back from removed.

**Filters:** All · Valid · Incomplete · Conflict · Overlap.

**Detail pane:**
- For valid requirements: status header, complexity, scenario count, issues chips (if any), the requirement text block, conflict warning (with suggestion if provided), overlap warning (with cross-links), edit textarea, complexity justification.
- For incomplete requirements: prominent warning banner explaining "this requirement is incomplete," `issues_found` chips called out, the original text in a warning-tinted block, and an edit textarea labelled "Complete the requirement" — the textarea border and focus ring are warning-colored to make completion the obvious next action. No complexity / scenarios / conflict / overlap sections (those don't apply).

**Conflict pane (only when a conflict requirement is selected):**
- Header with conflict id, resolved/dismissed/unresolved badge
- Involved requirements (red-tinted; turn primary-tinted once edited) — show the original text
- "Why this is a conflict" description
- Optional "Suggested resolution" tile (only rendered if the backend provides it)
- Resolution progress checklist
- Per-requirement edit buttons + `[Dismiss conflict]` (enabled only after both involved requirements have been edited)

**Approval:** Global `[Approve & continue]` is enabled only when `effectiveConflicts === 0`. Incomplete requirements do not block — they are simply not promoted to scenarios. Approving redirects back to the thread.
### 8.2 Scenario review page

Triggered from the Scenario Generator card. A file browser with validation context.

- List of all generated scenarios with their `.xosc` / `.xodr` filenames
- ASAM validation warnings highlighted per scenario
- Expand any scenario to view raw XML
- Individual scenarios can be rejected before global approval
- Global "Approve all & execute" redirects back to the thread — execution starts

### 8.3 Live simulation page

Triggered from the Execution card while CARLA is running.

- Progress bar — e.g. "12 / 47 scenarios complete"
- Real-time event stream in monospace, color-coded by status (OK / ERR / INFO), fed via WebSocket
- Per-scenario status updating live
- When all scenarios finish, the page freezes on the final summary and shows a button to return to the thread — where the Report card is now ready

### 8.4 Report page

Triggered from the Report Generator card. Read-only, shareable.

- Overall verdict prominent at the top (Pass / Fail + percentage)
- Full KPI table (TTC, min distance, lane deviation, reaction latency, etc.)
- Per-scenario verdict breakdown
- PDF download button
- Page is directly shareable via link — accessible without going through the thread

---

## 9. Pages summary

| Page | Notes |
|---|---|
| Home (conversation thread) | Primary workspace — composer + pipeline cards |
| Requirements review | Conflict/overlap analysis — NLP gate |
| Scenario review | Generated scenario files + validation — Scenario gate |
| Live simulation | Real-time CARLA event stream — no gate, view only |
| Report | Full KPI breakdown + PDF download — shareable |
| Scenario library | Reusable scenario templates per project |

---

## 10. Dynamic pipeline design

### 10.1 Pipeline stepper — always visible

A persistent horizontal stepper sits at the top of the active conversation. Four steps: **NLP → Scenarios → Execution → Report**. Always visible, even when scrolled deep into the thread.

Each step has three visual states:

| State | Appearance |
|---|---|
| Done | Filled circle, green, checkmark |
| Active | Pulsing ring animation, stage accent color |
| Waiting | Empty circle, muted gray |

The connector line between steps fills progressively as stages complete. The stepper is fixed at the top of the page at all times — even when the engineer is scrolled deep into the thread reading logs, they always know where they are in the pipeline.

### 10.2 Pipeline card animation states

Each card in the thread moves through four states:

**Processing** — skeleton loader or pulsing border, spinner, live status line:
> *"Extracting parameters from 47 requirements…"*

The animation is subtle — clearly alive, not flashy.

**Awaiting approval** — pulsing stops, card snaps to a solid state, amber highlight on the gate action button. The card is visually paused, waiting on the engineer.

**Approved** — card collapses to its headline, green accent, next card starts its processing animation immediately below.

**Failed** — red accent, error message, retry option inline.

### 10.3 The relay effect between stages

When the engineer clicks Approve, three things happen in sequence with a slight delay between each:

1. The current card collapses and shows a green "Approved" state
2. The connector line between the current step and the next one fills
3. The next stage card appears below and immediately starts its processing animation

This relay — collapse → line fills → next card opens — makes the pipeline feel like a real machine running, not just a list of static cards.

### 10.4 Execution card — special case

The execution card never asks for approval — it runs automatically. It behaves differently from gate cards:

- Live progress bar: *"12 / 47 scenarios complete"*
- Scrolling monospace log stream, color-coded (OK / ERR / INFO), capped at a max height before scrolling internally
- "Watch simulation" button opens the live simulation page
- No amber gate state — the card stays live until all scenarios finish, then collapses to its completion summary

---

## 11. Navigation flow

When the engineer approves on any dedicated page, they are automatically redirected back to the conversation thread. The approved stage card updates to show a completed state, and the next stage card appears below it. The thread always remains the source of truth — dedicated pages are detail views, not separate workflows.

---

## 12. Design principles

- **No details by default** — every card starts collapsed; engineer expands on demand
- **Conversation = audit trail** — scrolling up shows every decision made, timestamped
- **Composer always available** — iteration is always one message away
- **Gates are intentional** — approval actions are prominent, blocking, and explicit
- **Technical feel** — monospace for logs and IDs, clean flat surfaces, no decorative chrome

---

*Brainstorm session — Veridian UI planning. To be refined into wireframes and component specs.*
