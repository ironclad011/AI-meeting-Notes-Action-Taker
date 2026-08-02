# AI Meeting Notes & Action Tracker

## 1. Project Overview

A full-stack Next.js + Express + MongoDB web application that processes meeting transcripts (pasted text or uploaded `.txt`, `.pdf`, `.docx` files), utilizes AI language models to generate structured executive summaries, key decisions, risks, unanswered questions, and trackable action items, and features a central action tracker dashboard.

---

## 2. Technology Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS (with persistent Light/Dark mode), Lucide Icons, Tiptap Rich Text Editor (`@tiptap/react`).
- **Backend**: Node.js, Express.js, MongoDB (Mongoose ORM with Atlas URI & local `mongodb-memory-server` fallback for zero-dependency testability), `multer` (file uploads), `pdf-parse` (PDF extraction), `mammoth` (Word .docx extraction).
- **Authentication**: JWT stored in `Authorization: Bearer` headers, bcryptjs password hashing (10 salt rounds).
- **Validation**: Zod schemas applied as Express middleware.
- **AI Service Integration**: Swappable `aiService` supporting `mock` (heuristic text analysis), `gemini` (Google Gemini API), and `anthropic` (Claude API) with automatic Zod schema validation and 1-retry fallback logic.
- **Testing**: Jest + Supertest (49 backend tests covering auth, meetings, AI parsing, action items filtering/overdue, and full E2E user lifecycle integration flow).

---

## 3. Setup Instructions

### Step 1: Clone Repository
```bash
git clone <repository-url>
cd AI_meeting_notes_action_taker
```

### Step 2: Install Dependencies
```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### Step 3: Configure Environment Variables
- Copy `backend/.env.example` to `backend/.env`
- Copy `frontend/.env.example` (or `.env.local.example`) to `frontend/.env.local`

### Step 4: Database Setup (MongoDB)
You can choose either option:
- **Option A (MongoDB Atlas Cloud)**: Provide your MongoDB Atlas connection string in `backend/.env` under `MONGO_URI`.
- **Option B (Local/Memory Fallback)**: If `MONGO_URI` is left blank or disconnected, the backend automatically spins up an in-memory MongoDB instance via `mongodb-memory-server` for zero-install friction!

### Step 5: Run Development Servers
Open two terminal windows:

Terminal 1 (Backend Server):
```bash
cd backend
npm run dev
# Starts backend server on http://localhost:5000
```

Terminal 2 (Frontend Dev Server):
```bash
cd frontend
npm run dev
# Starts Next.js frontend on http://localhost:3000
```

---

## 4. Environment Variables

### Backend (`/backend/.env`)

| Variable Name | Purpose | Required / Optional | Example Value |
| :--- | :--- | :--- | :--- |
| `PORT` | Port number for Express server | Optional (Default: `5000`) | `5000` |
| `NODE_ENV` | Environment mode | Optional (Default: `development`) | `development` |
| `MONGO_URI` | MongoDB connection URI string | Optional (Fallback: Memory DB) | `mongodb+srv://user:pass@cluster.mongodb.net/dbname` |
| `JWT_SECRET` | Secret key for signing auth tokens | Required | `super_secret_jwt_key_12345` |
| `FRONTEND_URL` | Allowed CORS origin | Optional (Default: `http://localhost:3000`) | `http://localhost:3000` |
| `AI_PROVIDER` | Swappable AI provider (`mock`, `gemini`, `anthropic`) | Optional (Default: `mock`) | `mock` |
| `GEMINI_API_KEY` | API Key for Google Gemini API | Optional (Required if `AI_PROVIDER=gemini`) | `AIzaSy...` |
| `ANTHROPIC_API_KEY` | API Key for Anthropic Claude API | Optional (Required if `AI_PROVIDER=anthropic`) | `sk-ant-...` |

### Frontend (`/frontend/.env.local`)

| Variable Name | Purpose | Required / Optional | Example Value |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Base HTTP endpoint for backend API | Required | `http://localhost:5000/api` |

---

## 5. Architecture Overview

```
[ Next.js 15 Frontend (App Router) ]
         │  HTTP REST (JSON & Multipart)
         ▼  Header: Authorization: Bearer <JWT>
[ Express.js Backend Server ]
    ├── Routes & Zod Validation Middleware
    ├── Controllers & Mongoose Models
    └── Services (aiService.js)
            ├── Mock Provider (Heuristic)
            ├── Gemini API Provider
            └── Anthropic API Provider
```

- **Monorepo Split**: Clean separation between React frontend (`/frontend`) and Express API backend (`/backend`).
- **Client-Server Communication**: Frontend uses `apiFetch` helper in `lib/api.js` to automatically attach JWT token from `localStorage` into `Authorization: Bearer` headers.
- **Swappable AI Architecture**: `services/aiService.js` wraps all LLM implementations behind a unified `generateMeetingInsights(transcript)` interface. Switching `AI_PROVIDER` in `.env` toggles backend providers without changing controller logic.

---

## 6. Database Design

The database contains three main collections managed via Mongoose:

1. **Users Collection (`User.js`)**:
   - Stores user authentication profiles: `name`, `email` (unique index), `passwordHash` (excluded from `toJSON`), `createdAt`, and `updatedAt`.

2. **Meetings Collection (`Meeting.js`)**:
   - Belongs to a User (`owner` reference, indexed).
   - Holds meeting metadata (`title`, `date`, `type` enum, `participants` array, `transcript` text, `transcriptSource` enum, `notes`).
   - Contains embedded `ai` subdocument (`summary`, `keyDiscussionPoints`, `keyDecisions`, `risksOrConcerns`, `unansweredQuestions`, `status`, `generatedAt`, `error`).
   - Includes text index on `title` and compound index on `{ owner: 1, date: -1 }`.

3. **ActionItems Collection (`ActionItem.js`)**:
   - Belongs to a User (`owner` reference) and a Meeting (`meeting` reference).
   - Holds item details: `description` (text indexed), `assignee` (default 'Unassigned'), `dueDate` (default null), `priority` enum ('Low', 'Medium', 'High'), `status` enum ('Open', 'In Progress', 'Blocked', 'Completed'), and `source` enum ('ai_generated', 'manual').
   - Includes compound indexes on `{ owner: 1, status: 1 }` and `{ owner: 1, dueDate: 1 }`.
   - Computes dynamic `isOverdue` property (`dueDate < now AND status != "Completed"`).

---

## 7. API Overview

| Method | Endpoint Path | Auth Required | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | No | Register new user account & return JWT |
| `POST` | `/api/auth/login` | No | Authenticate user credentials & return JWT |
| `POST` | `/api/auth/logout` | Yes | Invalidate user session |
| `GET` | `/api/auth/me` | Yes | Retrieve current authenticated user profile |
| `POST` | `/api/meetings` | Yes | Create a new meeting |
| `GET` | `/api/meetings` | Yes | List user meetings (supports `search`, `type`, `page`, `limit`) |
| `GET` | `/api/meetings/:id` | Yes | Fetch single meeting details & attached action items |
| `PUT` | `/api/meetings/:id` | Yes | Update meeting metadata / transcript / notes |
| `DELETE` | `/api/meetings/:id` | Yes | Delete meeting & cascade-delete attached action items |
| `POST` | `/api/meetings/:id/transcript-file` | Yes | Upload `.txt`, `.pdf`, or `.docx` transcript file |
| `POST` | `/api/meetings/:id/generate-ai` | Yes | Run AI service to extract insights & create action items |
| `POST` | `/api/action-items` | Yes | Manually create an action item |
| `GET` | `/api/action-items` | Yes | Query action items (supports `status`, `priority`, `assignee`, `dueBefore`, `overdue`, `search`, `meetingId`, `page`) |
| `GET` | `/api/action-items/:id` | Yes | Fetch single action item by ID |
| `PUT` | `/api/action-items/:id` | Yes | Update action item (powers inline table editing) |
| `DELETE` | `/api/action-items/:id` | Yes | Delete action item |
| `GET` | `/api/dashboard/summary` | Yes | Aggregate dashboard metrics (`$facet` pipeline) and recent meetings |

---

## 8. Assumptions Made

1. **Stateless JWT Auth**: Session management uses stateless JWT stored in `localStorage`. Logout clears the client-side token.
2. **Post-Meeting Processing**: The app starts *after* a meeting has concluded; live transcription is out of scope.
3. **File Format Constraints**: Transcript file uploads support plain text (`.txt`), Adobe PDF (`.pdf`), and Microsoft Word (`.docx`) up to 5MB.
4. **AI Factual Guardrails**: Missing assignees default to `"Unassigned"`, missing due dates default to `null`, and no fake decisions are fabricated if none exist.

---

## 9. Features Completed (Mandatory Requirements 1–14)

- [x] **Requirement 1 (Auth)**: User registration and login with bcrypt hashing and JWT.
- [x] **Requirement 2 (Scoping)**: User isolation — all endpoints strictly scoped to `req.user.id`.
- [x] **Requirement 3 (Meeting CRUD)**: Full CRUD for meetings with title, date, type, participants, transcript, and notes.
- [x] **Requirement 4 (Dual Input)**: Textarea input and file upload (`.txt`, `.pdf`, `.docx`).
- [x] **Requirement 5 (Rich Text)**: Tiptap rich text editor integration for transcripts and notes.
- [x] **Requirement 6 (AI Insights)**: Automated generation of Executive Summary, Discussion Points, Decisions, Risks, and Questions.
- [x] **Requirement 7 (Action Item Auto-Creation)**: AI action items automatically saved into MongoDB.
- [x] **Requirement 8 (Central Action Tracker)**: Centralized table/card tracker listing all action items across meetings.
- [x] **Requirement 9 (Tracker Filtering)**: Multi-filter by status, priority, assignee, due date, search, and overdue status.
- [x] **Requirement 10 (Inline Editing)**: Direct inline status, priority, assignee, and due date updates in tracker.
- [x] **Requirement 11 (Overdue Highlight)**: Automatic overdue detection (`dueDate < now AND status != Completed`) with visual warning badges.
- [x] **Requirement 12 (Dashboard Aggregation)**: Real-time dashboard showing total meetings, total/open/completed/overdue counts, and recent meetings.
- [x] **Requirement 13 (Light/Dark Mode)**: Persistent light/dark mode switch with OS fallback and responsive mobile hamburger menu.
- [x] **Requirement 14 (Test Suite)**: 49 backend unit, integration, and E2E lifecycle tests passing 100%.

---

## 10. Features Not Completed

- **Kanban Board View**: Skipped in favor of a responsive table/card list with inline editing to prioritize full test coverage and documentation obligations under time limits.

---

## 11. Known Limitations

1. **No Password Reset**: Password recovery flow is omitted.
2. **No Auth Rate Limiting**: Authentication endpoints do not currently enforce IP rate limiting.
3. **Mock LLM Heuristics**: The `mock` provider relies on sentence splitting and keyword heuristics; for real semantic extraction, set `AI_PROVIDER=gemini` or `AI_PROVIDER=anthropic`.

---

## 12. Future Improvements

1. **Kanban Drag-and-Drop View**: Add a Trello-style board view for action items.
2. **Export Notes**: Export generated summaries and action items to Markdown / PDF download.
3. **Calendar Integration**: Sync action item due dates with Google Calendar / Outlook.
