# StudyBlocks — Design

Date: 2026-11-20
Status: draft, awaiting approval

## Intent

StudyBlocks is a clean, Obsidian-inspired calendar and planner for students. It pulls
assignments from Canvas, fits study time around classes, work shifts and other obligations,
flags conflicts, and shows how classes, assignments and study blocks connect in a graph
("study map").

It's for students in general, not only the author. Most students juggle a Canvas
calendar, a work schedule and a personal calendar that don't talk to each other, so they
end up planning study time in their heads. StudyBlocks puts those in one place and does
the planning for them.

## Goals

- Show a student's Canvas assignments and events on a calm, readable calendar within a
  minute of opening the app, with no account needed.
- Automatically place study blocks before due dates, in time the student is actually free.
- Make conflicts obvious (two obligations overlapping, or not enough free time before a
  deadline).
- Give an at-a-glance "study map" of how coursework connects.

## Non-goals (for now)

- Accounts and cross-device sync. Planned as a later optional milestone.
- Native mobile apps. The web app should still work at phone width.
- Writing back to Canvas (submitting, marking complete there).
- Collaboration or shared calendars between students.

## Anti-goals (would count as failure even if it works)

- **Keeping student data on our servers.** The feed helper must never store or log
  Canvas feed URLs, because those links work like passwords to a student's calendar.
- **Losing user data on re-import.** Re-syncing a feed must not wipe a student's own
  edits, study blocks or notes.
- **Clutter.** If it looks like a busy LMS dashboard instead of a quiet, Obsidian-like
  workspace, we've missed.
- **An open proxy.** The feed helper must not be usable to fetch arbitrary URLs.

## Constraints

- Canvas calendar feeds (`https://<school>/feeds/calendars/user_<token>.ics`) can't be
  fetched straight from the browser, because Canvas doesn't allow other sites to read
  them (CORS). A small server-side helper has to fetch them.
- Every school has its own Canvas domain (e.g. `canvas.school.edu`,
  `school.instructure.com`), so the helper can't allow-list hosts. It checks the URL
  shape instead (see Feed helper).
- The free, MIT-licensed parts of FullCalendar are fine to use. Its premium plugins
  (resource/timeline views) are not used.
- The author is a student, and coding agents will work on the project across many
  sessions, so the README has to carry the plan and the current status.

## Approaches considered

| Approach | Trade-offs | Decision |
|---|---|---|
| **A. Local-first web app** (data in the browser, stateless feed helper, optional sync later) | Free to host, fast to ship, no student data on our servers. No cross-device sync at first. | **Chosen** by the author. |
| B. Accounts from day one (Supabase auth + Postgres) | Sync from the start, but a bigger MVP, and we'd be holding student schedules and Canvas links (security, privacy, cost). | Rejected for now. Could become the sync milestone later. |
| C. Desktop app (Tauri) | Very private, offline, no CORS problem. But students have to install it, builds need signing, and there's no phone version. | Rejected as the main form. Possible later as an extra. |

## Tech stack (builder's call, stated to the author)

- **React + TypeScript + Vite**: interactive UI, with type safety for date and scheduling logic.
- **FullCalendar** (daygrid, timegrid, interaction, list): week and month views.
- **ical.js**: `.ics` parsing, including recurrence and time zones.
- **Dexie (IndexedDB)**: local storage, with room to add sync later.
- **Hono**: the feed helper. Runs locally with Node in development and can be deployed
  as a serverless function later.
- **Cytoscape.js**: study map (milestone 4).
- **Vitest + Testing Library**: unit tests. Scheduling and import logic stays pure and
  heavily tested.
- Plain CSS with CSS variables for theming. Dark theme by default (Obsidian-like), with a
  light theme too.

## Project structure

```
studyblocks/
  src/
    app/        shell, sidebar, routing, theme
    calendar/   calendar views (FullCalendar wrappers)
    import/     .ics parsing + Canvas mapping (pure, tested)
    schedule/   scheduler + conflict detection (pure, tested; milestones 2–3)
    graph/      study map (milestone 4)
    db/         Dexie schema, queries
  server/       feed helper (Hono)
  docs/         specs, plans
```

## Data model (milestone 1)

- **Feed**: `id`, `url`, `label`, `lastSyncedAt`, `lastError?`. The URL is stored only in
  the student's browser.
- **Course**: `id`, `name`, `color`. Created from the course names found in Canvas
  event titles. The student can rename courses and change their colors.
- **CalendarItem**: `id`, `uid` (from the .ics), `feedId?`, `courseId?`, `kind`
  (`assignment` | `event`), `title`, `start`, `end?`, `allDay`, `url?`, `description?`,
  `done` (set by the student), `userEdited` (flag).

Times are stored as UTC ISO strings and shown in the browser's local time zone.

### Mapping Canvas feeds

- UIDs that start with `event-assignment-` become `kind = assignment`. Everything else
  becomes `event`.
- Canvas puts the course in a bracket at the end of `SUMMARY`, e.g.
  `Lab 7 [CS 210 Fall 2026]`. Strip it from the title and use it as the course name.
  If there's no bracket, there's no course.
- Assignments arrive as a point in time (the due time) or as an all-day date. They're
  treated as deadlines, not time blocks.

### Re-importing a feed

- Upsert by `uid` within that feed. Student-owned fields (`done`, course color, anything
  flagged `userEdited`) are never overwritten.
- Items that have disappeared from the feed are deleted unless they're `userEdited` or
  `done`. In that case they're kept and marked "removed from Canvas".
- Uploading a `.ics` file follows the same rules, using a feed record whose label is the
  file name.

## Feed helper

`GET /api/feed?url=<encoded>` returns the `.ics` text. Rules:

- The URL must be `https:` and its path must match `/feeds/calendars/*.ics`.
- Refuse hosts that resolve to private or loopback addresses.
- Timeout of 10 s, response size cap of 5 MB, and the response must look like iCalendar
  (`BEGIN:VCALENDAR`).
- Store nothing, and don't log the URL (log only the host and status).

## Milestones

1. **MVP: calendar + .ics import.** App shell with sidebar and dark/light theme. Week,
   month and agenda views. Import by pasting a URL (through the helper) or uploading a
   file. Re-sync button. Assignment list grouped by due date, with a "done" checkbox.
   Course colors. Everything saved locally. Includes a sample `.ics` so the app can be
   tried without a Canvas account.
2. **Obligations + conflicts.** Add classes, work shifts and other obligations, one-time
   or weekly. Flag overlapping obligations in the calendar and in a conflicts panel.
   Seed data includes a made-up test work shift (e.g. Tue/Thu 4–9 pm, Sat 10 am–4 pm).
3. **Auto-scheduler.** Each assignment gets a time estimate (defaults by type,
   editable). Students set their available hours and block-length preferences. The app
   fills free time before due dates, flags deadlines that can't fit, and reschedules when
   things change. Blocks the student has moved are pinned.
4. **Study map.** A Cytoscape graph with course, assignment and study-block nodes. Click
   a node to jump to it on the calendar.
5. **Canvas API.** Optional personal access token. Brings in point values, submission
   status and assignment groups, and syncs automatically.
6. **Polish + launch.** Deploy (static hosting + serverless helper), export the schedule
   as `.ics`, PWA install, and optional sync (approach B as an add-on).

## Left to the builder

- Exact visual design within "quiet, Obsidian-like".
- The hosting provider (decided in milestone 6).
- Default time estimates and scheduling heuristics (decided in milestone 3).
- Whether to add a router, or to use simple view state.
