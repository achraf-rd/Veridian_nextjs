# Implement SSE API Integration

You are building the connection between the `/refine/stream` backend endpoint and the Veridian frontend UI.

**Backend**: Streams SSE events (`stage`, `attempt`, `validation_failed`, `result`, `error`) as the pipeline progresses.

**Task**: 
1. Create `src/services/requirementsApi.ts` — async generator that reads SSE events from `/refine/stream` using fetch + streaming reader (pattern from `test_api.js`)
2. Extend `src/types/pipeline.ts` with `RefinementEvent` union type for each event
3. Update `src/components/composer/index.tsx` to call `streamRefineRequirements()` on submit
4. Update `src/pages/Thread/index.tsx` to consume the event stream and:
   - `stage:running` → activate card, reset badges
   - `attempt:N/M` → update badge
   - `validation_failed` → pulse badge
   - `stage:completed` → collapse card, trigger next card open
   - `result` → show output, detect conflicts
   - `error` → show error state, offer retry
5. Wire pipeline cards to handle event-driven state updates

**Key**: Events arrive line-by-line from backend; UI updates incrementally in real-time. No final response buffer.
