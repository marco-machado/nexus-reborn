# Sprint 11 evidence — World Network to its UX spec (IF-016 to IF-035)

**Build**: working tree on top of `bb17de2` (the Sprint 11 story commit names its hash). Capture 2026-10-23.
**Harness**: `probe.mjs` (this folder), headless Chrome for Testing at exactly 1280×720 against the vite dev server on port 4200 (`preview_start dev`). Never the in-app pane or the user's Chrome. The dev server was stopped after the run and port 4200 confirmed free.
**Result**: `probe-output.txt` — 152 PASS, ALL PASS, no console or page errors.
**Unit seams**: IF-019 in `src/ui/worldOnboard.test.ts` (`clockUse` describe, 10 tests); `unrestTone` / `lockReason` in `src/ui/worldChrome.test.ts`; full suite 1642/1642.

## How the probe measures

- **Text runs**: every visible text node under `.screen`; computed `font-size`; colour; effective alpha (ancestor `opacity` × colour alpha); WCAG ratio composited over the ancestors' solid backgrounds on Void `#04070a` (gradients and images ignored). Runs drawn at alpha 0 (hover tips, the Feed row chevron) are not visible text and are skipped.
- **Readouts (≥12 px, owner list 2026-10-23)**: `.wm-resource b`, `.wm-sector-name`, `.wm-sector-reading b`, `.wm-cu b`, `.wm-kv-readout` (TAX YIELD, TAX PAID, GARRISON values), `.wm-op-main > b`, `.wm-speed b`, `.wm-date`, `.wm-clock`.
- **Clip / truncation / spill / overlap** (`clipped`): an ellipsis that cuts text; a non-scrolling box that cuts its text; text drawn outside its own box, or a text box sticking out of its button, `.panel-body` or `.kv` row; top-level panels intersecting. Declared overlays (first-visit card, tips, the Scan's floating chrome) are excluded.
- **Hit targets**: `getBoundingClientRect` per target; the Timeline's hit area is measured by hit-testing a column through the track (the drawn track stays 12 px).

## Watched failing (the probe is a gate only once it has failed)

- **As built** (`bb17de2` `src/` stashed): 60 FAIL before the run stopped — type floors, Ink Dim, Ink Faint and contrast in every state — and then a hard stop: the 4X button could not be clicked under the first-visit card because the card's full-screen wrap took every pointer event. That defect is fixed here (`.wm-onboard-wrap { pointer-events: none }`, IF-019).
- **Mutation 1** (three-column actions with an ellipsis on the action name): 5 FAIL, `truncated … "1 STABILIZE"` at 110 and 125.
- **Mutation 2** (three-column actions, column layout): 5 FAIL, `spill … "UNAFFORDABLE" box 951-1053 host 968-1060` at 110 and 125.
Both mutations reverted; the final run is ALL PASS.

## Story → evidence

| Story | Checks in `probe-output.txt` | Captures |
|---|---|---|
| IF-016 | failed banner line; complete banner unchanged; `rg "NETWORK COMMAND SUSPENDED" src` → none | `if-016-017-failed.png`, `if-016-complete.png` |
| IF-017 | failed rows read CAMPAIGN LOST (eu, na, as); click stays on World Network; non-failed rows read REQUIRES INTEL LVL n | `if-016-017-failed.png` |
| IF-018 | no `aria-modal="true"`; initial focus; Tab → nav; Shift+Tab back; Esc keeps the card | `state-opening-card.png` |
| IF-019 | Pause, 1X, 2X, 4X, 8X clicked under the card each apply and dismiss it; a Feed row click under the card leaves it up (browser); unit tests AC-1..AC-3 | `state-opening-card.png` |
| IF-020 | SECURE teal / STRAINED Print White `#e2f6ee` / CRITICAL Red Hot; no amber; Credits amber | `state-garrison-*.png`, `if-020-grayscale-strained.png` |
| IF-021 | Unrest 50 / 60 Ink, 61 notice, crisis 80 and crisis 40 (hysteresis) Red Hot, row and panel, bar tone, ≥4.5:1; pressure chip on the row only | `if-021-*.png` |
| IF-022 | empty token; FEED CLEAR; not clipped at 125; absent with events; `rg "NO TRAFFIC" src` → none | `if-022-empty*.png` |
| IF-023 | left column SECTORS only, header Influence, at 90/100/110/125; header debits in the frame the action turns ACTIVE | `if-023-024-world-*.png` |
| IF-024 | INTEL `LEVEL n PROGRESS n / 100`, no Credits/Influence/Roster, four scales; level-up wraps, matches header | `if-023-024-world-*.png` |
| IF-025 | effect text under each button, visible, no overlap with the status word, four scales; right column does not clip | `if-025-actions-*.png` |
| IF-026 | ≥10 px every run and ≥12 px readouts in 11 states (incl. intel 2+); nothing clips at four scales, incl. Review (fixed bottom strip); World Network, Research, Brief, Assembly at 125 with no clip and no nav truncation | `state-*.png`, `if-026-*-125.png` |
| IF-027 | no Ink Dim text and every run ≥4.5:1 as rendered, 11 states | `state-*.png` |
| IF-028 | no Ink Faint text, 11 states | `state-*.png` |
| IF-029 | locked rows: text alpha 1 and ≥4.5:1, reason Red Hot (no `red-dim`), frame differs, glyph, `aria-disabled`, default and high contrast | `if-029-*.png` |
| IF-030 | idle nav labels ≥4.5:1, one `aria-current="page"`, colour changes under high contrast — four Screens | `if-030-nav-*-hc.png` |
| IF-031 | Feed rows ≥24 px, no overlap | `if-031-035-targets.png` |
| IF-032 | pointer hit area ≥24 px; hits at ±11 px; transport centres still hit their buttons | `if-031-035-targets.png` |
| IF-033 | 1X–8X ≥24×24 | `if-031-035-targets.png` |
| IF-034 | steppers ≥24×24; absent under the Influence note | `if-031-035-targets.png`, `if-035-influence-note.png` |
| IF-035 | Pause, `n UNREAD`, globe toolbar (6), credit link, four nav tabs, `> GO LIVE`, both `UNDERSTOOD` ≥24×24; `FEED CLEAR` is not interactive (N/A) | `if-031-035-targets.png`, `if-035-influence-note.png`, `state-review.png` |

## Not exercised

- Text scales 90 and 110 on Research, Brief and Assembly (125 only, as IF-026 AC-2 asks).
- Screen-reader output (no AT run; the labels are read from the DOM).
- Real pointer drag on the Timeline (hit-testing only); keyboard scrub is covered by the existing Timeline tests.
- Windows below 1280×720.
