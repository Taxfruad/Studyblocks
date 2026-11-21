# Milestone 2 (Commitments + Conflicts) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Students add one-time/weekly commitments, drag them on the calendar, and see red conflicts (overlaps, deadlines during commitments) and amber back-to-back warnings.

**Architecture:** Commitments are rules stored in Dexie (schema v2) with local wall-clock times. Pure modules in `src/commitments/` expand rules into occurrences, find conflicts, and apply edits (move, delete with "this week / every week" scope). The UI renders occurrences for the visible range, and drag/resize calls the pure edit functions.

**Tech Stack:** as M1 (React, FullCalendar 6 interaction plugin, Dexie, Vitest).

**Spec:** `docs/superpowers/specs/2026-11-20-milestone-2-commitments-design.md`

## Global Constraints

- Only commitments take part in conflicts. Imported Canvas events never do.
- Overlap is strict: `b.start < a.end`. Touching (gap 0) is a *tight* warning, not a conflict.
- Deadline conflict: a timed, not-done assignment with `occ.start < due < occ.end` (strict).
- Tight warning: `0 <= gap < minGapMinutes`. `minGapMinutes` defaults to 10, and 0 turns warnings off.
- Conflict window: from now to 8 weeks (56 days) ahead.
- Commitments end on the same day they start (no overnight). End must be after start.
- Canvas items are never draggable.
- The test shift is loaded only by a button: Tue/Thu 16:00–21:00 and Sat 10:00–16:00, title "Work (test shift)", type work.

## Review Focus

1. **Daylight-saving week:** a weekly 16:00 commitment stays at 16:00 local on both sides of the change. (Task 1 test.)
2. **Moving one week of a series to another day:** the occurrence shows on the new day and not on the original. (Task 1 test.)
3. **"Every week" drag to another weekday** replaces only that weekday (Tue/Thu → Wed/Thu), keeps the times consistent, and keeps exceptions. (Task 3 test.)
4. **Deleting "this week only"** on the last remaining occurrence doesn't delete the rule. Deleting "every week" removes it. (Task 3 test.)
5. **Drag that crosses midnight or makes end ≤ start** is reverted with a message, and nothing is saved. (Task 3 test for the pure validator + UI revert.)

---

### Task 1: Commitment types + expansion

**Files:** `src/commitments/types.ts`, `src/commitments/expand.ts`, `src/commitments/expand.test.ts`

**Produces:**
- `type CommitmentType = 'class' | 'work' | 'other'`
- `type Exception = { skip: true } | { date?: string; startTime: string; endTime: string }`
- `type Commitment = { id; title; type: CommitmentType; courseId?; date: string; startTime: string; endTime: string; weekly?: { days: number[]; until?: string }; exceptions?: Record<string, Exception> }`
- `type Occurrence = { id: string /* `${commitmentId}::${originalDate}` */; commitmentId; originalDate: string; date: string; title; type; courseId?; start: string /* ISO */; end: string; recurring: boolean }`
- `expandCommitments(cs: Commitment[], fromKey: string, toKey: string): Occurrence[]` (inclusive keys, sorted by start)
- `localInstant(dateKey: string, hhmm: string): Date`

- [ ] Tests: a one-time item in and out of range; weekly Tue/Thu over 2 weeks gives 4 occurrences; `until` respected; nothing before `date`; skip exception; time-change exception; exception moving to another date (shows on the new date only, and is still found when the new date is in range and the original isn't); DST week keeps 16:00 local.
- [ ] Implement, pass, commit.

### Task 2: Conflicts

**Files:** `src/commitments/conflicts.ts`, `src/commitments/conflicts.test.ts`

**Produces:**
- `type Conflict = { id: string; kind: 'overlap'; a: Occurrence; b: Occurrence; at: string } | { id; kind: 'deadline'; occurrence: Occurrence; item: CalendarItem; at: string } | { id; kind: 'tight'; a: Occurrence; b: Occurrence; gapMinutes: number; at: string }`
- `findConflicts(occs: Occurrence[], items: CalendarItem[], opts: { now: Date; minGapMinutes: number }): Conflict[]` (sorted by `at`)
- `conflictMarks(cs: Conflict[]): { red: Set<string>; amber: Set<string> }` (occurrence ids + item ids)
- `CONFLICT_WINDOW_DAYS = 56`

- [ ] Tests: overlap found; touching gives tight (gap 0) not overlap; 5-min gap with min 10 gives tight; 15-min gap gives nothing; min 0 gives no tight; deadline strictly inside gives a conflict; deadline at the start/end edge gives none; all-day, done, and past deadlines are skipped; Canvas `event` items are ignored; marks contain the right ids; red wins over amber for the same id.
- [ ] Implement, pass, commit.

### Task 3: Edits + test shift

**Files:** `src/commitments/edit.ts`, `src/commitments/edit.test.ts`, `src/commitments/testShift.ts`

**Produces:**
- `type Scope = 'one' | 'all'`
- `validateTimes(start: Date, end: Date): string | null` (error message if overnight or end ≤ start)
- `moveOccurrence(c: Commitment, occ: Occurrence, newStart: Date, newEnd: Date, scope: Scope): Commitment`
- `deleteOccurrence(c: Commitment, originalDate: string, scope: Scope): Commitment | null` (null means delete the whole rule)
- `buildTestShift(today: Date): Commitment[]` (two commitments starting this week's Monday)

- [ ] Tests: move one-time (date + times); move one week of a series (adds an exception, leaves the rule alone); move all on the same weekday (changes times only); move all to another weekday (Tue/Thu → Wed/Thu); delete one week adds a skip; delete all returns null; delete a one-time item returns null; validateTimes rejects overnight/zero/negative.
- [ ] Implement, pass, commit.

### Task 4: Database v2 + settings

**Files:** modify `src/db/db.ts` (version 2: `commitments: 'id'`, `settings: 'key'`), create `src/db/settings.ts`

**Produces:** `db.commitments`, `db.settings: EntityTable<{ key: string; value: unknown }, 'key'>`, `getMinGap(): Promise<number>`, `setMinGap(n: number)`, `DEFAULT_MIN_GAP = 10`

- [ ] Test: a v1 database upgrades with items intact, and commitments start empty.
- [ ] Implement, pass, commit.

### Task 5: UI

**Files:** `src/commitments/CommitmentForm.tsx`, `src/commitments/ScopePrompt.tsx`, `src/commitments/ConflictsView.tsx`, `src/commitments/colors.ts`. Modify `CalendarView.tsx`, `toEvents.ts` (+ test), `Sidebar.tsx`, `App.tsx`, `theme.css`.

- [ ] Calendar expands commitments for the visible range (`datesSet`). Commitment events are `editable`, Canvas ones aren't. Red/amber outlines come from `conflictMarks`. Selecting a time range opens the form prefilled.
- [ ] Drag/resize: validate (revert + message), a scope prompt for weekly items (cancel reverts), then save.
- [ ] Form: title, type, course (optional), date, start/end, repeats weekly + days + until. Edit and delete (with scope prompt for weekly).
- [ ] Sidebar: Commitments section (list, add, "Load test work shift"), Conflicts nav item with red/amber counts, warning-gap setting.
- [ ] Conflicts view with "Conflicts" and "Tight squeezes" sections. Clicking jumps the calendar to that date.
- [ ] Browser check: test shift + sample data show at least one conflict; drag one week of the shift; drag every week; resize; delete one week; amber warning appears and disappears with the gap setting; phone width OK.
- [ ] Commit. Update the README roadmap (M2 done). Commit.
