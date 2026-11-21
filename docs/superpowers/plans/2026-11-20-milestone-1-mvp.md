# Milestone 1 (MVP: calendar + .ics import) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A local-first web app that imports a Canvas calendar feed (URL or file), stores it in the browser, and shows it on a calm Obsidian-like calendar with an assignment list.

**Architecture:** Vite + React SPA. Pure modules for parsing (`src/import`) and merging (`src/db/importFeed.ts`) carry the logic and the tests. The UI reads Dexie through `useLiveQuery`. A small Hono server (`server/`) is the stateless feed helper, proxied from Vite under `/api` in development.

**Tech Stack:** React 19, TypeScript, Vite, FullCalendar 6.1.x (daygrid/timegrid/list/interaction), ical.js 2, Dexie 4 + dexie-react-hooks, Hono 4 + @hono/node-server, Vitest, fake-indexeddb.

**Spec:** `docs/superpowers/specs/2026-11-20-studyblocks-design.md`

## Global Constraints

- The feed helper never stores or logs feed URLs. Log host + status only.
- Helper accepts only `https:` URLs whose path matches `/feeds/calendars/*.ics`, refuses private/loopback hosts, 10 s timeout, 5 MB cap, body must contain `BEGIN:VCALENDAR`.
- Re-import never overwrites `done`, course color/name, or `userEdited` items. Vanished items are deleted unless `done` or `userEdited`, in which case they get `removedFromSource = true`.
- Times are UTC ISO strings. All-day values are `YYYY-MM-DD` strings (no timezone conversion).
- Dark theme by default, with a light theme toggle. Works at phone width.
- All FullCalendar packages pinned to the same 6.1.x version (free MIT plugins only).

## Review Focus

1. **All-day Canvas assignments** (`DTSTART;VALUE=DATE:20261205`) must land on Dec 5 in every time zone. Stored as `"2026-12-05"`, never converted. (Task 2 test.)
2. **Titles with extra brackets or commas** like `Quiz [1], review [CS 210 Fall 2026]`: the course is the *last* bracket and the title keeps the earlier one. (Task 2 test.)
3. **Re-sync after the student marks something done and it disappears from Canvas:** keep it, flagged as removed. (Task 3 test.)
4. **Bad URL, non-ics response, or network failure:** clear error, existing data untouched. (Task 4 tests + Task 3 test that a failed parse imports nothing.)
5. **Recurring events in a plain .ics** (RRULE): expanded within a bounded window (1 year past to 1 year ahead, max 500 occurrences) so the browser doesn't hang. (Task 2 test.)

---

### Task 1: Scaffold, tooling, git

**Files:** Create the Vite react-ts scaffold, `vitest.config.ts`, `.gitignore`, `src/test/setup.ts`

- [ ] Scaffold with `npm create vite@latest . -- --template react-ts`, then install the stack above.
- [ ] Scripts: `dev` (vite + helper via concurrently), `dev:web`, `dev:server` (`tsx watch server/index.ts`), `test` (`vitest run`), `build`, `typecheck`.
- [ ] Vite proxies `/api` to `http://localhost:8787`.
- [ ] `npm test` runs (no tests yet is OK) and `npm run build` succeeds.
- [ ] `git init`, commit "chore: scaffold StudyBlocks".

### Task 2: .ics parsing + Canvas mapping

**Files:** Create `src/import/types.ts`, `src/import/parseIcs.ts`, `src/import/canvas.ts`, `src/import/parseIcs.test.ts`, fixture `src/import/fixtures/canvas-sample.ics` (also copied to `public/sample-canvas.ics`)

**Interfaces — Produces:**
- `type ParsedItem = { uid: string; kind: 'assignment' | 'event'; title: string; courseName?: string; start: string; end?: string; allDay: boolean; url?: string; description?: string }`
- `parseIcs(text: string, now?: Date): ParsedItem[]`. Throws `IcsParseError` on invalid input.
- `splitCanvasTitle(summary: string): { title: string; courseName?: string }`

- [ ] Tests:
  - `splitCanvasTitle('Lab 7 [CS 210 Fall 2026]')` → `{title:'Lab 7', courseName:'CS 210 Fall 2026'}`
  - `splitCanvasTitle('Quiz [1], review [CS 210]')` → `{title:'Quiz [1], review', courseName:'CS 210'}`
  - `splitCanvasTitle('Office hours')` → `{title:'Office hours'}`
  - The fixture parses into the expected count. `event-assignment-*` UIDs give `kind:'assignment'`.
  - An all-day assignment gives `{allDay:true, start:'2026-12-05'}`.
  - A UTC timed event gives `start:'2026-12-03T17:00:00.000Z'`.
  - An RRULE weekly event expands to occurrences with unique uids `${uid}::${start}`, capped by the window.
  - `parseIcs('garbage')` throws `IcsParseError`.
- [ ] Implement with ical.js (`ICAL.parse`, `Component`, `Event`, `iterator`).
- [ ] Tests pass. Commit.

### Task 3: Local database + import merge

**Files:** Create `src/db/db.ts`, `src/db/colors.ts`, `src/db/importFeed.ts`, `src/db/importFeed.test.ts`

**Interfaces — Produces:**
- `Feed { id: string; label: string; url?: string; lastSyncedAt?: string; lastError?: string }`
- `Course { id: string; name: string; color: string }` (unique index on `name`)
- `CalendarItem { id: string; uid: string; feedId: string; courseId?: string; kind; title; start; end?; allDay; url?; description?; done: boolean; userEdited: boolean; removedFromSource: boolean }`. `id = feedId + '|' + uid`.
- `class StudyBlocksDB extends Dexie` with tables `feeds`, `courses`, `items`. `db` singleton.
- `importFeed(db: StudyBlocksDB, feedId: string, parsed: ParsedItem[]): Promise<{ added: number; updated: number; removed: number; kept: number }>`. Runs in one transaction.
- `COURSE_COLORS: string[]`, `nextCourseColor(existingCount: number): string`

- [ ] Tests (fake-indexeddb):
  - The first import adds everything and creates courses with distinct colors.
  - Re-importing the same data reports `added 0, updated N` and doesn't duplicate.
  - `done` survives a re-import that changes the title.
  - An item that vanished and isn't done gets deleted. One that vanished and is done gets kept with `removedFromSource:true`.
  - A course color the student changed survives a re-import.
  - Importing into feed B doesn't touch feed A's items.
- [ ] Implement. Tests pass. Commit.

### Task 4: Feed helper server

**Files:** Create `server/app.ts`, `server/index.ts`, `server/validate.ts`, `server/app.test.ts`, `server/validate.test.ts`

**Interfaces — Produces:**
- `isAllowedFeedUrl(raw: string): boolean`
- `isPrivateAddress(ip: string): boolean` (IPv4 + IPv6: loopback, 10/8, 172.16/12, 192.168/16, 169.254/16, 127/8, ::1, fc00::/7, fe80::/10, 0.0.0.0)
- `createApp(deps?: { fetch?: typeof fetch; resolve?: (host: string) => Promise<string[]> }): Hono`
- `GET /api/feed?url=` → 200 `text/calendar` | 400 `{error}` bad url | 502 `{error}` upstream failure/non-ics/too large | 504 timeout.

- [ ] Tests: allowed `https://canvas.school.edu/feeds/calendars/user_abc.ics`. Rejected `http:`, a wrong path, `https://localhost/feeds/calendars/x.ics`, and a host resolving to `10.0.0.5`. Non-ics body gives 502. Oversized body gives 502. Good body gives 200 with the text.
- [ ] Implement (redirect: `manual`, checking each hop's URL rule; read the body with a byte cap).
- [ ] Tests pass. Commit.

### Task 5: App UI

**Files:** Create `src/app/App.tsx`, `src/app/Sidebar.tsx`, `src/app/theme.css`, `src/app/useTheme.ts`, `src/calendar/CalendarView.tsx`, `src/calendar/toEvents.ts` (+ test), `src/import/ImportDialog.tsx`, `src/import/syncFeed.ts`, `src/assignments/AssignmentList.tsx`, `src/assignments/group.ts` (+ test). Replace the scaffold's `App`/CSS.

**Interfaces — Produces:**
- `toCalendarEvents(items: CalendarItem[], courses: Course[]): EventInput[]`. Assignments render as zero-length deadline events (title prefixed with nothing, styled with a dot). Course color is the event color. Done items are dimmed via `classNames:['is-done']`.
- `groupAssignments(items: CalendarItem[], today: Date): { label: 'Overdue' | 'Today' | 'This week' | 'Later' | 'Done'; items: CalendarItem[] }[]`
- `syncFeedFromUrl(url: string, label?: string): Promise<ImportResult>` and `importFile(file: File): Promise<ImportResult>` (feed id from the URL/file name hash). On error, sets `feed.lastError` and imports nothing.

- [ ] Tests for `toCalendarEvents` (all-day stays a date string, color applied) and `groupAssignments` (bucket boundaries in local time).
- [ ] Layout: left sidebar (logo, view switch Calendar/Assignments, feeds list with re-sync and remove, courses with color dot + color picker, theme toggle). Main area: FullCalendar with week/month/list toolbar, or the assignment list. Empty state with "Import Canvas calendar" + "Try sample data". Below 760 px the sidebar collapses behind a menu button.
- [ ] Import dialog: paste URL (with a short "where to find it in Canvas" hint: Calendar → Calendar Feed), or choose a `.ics` file. Shows the result counts or the error.
- [ ] Verify in the browser (Playwright): sample import shows events, done toggling dims, theme toggles, mobile width has no horizontal scroll.
- [ ] Commit.

### Task 6: README

- [ ] `README.md`: what it is, how to run (`npm install`, `npm run dev`, `npm test`), architecture, the milestone list with status (M1 done), decisions, and where the spec/plan live. Commit.
