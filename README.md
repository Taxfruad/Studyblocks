# StudyBlocks

A clean, Obsidian-inspired calendar and planner for students. It pulls your Canvas
assignments into one calm calendar. Later milestones fit study time around classes and
work shifts, flag conflicts, and map how your coursework connects.

**Status:** Milestone 1 (calendar + .ics import) is done. Milestone 2 is next.

## Run it

Needs Node 20+.

```bash
npm install
npm run dev        # app on http://localhost:5173 + feed helper on :8787
npm test           # unit tests (Vitest)
npm run typecheck
npm run build
```

No Canvas account? Click **Try sample data** on the start screen.

To import your real calendar: in Canvas open **Calendar → Calendar Feed**, copy the link,
and paste it into **Import Canvas calendar**. You can also upload any `.ics` file.

## How it works

- **Local-first.** Everything a student imports is stored in their own browser
  (IndexedDB via Dexie). There are no accounts and no database on our side.
- **Feed helper** (`server/`). Canvas doesn't let web pages read calendar feeds from
  other sites (CORS), so a tiny stateless server fetches them for the app. It only
  accepts `https://…/feeds/calendars/*.ics` links, refuses private network addresses,
  caps size (5 MB) and time (10 s), and **never stores or logs feed URLs**. Those links
  work like passwords.
- **Re-syncing never loses your stuff.** Items are matched by their `.ics` UID. Your
  "done" marks and course colors are never overwritten. If something vanishes from
  Canvas after you marked it done, it's kept and labeled "Removed from Canvas".
- **Deadlines vs. time blocks.** Canvas assignments are deadlines, so they sit in the
  "Due" row of the day they're due (in your time zone). Events with real times are blocks
  on the grid.

```
src/
  app/          shell, sidebar, theme, item details dialog
  calendar/     FullCalendar view, item → event mapping, date helpers
  assignments/  assignment list + grouping
  import/       .ics parsing, Canvas mapping, sample feed, import/sync actions, dialog
  db/           Dexie schema, import merge rules, course colors
server/         feed helper (Hono)
docs/superpowers/specs/   design doc (the "why" and the full plan)
docs/superpowers/plans/   per-milestone implementation plans
```

**Stack:** React 19 + TypeScript + Vite · FullCalendar 6 (free MIT plugins) · ical.js ·
Dexie · Hono · Vitest. Planned: Cytoscape.js for the study map, Tauri as an optional
desktop build.

## Roadmap

| # | Milestone | Status |
|---|---|---|
| 1 | **MVP:** calendar (week/month/agenda), Canvas link + `.ics` import, re-sync, assignment list with done, course colors, dark/light theme, sample data | ✅ Done |
| 2 | **Obligations + conflicts:** add classes, work shifts and other commitments (one-time or weekly), and flag overlaps. Seed a made-up test shift: Tue/Thu 4–9 pm, Sat 10 am–4 pm | ⏭ Next |
| 3 | **Auto-scheduler:** time estimates per assignment, available hours, study blocks placed before due dates, warnings when a deadline can't fit, pinned blocks | |
| 4 | **Study map:** Obsidian-style graph of courses ↔ assignments ↔ study blocks | |
| 5 | **Canvas API:** optional access token, point values, submission status, auto-sync | |
| 6 | **Polish + launch:** deploy (static site + serverless helper), export to Google/Apple Calendar, installable PWA, optional account sync | |

## Decisions so far

- **For students in general, not just one person.** That's why approach A was chosen:
  local-first, so we hold no student data. Accounts with sync (Supabase) are an add-on in
  milestone 6, not the foundation.
- **TypeScript over Python**, because the app is mostly an interactive UI that runs in
  the browser.
- **Hosting is decided at launch** (milestone 6). Until then everything runs locally.

## Picking this up later

1. Read the design doc: `docs/superpowers/specs/2026-11-20-studyblocks-design.md`.
2. Check the roadmap above for the next milestone, and write its plan in
   `docs/superpowers/plans/`.
3. `npm test` should be green before and after each change.

## Known limits (milestone 1)

- Re-syncing is manual (there's a button per calendar). Auto-sync comes with milestone 5.
- Uploaded `.ics` files can't re-sync. Upload the newer file instead.
- Recurring events in non-Canvas calendars are expanded from 1 year back to 1 year ahead
  (max 500 occurrences each).
- The feed helper checks DNS before fetching but doesn't pin the resolved IP. That's fine
  locally; tighten it before public deployment (milestone 6).
