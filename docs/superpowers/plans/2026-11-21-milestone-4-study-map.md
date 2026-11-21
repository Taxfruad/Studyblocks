# Milestone 4 (Study Map) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An Obsidian-style, springy graph of courses, upcoming assignments, their study blocks, and (optionally) classes, with filters.

**Architecture:** A pure `buildGraph()` (`src/map/graph.ts`) decides which dots and lines exist and how they look. `StudyMap.tsx` runs a d3-force simulation and renders SVG with React. d3-zoom handles pan/zoom, and pointer events handle dragging. Filters persist in localStorage.

**Spec:** `docs/superpowers/specs/2026-11-21-milestone-4-study-map-design.md`

## Global Constraints

- Window: assignments due from the start of today through 56 days ahead. Plus not-done overdue ones from the last 14 days (status `overdue`).
- Defaults: `hideFinished: true`, `showClasses: false`, no hidden courses.
- Node ids: `course:<id>`, `item:<id>`, `block:<id>`, `class:<id>`. Links: block→item, item→course, class→course.
- Colors come from the course (same as the calendar). No course → `DEFAULT_EVENT_COLOR`.
- Radii: course 22, class 9 (square), block 4, assignment `clamp(6 + 4·√(estimate h), 7, 16)`.
- Statuses: `overdue` (red ring), `short` (amber ring), `done` (faded), `past` (faded block).

## Review Focus

1. **Hidden course** removes its hub, its assignments, their blocks, and its classes. (Task 1 test.)
2. **Done assignment with hideFinished off** appears faded, along with its crossed-out blocks. With it on, it and its blocks are gone. (Task 1 test.)
3. **Assignment with no course** floats without a hub (no dangling link). (Task 1 test.)
4. **Class without upcoming dates** (series ended) doesn't appear. (Task 1 test.)
5. **Empty data** gives an empty graph, and the UI shows the empty state. (Task 1 test + browser.)

---

### Task 1: `buildGraph` — `src/map/graph.ts` (+ test)
`type MapFilters = { hiddenCourses: string[]; hideFinished: boolean; showClasses: boolean }`, `DEFAULT_MAP_FILTERS`.
`type MapNode = { id; kind: 'course'|'assignment'|'block'|'class'; refId: string; label: string; color: string; radius: number; status?: 'overdue'|'short'|'done'|'past'; detail?: string }`, `type MapLink = { source: string; target: string }`.
`buildGraph({ items, courses, blocks, commitments, now, filters }): { nodes: MapNode[]; links: MapLink[]; availableCourses: Course[] }`
Tests: window + overdue; statuses; radii; filters (hidden course, hideFinished, showClasses); no-course assignment; ended class excluded; empty.

### Task 2: Study map UI
`src/map/StudyMap.tsx`, `src/map/useMapFilters.ts`; sidebar item "Study map"; App wiring (click: assignment→details, block→calendar focus, class→form, course→focus cluster); CSS; browser check (sample + test shift + plan); README; commit.
