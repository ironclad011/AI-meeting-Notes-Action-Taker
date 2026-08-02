# AI Usage & Engineering Report

## Executive Summary
This report documents the usage of AI assistance throughout the development of the **AI Meeting Notes & Action Tracker** project, detailing tools used, phase-sized prompting strategies, representative prompts, manual corrections, validation strategies, independent engineering decisions, and security/quality trade-offs.

---

## 1. AI Tools Utilized

- **Antigravity Coding Assistant (powered by Gemini & Claude 3.5 Sonnet)**: Primary AI pair programming assistant used for architecture planning, monorepo orchestration, Express routes, Mongoose schema modeling, Zod validation middleware, Tiptap rich text integration, Jest test suite construction, and documentation.
- **Anthropic Claude 3.5 Sonnet & Google Gemini 1.5 Flash**: Utilized as backend LLM engines in `backend/src/services/aiService.js` for real-time meeting transcript parsing into structured JSON.

---

## 2. Phase-by-Phase Prompting Approach

Rather than issuing one massive monolithic prompt, the project was executed in structured, phase-sized chunks following `TODO.md` and `PLAN.md`:

1. **Phase 0 & 1 (Base Setup & Auth)**: Focused on setting up the monorepo structure, Express error handling, Mongoose user schemas, JWT middleware, Zod validation, and frontend auth context.
2. **Phase 2 (Meeting Management)**: Built meeting CRUD endpoints, text indexing, Multer file upload middleware, and Next.js meeting form/detail pages.
3. **Phase 3 (AI Integration)**: Implemented `services/aiService.js` supporting `mock`, `gemini`, and `anthropic` providers with Zod JSON schema validation and retry logic.
4. **Phase 4 (Action Items & Tracker)**: Extended the ActionItem model with text indexes, built filtering/overdue queries, and created the Central Action Tracker page with inline editing.
5. **Phase 5 (Executive Dashboard)**: Implemented MongoDB `$facet` aggregation in `dashboardController.js` for single-query dashboard counts.
6. **Phase 6 (UX Polish & Responsive Design)**: Implemented persistent light/dark mode (`ThemeProvider.jsx`), Tiptap rich text editing (`RichTextEditor.jsx`), and responsive mobile hamburger drawer navigation.
7. **Phase 7 (Tests, PDF/DOCX Support & Documentation)**: Added `pdf-parse` and `mammoth` transcript extraction, built an end-to-end user lifecycle test (`integrationE2E.test.js`), frontend smoke tests, and comprehensive `README.md` and `AI_USAGE_REPORT.md` documentation.

---

## 3. Representative Prompts Used

### Prompt 1: AI Provider Interface & Schema Strictness
> *"Implement Phase 3 (AI Integration)... Create an aiService interface supporting mock, anthropic, and gemini. Ensure no fake decisions are invented, missing owners default to 'Unassigned', and missing due dates default to null. Validate all LLM JSON output against Zod schema and retry once on failure before marking status failed."*

### Prompt 2: Single-Query Dashboard Aggregation
> *"Create a single-query MongoDB $facet aggregation pipeline for dashboard summary counts (total, open, completed, overdue) rather than fetching all docs into JS memory."*

### Prompt 3: Responsive Mobile Hamburger Navigation
> *"The UI works fine for web layouts but for mobile layouts it becomes messy. Use a design which looks aesthetically pleasing in small form factor devices with a mobile hamburger navigation drawer."*

---

## 4. Where AI-Generated Code Was Incorrect & Manual Corrections Made

1. **ProtectedRoute Navigation Loop on Guest Pages**:
   - *Issue*: Early AI generation for `ProtectedRoute.jsx` checked `requireAuth = true` on guest pages (`/login` and `/register`), causing an infinite redirect loop.
   - *Correction*: Manually updated `ProtectedRoute.jsx` to evaluate `isAuthRequired = requireGuest ? false : requireAuth;` allowing guest auth pages to render immediately.

2. **React SSR Hydration Error in ActionItemRow**:
   - *Issue*: The AI generated a `<div className="md:hidden">` placed directly inside `<tbody>` in `ActionItemRow.jsx`. Browsers rejected `<div>` as a direct child of `<tbody>`, throwing a React DOM hydration error.
   - *Correction*: Wrapped the mobile card layout inside a valid HTML table row `<tr className="md:hidden"><td colSpan={6}><div ... /></td></tr>`.

3. **`pdf-parse` Function Import TypeError in Jest**:
   - *Issue*: Requiring `pdf-parse` directly inside the controller handler threw `TypeError: pdfParse is not a function` during unit testing due to CJS/ESM default export wrapping.
   - *Correction*: Safely unwrapped the module export: `const pdfParse = typeof pdfParseModule === 'function' ? pdfParseModule : (pdfParseModule.default || pdfParseModule);`.

4. **Dark Mode Text Contrast Overrides**:
   - *Issue*: Some header titles had hardcoded `text-white` classes, causing them to render white-on-white when toggled to Light mode.
   - *Correction*: Conducted a full theme audit, replacing hardcoded text utilities with adaptive `text-slate-900 dark:text-white` and `text-slate-600 dark:text-slate-400` classes.

---

## 5. How Generated Output Was Validated

- **Zod Response Validation**: All AI responses are validated against `aiResponseSchema.parse(json)` before writing to MongoDB.
- **49 Automated Backend Tests**: Comprehensive test suite covering authentication security, user isolation, search/filtering, overdue logic, PDF/DOCX file parsing, and full E2E user lifecycle integration.
- **Next.js Production Build**: Ran `npm run build` to verify 10/10 pages compile with zero lint or type errors.
- **Browser Visual Walkthrough**: Verified responsive layouts across mobile (~375px), tablet (~768px), and desktop (~1280px) viewports in both Light and Dark mode.

---

## 6. Independent Engineering Decisions Made

1. **MongoDB Choice & Memory Fallback**: Selected MongoDB for DB flexibility, and added an in-memory `mongodb-memory-server` fallback in `db.js` so tests and local servers run without local database setup friction.
2. **Swappable AI Provider Design**: Placed all LLM logic behind `services/aiService.js` exported functions, allowing seamless switching between `mock`, `gemini`, and `anthropic` via `AI_PROVIDER` environment variable.
3. **Single-Query `$facet` Pipeline**: Optimized dashboard analytics to run in a single MongoDB query round-trip instead of 4 separate database calls.
4. **Inline Tracker Table Editing**: Built inline select dropdowns and date pickers inside `ActionItemRow.jsx` to let users update status, priority, assignee, and due date directly in table rows.

---

## 7. Security, Quality & Architecture Concerns Identified

- **JWT Storage Trade-off**: Storing JWT in `localStorage` simplifies scope for a time-boxed MVP demo, but production implementations should consider `httpOnly` samesite cookies to mitigate XSS risks.
- **Rate Limiting**: Authentication endpoints (`/register`, `/login`) do not currently enforce IP rate limiting; `express-rate-limit` should be added in production.
- **Cascade Deletion**: Implemented `ActionItem.deleteMany({ meeting: meeting._id })` upon meeting deletion to prevent orphaned action item documents in MongoDB.
