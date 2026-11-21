# Milestone 3 — Auto-scheduler: Design

Date: 2026-11-21
Status: approved 2026-11-21
Parent design: `2026-11-20-studyblocks-design.md`

## Intent

Versions 1 and 2 taught StudyBlocks what's due and when the student is busy. Version 3
uses both to plan study time: it places study blocks in free time before each deadline,
so students don't have to plan in their heads.

## Decisions made by the author

- **Start early:** begin today and work a little each day, rather than cramming close to
  the due date.
- **Flexible chunks:** blocks vary in length between a minimum and a maximum.
- **Leave a buffer** around classes, shifts and other commitments.
- **Re-plan with a button** ("Plan my study time"), never automatically.
- **Finishing early:** when an assignment is checked off, its study blocks **stay on the
  calendar, crossed out**, instead of disappearing.

## Goals

- Every upcoming, unfinished assignment gets enough study time before it's due, spread
  across the days from today until then.
- Students can see and adjust how long each assignment should take.
- If something won't fit, the student is told clearly what and by how much.
- Blocks the student dragged by hand are never moved by the planner.

## Non-goals

- Automatic re-planning in the background.
- Smart estimates (learning from how long things actually took). Estimates are simple
  defaults the student can change.
- Splitting assignments into sub-tasks.
- Scheduling around imported Canvas events. Like conflicts, only the student's own
  commitments count as busy. (Canvas events still show on the calendar.)

## Anti-goals

- A plan the student can't trust: blocks on top of classes or shifts, outside study
  hours, or after the deadline.
- Wiping out blocks the student arranged by hand.
- A cluttered calendar. Blocks should read as quiet, clearly secondary.

## Approaches considered

| Approach | Trade-offs | Decision |
|---|---|---|
| **A. Earliest-deadline-first, spread one chunk per day** | Simple, predictable, easy to explain ("it works on what's due first, a bit each day"). Not mathematically optimal. | **Chosen** (builder's call) |
| B. Optimization solver (e.g. linear programming) | Can balance everything at once, but it's heavy, hard to explain when it does something surprising, and overkill for one student's week. | Rejected |
| C. Even split per assignment, ignoring other assignments | Simplest, but overlapping deadlines would fight for the same free time. | Rejected |

### How approach A works
1. Find **free time**: study hours, minus commitments with the buffer before and after,
   minus existing blocks that stay (pinned, past, or crossed out).
2. Take assignments in **due-date order**. For each one, work out **remaining hours** =
   estimate − hours already in past blocks − hours in pinned future blocks.
3. Walk the days from **today** to the day before it's due. Each pass gives each day
   **one chunk** (min 30 min, max 2 h, sized to fit the free slot), staying under the
   **daily study limit**, until the remaining hours are covered. Repeat passes if needed.
   That spreads the work early and across days.
4. Anything that still doesn't fit becomes a **"won't fit" warning** with the hours short.

## Builder's calls (stated so the author can correct them)

- **Buffer:** a separate setting, default **15 minutes** before and after each
  commitment. It's not tied to the back-to-back warning setting, so turning warnings off
  doesn't remove the buffer.
- **Study hours:** one window for weekdays (default **9 am–10 pm**) and one for weekends
  (default **10 am–10 pm**).
- **Daily study limit:** default **4 hours** of planned study per day.
- **Chunk sizes:** **30 min minimum, 2 h maximum.**
- **Default estimates** come from the assignment title: quiz 1 h, exam/test/midterm/final
  4 h, project 6 h, essay/paper 4 h, lab 2 h, problem set/homework 2 h,
  discussion/reading/peer review 1 h, anything else 2 h. Editable per assignment.
- **All-day deadlines** ("due Dec 5", no time) are treated as due at the **start** of that
  day, so the plan finishes the day before. Timed deadlines are due at their time, and
  the last block ends before it.
- **What re-planning replaces:** future blocks the planner made that aren't pinned or
  crossed out. Pinned, past and crossed-out blocks stay.
- **Dragging a block pins it** (shown with a small pin). It can be unpinned from its
  details, which hands it back to the planner.
- **Past blocks count as studied.** If a block's time has passed, its hours count toward
  that assignment.
- **Crossed-out blocks** (assignment marked done) don't take up time when re-planning,
  so the time is freed for other work. If the assignment is un-checked, its blocks are
  shown normally again.
- **Study blocks don't count toward conflicts or warnings.** The planner keeps them out of
  commitments in the first place.
- **The plan covers the next 8 weeks**, the same window as conflicts.
- **Look:** study blocks use the assignment's course color as a light, translucent block
  with a colored left edge, so they look secondary to solid commitment blocks.

## Data model

New Dexie table `studyBlocks` (schema version 3):

```
StudyBlock {
  id: string
  itemId: string     // the assignment (CalendarItem.id)
  start: string      // ISO
  end: string        // ISO
  pinned: boolean    // the student moved it; the planner leaves it alone
}
```

`CalendarItem` gets an optional `estimateMinutes`, which is student-owned and kept on
re-import. Settings get `studyHours`, `dailyLimitMinutes`, `bufferMinutes`,
`chunkMinMinutes` and `chunkMaxMinutes`.

## Logic (pure, tested)

- `defaultEstimate(title): number` (minutes)
- `freeSlots(range, settings, occurrences, keptBlocks): Slot[]`
- `planStudy({ items, occurrences, blocks, settings, now }): { add: StudyBlock[]; remove: string[]; wontFit: { itemId; shortMinutes }[] }`

## UI

- A **"Plan my study time"** button (sidebar and calendar toolbar). It shows a short
  summary afterwards: "Planned 9 blocks (11 h) · 1 assignment won't fit."
- **Study blocks on the calendar:** draggable and resizable (dragging pins). Clicking one
  shows its assignment, the time, and Unpin/Delete.
- **Assignment details:** an "Estimated time" field (hours + minutes), plus a progress
  line ("3 h planned · 1 h done · needs 2 h more").
- **"Won't fit" list:** shown in the plan summary and on the Conflicts page as its own
  section.
- **Study settings** (on the Conflicts page, renamed **"Schedule"**): study hours, daily
  limit, buffer, chunk sizes.

## Left to the builder

- Exact visual design of blocks and the summary.
- The exact tie-breaking rules inside the planner (within "earliest deadline first, spread
  across days").
