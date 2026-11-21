# Milestone 3 (Auto-scheduler) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A "Plan my study time" button that fills free time before each deadline with study blocks, spread from today, around commitments plus a buffer, with pinned/crossed-out blocks respected.

**Architecture:** A pure planner (`src/study/plan.ts`) takes items, commitment occurrences, existing blocks, settings and `now`, and returns `{ add, remove, wontFit }`. The UI applies that in one Dexie transaction. Blocks live in a new `studyBlocks` table (schema v3). Settings live in the `settings` table under `study`.

**Spec:** `docs/superpowers/specs/2026-11-21-milestone-3-auto-scheduler-design.md`

## Global Constraints

- Defaults: weekdays 09:00–22:00, weekends 10:00–22:00, daily limit 240 min, buffer 15 min, chunk 30–120 min, horizon 56 days.
- Estimates by title: quiz 60 · exam/test/midterm/final 240 · project 360 · essay/paper 240 · lab 120 · problem set/homework 120 · discussion/reading/peer review 60 · else 120 (minutes).
- All-day deadline = due at 00:00 local on that date. Timed = due at its time. Blocks end at or before due.
- Kept on re-plan: pinned, already started (start < now), or belonging to a done assignment. Everything else from the planner is replaced.
- Busy for planning: commitment occurrences ± buffer, and kept blocks except crossed-out ones.
- Only the student's commitments are busy. Imported Canvas events are not.
- Block times on a 15-minute grid. Today starts at `now` rounded up to the next 15 minutes.
- `estimateMinutes` on items is student-owned and survives re-import.

## Review Focus

1. **A deadline earlier than any free slot today** gives "won't fit", not a block after the due time. (Task 2 test.)
2. **A commitment that runs into the study window** (e.g. work 16–21, window 9–22) leaves 21:15–22:00, and a 45-min slot gets used only if ≥ min chunk. (Task 2 test.)
3. **Re-plan twice** gives the same result and no duplicates. (Task 2 test.)
4. **Assignment un-checked after being done:** its crossed-out blocks count again (not crossed out). (Task 4 mapping test.)
5. **Removing a feed** deletes its items' study blocks too. (Task 3 test.)

---

### Task 1: Estimates — `src/study/estimate.ts` (+ test)
`defaultEstimate(title: string): number` with the table above (case-insensitive, word-based; "Quiz 5" → 60, "Final project" → 360 (project beats final), "Problem Set 7" → 120).

### Task 2: Planner — `src/study/types.ts`, `src/study/slots.ts`, `src/study/plan.ts` (+ tests)
- `StudySettings`, `DEFAULT_STUDY_SETTINGS`, `normalizeStudySettings(v: unknown): StudySettings`
- `StudyBlock { id; itemId; start; end; pinned }`
- `dueInstant(item): Date`, `estimateFor(item): number`
- `planStudy(input: { items; occurrences; blocks; settings; now; newId?: () => string }): { add: StudyBlock[]; remove: string[]; wontFit: { itemId: string; shortMinutes: number }[] }`
- Algorithm: earliest due first. Pass 1 puts one chunk per day sized `clamp(roundUp15(remaining / daysLeft), min, max)`. Later passes use max chunks. Respect the daily limit, slots, and due time.
- Tests: spreads 2 h over 4 days as 30-min blocks; avoids commitments + buffer; daily limit; won't fit; pinned/past counted; re-plan removes old unpinned future blocks and is stable; done item's blocks kept and its time freed; all-day due ends the day before; earliest deadline wins scarce time; nothing before now.

### Task 3: Database v3 + estimate preservation
`studyBlocks: 'id, itemId, start'`; `getStudySettings`/`setStudySettings`; `importFeed` keeps `estimateMinutes`; `removeFeed` deletes blocks of removed items. Tests for each.

### Task 4: UI
`studyBlockEvents(blocks, items, courses)` (+ test: crossed out when item done, pinned class, editable). Plan button (sidebar + Schedule page) with a summary toast. Dragging/resizing a block pins it. Block dialog (assignment, time, Unpin, Delete). Estimate field + progress in assignment details. Conflicts page renamed "Schedule" with a "Not fully planned" section and study settings. Browser check, README, commit.
