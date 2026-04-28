# Demo Setup: Mock Conversation with Requirements

## Overview
A mock conversation has been pre-populated with sample AEB (Autonomous Emergency Braking) requirements for demonstration purposes.

## What's Set Up

### 1. Mock Data
- **File**: `src/stores/mockData.ts`
- **Contents**: 
  - `MOCK_DEMO_NLP_RESULT`: 47 raw requirements refined to 44, with 2 conflicts and 4 overlaps
  - `MOCK_DEMO_PIPELINE`: Pre-populated conversation in "awaiting NLP approval" state

### 2. Auto-Population
- **File**: `src/stores/pipelineStore.ts` (hydrate function)
- **Behavior**: On first page load, if no pipeline data exists for `conv-1`, it seeds with the mock data
- The data persists in localStorage after the first load

### 3. Projects & Conversations
- **Project**: "Renault AEB Suite v2" (ID: `renault-aeb`)
- **Conversation**: First conversation (ID: `conv-1`, Title: "requirements_v2.xlsx — 47 reqs")
- **Auto-redirect**: Home page redirects to `/project/renault-aeb/conversation/conv-1`

## What the Demo Shows

### Thread Page
When visiting the first conversation, you'll see:

1. **Engineer Input Bubble**
   - "Loaded from: requirements_v2.xlsx (47 raw requirements)"

2. **NLP Card in Awaiting Approval State**
   - ✅ All checks passed summary
   - 44 requirements kept, 3 removed, 2 conflicts, 4 overlaps
   - Expandable section showing:
     - **Requirements table** with status badges (conflict, overlap, refined, ok), complexity chips, scenario counts
     - **Metric tiles**: Kept, Removed, Conflicts, Overlaps
     - **Conflicts panel**: Shows the 2 conflicting requirements with descriptions
     - **Action buttons**: "Review requirements →" and "Approve & continue"

3. **Composer** at the bottom for new submissions or refactor instructions

### Requirements Review Page
Click "Review requirements →" to see the detailed requirements review page:
- **Requirements sidebar**: All 15 sample requirements with status indicators
- **Requirement detail panel**: Full details of selected requirement
- **Conflict resolution panel**: Shows conflicts with edit support
- **Statistics**: Total refined, removed, conflicts, overlaps
- **Approval flow**: "Approve & continue to scenarios" button once all conflicts are resolved

## Sample Data Highlights

### Requirements Included
- REQ-001 to REQ-015: 15 detailed AEB requirements
- Various complexity levels: HIGH, MEDIUM, LOW
- Multiple statuses: refined, unchanged, conflicts, overlaps
- Realistic ADAS testing scenarios (highway detection, braking latency, false positive rates, etc.)

### Conflicts
1. **CONF-001**: REQ-003 (250ms) vs REQ-004 (200ms) — latency conflict
2. **CONF-002**: REQ-001 (50m) vs REQ-002 (45-55m) — detection range overlap

### Overlaps
- REQ-001 ↔ REQ-002 (pedestrian detection range)
- REQ-005 ↔ REQ-006 (false positive rate in specific conditions)
- REQ-007 ↔ REQ-008 (environmental feature rejection)
- And more...

## API Logging Added

**Files Modified**:
- `src/lib/api-logger.ts` — New logging utility with color-coded output
- `src/app/api/refine/stream/route.ts` — Added logging for SSE requests
- `src/app/api/parse-file/route.ts` — Added logging for file upload requests

**Dev Console Output Example**:
```
[API] POST   /api/parse-file 200 (145ms)
  Details: { filename: 'requirements.xlsx', file_size: 8192, requirements_extracted: 20 }

[API] POST   /api/refine/stream 200 (23ms)
  Details: { requirements_count: 20, backend_url: '...' }
```

## Testing the Demo

1. Run `npm run dev`
2. Open browser to `http://localhost:3000`
3. You'll be auto-redirected to the first conversation
4. Expand the NLP Card to see all requirements and conflicts
5. Click "Review requirements →" to go to the requirements detail page
6. Click "Approve & continue" (in NLP Card footer) to move through the pipeline

## Notes

- Mock data is seeded only once on first load
- After that, real data from user submissions takes over
- To reset to demo, clear browser localStorage (DevTools → Application → localStorage → clear)
- The demo stays in the "awaiting NLP approval" state until you click "Approve & continue"
