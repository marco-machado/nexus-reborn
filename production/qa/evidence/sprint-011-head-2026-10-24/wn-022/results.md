# WN-022 — HELD BY names the city majority — execution results

**Story type**: UI | **Gate**: BLOCKING | **Cases**: `production/qa/test-cases/wn-022-held-by-names-the-city-majority-cases.md`
**Build**: HEAD `131a5c1`. Uncommitted src changes at run time (`git status --short src`): `M src/game/tutorial.test.ts`, `M src/state/tutorialStore.test.ts`, `?? src/game/world.noRoute.test.ts`. None is `src/ui/worldChrome.test.ts`, and none is imported by the app.
**Date**: 2026-10-24. **Server**: dev server already running on http://localhost:4200 (not started or stopped by this run).
**Browser**: headless Chrome for Testing (chromium-1247) through `playwright-core`, viewport 1280x720, launched as `production/qa/evidence/sprint-011/probe.mjs` lines 22-60 do.
**Script**: `wn022.mjs` (this folder). Raw readings: `wn022-output.json`. Captures: `wn-022-*.png` (33 files, this folder).
**Harness assists**: localStorage clear; New Operation through `save.startNewOperation`; `goto('world')`; card dismissed with `markSeen('hint-worldmap')` (with an UNDERSTOOD click as fallback if the button were still present); pause, sector focus, Control, city owner, text scale and HC set through the stores' own `setState` / actions. Finite animations awaited before every read. The probe's `window.__probe` measurement helpers were not copied: no WN-022 case uses them.
**R1 probe**: has no WN-022 check (contrary to the QA plan line). Every case except WN-022-13 was walked by this script.
**Page / console errors**: zero across the whole run (`ALL_ERRS: []`).

| Case | AC | Coverage | Actual Result | Result |
|---|---|---|---|---|
| WN-022-01 | AC-1 (row placement) | Headless walk, 6 sectors | Label order in `.wm-sector-scroll` for na, eu, sa, af, as, oc: `COORD, CONTROL, UNREST, HELD BY, TAX YIELD, TAX PAID, GARRISON CONDITION`. `HELD BY` occurs once; `indexOf(TAX YIELD) - indexOf(HELD BY) = 1` in all six. `wn-022-row-order-na.png`. | PASS |
| WN-022-02 | AC-1 (Nexus, teal) | Headless walk | NA: text `NEXUS GLOBAL // 2 OF 3 CITIES`, class `wm-kv-readout teal`, colour `rgb(126, 240, 212)`; HC on colour `rgb(126, 240, 212)`. `wn-022-nexus-na.png`. | PASS |
| WN-022-03 | AC-1 (live count) | Headless walk | `owner.dt = nexus`: `NEXUS GLOBAL // 3 OF 3 CITIES`, `teal`. Back to `stratos`: `NEXUS GLOBAL // 2 OF 3 CITIES`, `teal`. No reload or re-focus. | PASS |
| WN-022-04 | AC-1 (other corp, default tone) | Headless walk | eu `HELIX CORP // 2 OF 3 CITIES`; af `OMNICORP // 2 OF 3 CITIES`; as `HELIX CORP // 2 OF 3 CITIES`; oc `STRATOS INDUSTRIES // 2 OF 3 CITIES`. All class `wm-kv-readout dim`, colour `rgb(184, 216, 207)`. HC on, eu: `rgb(226, 246, 238)`. `wn-022-other-eu.png`, `wn-022-other-oc.png`. | PASS |
| WN-022-05 | AC-1 (contested) | Headless walk | sa: `CONTESTED // CITIES SPLIT 1-1-1`, `dim`, `rgb(184, 216, 207)`. TAX PAID `NO // NOT NEXUS-HELD`. `wn-022-contested-sa.png`. | PASS |
| WN-022-06 | AC-1 (owner, not Control) | Headless walk | S1 (NA Control 86, nb=omni): `CONTESTED // CITIES SPLIT 1-1-1`, `dim`; TAX PAID `NO // NOT NEXUS-HELD`. S2 (Control 10): unchanged. S3 (EU Control 37, ln/nc=nexus): `NEXUS GLOBAL // 2 OF 3 CITIES`, `teal`; TAX PAID `YES // NEXUS-HELD`. S4 (Control 95): unchanged. `wn-022-owner-not-control.png`. | PASS |
| WN-022-07 | AC-1 (words carry the state) | Headless walk + capture read by eye | Grayscale texts: na `NEXUS GLOBAL // 2 OF 3 CITIES`, eu `HELIX CORP // 2 OF 3 CITIES`, sa `CONTESTED // CITIES SPLIT 1-1-1` (pairwise distinct). Read from the row crops `wn-022-gray-{nexus,other,contested}-row.png`: "NEXUS GLOBAL // 2 OF 3 / CITIES", "HELIX CORP // 2 OF 3 CITIES", "CONTESTED // CITIES SPLIT / 1-1-1" (wrapped, full strings, legible). Row children: `span`, `b` (exactly two). Full captures `wn-022-gray-{nexus,other,contested}.png`. | PASS |
| WN-022-08 | AC-2 (THE JOB) | Headless walk | Title `THE JOB`. Body (normalised) equals the expected string exactly: "You run the network from this desk. Every sector prints a Tax yield, but only a Nexus-held sector pays it: one where Nexus holds most of its cities. North America pays from the start, Europe does not. A win hands the mission city to Nexus." `wn-022-card-100.png`. | PASS |
| WN-022-09 | AC-2 (CONTROL line) | Headless walk + `rg` | Row title `THE FOUR NUMBERS`. CONTROL line equals expected exactly: "CONTROL: the order kept in the sector; a win raises it. It sets Tax yield and Garrison, not who holds the sector (HELD BY on the sector panel)." Card text contains `how much of the sector Nexus holds`: false. `rg -n "how much of the sector" src`: no matches (exit 1). After dismissing, the NA panel's HELD BY row is present (`NEXUS GLOBAL // 2 OF 3 CITIES`). | PASS |
| WN-022-10 | AC-1 + ADR-0017 | Headless walk, 15 combinations | All 15 (na/oc/sa x 90/100/110/125/HC): `scrollWidth == clientWidth` (e.g. oc-90 231/231), `text-overflow: clip` (initial value; no ellipsis), `white-space: normal`; readout inside `.wm-sector-scroll` horizontally and vertically; label and readout boxes do not overlap; inside the viewport. The text wraps to a second line where it is wider than the column (heights 13-36 px). `wn-022-oc-125` capture checked by eye: `STRATOS INDUSTRIES // / 2 OF 3 CITIES` whole. Captures `wn-022-held-<sector>-<scale|hc>.png` (15). | PASS |
| WN-022-11 | AC-2 + ADR-0017 | Headless walk, 5 configurations | Card box x 300..980, y from 197..523 (90) to 97..623 (125), inside 1280x720 in all five. Job row and CONTROL span: `scrollWidth <= clientWidth` and `scrollHeight <= clientHeight`, both fully inside the card. Card `overflow-y: visible`, no internal scroll. UNDERSTOOD inside the card in all five (125: y 583..612). `wn-022-card-125.png` checked by eye: all text whole. Captures `wn-022-card-{90,100,110,125,hc}.png`. | PASS |
| WN-022-12 | Edge (Antarctica) | Headless walk | `selected: 'an'`: HELD BY `UNKNOWN`, class `wm-kv-readout dim`; TAX PAID `NO // NOT NEXUS-HELD`; zero page errors. `wn-022-an.png`. | PASS |
| WN-022-13 | AC-1 (automated) | vitest | `npx vitest run src/ui/worldChrome.test.ts`: `Test Files 1 passed (1)`, `Tests 26 passed (26)`. With `-t "WN-022"` (verbose): all four tests under `HELD BY names the city majority, not Control (WN-022)` passed: `opening North America: Nexus holds two of three cities`, `opening Europe: Helix holds two of three`, `opening South America is a three-way split`, `one seized city turns North America contested whatever its Control`. | PASS |
| WN-022-14 | Supporting | Prior captures read by eye | All five `playtest-fixes-2026-10-23/world-{90,100,110,125,hc}.png` opened. HELD BY is partly under the card's right edge in all five; the visible part reads `NEXUS GLOBAL // 2 OF 3 [CITIES]` (label cut to `ELD` by the card overlay, not by the panel). THE JOB and CONTROL lines on the card match WN-022-08/-09 word for word. No contradiction with this run. | PASS |

## Notes

- **Antarctica**: HELD BY reads `UNKNOWN`, the code's value. No design question raised for this reading.
- **Antarctica, non-AC observation**: the same panel prints `GARRISON CONDITION` `CRITICAL` in red for a locked sector with no cities and Control 0% (`wn-022-an.png`). Outside WN-022's ACs; a possible design question for the owner on whether an unsurveyed sector should print a garrison state.
- **Card overlay over HELD BY (non-AC)**: with the orientation card up, the card's right edge covers the left part of the sector panel, including the HELD BY label (prior captures and this run's `wn-022-card-*.png`). The row is fully readable once the card is dismissed (WN-022-10). The AC asks for the row and the card copy, not for both to be visible at once.
- **Wrapping**: at every scale at least one HELD BY string wraps to two lines (worst case `STRATOS INDUSTRIES // 2 OF 3 CITIES`); the full string is shown in every case, and the case allows wrapping.
- **AC-2 has no unit test** (recorded in the story); WN-022-08/-09 are its only evidence, and both pass.
- **Coverage**: every case except WN-022-13 is a headless hand-walk; the R1 probe has no WN-022 check.

## Story verdict: PASS WITH NOTES

- AC-1: PASS (WN-022-01 to -07, -10, -13)
- AC-1 manifest rule (owner, not Control): PASS (WN-022-06)
- AC-2: PASS (WN-022-08, -09, -11)
- ADR-0017 layout: PASS (WN-022-10, -11)
- Edge (Antarctica): PASS (WN-022-12)
