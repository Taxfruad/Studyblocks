# Milestone 2 — Commitments + Conflicts: Design

Date: 2026-11-20
Status: approved 2026-11-20
Parent design: `2026-11-20-studyblocks-design.md`

## Intent

Version 1 only knows what Canvas knows. Version 2 teaches StudyBlocks about the rest of
a student's week (classes, work shifts, other obligations) and points out when things
clash. It's also the groundwork for milestone 3: the auto-scheduler can only place
study blocks once the app knows when the student is busy.

## Goals

- Students can add **commitments** (class, work, or other) as one-time or weekly items.
- Commitments can be **dragged and resized** on the calendar.
- **Conflicts** are flagged on the calendar and listed in one place:
  1. two commitments overlapping in time;
  2. a timed deadline that falls during a commitment (e.g. "Quiz 5 due 10:00 AM" while
     at work). Decided by the author: this is a full conflict, not a softer warning.
- **Back-to-back warnings** (requested by the author): two commitments with less than
  a set gap between them (default **10 minutes**, including 0) get a softer warning.
  This is separate from conflicts: amber, not red.
- Test data includes a made-up work shift: **Tue/Thu 4–9 pm, Sat 10 am–4 pm**.

## Non-goals

- **Walking or travel time between places.** The author decided against it for now.
  A single adjustable gap (see warnings) stands in for it. There are no per-place times.
- Automatic study-block scheduling (milestone 3).
- Importing work schedules from another calendar. Commitments are entered by hand.
- Repeat patterns other than weekly (no "every other week" or "monthly").

## Anti-goals

- A conflict alert that's wrong or noisy enough that students stop trusting it.
- Losing a commitment, or every week of one, through a single mis-drag.

## Decisions

### Made by the author
- Deadline-during-commitment counts as a full conflict.
- Dragging commitments is in scope.
- No travel time.
- Back-to-back commitments get a warning.

### Builder's calls (stated so the author can correct them)
- **Only commitments count for conflicts, not imported Canvas events.** Things like
  a "review session" are often optional, and flagging them would be noisy. Canvas
  events still show on the calendar as before.
- **Touching isn't overlapping.** A shift ending at 4:00 and a class starting at 4:00
  aren't a conflict, but they do get a back-to-back warning. A deadline exactly at a
  commitment's start or end isn't a conflict.
- **Warning gap is a per-student setting** (minutes, default 10, 0 turns warnings off).
  It's stored locally like everything else. Warnings only compare commitments with
  commitments, never deadlines.
- **All-day deadlines are skipped** (no time of day to compare).
- **Commitments store local wall-clock times** (e.g. "16:00 on Tuesdays"), so a 4 pm
  shift stays at 4 pm across daylight-saving changes.
- **Dragging a weekly commitment asks "This week only" or "Every week".** "This week only"
  saves an exception for that date. "Every week" moves the rule. Deleting works the same
  way ("this week only" skips that date).
- **Canvas items can't be dragged.** Due dates belong to Canvas.
- **Conflicts are checked from today through 8 weeks ahead.** Past clashes don't matter.
- **Commitment types and colors:** Class, Work and Other, each with its own muted color,
  drawn as a solid block. A commitment can optionally be linked to a course, in which
  case it uses that course's color.
- **Conflict display:** conflicting blocks and deadlines get a red outline, and
  back-to-back pairs get an amber outline. A "Conflicts" item in the sidebar shows the
  red count (plus an amber count) and opens a list with two sections, "Conflicts" and
  "Tight squeezes". Clicking either jumps to that week.
- **Test shift:** a "Load test work shift" button in the sidebar's commitments
  section, so it doesn't sneak into real students' data.

## Data model

New Dexie table `commitments` (schema version 2):

```
Commitment {
  id: string
  title: string
  type: 'class' | 'work' | 'other'
  courseId?: string
  // One-time: date is the day. Weekly: date is the first day it applies.
  date: 'YYYY-MM-DD'
  startTime: 'HH:mm'      // local
  endTime: 'HH:mm'        // local, after startTime (no overnight items in v2)
  weekly?: { days: number[] /* 0=Sun..6=Sat */, until?: 'YYYY-MM-DD' }
  exceptions?: Record<'YYYY-MM-DD', { skip: true } | { startTime; endTime; date? }>
}
```

## Logic (pure, tested)

- `expandCommitments(commitments, fromKey, toKey): Occurrence[]` turns rules plus
  exceptions into concrete occurrences with real start/end instants.
- `findConflicts(occurrences, items, now): Conflict[]` returns
  `{ kind: 'overlap', a, b }`, `{ kind: 'deadline', occurrence, item }`, and
  `{ kind: 'tight', a, b, gapMinutes }` (a warning), sorted by time. Also takes
  `minGapMinutes`.

## UI

- "Add commitment" form: title, type, optional course, date, start/end time,
  "Repeats weekly" with day checkboxes and an optional end date. Clicking an existing
  commitment opens the same form to edit or delete it.
- Calendar: commitments appear as blocks, drag/resize is enabled for commitments only,
  and the "This week only / Every week" prompt appears for weekly ones.
- Sidebar: a "Commitments" section (list + add + "Load test work shift") and a
  "Conflicts" item with a count.
- Settings: "Warn me when commitments are less than [10] minutes apart."

## Left to the builder

- Exact form layout and wording.
- How the "This week / Every week" choice is shown (small dialog vs. inline menu).
