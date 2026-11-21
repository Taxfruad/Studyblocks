# Milestone 4 — Study Map: Design

Date: 2026-11-21
Status: approved 2026-11-21
Parent design: `2026-11-20-studyblocks-design.md`

## Intent

The calendar shows *when* things happen. The study map shows *how they connect* and
where effort is going: an Obsidian-style graph of courses, upcoming assignments and
their study blocks. It answers "which class is eating my week?" at a glance.

## Decisions made by the author

- **Classes are optional:** a "Show classes" switch adds class commitments (lectures),
  linked to their course. When it's off, the map shows only coursework.
- **Only what's coming up:** assignments due from today through the next 8 weeks.
- **One dot per study block.**
- **Filters:** courses on/off, hide finished work, and the classes switch.

## Goals

- One glance shows each course as a cluster, with its upcoming assignments and their
  study blocks.
- Status is visible without reading: done, needs more study time, due soon.
- Clicking a dot gets you to the real thing (assignment details, or the calendar).
- It feels like Obsidian's graph: springy, draggable, zoomable, calm.

## Non-goals

- Editing on the map (no creating links or items by drawing).
- Saving dot positions between visits. The layout settles fresh each time.
- Past work beyond what's described under "What's included".

## Anti-goals

- A hairball: a map so crowded it's unreadable.
- A map that disagrees with the calendar (different colors, missing items).

## Approaches considered (rendering)

| Approach | Trade-offs | Decision |
|---|---|---|
| **A. d3-force simulation + SVG, rendered by React** | Live physics like Obsidian (dragging a dot pulls its neighbors), full control over styling, both themes via CSS variables. More code than a ready-made widget. Fine for a few hundred dots. | **Chosen** (builder's call) |
| B. Cytoscape.js (the original plan) | Rich graph toolkit, but its layouts settle once instead of staying springy, and styling is its own system instead of our CSS. | Rejected |
| C. force-graph (canvas wrapper around d3-force) | Very fast and springy, but drawn on a canvas, so it's harder to theme and less accessible (dots aren't real elements). | Rejected |

## What's included

- **Courses:** every course that has at least one included assignment (or class, when
  classes are shown) and isn't filtered out.
- **Assignments:** not done, due from the start of today through 8 weeks ahead.
  - Builder's call: **overdue assignments that aren't done are also included** (from the
    last 14 days), outlined in red, because they're still on the student's plate. Easy
    to drop if the author disagrees.
  - With "Hide finished work" off, **done** assignments in the same window are included,
    faded.
- **Study blocks:** every block of an included assignment, including past ones (faded,
  as "studied"). Crossed-out blocks follow their assignment's "done" visibility.
- **Classes** (when the switch is on): one dot per *class-type commitment* (not per
  week), linked to its course. Class commitments without a course float on their own.
- Assignments with no course float on their own (no hub).

## Look

- Size: course hubs are large. Assignment dots scale with the time estimate (between a
  min and max radius). Study blocks are small. Classes are medium **squares**, so they
  read differently from round coursework dots.
- Color: the course color everywhere (same as the calendar). Items without a course use
  the neutral gray.
- Status rings: **red** = overdue, **amber** = needs more study time, **faded** = done or
  past block. A small "due in N days" label shows on hover.
- Labels: course names always, assignment titles on hover or when zoomed in, block
  labels only on hover (time).
- Lines are thin and muted. Hovering a dot highlights its neighbors and dims the rest,
  like Obsidian.

## Interaction

- Drag dots (neighbors follow), scroll or pinch to zoom, drag the background to pan.
  "Fit" button to re-center.
- Click: course → toggles focus on that cluster (dims others) · assignment → opens its
  details (same dialog as the calendar) · study block → jumps to it on the calendar ·
  class → opens the commitment form.
- Filters bar above the map: course chips (click to hide/show), "Hide finished work"
  (default on), "Show classes" (default off).
- Empty state: "Nothing coming up. Import a calendar or press Plan my study time."

## Builder's calls (stated so the author can correct them)

- d3-force rendering (approach A).
- Overdue-but-not-done assignments from the last 14 days are included, in red.
- "Hide finished work" defaults to **on** and "Show classes" to **off**, so the first
  view is the least crowded.
- Filter choices are remembered in this browser (they're conveniences, so they use
  localStorage).
- The map is a new sidebar item, **"Study map"**, between Assignments and Schedule.
- At phone width the map fills the screen, and the filters collapse into one row that
  scrolls sideways.

## Logic (pure, tested)

`buildGraph({ items, courses, blocks, commitments, now, filters }): { nodes, links }`,
with node kinds `course | assignment | block | class` and status flags. The simulation
and rendering live in the component.

## Left to the builder

- Force strengths and radii, tuned until clusters read clearly with the sample data plus
  a planned week.
