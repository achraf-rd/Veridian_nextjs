# DB Wiring Plan — Implementation Summary

This document summarizes all changes applied to implement the production-ready Postgres + Auth + API backend as outlined in `DB_wiring_plan.txt`.

## ✅ Completed Implementation

### Phase 1: Postgres Schema (Prisma)

**Files Created:**

1. **`prisma/schema.prisma`**
   - User, Project, Conversation models
   - JSONB column for pipeline state storage
   - Relationships and cascade delete

2. **`src/lib/prisma.ts`**
   - PrismaClient singleton instance
   - Optimized for dev/prod environments

**Configuration:**

3. **`.env.local`** (Updated)
   - Added `DATABASE_URL` placeholder
   - Added `NEXTAUTH_SECRET` placeholder
   - Added `NEXTAUTH_URL` placeholder

### Phase 2: NextAuth v5 Authentication

**Files Created:**

1. **`src/auth.ts`**
   - NextAuth configuration
   - Credentials provider (email/password)
   - JWT session strategy
   - PrismaAdapter integration
   - Callbacks for JWT and session tokens

2. **`src/app/api/auth/[...nextauth]/route.ts`**
   - NextAuth route handler

3. **`src/app/api/auth/register/route.ts`**
   - User registration endpoint
   - Password hashing with bcryptjs (12 rounds)
   - Email uniqueness validation
   - Returns 201 on success, 409 on duplicate, 400 on invalid input

4. **`src/middleware.ts`**
   - Route protection middleware
   - Redirects unauthenticated users to `/login`
   - Protects `/project` and `/settings` routes

5. **`src/app/api/users/me/route.ts`**
   - GET: Fetch authenticated user profile
   - PATCH: Update user profile, preferences, notifications
   - Returns 401 if unauthorized

6. **`types/next-auth.d.ts`**
   - TypeScript augmentation for NextAuth session
   - Extended User and Session types with `id` field
   - JWT token type extension

**UI Integration:**

7. **`src/app/login/page.tsx`** (Updated)
   - Integrated `signIn('credentials')` from next-auth
   - Added error handling and loading states
   - Form validation and user feedback

8. **`src/app/register/page.tsx`** (Updated)
   - Integrated `/api/auth/register` endpoint
   - Password matching validation
   - Auto-login after successful registration
   - Added error messages and loading states

9. **`src/components/layout/TopBar/index.tsx`** (Updated)
   - Displays logged-in user name/initials with avatar
   - Added sign-out button (LogOut icon)
   - Shows user info from NextAuth session

10. **`src/app/layout.tsx`** (Updated)
    - Added `SessionProvider` wrapper around app
    - Enables `useSession` hook throughout app

### Phase 3: Projects & Conversations CRUD

**Files Created:**

1. **`src/app/api/projects/route.ts`**
   - GET: List all projects for authenticated user (sorted by date, newest first)
   - POST: Create new project (requires name)

2. **`src/app/api/projects/[id]/route.ts`**
   - GET: Fetch project with conversations
   - PATCH: Update project name/description
   - DELETE: Delete project (cascades conversations)
   - All routes verify ownership before returning data

3. **`src/app/api/projects/[id]/conversations/route.ts`**
   - GET: List all conversations for a project
   - POST: Create new conversation (requires title)
   - Ownership verification

4. **`src/app/api/conversations/[id]/route.ts`**
   - GET: Fetch conversation with pipeline state
   - PATCH: Update title or pipeline state (for sync)
   - DELETE: Remove conversation
   - Ownership verification via project relationship

### Phase 4: CARLA Execution Streaming (SSE)

**Files Created:**

1. **`src/app/api/execution/stream/route.ts`**
   - Server-Sent Events (SSE) endpoint
   - Accepts POST with conversationId and scenarioData
   - Streams execution events:
     - `start` event (execution_started)
     - `log` events (color-coded: INFO, OK, ERR)
     - `complete` event (execution_complete)
     - `error` event (on failure)
   - Header configuration: `text/event-stream`, no-cache, no buffering
   - Currently uses mock events; ready for Python backend integration

### Package Updates

**`package.json`** (Updated)

Added dependencies:
- `next-auth@^5.0.0-beta` — Authentication framework
- `@auth/prisma-adapter@^2.0.0` — Prisma session adapter
- `@prisma/client@^5.14.0` — Prisma ORM client
- `bcryptjs@^2.4.3` — Password hashing
- `prisma@^5.14.0` (devDep) — CLI and schema generator

Added devDependencies:
- `@types/bcryptjs@^2.4.6` — Type definitions for bcrypt

---

## 🚀 Next Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Database
Create a PostgreSQL database and update `.env.local`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/veridian"
```

Run migrations:
```bash
npx prisma migrate dev --name init
```

### 3. Configure NextAuth
Generate a secure secret:
```bash
openssl rand -base64 32
```

Update `.env.local`:
```
NEXTAUTH_SECRET="your-generated-secret"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Test Auth Flow
- Run `npm run dev`
- Navigate to `/register` and create an account
- Login at `/login`
- Verify user info in TopBar

### 5. Remaining Backend Integration (NOT YET IMPLEMENTED)

The following components still need API integration:

- **`src/stores/projectStore.ts`**
  - Replace hardcoded mock data with `useEffect(() => fetch('/api/projects'))`
  - Wire `addProject()` to POST `/api/projects`
  - Wire `addConversation()` to POST `/api/projects/[id]/conversations`

- **`src/stores/pipelineStore.ts`**
  - Replace localStorage with PATCH calls to `/api/conversations/[id]`
  - Sync pipeline state on every gate action (NLP approve, Scenario approve, Refactor)

- **`src/services/api.ts`**
  - Add `streamExecution(convId)` generator function
  - Subscribe to `/api/execution/stream` SSE endpoint

- **`src/components/pipeline/ExecutionCard/index.tsx`**
  - Replace `MOCK_LOGS` with `streamExecution()` stream
  - Connect WebSocket/SSE events to card UI

- **`src/app/settings/page.tsx`**
  - Load user profile from `/api/users/me` on mount
  - Wire "Save changes" to PATCH `/api/users/me`
  - Save preferences and notifications

---

## Security Considerations

✅ **Implemented:**
- JWT-based sessions (stateless, scalable)
- Password hashing with bcrypt (12 rounds)
- Server-side ownership verification on all routes
- CORS implicit (same-origin only)
- Middleware protects private routes

⚠️ **To Consider:**
- Rate limiting on auth endpoints (add express-rate-limit or similar)
- CSRF protection (next-auth handles this by default)
- API key rotation for long-lived integrations (future phase)
- Audit logging for sensitive operations (future phase)

---

## Architecture Summary

```
User Auth Flow:
  /login → signIn('credentials') → /api/auth/signin → prisma user lookup + bcrypt verify → JWT token

Project Management:
  Authenticated user → GET /api/projects → returns user-owned projects only
  → GET /api/projects/[id] → verify ownership → return project + conversations
  → POST /api/projects/[id]/conversations → create conversation

Pipeline State:
  Conversation holds full pipeline JSON → PATCH on every gate decision
  → frontend reads from /api/conversations/[id] → stores in Zustand

Execution Streaming:
  POST /api/execution/stream → SSE events → browser receives and renders
  (placeholder: connect to Python CARLA backend)
```

---

## Files Modified/Created

**Total: 20 files**

Created:
- prisma/schema.prisma
- src/lib/prisma.ts
- src/auth.ts
- src/app/api/auth/[...nextauth]/route.ts
- src/app/api/auth/register/route.ts
- src/middleware.ts
- src/app/api/users/me/route.ts
- src/app/api/projects/route.ts
- src/app/api/projects/[id]/route.ts
- src/app/api/projects/[id]/conversations/route.ts
- src/app/api/conversations/[id]/route.ts
- src/app/api/execution/stream/route.ts
- types/next-auth.d.ts

Modified:
- .env.local
- package.json
- src/app/layout.tsx
- src/app/login/page.tsx
- src/app/register/page.tsx
- src/components/layout/TopBar/index.tsx

---

## Testing Checklist

- [ ] `npm install` succeeds
- [ ] Prisma migrations run without error
- [ ] Login page works (invalid credentials show error)
- [ ] Registration creates user in database
- [ ] Auto-login after registration
- [ ] TopBar shows user name + sign-out button
- [ ] Sign-out redirects to `/login`
- [ ] Middleware blocks unauthenticated `/project` access
- [ ] GET `/api/projects` returns user's projects
- [ ] POST `/api/projects` creates new project
- [ ] GET `/api/projects/[id]` fetches project
- [ ] PATCH `/api/conversations/[id]` updates pipeline state
- [ ] SSE `/api/execution/stream` streams events

---

## Integration Points for Python Backend

When CARLA execution backend is ready:

1. Update `/api/execution/stream/route.ts` to call Python API instead of mock events
2. Proxy Python SSE stream to browser
3. Forward headers: `Authorization`, `X-Conversation-ID`, etc.
4. Error handling: Python service down, timeout, etc.

Example:
```typescript
const response = await fetch(`${CARLA_BACKEND_URL}/execute/stream`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ scenarioData }),
});
// return response.body as ReadableStream
```
