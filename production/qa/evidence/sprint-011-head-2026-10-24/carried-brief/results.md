# Sprint 11 — Carried from Sprint 10 (QA condition 4): Brief checks H5–H8

**Story type**: none (Brief checks carried from Sprint 10, not Sprint 11 story ACs) · **Evidence**: this folder · **Gate**: QA condition 4 for sign-off
**Build**: HEAD `131a5c1` (Brief as changed in `2c73542`) · **Server**: http://localhost:4200 (already running; not started or stopped by this run)
**Harness**: headless Chrome for Testing (chromium-1247) through playwright-core, set up as `production/qa/evidence/sprint-011/probe.mjs` lines 22–60. HELPERS, `fresh()`, `dismissCard()`, `setScale()` and `goto()` are copied verbatim from that file.
**Script**: `carried-brief.mjs` · **Raw data**: `results.json`, `output.txt` · **Captures**: `h5-*`, `h6-*`, `h7-*`, `h8-*.png`
**Harness assists**: localStorage clear; `save.startNewOperation`; `campaignStore.setState({ intelLevel: 2 })` for m01/m02, whose intel gate is 2 (m03 and NEON GARDEN run at the opening intel 1); `worldStore.setState({ influence: 20, selected: 'eu' })` so Expedite is affordable; the reclient applied with the game's own `reclientContract` (in play a seizure or a city flip calls it); Brief through `selectMission`; Assembly through `goto('team')`. Deploy was the Assembly's real `DEPLOY TEAM` button, clicked. Page errors during the run: 0.

| Case | Actual Result | PASS/FAIL/BLOCKED |
|---|---|---|
| H5 — tac rail bottom row at 90/100/110/125 × m01, m02, m03 (12 states) | In all 12 states the rail scrolls (`scrollHeight > clientHeight`). After scrolling to the end, the last row's box sits inside the rail's visible box, and the scroll fade is off (class `on` absent, opacity 0), so no opaque fade part covers the row. Last row: m01 `RISK INDEX 89 // SEVERE`, m02 `RISK INDEX 66 // HIGH` (both at intel 2), m03 `PROJECTED SUCCESS 82%` (intel 1). Boxes are in the table below. | PASS |
| H6 — Expedite / reclient between Brief and deploy (NEON GARDEN `gc7518e2d3`) | **Expedite**: clicked the `3 EXPEDITE 12P CLEAR` button (enabled), and the record became `expedited: true`. The returned Brief's objectives and KIT lines did not change; it added the note `EXPEDITED CONTRACT // INTEL GATE WAIVED.` Deploy reached phase `mission`. The HUD objectives equal the Brief's: 4 rows, same labels, order and OPTIONAL flags. The KIT lines `kitLine()` makes from the deployed mission's objectives equal the Brief's KIT lines. **Reclient**: client changed helix → stratos (city stayed `os`/OSLO). The Brief did not change; deploy reached `mission`; the HUD equals the Brief; the KIT lines match. | PASS |
| H7 — NEON GARDEN (MODERATE, Europe, New Operation) Brief at 90/100/110/125 | Threat box `THREAT RATING MODERATE … ETA RESPONSE: < 06:00` showed at every scale (box h 74/76/80/84). Two KIT lines showed at every scale. `clipped('.screen')` returned 0 entries, text overlap included, both at load and with the dossier scrolled to its end, at all 4 scales. | PASS |
| H8 — Brief at 1920×1080 (m03, NEON GARDEN) | `clipped('.screen')` = 0 for both. The screen fills 1920×1080 with no document overflow. Every region is the same size or larger than at 1280×720: main 1249×511 → 1880×856; left 907 → 1490 wide; tac 907×218 → 1490×368; plate 174 → 324 square; dossier 333×511 → 380×856. | PASS |

## H5 boxes (y, px, viewport 1280×720; last row after scrolling to end vs the rail's visible box)

| Contract | Scale | Last row box (top–bottom) | Rail visible box (top–bottom) | Fade |
|---|---|---|---|---|
| m01 | 90 | 555.6–569.6 | 396.6–569.6 | off |
| m01 | 100 | 530.2–564.2 | 395.2–564.2 | off |
| m01 | 110 | 517.4–554.4 | 392.4–554.4 | off |
| m01 | 125 | 502.1–544.1 | 389.1–544.1 | off |
| m02 | 90 | 555.6–569.6 | 396.6–569.6 | off |
| m02 | 100 | 560.4–575.4 | 401.4–575.4 | off |
| m02 | 110 | 530.8–567.8 | 399.8–567.8 | off |
| m02 | 125 | 502.1–544.1 | 389.1–544.1 | off |
| m03 | 90 | 555.6–569.6 | 396.6–569.6 | off |
| m03 | 100 | 560.4–575.4 | 401.4–575.4 | off |
| m03 | 110 | 551.8–567.8 | 399.8–567.8 | off |
| m03 | 125 | 516.5–558.5 | 397.5–558.5 | off |

Horizontal inside-checks also passed (see `results.json`). The H5 pass rule: the row box lies inside the rail's client box, and, if the fade is showing, the row ends above the point where its gradient reaches alpha 0.5.

## Notes

- H5 measures the row against the rail's own scroll box. The run did not also check whether an ancestor panel clips the rail, and the H5 PNGs (`h5-*-rail.png`) were not reviewed by eye in this run.
- H6 limits: NEON GARDEN has 4 objectives (PRIMARY, OPTIONAL, SECONDARY, TERTIARY), so no QUATERNARY tier came up in this walk. The reclient changed only the client, not the city. Re-cliented offers that also move city (an outside client while the city is Nexus-held) were not walked.
- H6 compares labels and OPTIONAL flags in the HUD DOM, `.hud-obj-text` / `.hud-obj-opt`. The HUD does not print KIT lines, so the KIT match is between `kitLine()` on the deployed mission's objective definitions and the Brief's printed KIT lines.
- H7 text-overlap is the `textoverlap` / `boxoverlap` / `overlap` part of the probe's `clipped()`. It was empty at every scale.
- The 1920×1080 captures were not reviewed by eye. H8 rests on the measured boxes and `clipped()`.

**Overall: PASS — H5, H6, H7 and H8 all pass on HEAD 131a5c1 (4/4; 12/12 H5 states, 2/2 H6 paths, 4/4 H7 scales, 2/2 H8 Briefs).**
