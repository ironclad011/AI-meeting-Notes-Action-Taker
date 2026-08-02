# PLAN.md — AI Meeting Notes & Action Tracker

**Time budget: 4 hours. MVP-first. Cut scope, not quality, when time runs short.**

## 1. Tech Stack (locked decisions)

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js (App Router) + React | Required option, file-based routing speeds up MVP, API routes available if needed as BFF |
| Backend | Node.js + Express | Required option, fastest to scaffold, huge ecosystem, no build step |
| Database | MongoDB (Mongoose) | NoSQL avoids schema-migration overhead under time pressure; document shape fits Meeting → ActionItems naturally; can run via local `mongod` or free Atlas cluster — no install if Atlas used |
| Auth | JWT (access token) + bcrypt password hashing | Simple, stateless, no session store needed |
| Rich text editor | Tiptap (React) | Lightweight, headless, easy to theme for dark mode |
| AI provider | Anthropic (Claude) via `@anthropic-ai/sdk`, with a **mock AI service** fallback behind an interface | Satisfies "structured JSON output" requirement; mock guarantees the demo works with zero API-key risk |
| Styling | Tailwind CSS | Fast responsive + dark mode (`dark:` variant) with no extra config overhead |
| Testing | Jest + Supertest (backend), React Testing Library (a few frontend smoke tests) | Time-boxed — a handful of high-value tests, not full coverage |
| Validation | Zod (shared shape on frontend + backend where practical) | One library, low boilerplate |

Monorepo layout, two workspaces, run concurrently:
```
/backend   → Express API (port 5000)
/frontend  → Next.js app (port 3000)
```

## 2. Data Model (MongoDB / Mongoose)

### User
```
{ _id, name, email (unique), passwordHash, createdAt }
```

### Meeting
```
{
  _id,
  owner: ObjectId(User),
  title: String (required),
  date: Date (required),
  type: enum [Client Meeting, Sales Meeting, Project Meeting, Internal Meeting,
              Requirement Discussion, Retrospective, Other],
  participants: [String],
  transcript: String (required, rich text HTML from Tiptap or plain pasted text),
  transcriptSource: enum [pasted, uploaded],
  notes: String (optional rich text, manual notes),
  ai: {
    status: enum [not_started, processing, completed, failed],
    summary: String,
    keyDiscussionPoints: [String],
    keyDecisions: [String],
    risksOrConcerns: [String],
    unansweredQuestions: [String],
    rawResponse: Mixed,      // stored for audit/debug
    generatedAt: Date,
    error: String
  },
  createdAt, updatedAt
}
```

### ActionItem
```
{
  _id,
  meeting: ObjectId(Meeting),
  owner: ObjectId(User),          // account owner (creator), for scoping
  description: String (required),
  assignee: String (default "Unassigned"),
  dueDate: Date | null,           // null → "Not specified"
  priority: enum [Low, Medium, High] (default Medium),
  status: enum [Open, In Progress, Blocked, Completed] (default Open),
  source: enum [ai_generated, manual],
  createdAt, updatedAt
}
```

Indexes: `Meeting.owner + date`, `ActionItem.owner + status`, `ActionItem.owner + dueDate`, text index on `Meeting.title` / `ActionItem.description` for search.

## 3. API Design (REST)

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/meetings              ?search=&type=&page=
POST   /api/meetings
GET    /api/meetings/:id
PUT    /api/meetings/:id
DELETE /api/meetings/:id
POST   /api/meetings/:id/transcript-file   (multipart upload, .txt minimum)
POST   /api/meetings/:id/generate-ai       (triggers AI processing, updates ai.* fields)

GET    /api/action-items          ?status=&priority=&owner=&dueBefore=&overdue=&search=&meetingId=
POST   /api/action-items
GET    /api/action-items/:id
PUT    /api/action-items/:id
DELETE /api/action-items/:id

GET    /api/dashboard/summary
```

All routes except `/auth/register` and `/auth/login` require `Authorization: Bearer <jwt>`.

## 4. AI Processing Design

- `services/aiService.js` exposes one function: `generateMeetingInsights(transcript) -> StructuredOutput`.
- Two implementations behind the same interface, selected by `AI_PROVIDER` env var (`anthropic` | `mock`):
  - **anthropic**: calls Claude with a system prompt demanding strict JSON (summary, keyDiscussionPoints[], keyDecisions[], actionItems[], risksOrConcerns[], unansweredQuestions[]); response parsed and validated with Zod before saving.
  - **mock**: deterministic heuristic (naive sentence/keyword extraction) that returns the same JSON shape — demonstrates the integration point works even without an API key.
- Validation layer: if the AI JSON fails schema validation → retry once → on second failure, set `ai.status = failed` and surface a "Failed AI request" state in the UI; never trust unvalidated data into the DB.
- Action items returned by AI are inserted as separate `ActionItem` documents with `source: ai_generated`, `assignee` defaulting to "Unassigned" and `dueDate` to `null` when not stated — no invented specifics.

## 5. Phased Build Order (MVP-first, ~4 hours)

| Phase | Time | Deliverable |
|---|---|---|
| 0. Setup | 15 min | Repo scaffold, env files, Mongo connection, base Next.js + Express running |
| 1. Auth | 30 min | Register/login/logout, JWT middleware, protected route wrapper |
| 2. Meeting CRUD + transcript input | 45 min | Create/list/detail/edit/delete, paste + .txt upload, search |
| 3. AI integration | 45 min | aiService (mock + anthropic), generate endpoint, summary/decisions/action extraction, validation |
| 4. Action items + tracker | 45 min | CRUD, central tracker with filters (status/priority/owner/due), overdue detection |
| 5. Dashboard | 20 min | Aggregation endpoint + cards |
| 6. UX polish | 30 min | Rich text editor wiring, light/dark mode, loading/empty/error states, responsive pass |
| 7. Tests + docs | 30 min | Core backend tests, README, AI usage report, CLAUDE.md/TODO.md kept current |

If time is tight, cut in this order: dashboard extra metrics → responsive polish beyond basic breakpoints → PDF/DOCX upload → tests beyond auth+AI validation. Never cut: auth, meeting CRUD, AI generation with validation, action item CRUD.

## 6. Security & Engineering Practices Checklist
- Passwords hashed with bcrypt, never logged.
- JWT secret, DB URI, AI API key only in `.env` (gitignored), `.env.example` committed instead.
- Centralized Express error handler — never leak stack traces to client, generic message + server-side log.
- Input validation with Zod on every mutating route.
- File upload size/type restricted (text files, small size cap) via multer config.
- CORS locked to frontend origin.

## 7. What "MVP" means here
A user can: register → log in → create a meeting → paste/upload a transcript → trigger AI generation → see summary/decisions/action items → manage those action items in a tracker with filters → see a dashboard. Everything else (extra file formats, extra dashboard metrics, deep responsive polish, exhaustive tests) is stretch scope, added only after the above works end-to-end.
