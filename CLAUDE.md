# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## UI Specification — Strict Reference

**`veridian_ui_brainstorm.md` is the authoritative UI spec.** Every interaction, layout, card state, animation, page, and navigation flow described in it must be implemented exactly as written. Do not deviate, simplify, or add patterns not described there.

**Design skills** are available as Claude slash commands:
- `/application` — primary design system (blue #0284c7, Inter, card-based, top-bar nav)
- `/modern` — secondary design system (IBM Plex Serif, #553F83, editorial minimal)

Use `/application` for all Veridian UI work unless explicitly told otherwise. **Color palette is now professional sky-blue (#0284c7), not purple.**

## Project Overview

**Veridian** is an ADAS (Advanced Driver Assistance Systems) validation platform built as a real MVP for Capgemini engineers. It is a single-user-role application (no RBAC in MVP) targeted at ADAS validation engineers.

The UI is modeled directly on Claude's interface: projects on the left sidebar, conversations inside each project, and a chat-like thread as the main workspace. The engineer never navigates to a separate "run" page — everything unfolds in the thread.

## Architecture (Planned)

### Mental Model

| Claude concept | Veridian equivalent |
|---|---|
| Projects | Validation projects (e.g. "Renault AEB Suite v2") |
| Conversations | Test batch submissions |
| Messages | Engineer inputs + pipeline stage cards |
| New chat | New batch submission |

### Pipeline Stages

Four sequential stages, each producing a collapsible card in the thread:

1. **NLP Interpreter** — parses requirements, extracts parameters, flags conflicts/overlaps → **gate** (requires engineer approval)
2. **Scenario Generator** — generates `.xosc`/`.xodr` scenario files, ASAM validation → **gate** (requires engineer approval)
3. **Execution** — runs scenarios in CARLA simulator, live WebSocket log stream → no gate, runs automatically
4. **Report Generator** — KPI summary, per-scenario verdicts, PDF export → no gate

### Pages

| Page | Route (TBD) | Purpose |
|---|---|---|
| Home / Thread | `/project/:id/conversation/:id` | Composer + pipeline cards, primary workspace |
| Requirements Review | `/…/requirements` | Conflict/overlap analysis, NLP gate detail |
| Scenario Review | `/…/scenarios` | Generated files + ASAM warnings, Scenario gate detail |
| Live Simulation | `/…/simulation` | Real-time CARLA event stream via WebSocket |
| Report | `/…/report` | Full KPI breakdown, PDF download, shareable link |

Dedicated pages are detail views — approving on a dedicated page redirects back to the thread where the next pipeline card appears.

### Key Interactions

- **Composer** accepts: free text, drag-and-drop `.xlsx`/`.md`, or Jira issues via MCP connector
- **Pipeline cards** have four states: processing (skeleton/spinner), awaiting approval (blue pulsing), approved (collapsed, green), failed (red, retry)
- **Relay animation** on approve: card collapses → connector line fills → next card opens with processing animation
- **Post-completion refactor**: engineer types a natural-language instruction; agent identifies the earliest affected stage and re-runs from there; prior rounds stay visible above a divider
- **Execution card** shows a live scrolling monospace log stream (WebSocket), color-coded OK/ERR/INFO
- **New project modal** appears when clicking "+ New" in the sidebar's Projects header; captures project name (required) and optional description, then adds to sidebar and auto-expands

## Theme System

**Light and dark mode** are supported with system preference auto-detection:
- Light mode: white/slate backgrounds (#f8fafc bg, #ffffff card), dark text (#0f172a)
- Dark mode: navy backgrounds (#090c14 bg, #101620 card), light text (#e2e8f4)
- Theme toggle button (Sun/Moon icon) in TopBar switches themes instantly and persists
- Implemented via `next-themes` + CSS variables in `globals.css` + `darkMode: 'class'` in Tailwind

All `vrd.*` colors in `tailwind.config.ts` reference CSS variables (`var(--vrd-bg)`, etc.) defined in `globals.css` for light/dark modes.

## Design System

### Tokens (Application theme — primary)

```
primary:   #0284c7 (professional sky-blue)
secondary: #0ea5e9
success:   #10b981
warning:   #f59e0b
danger:    #ef4444
surface:   #FFFFFF
text:      #09090b
```

**Color Palette** (Tailwind custom tokens in `tailwind.config.ts`):
- `vrd-bg`: Dark background (#090c14)
- `vrd-sidebar`: Sidebar background (#0f1419)
- `vrd-card`: Card background (#1a2332)
- `vrd-card-hover`: Card hover state (#252f42)
- `vrd-border`: Border color (#2a3f5e)
- `vrd-text`: Primary text (#e0e8f5)
- `vrd-text-muted`: Muted text (#8fa3b8)
- `vrd-text-dim`: Dimmed text (#5a6f8a)
- `primary`: #0284c7
- `primary-light`: #0ea5e9

### Typography

- Primary font: **Inter**
- Mono font: **JetBrains Mono** (used for logs, IDs, XML)
- Scale: 12/14/16/20/24/32
- Weights: 100–900

### Layout

- Top-bar only navigation (no sidebar on top-level; sidebar for projects/conversations)
- Card-based content, structured grid
- Spacing scale: 4/8/12/16/24/32
- Style: modern, clean, high-contrast, glass-like panels, soft shadows, rounded components
- Accessibility: WCAG 2.2 AA, keyboard-first, visible focus states

### Design Principles

- **No details by default** — every pipeline card starts collapsed
- **Conversation = audit trail** — scrolling up shows every gate decision, timestamped
- **Composer always available** — iteration is one message away
- **Gates are intentional** — approval actions are prominent, blocking, explicit
- **Technical feel** — monospace for logs and IDs, flat surfaces, no decorative chrome

## Folder Structure

```
src/
├── components/
│   ├── ui/                        # Base design-system primitives (Button, Badge, Card…)
│   ├── layout/
│   │   ├── Sidebar/               # Projects + conversations left sidebar, project creation
│   │   └── TopBar/                # Top navigation bar
│   ├── composer/                  # Unified input composer (text / file upload / Jira connect)
│   └── pipeline/                  # Pipeline stage cards (thread messages)
│       ├── NLPCard/
│       ├── ScenarioCard/
│       ├── ExecutionCard/         # Live WebSocket log stream
│       └── ReportCard/
├── pages/
│   ├── Thread/                    # Primary workspace — composer + pipeline cards
│   ├── RequirementsReview/        # NLP gate detail — conflict/overlap analysis
│   ├── ScenarioReview/            # Scenario gate detail — .xosc/.xodr files + ASAM warnings
│   ├── LiveSimulation/            # Real-time CARLA event stream (view only, no gate)
│   └── Report/                    # Full KPI breakdown, PDF download, shareable
├── hooks/
│   └── useWebSocket.ts            # WebSocket hook for live simulation stream
├── stores/                        # Client state (Zustand or similar)
│   ├── projectStore.ts
│   └── pipelineStore.ts
├── services/
│   ├── api.ts                     # REST API client
│   └── websocket.ts               # WebSocket client
├── types/
│   ├── pipeline.ts                # PipelineStage, CardState, GateStatus…
│   ├── project.ts                 # Project, Conversation…
│   └── conversation.ts            # Message, Round, Divider…
└── styles/
    └── tokens.css                 # CSS custom properties from Application design tokens
```

Claude slash commands: `.claude/commands/application.md` → `/application`, `.claude/commands/modern.md` → `/modern`

## External Integrations

- **CARLA** — autonomous driving simulator that executes generated scenarios
- **Jira** — requirement import via MCP connector (sprint/epic picker)
- **WebSocket** — live execution log stream from CARLA
