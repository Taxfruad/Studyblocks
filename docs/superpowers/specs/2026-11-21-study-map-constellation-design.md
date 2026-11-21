# Study Map Restyle — "Constellation": Design (short)

Date: 2026-11-21
Status: superseded by 2026-11-21-study-map-clean-diagram-design.md
Changes: milestone 4 study map (`2026-11-21-milestone-4-study-map-design.md`)

## Intent

The author found the first study map "clunky": big flat dots, large bold labels, heavy
lines. Of three mockups (A Constellation, B Labeled pills, C Orbits), the author picked
**A: Constellation**, which is closest to Obsidian: tiny glowing dots, hairline lines, a
faint dot grid, and small labels that appear as you zoom or hover.

## Approaches

| Option | Trade-off | Decision |
|---|---|---|
| A. Constellation | Calm, minimal, most Obsidian-like. Details come from hover/zoom. | **Picked by the author** |
| B. Labeled pills | Everything readable at once, but busier and less "graph". | Not chosen |
| C. Orbits + progress rings | Shows progress, but replaces the block dots and reads like a dashboard. | Not chosen |

## What stays the same

Everything the map *does*: what's included, filters, hover focus, clicking dots, dragging,
zoom/pan, Fit, status meanings. Only the look changes.

## The look (builder's calls, stated so the author can correct them)

- **Smaller dots:** course hubs ~7 px, assignments 3.5–6 px (by estimate), study blocks
  2 px, classes small rounded squares (~4 px).
- **Glow:** course hubs always glow softly in their color. The hovered dot grows and
  glows. Nothing else glows, which keeps it calm and fast.
- **Hairline lines:** 0.8 px, low contrast. Lines touching the hovered dot brighten.
- **Dot grid background** that moves with pan and zoom, like a canvas.
- **Labels:**
  - Course names are always shown, small and semibold, under the hub.
  - Assignment titles appear when you zoom in, hover, or focus a course.
  - Overdue assignments always show their label ("Lab 8 · overdue"), because those need
    attention.
  - Study blocks get no labels, only the hover card.
- **Status:** overdue = red outline ring (hollow dot), needs time = amber outline ring,
  done/past = faded.
- **Hover:** everything not connected fades to ~12%. Smooth fade transitions.
- **Filter bar:** lighter, smaller borderless chips. The legend becomes one small, quiet
  line.
- **Both themes:** the light theme uses a soft off-white background with light-gray grid
  dots and slightly darker lines.
- **Spacing:** forces re-tuned for the smaller dots, so clusters stay tight and separated.

## Left to the builder

Exact colors, glow strength and force values, tuned against the sample data plus a
planned week, in both themes.
