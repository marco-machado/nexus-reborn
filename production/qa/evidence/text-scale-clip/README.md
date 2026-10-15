# Text-scale clipping at 1280x720 — evidence

Found during Sprint 6 QA (PV-018 notice check): at 125% text scale the World
Network SECTORS cards clipped their UNREST rows. `design/gdd/interface.md`
Rule 6 (clipping at 1280x720 is a bug) and Rule 14 (text scale 90/100/110/125,
screens scroll rather than clip).

## Method

Dev server from `.claude/launch.json` (port 4200). Playwright driving Google
Chrome at a 1280x720 viewport, fresh NEW OPERATION, `textScale` set in
`nexus-settings-v1`, orientation dismissed; World Network → Research → World
Network → first open contract (Brief) → Assembly. On each Screen
`clipcheck.js` lists text whose box leaves its container (stopping at scroll
containers, where content is reachable) or is ellipsized.

## Before (125%)

| Screen | Clipped |
|---|---|
| World Network | every sector card's UNREST row overflowed its card by 4–6px (`.wm-sector { flex: 1 }` let cards shrink below content) |
| Research | DIVISION OVERVIEW and node-detail titles ellipsized; AVAILABLE CREDITS figure spilled past the panel; BALLISTICS LAB cut |
| Brief | tactical rail overflowed top and bottom (CITY BLOCKS under the header, PROJECTED SUCCESS cut); weather value ran into the plan; CLIENT ellipsized; comms log line ellipsized |
| Assembly | ROSTER DATABASE and detail titles ellipsized; bay NEURAL/CHEST readings ran together; role protocol descriptions ellipsized |

Files: `before-*-1280x720-scale125.png`.

## After

`clipcheck.js` reports nothing on any of the four Screens at 90, 100, 110 and
125%, apart from rows inside scroll containers (reachable by scrolling) and the
hidden Brief-lock nav tooltip. Files: `after-*-1280x720-scale{90,100,110,125}.png`.
