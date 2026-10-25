# IF-026 results: World Network type meets the size floors (Sprint 11 Phase 5, HEAD 131a5c1)

- **Story type**: UI. **Gate**: BLOCKING. **Cases**: `production/qa/test-cases/if-026-world-network-type-meets-the-size-floors-cases.md`
- **Build**: HEAD `131a5c1` (`git rev-parse --short HEAD`). `git status --short src/` shows only `src/game/tutorial.test.ts`, `src/state/tutorialStore.test.ts` (modified) and `src/game/world.noRoute.test.ts` (untracked); test files, not imported by the app. Dev server on :4200 answered `200`; not started or stopped by this run.
- **R1**: `../r1-probe/run.log` (`# Sprint 11 probe — 2026-10-25T02:29:14.535Z`), last lines `no console or page errors` / `ALL PASS`.
- **Hand-walk**: `handwalk.mjs` (probe.mjs lines 22-426 and `onScreen` copied verbatim), headless Chrome for Testing, 1280x720. Output `run.log` (`# IF-026 hand-walk — 2026-10-25T02:41:10Z`, re-run once with extra diagnostics), ending `no console or page errors`. Captures `tc13-*.png`, `tc14-opening-globe.png`, `tc19-brief-threat-125.png`, `tc22-*-125-scroll*.png`, `tc23-map-125.png`.
- Script fix during the run: the first launch called `setHC` on `about:blank` (module import failed); added `page.goto(URL)` before it. No app change.

| Case | AC | Coverage | Actual Result | Result |
|---|---|---|---|---|
| TC-01 | AC-1 card | R1 | `PASS IF-026 opening-card: every text run >= 10 px // min 10px over 235 runs`; `PASS IF-026 opening-card: readouts >= 12 px // 34 readouts, min 12px`. `state-opening-card.png`: ORIENTATION card over the World Network. | PASS |
| TC-02 | AC-1 opening | R1 | `min 10px over 221 runs`; `34 readouts, min 12px`. PNG: no card, Europe focused, OPEN CONTRACTS `1 / 2`, second (generated) row partly visible with `GENERATED` chip; its `EXPIRY` chip sits below the list fold (seen in DOM by TC-13 and at scroll end in TC-22). | PASS (note 1) |
| TC-03 | AC-1 SECURE | R1 | `min 10px over 221 runs`; `34 readouts, min 12px`. PNG GARRISON CONDITION `SECURE`. | PASS |
| TC-04 | AC-1 STRAINED | R1 | `min 10px over 221 runs`; `34 readouts, min 12px`. PNG `STRAINED`. | PASS |
| TC-05 | AC-1 CRITICAL | R1 | `min 10px over 221 runs`; `34 readouts, min 12px`. PNG `CRITICAL`. | PASS |
| TC-06 | AC-1 pressure | R1 | `min 10px over 222 runs` (opening 221); `34 readouts, min 12px`. PNG Europe row `UNREST PRESSURE`. | PASS |
| TC-07 | AC-1 crisis | R1 | `min 10px over 222 runs`; `34 readouts, min 12px`. PNG row `CRISIS` and panel chip `CRISIS`. | PASS |
| TC-08 | AC-1 Review | R1 | `min 10px over 223 runs`; `34 readouts, min 12px`. PNG `REVIEW -6.0H` and `> GO LIVE`. | PASS |
| TC-09 | AC-1 failed | R1 | `min 10px over 221 runs`; `34 readouts, min 12px`. PNG banner `CAMPAIGN FAILED` / `ROSTER EMPTY // NO CONTRACT CAN BE TAKEN`, row `CAMPAIGN LOST`. | PASS |
| TC-10 | AC-1 Influence note | R1 | R1 lines PASS: `min 10px over 203 runs`; `33 readouts, min 12px`. **But `state-influence-note.png` (and `if-035-influence-note.png`) show no Influence moment note and no `UNDERSTOOD` button**: NA focused, INFLUENCE 8 PTS, `1 STABILIZE 8P CLEAR`, sector inset absent. Expected: note visible. So the measured state is not shown to be "note showing". | FAIL (note 2) |
| TC-11 | AC-1 intel 2+ | R1 | `min 10px over 237 runs` > opening 221; `34 readouts, min 12px`. Forecast chips are below the panel fold in the PNG; hand-walk found 10 `.wm-fc-chip` text elements (RIOT 46%, BLKOUT 22%, RAID 61%, TRADE 24%, SEIZE 1%), all 10px, all in the run list. | PASS (note 1) |
| TC-12 | AC-1 readouts | Hand-walk | 11 states: 0 selectors with 0 matches; 0 readouts < 11.95 px. Table below. | PASS (note 3) |
| TC-13 | AC-1 state-only runs | Hand-walk | review: `REVIEW -` 10px, `> GO LIVE` 10px. pressure: `UNREST PRESSURE` 10px. crisis: row `CRISIS` 10px, panel chip `CRISIS` 10px. failed: `CAMPAIGN FAILED` 11px, `ROSTER EMPTY // NO CONTRACT CAN BE TAKEN` 10px, `0 /` `3` 17px, sigil 18px, 2x `CAMPAIGN LOST` 10px. opening: `EXPIRY` chip 10px. intel2: 10 forecast chip runs, 10px. 6/6 groups found, min 10px. | PASS |
| TC-14 | AC-1 measurement rules | Hand-walk | Globe ready (wait 0 ms, no `.globe-status`); LABELS `aria-pressed=true`. 10 globe labels, every text node in the run list, sizes 11px / 10px. 19 `aria-hidden` text nodes: 3 drawn (action effects, 10px) all in run list; 16 are hover `span.tip` text with drawn alpha 0 (not drawn, so not runs). sr-only elements under `.screen`: 0, so 0 in the list. | PASS (note 4) |
| TC-15 | AC-1 / AC-2 clip | R1 | All 8 named lines PASS with no detail (run.log lines 91, 94, 97, 100, 146-149). PNG step: `if-023-024-world-125.png` and `if-026-review-125.png` not opened (stopped at the coordinator's turn limit). | NOT RUN (PNG step; R1 half PASS) |
| TC-16 | AC-2 World 125 | R1 | `PASS IF-026 World Network at 125: nothing clips; nav labels not truncated`. `if-026-world-125.png`: 4 nav labels and CREDITS / INFLUENCE / INTEL / ROSTER whole. | PASS |
| TC-17 | AC-2 Research 125 | R1 | `PASS IF-026 Research at 125: nothing clips; nav labels not truncated`. PNG not opened (turn limit). | NOT RUN (PNG step; R1 half PASS) |
| TC-18 | AC-2 Brief 125 | R1 | `PASS IF-026 Brief at 125: nothing clips; nav labels not truncated`. PNG not opened (turn limit); hand-walk read subtitle `RUST HAVEN // DETROIT SPRAWL`. | NOT RUN (PNG step; R1 half PASS) |
| TC-19 | AC-2 BUG-0009 | Hand-walk | At 125: `.mb-threat` 940.8-1255.6 x 326.3-410.3; MODERATE 983.8-1105.4 x 347.3-371.3; blocks 1149.6-1245.6 x 374.3-386.3; ETA 1050.8-1245.6 x 389.3-404.3. Intersections (w,h): MODERATE/ETA (54.6, 0), MODERATE/blocks (0,0), label/ETA (194.8, 0), label/blocks (96, 0): 0 with area. 4/4 parts inside the box. Capture `tc19-brief-threat-125.png` saved (not viewed). | PASS |
| TC-20 | AC-2 Assembly 125 | R1 | `PASS IF-026 Assembly at 125: nothing clips; nav labels not truncated`. PNG not opened (turn limit). | NOT RUN (PNG step; R1 half PASS) |
| TC-21 | AC-2 header | Hand-walk | World: 4 `.wm-resource`; Research / Brief / Assembly: 5 `.screen-head-right` chips (clock, CREDITS, INFLUENCE, INTEL, ROSTER). Every item `scrollWidth == clientWidth`, parts inside, inside `.screen-head`, 0 hits on title / subtitle / navtabs. bad=0 on all four. | PASS |
| TC-22 | AC-2 overflow scrolls | Hand-walk | World 4 scroll containers, Research 0, Brief 2, Assembly 2. At scroll end every last child bottom within the container (e.g. ops list 514 / 514, dossier 559 / 568) and every last text fully visible. `clipped('.screen')` at scrolled position `[]` on all four. Captures saved. | PASS (note 5) |
| TC-23 | AC-2 map chrome | Hand-walk | 51 text elements under `.wm-map-wrap` at 125: 0 cut / truncated / spilled. Blocks `globe-toolbar`, `wm-ov tl`, `wm-ov tc`, `wm-ov br`: 0 intersections, 0 outside the map. Capture `tc23-map-125.png` saved. | PASS |

## TC-12 table (HEAD 131a5c1, text scale 100, computed font-size)

All 11 states (opening-card, opening, garrison-secure/strained/critical, pressure, crisis, review, failed, influence-note, intel2) give the same sizes:

| Readout | Selector | Matches per state | Size |
|---|---|---|---|
| Header CREDITS, INFLUENCE, INTEL, ROSTER | `.wm-resource b` | 4 | 12px |
| Sector names | `.wm-sector-name` | 7 | 12px |
| CONTROL / UNREST, rows | `.wm-sector-reading b` | 12 | 12px |
| CONTROL / UNREST, panel | `.wm-cu b` | 2 | 17.92px |
| HELD BY, TAX YIELD, TAX PAID, GARRISON | `.wm-kv-readout` | 4 | 12px |
| Contract codenames | `.wm-op-main > b` | 2 (influence-note: 1, `RUST HAVEN`) | 12px |
| CLOCK SPEED | `.wm-speed b` | 1 (`PAUSED`) | 12px |
| Date | `.wm-date` | 1 | 19.2px |
| Clock | `.wm-clock` | 1 | 12px |

Minimum run per state: 10px in all 11 (runs: 235, 221, 221, 221, 221, 222, 222, 223, 221, 203, 237).

## Notes

1. TC-02 / TC-11: the `EXPIRY` chip and the forecast chips are below the fold of their scroll lists at 1280x720, so the state PNGs do not show them; their presence and size were read from the DOM (TC-13) and the ops-list end capture (TC-22).
2. TC-10: cause not determined. `useInfluenceMoment` (`src/ui/WorldMap.tsx:221-249`) fires the note when an action is affordable and the note takes the sector inset's slot; in the PNG the inset is gone but no note is drawn, and the run count (203) is below opening (221). Whether this is the fixture (setState while paused, tutorial seen state) or the app was not established. The R1 readings for this state therefore do not prove the "note showing" state was measured. Needs triage (qa-lead) before filing a bug.
3. TC-12 step 5 asks for the table in the evidence README; it is recorded here in `results.md` (this run was authorised to write only this file).
4. TC-14: the sr-only half passes vacuously: no element under `.screen` uses the sr-only clip in the opening state.
5. TC-22: World ops list at 125, the last contract card is 101 px tall in a 94 px viewport (top 413 vs container top 420), so at scroll end its top 7 px is above the view; its bottom and last text are inside. Every part is reachable by scrolling.
6. Observation (not an AC fail): in `state-influence-note.png` / `if-035-influence-note.png` the CONTROL KEY overlay covers the globe label `RUST HAVEN / DETROIT SPRAWL · SABOTAGE`. Globe labels sit in `.globe-view`, outside the probe's clip pass and TC-23's block check.

## Story verdict

**FAIL** (pending triage of TC-10). AC-1: FAIL on TC-10 (Influence-note state not shown in its capture); all other AC-1 cases PASS. AC-2: PASS on TC-16, 19, 21, 22, 23; TC-15, 17, 18, 20 have R1 lines PASS but their PNG steps NOT RUN (turn limit).

## qa-lead ruling and completion (orchestrator, 2026-10-24)
- **TC-10: PASS.** The Influence note was up when R1 measured. R1's later IF-035 check found its UNDERSTOOD at y 408 (r1-probe/run.log:152), and a triage re-measure with the note confirmed in the DOM gave 203 runs, min 10 px, min 6.42:1, 0 clipped (if-026/triage/floors-note.mjs). That is the same run count as R1 line 47. The captures don't show the note because, at 1280x720, it sits below the fold of the sector panel's scroll box: UNDERSTOOD is at y 408–432, the panel's visible area at y 111–397 (if-034 results N1). In the 10-23 build it was partly on screen. WN-022's HELD BY row (2c73542) added height to the panel.
  - **Observation for the owner / ux-designer, not a defect:** P-25 says the note "takes a slot in the panel's own flow" (design/ux/interaction-patterns.md:654) and does not require it in view. But a first-time player sees it only by scrolling, and a refocus drops it for good (P-25). Triage captures: if-026/triage/influence-note-up.png.
- **TC-15, TC-17, TC-18, TC-20: PASS.** I viewed r1-probe/if-023-024-world-125.png, if-026-review-125.png, if-026-research-125.png, if-026-brief-125.png and if-026-team-125.png. On World Network, Review, Research and Brief I saw no clipped text, overlapping box or truncated nav label. On Assembly at 125 the stat tile reads `MOBILIT` / `Y`, a mid-word break with nothing clipped or overlapping. That is IF-036 AC-2's defect (owner ruling 2026-10-24), filed there, not against IF-026. The Brief stats-rail bottom row (`ROUTE OMEGA`) sits under the scroll fade and is reached by scrolling, which is the carried Sprint 10 case H5.
Story verdict: **PASS WITH NOTES**.
