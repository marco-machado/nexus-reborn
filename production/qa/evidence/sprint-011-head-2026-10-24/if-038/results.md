# IF-038 — Spec-review and overlap fixes — execution results

**Story type**: UI | **Gate**: BLOCKING (qa-lead sign-off) | **Build**: HEAD `131a5c1` (uncommitted changes only in three test files the app does not import)
**Cases**: `production/qa/test-cases/if-038-spec-review-and-overlap-fixes-cases.md`
**Date**: 2026-10-24 | **Server**: dev server on http://localhost:4200, already running (not started or stopped by this run)
**Browser**: headless Chrome for Testing via `playwright-core` (R2 launch flags), viewport 1280x720 unless the case says otherwise. The user's Chrome was not used.

**Evidence used**
- R2: `../r2-sweep/sweep-output.txt`, `../r2-sweep/sweep-<surface>.json`, PNGs; `../r2-sweep-world-alone/`
- R3: `../r3-focus/focus-output.txt`, `../r3-focus/run.log`
- R4: `../r4-playtest-sweep/sweep-output.txt`, `sweep-<surface>.json`, PNGs
- Hand-walk: `handwalk.mjs` (helpers, `fresh()`, `SURFACES` copied verbatim from R2; `debriefkia` from R4; R1 `STATES.opening` / `failed` / `influence-note` from `sprint-011/probe.mjs`). Output in `run.log` and `handwalk.json`, PNGs `if-038-*.png`. One follow-up script `brief-followup.mjs` / `brief-followup.log` / `if-038-17-brief-125-recon.png` (IF-038-17 PNG check).
- Write failure (IF-038-23): triggered through the app's own path. The harness patched `Storage.prototype.setItem` in the page so that it throws `DOMException('…', 'QuotaExceededError')` for key `nexus-save-v1`, then called `save.writeSave()`. Result: `{"ok":false,"status":"write-failed","reason":"quota"}`. No `src/` edit.

## Results

| Case | AC | Coverage | Actual Result | Result |
|---|---|---|---|---|
| IF-038-01 | AC-1 | R2 `label-in-name` (world) + presence check in the same fixture | R2 `## world`: `label-in-name: 0`; `r2-sweep-world-alone`: `label-in-name: 0`; `sweep-world.json` `def.labelInName` = `[]`. Presence (hand-walk, R2 `SURFACES.world`): `UNDERSTOOD // DISMISS THE ORIENTATION` found 1, visible line `UNDERSTOOD`; `2 UNREAD // MARK ALL EVENTS READ` found 1, visible line `2 UNREAD`. | PASS |
| IF-038-02 | AC-1 | Hand-walk | R1 `influence-note`: `.wm-moment-btn` visible, `aria-label` `UNDERSTOOD // DISMISS THE INFLUENCE NOTE`; first visible line `UNDERSTOOD`; starts-with true; R2 `labelInName` = `[]`. Capture `if-038-02-influence-note.png`. | PASS |
| IF-038-03 | AC-1 | R2 `label-in-name` (team) + presence | R2 `## team`: `label-in-name: 0`; `def.labelInName` `[]`. Presence: `RECRUIT + (8/8) // OPEN THE RECRUITMENT MARKET` (1); item slots `EMPTY SLOT // ITEM SLOT 1 // CYCLE`, `EMPTY SLOT // ITEM SLOT 2 // CYCLE` (2); `DEPLOY TEAM // STRIKE TEAM 04`, visible `DEPLOY TEAM >>` (1). | PASS |
| IF-038-04 | AC-1 | Hand-walk | After `operatives: []`: `.ts-none` visible, text `ROSTER EMPTY / RECRUIT REPLACEMENTS TO REBUILD STRIKE TEAM 04 / RECRUIT >>`; `button.cta` `aria-label` `RECRUIT // OPEN THE RECRUITMENT MARKET`, text `RECRUIT >>`; `labelInName` `[]`. Capture `if-038-04-roster-empty.png`. | PASS |
| IF-038-05 | AC-1 | R2 `label-in-name` (research) + presence | R2 `## research`: `label-in-name: 0`. CTA found 1: `AUTHORIZE PROJECT // ADVANCED PROPELLANTS // COMMITS 16,000 CR // 2H IN BALLISTICS LAB`, visible `AUTHORIZE PROJECT`. | PASS |
| IF-038-06 | AC-1 | R2 `label-in-name` (settings) + presence | R2 `## settings`: `label-in-name: 0`. `RESET ALL // EVERY CONTROL TO ITS DEFAULT KEY` found 1 (disabled, visible); Quality: `AUTO // RENDER QUALITY auto`, `HIGH // RENDER QUALITY high`, `MED // RENDER QUALITY medium`, `LOW // RENDER QUALITY low` (4). 1 + 4 found. | PASS |
| IF-038-07 | AC-1 | R2 `label-in-name` (balance) + presence | R2 `## balance`: `label-in-name: 0`. `EXPORT JSON // THE TELEMETRY RECORDS` found 1. | PASS |
| IF-038-08 | AC-1 | R2 `label-in-name` (debrief) + step-3 fallback | R2 `## debrief`: `label-in-name: 0`, **but vacuous for these controls**: in the R2 debrief fixture OPEN RESEARCH and UNDERSTOOD (research prompt) are found 0 / 0 (R2 `fresh()` marks `hint-debrief-research` seen). Fallback per step 3 (team → remove `hint-debrief-research` from `seen` → settle the won outcome, no `fresh()` in between): `OPEN RESEARCH // THE RESEARCH TAB` found 1, `UNDERSTOOD // DISMISS THE RESEARCH PROMPT` found 1; hand `labelInName` = `[]`. Capture `if-038-08-debrief-note.png`. | PASS |
| IF-038-09 | AC-1 | Hand-walk | R2 debrief + seeded record: `BALANCE DATA // OPEN THE DASHBOARD OVER THE LOCAL MISSION LOG` found 1, visible `BALANCE DATA`; `labelInName` `[]`. Capture `if-038-09-balance-data.png`. | PASS |
| IF-038-10 | AC-1 | R2 (mission, pause) + R4 (mission, hold) | R2 `## mission` `label-in-name: 0`; R2 `## pause` `label-in-name: 0`; R4 `## mission` `label-in-name: 0`; R4 `## hold` `label-in-name: 0` (4/4). `button.hud-toast-btn[aria-label="SKIP TUTORIAL // SKIP THE WHOLE TUTORIAL"]` visible in the mission state. | PASS |
| IF-038-11 | AC-1 | R2 10 surfaces, R4 12 surfaces | R2: world, menu, settings, research, brief, team, debrief, mission, pause, balance all `label-in-name: 0` (10/10). R4: same ten + hold, debriefkia all `label-in-name: 0` (12/12). 0 `NOT MEASURED`; last line `no page errors` in both. | PASS |
| IF-038-12 | AC-1 | Hand-walk | Every listed control found and `norm(label).startsWith(norm(visible))` true: UNDERSTOOD (orientation / influence / research) 3/3; `2 UNREAD`; `RECRUIT + (8/8)`; `RECRUIT >>`; `EMPTY SLOT` x2 (item slots 1, 2); `DEPLOY TEAM >>`; `OPEN RESEARCH`; `BALANCE DATA`; `AUTHORIZE PROJECT`; `RESET ALL`; `AUTO` / `HIGH` / `MED` / `LOW`; `EXPORT JSON`; `SKIP TUTORIAL`. 0 rows fail, 0 missing. Table below. | PASS |
| IF-038-13 | AC-2 | R3 | `PASS Balance from the Debrief takes focus // EXPORT JSON // THE TELEMETRY RECORDS`; `PASS Escape closes Balance on the Debrief and focus returns to BALANCE DATA // BALANCE DATA // OPEN THE DASHBOARD OVER THE LOCAL MISSION LO`. No `BALANCE DATA shows on the Debrief with a record` FAIL line; no error lines in `focus-output.txt` / `run.log`. Step 3 (`ALL PASS`) is not met: the run ends `FAILED 1` on an unrelated line (see Notes 1). | PASS |
| IF-038-14 | AC-2 | R3 | `PASS invoice is a named scroll region with the cut-edge fade // {"role":"region","label":"Mission invoice","fade":true}` | PASS |
| IF-038-15 | AC-2 | Hand-walk | R4 `debriefkia` at text scale 125: `.scroll.db-rows` scrollHeight 622, clientHeight 354 (overflows); role `region`, label `Mission invoice`, tabIndex 0. At scrollTop 0: fade class `scroll-fade on`. Tab from body reached the region: `true`. After focus + End: scrollTop 267, fade class `scroll-fade` (`on` gone). Captures `if-038-15-fade-on.png`, `if-038-15-fade-off.png`. Scale reset to 100. | PASS |
| IF-038-16 | AC-2 | Hand-walk (H9) | R1 `failed`: one `.wm-campaign-fail`, visible, `role="status"`, text `◆ / CAMPAIGN FAILED / ROSTER EMPTY // NO CONTRACT CAN BE TAKEN / 0 / 3`. Capture `if-038-16-failed-banner.png`. | PASS |
| IF-038-17 | AC-3 | R2 + R4 `clip @N` (brief) | R2 `## brief` `clip @90: 0`, `@100: 0`, `@110: 0`, `@125: 0`; R4 `## brief` same 4 x 0 (8/8). `sweep-brief.json` `clips` empty at every scale in both runs (0 `boxoverlap` / `textoverlap`). `brief-125.png` (R2) and a zoomed capture `if-038-17-brief-125-recon.png`: briefing block, readouts and callout do not sit on one another (see Notes 3 on canvas art under the callout). | PASS |
| IF-038-18 | AC-3 | Hand-walk | One `.mb-recon-labels .mb-rright`, holding the 1 `.mb-rreadout` and the 1 `.mb-rcallout` on the page. At 90/100/110/125: `.mb-rbrief` and `.mb-rreadout` `rgba(7, 16, 15, 0.92)`; `.mb-rcallout` `rgba(4, 10, 9, 0.9)` (= `--bg-inset`, `src/index.css:15`). `.mb-rbrief` / `.mb-rright` horizontal gap (intersection width negative): -188.2 / -138.3 / -122.8 / -99.5 px, so 0 intersections. Captures `if-038-18-brief-recon-<scale>.png`. | PASS |
| IF-038-19 | AC-3 | Hand-walk | R1 `opening` (EUROPE // HELIX CORP): tag vs stepper L intersection width -4 px at every scale; vs stepper R -77 / -61.7 / -46.5 / -23.6 px at 90/100/110/125; `clipped('.screen')` `wm-inset` entries 0 at every scale. All 6 sectors stepped at 125: longest tag `OCEANIA // STRATOS INDUSTRIES` wraps (tag height 32 px vs 17 px single-line), left gap 4 px, right gap 4 px, 0 clip entries; also `NORTH AMERICA // NEXUS GLOBAL` and `SOUTH AMERICA // CONTESTED` wrap with 4 px gaps. 0 intersections > 2x2. Captures `if-038-19-inset-<scale>.png`. | PASS |
| IF-038-20 | AC-3 | R2 (mission) + R4 (mission, hold) + shared-parent check | R2 `## mission`, R4 `## mission`, R4 `## hold`: `clip @90..@125` all 0 (12/12); no `hud-toasts` boxoverlap (clips arrays empty). Shared parent: `.hud-toasts`, `.hud-weapons`, `.hud-comms` all children of `.hud-root`, all `position: absolute` → `toastsWeapons: true`. Direct rects (supporting): toasts bottom vs weapons top gap 20.6 / 16 / 7.8 / 15 px at 90/100/110/125. | PASS |
| IF-038-21 | AC-3 | R2 + R4 `clip @N` (mission, hold) | 0 `hud-comms` / `hud-weapons` boxoverlap entries over 4 scales x 3 surface runs (all clips arrays empty). `mission-125.png` (R2): COMM LOG panel ends left of the PRIMARY weapons panel. Direct 1280 rects: comms right 304/296/288/276 vs weapons left 309 at every scale. | PASS |
| IF-038-22 | AC-3 | Hand-walk (H10) | 1360x720 comms width 294 / 286 / 278 / 266 at 90/100/110/125 (expected 294/286/278/266); comms right 304/296/288/276 vs weapons left 345.9/341.9/340/340. 1280x720: width 294/286/278/266; comms right 304/296/288/276 vs weapons left 309. 8/8 widths exact, 0/8 overlaps. Captures `if-038-22-comms-<1360|1280>-<scale>.png`. | PASS |
| IF-038-23 | AC-3 | Hand-walk (H10) | Through `writeSave()` with a throwing `setItem` (reason `quota`). World: `.write-fail-region .write-fail-notice` text `SAVE FAILED // CAMPAIGN NOT FILED`, color `rgb(255, 107, 85)`, border all four sides `color(srgb 1 0.419608 0.333333 / 0.6)` (= Red Hot 255,107,85 at 0.6), 1px, bg `rgba(7, 16, 15, 0.92)`, `::before` corner borders `rgb(255, 107, 85)`, contrast 6.9:1. Research: identical values, 6.9:1. Card (`.wm-onboard-fail`, orientation card up): identical values, contrast 6.85:1; fixed region hidden (`clip-path: inset(50%)`). No amber (`rgb(240, 180, 69)`) value anywhere. Clear: restoring `setItem` and calling `writeSave()` → `filed`, 0 `.write-fail-notice`; card variant after `reset()` → 0. Captures `if-038-23-write-fail-{world,research,card}.png`. | PASS |
| IF-038-24 | AC-3 | R2 10 + R4 12 surfaces `clip @N` | R2 40/40 and R4 48/48 surface x scale `clip @N` lines = 0; every `sweep-<surface>.json` `clips` array empty in both runs (0 `boxoverlap`); also `r2-sweep-world-alone` 4/4 = 0. 0 `NOT MEASURED`; `no page errors` in both. | PASS |

### IF-038-12 table (label starts with the visible line)

| Control | Visible line | aria-label | starts-with |
|---|---|---|---|
| UNDERSTOOD (orientation) | UNDERSTOOD | UNDERSTOOD // DISMISS THE ORIENTATION | true |
| n UNREAD | 2 UNREAD | 2 UNREAD // MARK ALL EVENTS READ | true |
| UNDERSTOOD (influence) | UNDERSTOOD | UNDERSTOOD // DISMISS THE INFLUENCE NOTE | true |
| RECRUIT + | RECRUIT + (8/8) | RECRUIT + (8/8) // OPEN THE RECRUITMENT MARKET | true |
| Item slot 1 | EMPTY SLOT | EMPTY SLOT // ITEM SLOT 1 // CYCLE | true |
| Item slot 2 | EMPTY SLOT | EMPTY SLOT // ITEM SLOT 2 // CYCLE | true |
| DEPLOY TEAM | DEPLOY TEAM >> | DEPLOY TEAM // STRIKE TEAM 04 | true |
| RECRUIT (empty roster) | RECRUIT >> | RECRUIT // OPEN THE RECRUITMENT MARKET | true |
| AUTHORIZE PROJECT | AUTHORIZE PROJECT | AUTHORIZE PROJECT // ADVANCED PROPELLANTS // COMMITS 16,000 CR // 2H IN BALLISTICS LAB | true |
| RESET ALL | RESET ALL | RESET ALL // EVERY CONTROL TO ITS DEFAULT KEY | true |
| AUTO | AUTO | AUTO // RENDER QUALITY auto | true |
| HIGH | HIGH | HIGH // RENDER QUALITY high | true |
| MED | MED | MED // RENDER QUALITY medium | true |
| LOW | LOW | LOW // RENDER QUALITY low | true |
| EXPORT JSON | EXPORT JSON | EXPORT JSON // THE TELEMETRY RECORDS | true |
| OPEN RESEARCH | OPEN RESEARCH | OPEN RESEARCH // THE RESEARCH TAB | true |
| UNDERSTOOD (research prompt) | UNDERSTOOD | UNDERSTOOD // DISMISS THE RESEARCH PROMPT | true |
| BALANCE DATA | BALANCE DATA | BALANCE DATA // OPEN THE DASHBOARD OVER THE LOCAL MISSION LOG | true |
| SKIP TUTORIAL | SKIP TUTORIAL | SKIP TUTORIAL // SKIP THE WHOLE TUTORIAL | true |

## Notes

1. **R3 script defect (not an app defect).** The R3 run on this clean server ends `FAILED 1` on `FAIL Debrief research note shows on the first Debrief // no note`. Cause, from `focus.mjs` step 4: it removes `hint-debrief-research` from `seen`, then `SURFACES.debrief()` → `team()` → `fresh()` marks it seen again. IF-038-08's fallback did the un-mark after `team()` and before the outcome, and the note showed (OPEN RESEARCH and UNDERSTOOD both found). IF-038-13 step 3 (`ALL PASS`) is therefore not met, but the case's Pass Criteria are. The script needs fixing (owner of `focus.mjs`); not filed as a bug.
2. **R2 debrief label-in-name 0 is vacuous for OPEN RESEARCH / UNDERSTOOD.** Same cause as Note 1 (R2 `fresh()` marks the research note seen). The fallback in IF-038-08 covers it. R2's debrief fixture also renders no BALANCE DATA (no telemetry record); IF-038-09 covers it.
3. **Brief at 125 (IF-038-17).** In `brief-125.png`, a partly hidden glyph shows under the top edge of the TARGET BUILDING callout at about x 880, y 212. `brief-followup.log` lists every DOM text box in `.mb-recon-labels` at 125. None is at that spot: the readouts end at y 209 and the callout starts at y 221. So the glyph is scene art (canvas), not a positioned text box. The R2 overlap rule does not cover canvas content. This is an observation, not an AC failure.
4. **IF-038-23.** The case's step 1 calls `markWriteFailed('quota')` directly. Per the run instruction, the notice was triggered instead through `save.writeSave()` with a `setItem` that throws `QuotaExceededError`. The status reached `write-failed` / `quota` through `classifyWriteFailure`, the same end state. On World / Research the notice cleared through the app's own path (the next successful `writeSave()` → `filed`). On the card variant it cleared through `reset()`, as the case says.
5. RESET ALL is disabled at default bindings. The R2 rule still measures it (`disabled: true`, visible), as the case expects.
6. Hand-walk page errors: `[]` (`handwalk.json` → `errors`).

## Verdict

**PASS WITH NOTES**

- AC-1: PASS (IF-038-01 .. -12; R2 10/10 and R4 12/12 at `label-in-name: 0`; 19 of 19 listed control instances start with their visible label)
- AC-2: PASS (IF-038-13 .. -16)
- AC-3: PASS (IF-038-17 .. -24)

Notes 1–3 are harness or observation items. None is an AC failure. Note 1 (R3 step 4 ordering) should go to the owner of `focus.mjs`.
