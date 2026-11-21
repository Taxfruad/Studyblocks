# Study Map "Constellation" Restyle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the study map to mockup A (Constellation) without changing behavior.
**Spec:** `docs/superpowers/specs/2026-11-21-study-map-constellation-design.md`

## Global Constraints
- Radii: course 7, class 4 (rounded square), block 2, assignment `clamp(3.5 + 1.2·√(estimate h), 3.5, 6)`.
- Lines 0.8 px, non-scaling (stay hairline at any zoom).
- Glow filter only on course hubs and the hovered dot. Hovered dot draws at 1.6× radius.
- Labels: course always · overdue assignment always ("<title> · overdue") · assignment/class when zoom ≥ 1.6, hovered/neighbor, or in the focused cluster · blocks never.
- Theme tokens: `--map-bg`, `--map-grid`, `--map-link`, `--map-link-hot` for dark + light.

## Review Focus
1. Tiny dots still clickable: add an invisible ≥10 px hit circle per node.
2. Grid moves with pan/zoom (patternTransform = zoom transform).
3. Light theme legible (grid and lines visible, not harsh).
4. Overdue label doesn't collide with the hub label on small maps.
5. Phone: chips scroll sideways, no page overflow.

### Task 1: radii in `buildGraph` (update tests first)
### Task 2: StudyMap rendering + CSS tokens + filter bar/legend restyle; browser screenshots in both themes; commit.
