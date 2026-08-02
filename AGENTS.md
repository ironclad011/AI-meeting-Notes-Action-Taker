# CLAUDE.md

Guidance for any AI coding assistant (Claude Code, Cursor, Copilot, etc.) working in this repository.
Read `PLAN.md` and `TODO.md` first — they hold the architecture and the phase order. This file holds
conventions and guardrails so generated code stays consistent as work moves fast under a 4-hour budget.

## Project in one line
A Next.js + Express + MongoDB app that stores meeting transcripts and uses an AI model to generate a
summary, key decisions, and trackable action items.

## Non-negotiable scope boundaries
- Do **not** build video/audio calling, screen sharing, live transcription, or calendar integration.
  The app starts *after* a meeting has already happened — text in, structured output out.
- Do not invent AI output. Missing owner → `"Unassigned"`. Missing due date → `null` / "Not specified".
  No decisions found → empty array, never a fabricated one.
- Follow the phase order in `TODO.md`. Do not jump ahead to polish (dark mode, animations) before the
  MVP flow (auth → meeting → AI generate → action tracker) works end-to-end.

## Repo layout
```
/backend
  /src
    /models        Mongoose schemas: User, Meeting, ActionItem
    /routes         Express routers, one file per resource
    /controllers    Route handler logic
    /services       aiService.js (mock + anthropic implementations behind one interface), others as needed
    /middleware      auth (JWT verify), errorHandler, validate (Zod)
    /schemas         Zod schemas shared by validation middleware
    /config          db.js, env loading
    app.js
    server.js
  /tests            Jest + Supertest
  .env.example
/frontend
  /app              Next.js App Router pages
  /components       Reusable UI components
  /lib              api client, auth context, utils
  /styles
  .env.example
PLAN.md
TODO.md
CLAUDE.md
README.md
```

## Conventions
- **Language**: JavaScript (or TypeScript if it doesn't slow the build down — prefer JS for speed given
  the time limit unless the assistant is already fluent enough in TS to not lose time).
- **API responses**: `{ success: boolean, data?: ..., error?: { message } }` consistently.
- **Error handling**: every controller wrapped or uses `next(err)`; one centralized error middleware in
  `backend/src/middleware/errorHandler.js` formats the response and logs internally. Never send stack
  traces or raw DB errors to the client.
- **Validation**: Zod schema per mutating endpoint, applied in middleware before the controller runs.
- **Auth**: JWT in `Authorization: Bearer` header. No cookies/sessions to keep scope small.
- **Env vars**: never hardcode secrets. Read from `process.env`. Keep `.env.example` in sync whenever a
  new var is introduced.
- **AI service**: always go through `services/aiService.js`'s exported function — never call the
  Anthropic SDK directly from a controller. This keeps the mock/real switch (`AI_PROVIDER` env var)
  working and keeps the integration point testable.
- **Commits**: small, scoped commits per phase (e.g. `feat: meeting CRUD`, `feat: AI insight generation`,
  `feat: action tracker filters`) — the assessment explicitly checks for a clean Git history.

## When generating code, prefer
- Reusable, small React components over large page files.
- Explicit, meaningful names over abbreviations.
- Existing, well-known libraries (Tiptap, react-hook-form, Zod, multer, bcrypt, jsonwebtoken) over
  hand-rolled equivalents — the brief explicitly discourages building things like a custom rich text
  editor from scratch.

## Testing expectations
Time-boxed — a handful of high-value backend tests beats broad shallow coverage:
1. Auth: register + login happy path and failure path.
2. AI response validation: valid JSON accepted, malformed JSON rejected/retried and marked `failed`.
3. Action item filtering: overdue detection logic.

## Definition of done for the MVP demo
Register → log in → create a meeting → paste or upload a transcript → generate AI insights (summary,
decisions, action items) → edit an action item's owner/due date/priority/status in the central tracker →
see dashboard counts update → toggle light/dark mode → resize to mobile and confirm it's still usable.

## Documentation obligations (do not skip under time pressure)
Both are graded deliverables:
- `README.md`: overview, stack, setup, env vars, architecture, DB design, API overview, assumptions,
  completed/not-completed features, limitations, future improvements.
- `AI_USAGE_REPORT.md`: which AI tools were used and how, key prompts, where AI output was wrong and
  what was manually corrected, how AI output was validated, engineering decisions made independently,
  any security/quality/architecture concerns identified along the way.
