# TODO.md — Execution Checklist (4-hour budget)

Legend: `[MVP]` must-have to demo the core flow · `[STR]` stretch, do only if ahead of schedule.

## Phase 0 — Setup (0:00–0:15) [MVP]
- [x] Init monorepo: `/backend`, `/frontend`
- [x] Backend: Express app, `dotenv`, Mongoose connection, health-check route
- [x] Frontend: Next.js (App Router) + Tailwind configured with dark mode (`class` strategy)
- [x] `.env.example` in both folders (MONGO_URI, JWT_SECRET, AI_PROVIDER, ANTHROPIC_API_KEY, PORT, FRONTEND_URL)
- [x] `.gitignore` covers `node_modules`, `.env`, build output
- [x] Confirm both dev servers run concurrently (`concurrently` or two terminals)

## Phase 1 — Auth (0:15–0:45) [MVP]
- [x] User model (name, email unique, passwordHash)
- [x] `POST /api/auth/register` — Zod validation, bcrypt hash
- [x] `POST /api/auth/login` — issue JWT
- [x] `POST /api/auth/logout` — clear client token (client-side, stateless JWT)
- [x] `GET /api/auth/me` — return current user from token
- [x] Express auth middleware (verify JWT, attach `req.user`)
- [x] Frontend: login/register pages, auth context/store, protected route wrapper, redirect unauthenticated users
- [x] Error states: invalid credentials, duplicate email, weak password

## Phase 2 — Meeting Management + Transcript Input (0:45–1:30) [MVP]
- [x] Meeting model
- [x] `POST /api/meetings` (title, date, type, participants, transcript required — validation)
- [x] `GET /api/meetings` with `search` + `type` filter
- [x] `GET /api/meetings/:id`
- [x] `PUT /api/meetings/:id`
- [x] `DELETE /api/meetings/:id` (+ cascade delete its action items)
- [x] `POST /api/meetings/:id/transcript-file` — multer, `.txt` minimum, size cap, mimetype check
- [x] Frontend: meeting list page (cards/table + search + type filter), create/edit form (Zod + react-hook-form), meeting detail page showing transcript (Tiptap read view)
- [x] Frontend: paste-transcript textarea AND file upload on the same form
- [x] Delete confirmation modal

## Phase 3 — AI Integration (1:30–2:15) [MVP]
- [x] `services/aiService.js` interface: `generateMeetingInsights(transcript)`
- [x] Mock implementation (deterministic, no API key needed)
- [x] Anthropic implementation (strict-JSON system prompt)
- [x] Zod schema for AI response; reject/retry on invalid shape
- [x] `POST /api/meetings/:id/generate-ai` — sets `ai.status=processing` → calls service → saves summary/decisions/discussion points/risks/questions → creates `ActionItem` docs (`source: ai_generated`)
- [x] Handle "no clear decision" case (empty array, not invented content)
- [x] Frontend: "Generate AI Insights" button on meeting detail, processing spinner state, failed-request state with retry, rendered summary/decisions/risks/questions sections

## Phase 4 — Action Items + Tracker (2:15–3:00) [MVP]
- [ ] ActionItem model
- [ ] Full CRUD endpoints + manual-add endpoint
- [ ] `GET /api/action-items` with `status`, `priority`, `owner`, `dueBefore`, `overdue`, `search`, `meetingId` filters
- [ ] Overdue = `dueDate < now AND status != Completed`
- [ ] Frontend: action items list on meeting detail page (inline edit owner/due/priority/status)
- [ ] Frontend: central Action Tracker page — table/board view, filter bar (status, priority, owner, due date, search), overdue badge
- [ ] Manual "Add action item" form
- [ ] Delete confirmation

## Phase 5 — Dashboard (3:00–3:20) [MVP]
- [ ] `GET /api/dashboard/summary` aggregation (total meetings, total/open/completed/overdue action items, recent meetings)
- [ ] Frontend: dashboard cards + recent meetings list
- [ ] Empty state when no data yet

## Phase 6 — UX Polish (3:20–3:50) [MVP for baseline, STR for depth]
- [ ] `[MVP]` Light/dark toggle, persisted (e.g. `localStorage` + `prefers-color-scheme` default)
- [ ] `[MVP]` Loading indicators (list fetch, AI generation, form submit)
- [ ] `[MVP]` Empty states: no meetings, no action items, no search results
- [ ] `[MVP]` Responsive check at mobile/tablet/desktop breakpoints for nav, forms, tables → cards on small screens
- [ ] `[STR]` PDF/DOCX transcript upload support
- [ ] `[STR]` Kanban board view for tracker (vs table)
- [ ] `[STR]` Extra dashboard metrics (e.g. meetings by type)

## Phase 7 — Tests + Docs (3:50–4:00, or earlier if ahead) [MVP]
- [ ] Backend: auth tests (register/login happy + failure paths)
- [ ] Backend: AI response validation test (valid + invalid shape)
- [ ] Backend: action item filter/overdue logic test
- [ ] `[STR]` Frontend smoke test (renders meeting list)
- [ ] README.md — overview, stack, setup, env vars, architecture, DB design, API overview, assumptions, completed/not-completed features, limitations, future improvements
- [ ] AI Usage Report — tools used, how, key prompts, what was wrong/fixed, validation approach, independent engineering decisions, security/quality concerns noticed
- [ ] Final pass: no secrets committed, `.env.example` accurate, seed/demo data if time allows

## Cut list if running out of time (in order)
1. Kanban view → keep table only
2. Extra dashboard metrics
3. Deep responsive polish beyond usable
4. PDF/DOCX upload
5. Frontend tests (keep backend tests — they matter more for the eval)

## Never cut
Auth · Meeting CRUD · Transcript paste+upload · AI generation with validated JSON · Action item CRUD · Central tracker with at least status+priority filters · README + AI Usage Report
