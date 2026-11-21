# Study Map "Clean diagram" Restyle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Constellation look with mockup 1 (Clean diagram), keeping all behavior.
**Spec:** `docs/superpowers/specs/2026-11-21-study-map-clean-diagram-design.md`

## Global Constraints
- Radii: course 8, assignment `clamp(4 + 0.9·√(estimate h), 4, 6)`, block 2, class 4.
- Dot fill = `color-mix(in srgb, <course color> 78%, #8a8a8a)`; ring = 2.5 px in `var(--bg)`.
- Lines 1 px non-scaling, `--map-link`. No glow, no grid, map background = `var(--bg)`.
- Labels to the right of dots (x + r + 6, vertically centered). Course 11 px/600, others 9.5 px muted.
  Assignment/class labels hidden when zoom < 0.75 unless hovered/focused. Overdue always.
- Tags as colored tspans: "Overdue" (danger) and "Needs <time>" (warn).
- Hover: hovered dot outlined in `var(--text)`; unrelated items fade to 25%.

## Review Focus
1. Side labels don't collide with neighboring dots in the sample layout (both themes).
2. Tags stay readable on light theme.
3. Hit areas still work.

### Task 1: `needMinutes` on short assignments + radii (tests first)
### Task 2: StudyMap rendering + CSS; screenshots dark/light/phone; commit.
