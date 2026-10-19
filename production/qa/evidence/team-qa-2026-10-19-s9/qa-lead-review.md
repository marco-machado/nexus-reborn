# QA Lead Review: /team-qa Phase 5 (manual QA), Sprint 9

- Date: 2026-10-19
- Build: `main` at `0dcb87c`. The tree is clean apart from new QA files.
- Settings: qa.level standard, autonomous mode.
- Reviewer: qa-lead.
- Inputs:
  - Results verified from the transcripts by the orchestrator. Nothing was re-run for this review.
  - The captures listed per story, opened and viewed in this review.
  - `docs/click-through.md`.
  - `production/qa/evidence/if-001/README.md`.
  - The story files for IF-001, 003, 004, 005, 007, 008, 010 and 012.
  - `design/gdd/interface.md`.
  - `production/qa/bugs/BUG-0001.md`.
  - `src/game/missionParams.ts:69-75` and `src/game/data.ts:139-143`.
  - `src/ui/worldChrome.test.ts:137-140`.

Smoke prerequisite: `production/qa/smoke-2026-10-19-sprint-009.md` PASS. There have been 0 `src/` commits since that record.

## UI sign-offs

Paths are relative to `production/qa/evidence/`: `smoke/` = `smoke-2026-10-19/` and `s9/` = `team-qa-2026-10-19-s9/`.

| Story | Decision | Captures viewed | Notes |
|---|---|---|---|
| IF-001 | **NOT SIGNED**, because AC20's record is incomplete (see the AC20 check). AC1 visual review: pass. | `smoke/if-001/` at 125%: `menu`, `world-network`, `research`, `brief`, `assembly`, `mission-hud`, `mission-hud-…-slot4`, `pause`, `pause-settings`, `settings`, `debrief` (all `-1280x720-scale125.png`). | **90/100/110% were covered by the automated sweep only** (`sweep-result.json`, 40/40 `ok`). I did not open those captures. At 125%: no clipped or overlapping text on the 10 surfaces. In slot 4 the KESTREL card and the `PRIMARY // KESTREL` header fit. The tutorial toast covers the top of the PRIMARY weapon panel on the Mission HUD; toasts are a declared overlay. Some rows are cut at a scroll container's own edge: Brief stats ROUTE OMEGA, the Assembly roster at VEX and the augmentations list, the Settings DIFFICULTY row and Controls list, and the Debrief OPTIONAL BONUS row. R2 accepts these. The R7 bug is linked. **This signs once the README amendment lands. No re-run is needed.** |
| IF-003 | **SIGNED WITH NOTES** | `s9/if-003/03`, `05`, `07` | 03: DEPLOY is disabled with the visible text `SELECT A CONTRACT ON THE WORLD NETWORK`. The nav reads `BRIEF LOCKED / NO CONTRACT SELECTED`. 05: Glass Veil, District 07, live, MARA/GHOST/DART/TORQ. 07: Replay lands on the Glass Veil Brief, with the clock at 2087.05.16 and 132,619 CR. Note: the replay Brief shows CITY BLOCKS 31, CIVILIANS 28 and PATROL CONTACTS 09, against 29/22/08 on the first Brief (`capture-output.txt:10`). This matches `missionVariant(m, true)`, which picks the other authored layout (`missionParams.ts:71-75`). The AC5 table covers the first deployment only (R8). |
| IF-004 | **SIGNED WITH NOTES** | `s9/if-004/01`, `07`, `11` | 01: the three teaching strings are present (THE JOB Nexus-held Tax, STRATEGIC TIME, INFLUENCE unaffordable-not-broken). 07: `REVIEW -7.7H > GO LIVE`, with North America Control 69% / Unrest 10% and TAX YIELD 4,140 CR / 24H. This matches transcript line 16 ("after run"). The `-6.0H` cue is line 13, the paused read taken before the run. 11: `RISK INDEX 89 // SEVERE`, with no percent and no cap label. Two rows are cut at their scroll edge: CIVILIANS on 11 and North America in the scrolled SECTORS list on 07 (R2). SECTOR LOCKED: see R1. |
| IF-005 | **NOT SIGNED**, because the AC19 focus return fails for Settings opened from the Menu (R4). | `smoke/if-005/01`, `03`, `07`, plus `s9/if-005/probe-01` | 01: AUTHORIZE is disabled, with `INSUFFICIENT CREDITS // 1 CR SHORT` at 15,999 CR against 16,000 funding. 03: the badge reads `IN PROGRESS`, with PROGRESS 1%, 1:59:09 remaining and the Ballistics Lab occupied. Running reads 1/3, and Authorize is disabled with `RUNNING IN BALLISTICS LAB` (R3 accepts this). 07: the focus ring is on RESUME after nested Settings, so AC18 passes. probe-01: the Menu after Settings closes shows no focus ring on any control. `probe-output.txt` reports `FAILS: 2`. The captures themselves are clean. **This re-signs after the R4 fix and a `probe.mjs` re-run.** |
| IF-006 | **SIGNED WITH NOTES** | `s9/if-006/probe-06`, `probe-09a`, `probe-09b` | probe-06: after New Operation, the orientation card shows again at the seeded 125% (the tutorial reset). Its RESEARCH row is cut at the card's scroll edge (R2). probe-09a: TELEMETRY OFF, BALANCE DATA OPEN, HARDENED, LOW and 125%, with HOLD POSITION remapped to J. With the Settings body scrolled down to DATA, the right Controls column shows 4 rows and then blank space down to the footer. That is a layout observation; nothing is clipped. probe-09b: Balance is open while recording is off, with 1/60 records, MISSIONS 1 and ABORTS 1. That is the TC-09 fixture, separate from TC-07's 3 records. Cosmetic: at 125% the MEAN FIRST CONTACT placeholder value breaks onto two lines. Balance is not one of AC1's surfaces. This is an S4-Low / P3-Backlog candidate. |
| IF-007 | **SIGNED WITH NOTES** | `s9/if-007/probe-01`/`01s`, `02`/`02s`, `03`/`03s`, `probe-06-reduced-motion-a`/`-b` | At each zoom, Hardened and Standard show the same layout, objective marker, squad ring and camera footprint. Hardened shows more red contacts, and nothing is stripped. Sight cones are not visible in any frame (Alert 0). Cones rest on the code read (the draw code never reads difficulty), not on a capture. Reduced motion: the ring is identical in frames a and b. See R5 and R6. |
| IF-010 | **SIGNED WITH NOTES** | `smoke/if-010/01`, `04`, `06a` | 01: `INVOICE UNFILED // COMMITS ON NEXT SCREEN`. 04: `SAVE FAILED // CAMPAIGN NOT FILED` on the World Network. It is not clipped and it sits over the globe imagery only. 06a: the notice covers orientation-card text. That is the R7 bug, and it is IF-001 AC1's concern, not this story's. AC22/AC23 are met. |
| IF-012 | **SIGNED** | `s9/if-012/01`, `04`, `probe-06` | 01: the Recruitment Market shows 3 candidates, each with `COST … // CREDITS 9,000 CR` and a disabled HIRE. The shortfalls read 15,500 / 19,000 / 13,500, and the arithmetic checks. 04: 430.1 KG of a 400.0 KG limit, HEAVY LOAD, DEPLOY disabled, `OFFLOAD 30.1 KG BEFORE DEPLOYMENT`. probe-06: the HUD on the second heavy deploy shows no advisory toast. The Recruitment Market is a modal over Assembly that is missing from AC1's declared-overlay list. That is a document gap only (see R7). |

## AC20 check (IF-001 TC-05)

I compared `production/qa/evidence/if-001/README.md` "Browser coverage" (lines 77-78) with `docs/click-through.md` steps 1-6 and "Audio changes".

**Missing from both the exercised list and the unexercised list:**

1. **Step 2, the World Network chrome wording checks:**
   - SECTORS, Scan (ORBITAL SCAN still up), OPEN CONTRACTS, CLOCK SPEED, Pause/Resume, TIMELINE, FEED, TIME CODE and Control key.
   - The absence of VIEW SECTOR INTEL, GAME SPEED and WORLD CLOCK.
   - The record lists only "header and nav-tab wording checks" and "Event forecast". Neither covers these chrome labels.
2. **Step 3, the Glass Veil Brief weather line:** "the brief weather line names the coming front and clock". The line appears in the Brief captures (for example the 125% Comms Log `WEATHER: HEAVY RAIN → LIGHT RAIN 22:16:38`), but the record names it nowhere.

Borderline items, implicitly under "focused-sector fields" and "header": "Opening North America tax yield is 4,080 CR / 24h" and "Influence is a point wallet (0 on a new operation)". Name them explicitly in the same edit.

Every other step and sub-check appears in one of the two lists.

**Result:** AC20 is not met as ticked. **Fix:** add items 1 and 2 to "Not exercised". Item 2 could instead go under "Exercised", citing the capture. This is a documentation edit, and IF-001 signs on it.

## Rulings

| # | Decision | Reason |
|---|---|---|
| R1 | **Accepted.** | `worldChrome.test.ts:137-140` asserts that `influenceStatus('locked-sector', …)` returns `SECTOR LOCKED` and that Antarctica offers no action. The UI captures show the other three reasons, plus Antarctica `NO SURVEY DATA` with 0 actions. The README records that the locked-sector state is unreachable in the UI, so a test of the owner-reason → label mapping is the strongest evidence available. Advisory to game-designer: if no sector can ever be locked in play, that clause of AC27 is dormant. |
| R2 | **Accepted.** | A partial row at a scroll container's own edge is the scroll viewport, not text "cut off by its container". The sweep stepped each such container: Assembly at 4 positions, Debrief at 2, and Brief `.mb-tac-rail` / `.mb-dossier-scroll`. The overflow is therefore reachable, which is what AC1 asks. Advisory to ux-designer: scroll cues are inconsistent. Brief stats shows a down chevron, but no capture shows a cue for the intel-2 Brief top edge or for Debrief `.db-rows` at 125%. |
| R3 | **Accepted.** | The GDD names the Research state "active", and the build labels it `IN PROGRESS` consistently in both the badge and the legend. Capture 03 shows a started project, not mere inspection: the badge changes from AVAILABLE, progress reads 1% with time remaining, the lab is occupied, running reads 1/3, and Authorize reads `RUNNING IN BALLISTICS LAB`. Exact copy belongs to UX. |
| R4 | **Defect.** The orchestrator files it. Proposed labels: **S3-Medium / P1-Fix this sprint**. | AC19 says focus "returns to the opening context", and GDD `interface.md` §14 says "Pause and Settings trap and **restore** focus". Restoring means returning focus to where it was before the dialog opened, and the build already does this for pause. The probe's own criterion was "focus returns to the opening control". The document body is not a place a keyboard user can act from. `probe-output.txt` reports focus on the body for both the Escape close and the CLOSE close. Labels: S3 because keyboard access is degraded but not lost. Whether Tab from the document start reaches the Menu buttons was **not verified**. P1 because it fails a ticked AC in a Complete story at qa.level standard. **Untick IF-005 AC19 until the fix is verified.** |
| R5 | **Outside the requirement.** | "Name current bindings" applies to steps that have a binding. The live binding table (pause capture) has no extract or directive action. Extraction completes by position through a move order, and toast 2 already teaches that with RIGHT CLICK. DIRECTIVES points to a panel. Optional for game-designer: add "right click" to the Extraction body. |
| R6 | **Accepted for QA. Document drift goes to game-designer.** | All 8 toasts AC13 requires are present and pass. The 9th (DIRECTIVES) meets the same constraints: it does not block, does not pause, and Skip marks it seen. AC13 and GDD rule 13 still list 8. Either write DIRECTIVES back into the GDD and AC13, or remove the toast. That is a design decision, not a defect. |
| R7 | **File a bug. Do not amend the list from QA.** Proposed labels: **S4-Low / P3-Backlog**. | As written, AC1 allows only Settings, Balance, pause and toasts to overlap, and the notice is not on that list. The implementation's own intent is also no overlap: the `ui.css:2705-2716` comment says the notice "covers no text on any of the four Screens". Capture 06a contradicts that, and IF-010 review advisory 1 had already flagged it. The labels are low because this happens only on a failed New Operation write and is a readability issue with no gameplay impact. Placement goes to ux-designer. If design instead declares the notice an overlay, amend AC1 and the GDD and close the bug as by-design. Separate document gap for game-designer: AC1's overlay list also omits the first-visit orientation card and the Recruitment Market modal. Both are visible overlays in this run's captures. |
| R8 | **Enough.** | The recorded seed 20870514 is both m01's contract seed and `variants[0].seed`, while `variants[1].seed` is 20870515 (`data.ts:139-143`). The seed therefore identifies the deployed layout, and `missionVariant(m, false)` picks index 0. Advisory: add an explicit variant row. Replay deploys `variants[1]` (see IF-003/07: 31/28/09 against 29/22/08) and is not compared. Add that to the follow-up test-tightening story the IF-003 review already recommends. |

## BUG-0001 labels

- **Severity: S3-Medium.** Confirmed. The freeze breaks on one input path only, Space on a focused range input in Settings opened from pause. Pause itself works, and there is no crash and no data loss. The bug can be avoided, so it is not S2.
- **Priority: P1-Fix this sprint.** Confirmed. It fails ticked AC11 of IF-008, a Complete story, at qa.level standard. The fix is small: a guard plus a regression test. **Untick IF-008 AC11 until the fix is verified.**
- **Workaround: yes, documented.** It is in the labels note under Summary: "change the volume with the pointer or the arrow keys". The note's other option, "press Space again to re-pause", is recovery after the fact, not a workaround: by then the sim has advanced and Settings has closed. The template has no workaround field, so the note is the right place.
- The regression list in Notes covers all five sliders and the existing exemption for buttons. No change is needed.

## AC boxes

| Story / AC | Decision | Basis |
|---|---|---|
| IF-007 AC10 | **Tick** | The probe compared Standard and Hardened at 3 zooms and found identical objective-pulse centres. Hardened counts are at least Standard's (28/17/17 against 22/15/15), and the draw code never reads difficulty. Three zooms exist, and dragging the view up moves the camera to screen-up (cos 1.000). Steering is shown by drag. The results given to me do not name a single-click steer separately. |
| IF-007 AC13 | **Tick** | 9 toasts show live keys, and the remap reads `J holds position`. Toasts do not pause the sim (t 6.96 to 8.18), and keyboard and canvas input land under them. SKIP marks every step seen. R5 and R6 cover the two open questions. |
| IF-007 AC14 | **Tick** | At the front the comm log prints `22:16:38 WEATHER FRONT. RAIN LIFTS. GUARD SIGHT INCREASED.`, and the chip changes from HEAVY RAIN to LIGHT RAIN. |
| IF-012 AC26 | **Tick** | The advisory appears once on the first heavy deploy (t 1.67) and does not appear on the second (capture at t 2.36). The over-limit deploy is refused with `OFFLOAD 30.1 KG BEFORE DEPLOYMENT` and never enters the mission. |
| IF-012 AC28 | **Tick** | The unaffordable fixture shows cost against Credits, a disabled HIRE and the shortfall reason. The full-roster fixture passed in the re-run. Clicks on the refusals start 0 audio sources, and none is required. |
| IF-005 AC19 | **Untick** (currently [x]) | R4 defect: Menu Settings close does not restore focus. |
| IF-008 AC11 | **Untick** (currently [x]) | BUG-0001. |
| IF-001 AC20 | **Untick** (currently [x]) until the README is amended | See the AC20 check. |

The story files were not edited. Whether IF-001, IF-005 and IF-008 keep their Complete status is a decision for the producer and orchestrator.
