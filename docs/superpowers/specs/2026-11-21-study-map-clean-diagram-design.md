# Study Map Restyle — "Clean diagram": Design (short)

Date: 2026-11-21
Status: approved 2026-11-21
Replaces: `2026-11-21-study-map-constellation-design.md` (the look only)

## Intent

The author felt the Constellation restyle "looks like a video game" (glow, starfield
background, bright colors) and wants the map **modern and professional**. Of three new
mockups (1 Clean diagram, 2 Course sections, 3 Tree + timeline), the author picked
**1: Clean diagram**: the same springy, draggable graph, drawn like a Figma or Notion
diagram.

## Approaches

| Option | Trade-off | Decision |
|---|---|---|
| 1. Clean diagram | Keeps the free graph. Professional through restraint: muted dots, thin lines, side labels, small tags. | **Picked by the author** |
| 2. Course sections | Very scannable, but a fixed, list-like layout. | Not chosen |
| 3. Tree + timeline | Shows *when* work happens, but fixed and not draggable. | Not chosen |

## What stays the same

Everything the map does: what's included, filters, hover focus, clicking, dragging,
zoom/pan, Fit, remembered filters, dot sizes by estimate, invisible larger click areas.

## The look (builder's calls, stated so the author can correct them)

- **Removed:** glow, dot-grid background, the separate dark map background. The map sits
  on the app's normal background.
- **Muted colors:** course colors are toned down slightly on the map (blended toward
  gray), so dots read as calm rather than neon. The calendar keeps the full colors.
- **Dots:** solid, with a thin ring in the background color, so they sit cleanly on top
  of lines. Course hubs ~8 px, assignments 4–6 px, blocks 2 px, classes small rounded
  squares.
- **Lines:** 1 px, neutral gray, hairline at any zoom.
- **Labels beside dots** (left-aligned, vertically centered), not floating underneath.
  Course names 11 px semibold. Assignment names 9.5 px muted, shown unless you zoom far
  out. Blocks have no label.
- **Status as small tags instead of rings:** a red **"Overdue"** tag, and an amber
  **"Needs 2 h"** tag (with the remaining time) next to the assignment name.
- **Hover:** no growing or glow. The hovered dot gets a crisp outline, its connections
  stay full strength, and everything else fades to about 25%.
- **Filter bar and legend:** unchanged from the last version (they weren't the problem).
- **Light theme:** the same restraint on the light background.

## Left to the builder

Exact gray blend amount, spacing between labels and dots, and force tweaks so side
labels don't overlap, checked in both themes.
