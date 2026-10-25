# IF-039 results: Brief, Assembly, Debrief and Abort say what happens

**Story type**: UI | **Gate level**: BLOCKING | **Build**: HEAD `131a5c1` | **Date**: 2026-10-24
**Cases**: `production/qa/test-cases/if-039-brief-assembly-debrief-and-abort-say-what-happens-cases.md`
**Executor**: Claude (qa-tester, `/team-qa` Sprint 11 Phase 5). Headless Chrome for Testing via `playwright-core` (launch copied from `playtest-fixes-2026-10-23/sweep.mjs`), viewport 1280x720. Dev server on `http://localhost:4200/` was already running; not started or stopped by this run.
**Scripts and raw output (this folder)**:
- `walk.mjs` -> `walk-output.json`, `run.log` (TC-01..05, 07, 09/10 first pass, 12 steps 1-3, 15, 16)
- `walk2.mjs` -> `walk2-output.json`, `run2.log` (TC-09/10 re-run with a fixed row finder; TC-12 step 4 re-run)
- `walk3.mjs` -> `run3.log` (TC-08 follow-up: loadout hint position at 125%)
- R4 cases quote `../r4-playtest-sweep/run.log`. Page errors in all three scripts: `[]`.

## Results

| Case | AC | Coverage | Actual Result | Result |
|---|---|---|---|---|
| IF039-TC-01 | AC-1 | Hand-walk | m03, m01, m02: `.mb-collateral` = `5,000 CR PER CIVILIAN HIT // CAPPED AT THE REWARD`; box text `COLLATERAL: 5,000 CR PER CIVILIAN HIT // CAPPED AT THE REWARD`. Meter/bar descendants `[]`, `%` false, tier-paren false on all three. `COLLATERAL TOLERANCE` false, `(10%)` false. `COLLATERAL_FINE` = 5000. Shots `if039-tc01-{m03,m01,m02}.png`. | PASS |
| IF039-TC-02 | AC-1 | Hand-walk | 4 of 6 Briefs carry the phrase. **m03** notes: `CLEAR DUSK. GUARDS SEE AND HEAR AT FULL RANGE.` / `CIVILIAN DENSITY SPARSE. INDUSTRIAL BAND MOSTLY EMPTY.` / `DEMOLITION CELLS ARE THE FAST TOOL. GUNFIRE WORKS, SLOWLY.` / `THE YARD GUARD CAN BE BYPASSED ON THE WAY IN.` **qa039-sabotage** notes: `HEAVY RAIN. VISIBILITY REDUCED.` / `CIVILIAN DENSITY SPARSE. INDUSTRIAL BAND MOSTLY EMPTY.` / `GENERATED CONTRACT // OFFER EXPIRES IF UNACCEPTED.` Neither contains `EVERY CIVILIAN HIT IS BILLED.` (expected in every Brief). m01, m02, qa039-seizure, qa039-extraction contain it (`CIVILIAN DENSITY MODERATE/LOW. EVERY CIVILIAN HIT IS BILLED.`). Generated clones were made from the fresh campaign's one opening contract `gc7518e2d3` (SABOTAGE, eu/os, seed 1964565203). Shots `if039-tc02-<id>.png`. | **FAIL** |
| IF039-TC-03 | AC-1 | Hand-walk | `.mb-reward-eta`: m03 `A WIN SPENDS 3 DAYS OF WORLD TIME` (etaDays 3), m01 `... 2 DAYS ...` (2), m02 `... 4 DAYS ...` (4). `closest('.mb-reward')` non-null for all three. `ETA [234]D` matches: `[]` on all three. Shot `if039-tc03-m03.png`. | PASS |
| IF039-TC-04 | AC-1 | Hand-walk | m03 tiers `[PRIMARY, OPTIONAL, SECONDARY, TERTIARY, QUATERNARY]` (REACH THE RELAY YARD; DROP THE BACKUP TRANSFORMER (+6,000 CR); DESTROY THE THREE FUEL RELAYS; HOLD THE YARD FOR THE BURN; EXTRACT THE SQUAD). m02 `[PRIMARY, OPTIONAL (PULL THE DETENTION SERVER), SECONDARY, TERTIARY, QUATERNARY]`. m01 `[PRIMARY, SECONDARY, TERTIARY]`. No repeats. Shots `if039-tc04-m03-1..5.png`. | PASS |
| IF039-TC-05 | AC-1 | Hand-walk | `S1` = 2 (`sequenceVariant(2)` = 1). `qa039-sab-v1` (SABOTAGE, seed 2, variant 1): PRIMARY REACH THE RELAY YARD, SECONDARY DESTROY THE THREE FUEL RELAYS, TERTIARY HOLD THE YARD FOR THE BURN, QUATERNARY EXTRACT THE SQUAD. `qa039-ext` (EXTRACTION, seed 1964565203, variant 2): PRIMARY, OPTIONAL PULL THE DETENTION SERVER, SECONDARY, TERTIARY, QUATERNARY EXTRACT THE SQUAD. No repeats. Shot `if039-tc05-sab.png`. | PASS |
| IF039-TC-06 | AC-1 | R4 | `run.log` `## brief: 143 runs, 5 targets`: `clip @90: 0`, `clip @100: 0`, `clip @110: 0`, `clip @125: 0` (lines 62-65). `brief-125.png` 1280x720 (sips). | PASS |
| IF039-TC-07 | AC-2 | Hand-walk | `.ts-deploy-sub`: m03 `RUST HAVEN // A WIN SPENDS 3 DAYS OF WORLD TIME`, m01 `GLASS VEIL // A WIN SPENDS 2 DAYS OF WORLD TIME`, m02 `HOLLOW CROWN // A WIN SPENDS 4 DAYS OF WORLD TIME`; `DEPLOY TEAM >>` enabled on all three. Hint `CLICK A SLOT TO CYCLE: EMPTY > MED KIT > POWER CELL`, inside `.ts-box`, before `.ts-loadout`. Slot clicks: `+ EMPTY SLOT 0.0 KG` -> `MED KIT 8.0 KG` (filled) -> `POWER CELL 6.0 KG` (filled) -> `+ EMPTY SLOT 0.0 KG`. Shot `if039-tc07-m03.png`. | PASS |
| IF039-TC-08 | AC-2 | R4 | `run.log` `## team: 225 runs, 32 targets`: `clip @90/100/110/125: 0` (lines 75-78). In `team-125.png` the deploy line `RUST HAVEN // A WIN SPENDS 3 DAYS OF WORLD TIME` is fully visible. The loadout hint is **not** fully visible: `CLICK A SLOT TO` shows, the next line `CYCLE: EMPTY >` is cut by the bottom edge of the `.ts-detail-list` scroll pane, the rest is below it. Expected per the case: "both strings are visible in the PNG". Follow-up (`walk3.mjs`): at 125% the hint sits at top 735.8 px, below the pane's bottom 509.6 px; scrolled into view it sits 322.8..382.8 px, left 1094.9 / right 1253.6 inside the pane (918.1..1263.6), `scrollWidth` 159 = `clientWidth` 159 (no horizontal clip). Shot `if039-tc08-hint-125-scrolled.png`. | **FAIL** (case criterion; see Notes 2) |
| IF039-TC-09 | AC-3 | Hand-walk | (walk2) One `.db-row`: label `> KIA // DART`, value `0 XP LOST // ROSTER 7/8` (`b.red`). Text order: SQUAD CASUALTIES (idx 165) < KIA (186) < INJURED // GHOST (224). `operatives.length` 7; `lastReport.kia` `[{id:'op3', codename:'DART', xp:0}]`. Only DART line on the page is `> KIA // DART`. Shot `if039-tc09.png`. | PASS |
| IF039-TC-10 | AC-3 | Hand-walk | Seeded xp read back op1 120, op3 45. Two rows in order: `> KIA // MARA` = `120 XP LOST // ROSTER 6/8`; `> KIA // DART` = `45 XP LOST // ROSTER 6/8`. Zero-death Debrief: 0 KIA rows. Shots `if039-tc10-two.png`, `if039-tc10-none.png`. | PASS |
| IF039-TC-11 | AC-3 | R4 | `run.log` `## debriefkia: 60 runs, 3 targets`: `<4.5:1 default: 0`, `<4.5:1 high contrast: 0` (137-138), `clip @90/100/110/125: 0` (143-146). `debriefkia-125.png` (1280x720): row `> KIA // DART ... 0 XP LOST // ROSTER 7/8` fully visible. | PASS |
| IF039-TC-12 | AC-4 | Hand-walk | Step 1 hint `""`, button `ABORT`. Step 2 hint `PRESS AGAIN WITHIN 3 S TO ABORT // NO INVOICE, CONTRACT STAYS OPEN, ROSTER AS DEPLOYED`, button `CONFIRM?`, aria `Confirm abort mission`. Step 3 (3.5 s later) hint `""`, button `ABORT`, phase `mission`. Step 4 (walk2, 125%): hint text as step 2; two line rects 287.4..992.6 and 545.3..734.7; panel 250..1030; hint box 261..1019, `scrollWidth` 758 = `clientWidth` 758; inside panel and 1280. Shots `if039-tc12-armed-100.png`, `if039-tc12-armed-125.png`. | PASS |
| IF039-TC-13 | AC-4 | R4 | `run.log` `## pause: 200 runs, 16 targets`: `clip @90/100/110/125: 0` (lines 116-119). | PASS |
| IF039-TC-14 | AC-5 | R4 | `run.log` `## mission: 126 runs, 13 targets`: `clip @90/100/110/125: 0` (lines 102-105). `grep spill\|offscreen\|hud-panel-head run.log`: no matches. `mission-125.png` 1280x720. | PASS |
| IF039-TC-15 | AC-5 | Hand-walk | Objectives panel 982..1270 (inner 286). At 100: `MISSION DIRECTIVES // SABOTAGE`, 1 line, right 1231.6. At 125: same text, no ellipsis, 2 lines (991..1201.5, 991..1071.2); single-line width at 125 = 301 > inner 286, so wraps as required. All 8 HUD panel heads at 125 inside panel +/-1.5 px and 0..1280 (`ok: true` for each). Shots `if039-tc15-hud-125.png`, crop `if039-tc15-objectives-125.png`. | PASS |
| IF039-TC-16 | AC-5 | Hand-walk | `qa039-supp` (SUPPRESSION clone), phase `mission`. At 125: `MISSION DIRECTIVES // SUPPRESSION`, no ellipsis, 2 lines (991..1201.5, 991..1101.3) inside panel 982..1270; single-line width 331 > inner 286. All heads `ok: true`. Shot `if039-tc16-hud-125.png`. | PASS |

## Per-AC

| AC | Result | Why |
|---|---|---|
| AC-1 Brief | **FAIL** | TC-02: m03 RUST HAVEN and the generated SABOTAGE Brief lack `EVERY CIVILIAN HIT IS BILLED.` TC-01, 03, 04, 05, 06 pass. |
| AC-2 Assembly | **FAIL** (case criterion) | Copy and behaviour pass (TC-07). TC-08 fails its own criterion: in R4 `team-125.png` the loadout hint is cut by the scroll pane edge. Needs a qa-lead ruling (Notes 2). |
| AC-3 Debrief | PASS | TC-09, 10, 11. |
| AC-4 Abort | PASS | TC-12, 13. |
| AC-5 HUD 125% | PASS | TC-14, 15, 16. |

## Notes

1. TC-02 cause, from source (not a separate finding): `src/game/data.ts` m03 notes and `src/game/contracts.ts` `DENSITY_NOTE.industrial` = `'CIVILIAN DENSITY SPARSE. INDUSTRIAL BAND MOSTLY EMPTY.'`; `checkpoint` and `compound` notes end `EVERY CIVILIAN HIT IS BILLED.` Every generated SABOTAGE contract maps to `industrial`, so all of them fail, including the fresh campaign's opening offer `gc7518e2d3`.
2. TC-08 is a fail against the case's written criterion ("both strings are visible in the PNG"), not a clip: R4 clip counts are 0, and the hint fits once scrolled into view. AC-2 itself requires the hint to be shown, not shown above the fold of the item-slot scroll pane. qa-lead should rule whether this is a defect or a case-design issue before a bug is filed. In the walk3 fixture the hint was fully below the pane (top 735.8 vs pane bottom 509.6); in R4's PNG it was partly visible, so the pane's scroll position at capture differs between the runs.
3. TC-12, harness: in the first pass (`walk.mjs`), after the 3.5 s lapse, setting 125% and clicking ABORT 300 ms later read back hint `""` and button `ABORT` (`walk-output.json` `tc12.armed125`, `after125`). The second pass (`walk2.mjs`, fresh mission, 500 ms after the scale change) read the armed hint at 0 ms and 150 ms after the click. The result above comes from walk2. I did not find out why the first click did not arm (or armed and cleared within 300 ms). Not repeated a third time.
4. TC-09/10 first pass (`walk.mjs`) found 0 rows because its finder looked for labels starting with `KIA //`. The rendered label is `> KIA // DART` (`span.db-row-label`). Script fixed in walk2; the app was not changed.
5. Not an AC item: in `debriefkia-125.png` the `> SECTOR // NORTH AMERICA` row's value wraps, and its second line `UNREST 12% > 10%` is cut by the bottom edge of the row scroll pane (scroll arrow shown). R4 counts it as clip 0.
6. Not an AC item: TC-10 step 3 used the R4 `debrief` fixture inline in `walk2.mjs`, not a separate R4 run.

## Story verdict

**FAIL**. AC-1 fails on observed copy (TC-02: 2 of 6 Briefs, m03 RUST HAVEN and generated SABOTAGE, lack `EVERY CIVILIAN HIT IS BILLED.`). TC-08 (AC-2) also fails its case criterion, pending a qa-lead ruling. AC-3, AC-4 and AC-5 pass.

## qa-lead ruling (orchestrator, 2026-10-24)
- **TC-02 FAIL is confirmed as a defect** against AC-1: "contract notes say `EVERY CIVILIAN HIT IS BILLED.`" for any Brief. The source matches what renders: src/game/data.ts:246 (m03) and src/game/contracts.ts:420 (`DENSITY_NOTE.industrial`, used by every SABOTAGE contract) both read `CIVILIAN DENSITY SPARSE. INDUSTRIAL BAND MOSTLY EMPTY.` A bug is filed.
- **TC-08 is resolved as PASS WITH NOTES.** AC-2 requires the loadout line to read `CLICK A SLOT TO CYCLE: EMPTY > MED KIT > POWER CELL`. It does, and scrolled into view it sits whole inside `.ts-detail-list` with no clip (scrollWidth 159 = clientWidth 159). design/ux/assembly.md:371 says "overflow scrolls (P-15)". The case's "visible in the PNG" criterion is stricter than the AC.
- The Debrief SECTOR row's second line at 125% sits at a scroll-pane edge and is reached by scrolling. Observation.
Story verdict: **FAIL** (AC-1).
