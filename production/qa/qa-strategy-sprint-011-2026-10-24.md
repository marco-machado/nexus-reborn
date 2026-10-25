# QA Strategy: Sprint 11 (Phase 2 of /team-qa)
**Date**: 2026-10-24
**Author**: qa-lead
**Sprint**: 11, 24 stories, all `done` in `production/sprint-status.yaml`
**Base documents**: `production/qa/qa-plan-sprint-011-2026-10-23.md` (20 stories), `production/qa/smoke-2026-10-24-sprint-011.md`, `production/qa/evidence/sprint-011/README.md`, `production/qa/evidence/screens-2026-10-23/README.md`
**Config**: `qa.level` full, rigor full, studio. Tests are a hard gate for Logic and Integration; UI needs a retained screenshot per screen touched.
**HEAD**: `131a5c1` (docs only on top of `ca6d51e`). `git log -- src` shows the last `src/` change is `ab9935c` (perf hook in `src/main.tsx`, `src/perfHooks.ts`).

---

## 1. Headline finding: the sprint evidence predates HEAD's `src/`

The World Network probe output (`sprint-011/probe-output.txt`, 152 PASS) was last committed in `ad176af` (2026-10-23 04:02). The every-surface sweep (`screens-2026-10-23/sweep-output.txt`) and `focus-output.txt` date from `d40bff5` to `ad176af`. Commit `2c73542` (2026-10-23 10:37, playtest 3 and 4 fixes) then changed 37 `src/` files after `ad176af`, including ones these probes measure:

- `src/ui/ui.css`, `src/ui/WorldMap.tsx`, `src/ui/worldChrome.ts`, `src/ui/worldOnboard.ts` (HELD BY row; orientation card copy changed)
- `src/ui/index.tsx` (Brief, Assembly, Debrief), `src/ui/Hud.tsx`, `src/ui/Minimap.tsx`, `src/ui/Settings.tsx`, `src/ui/abortArm.ts`

The probe README also states its build as "working tree on top of `bb17de2`", not the final sprint build. The QA plan's Definition of Done requires screen-wide checks "re-run on the final build" with the README naming the commit. **That item is open.** The 152 PASS and the sweep zeros are valid for `ad176af`, not demonstrated for HEAD. The smoke report passed its 8 items at HEAD, but those are launch and path checks, not the measured floors.

`2c73542` also records one unresolved item in IF-036's territory: "World Network 0 when measured alone but 14 low-contrast hits when measured first in a batch (orientation card mid fade), unresolved. Menu, Research and Settings not re-swept." This needs a settled-state re-run before IF-036 AC-1 can be called passing at HEAD.

**Consequence for the table below:** every UI story's evidence is classed "Evidenced at `ad176af`; fresh run needed at HEAD", and the cheapest way to refresh nearly all of it is three scripted runs (section 4), not hand-walking.

---

## 2. Story table

Type column: IF-016..035 are as classified in the QA plan (19 UI, IF-019 Integration). IF-036, IF-037, IF-038 and TM-018 are classified here from their story files and match their headers.

| Story | Type | Automated Required | Manual Required | Blocker? |
|---|---|---|---|---|
| IF-016 Failed-campaign banner copy | UI | None (rg check is in the probe) | Re-run probe on HEAD; failed + completed captures | No |
| IF-017 Failed rows read CAMPAIGN LOST | UI | `lockReason` unit test exists in `src/ui/worldChrome.test.ts` (supporting) | Re-run probe; smoke item 5 already passed at HEAD | No |
| IF-018 Card not aria-modal | UI | None | Re-run probe (DOM + Tab/Shift+Tab/Esc); one hand-walk | No (advisory: no per-story capture beyond `state-opening-card.png`) |
| IF-019 Clock dismisses card | Integration | `src/ui/worldOnboard.test.ts`, `clockUse` describe, present and green in the 1664 | Probe clicks the five controls under the card in a browser (re-run) | No |
| IF-020 Garrison notice tone | UI | None | Re-run probe; grayscale capture exists for STRAINED only | No (guard gap, section 5) |
| IF-021 Unrest ink and bar | UI | `unrestTone` unit test exists (supporting) | Re-run probe (5 Unrest states) | No |
| IF-022 Empty Feed token | UI | None | Re-run probe | No |
| IF-023 Left INFLUENCE removed | UI | None | Re-run probe; award-on-return half of AC-2 from smoke item 4 | No |
| IF-024 RESOURCE POOL to INTEL | UI | None | Re-run probe (4 scales, level-up) | No |
| IF-025 Influence effect line | UI | None | Re-run probe (5 action states x 4 scales) | No |
| IF-026 Type size floors | UI | None | Re-run probe on HEAD (screen-wide, must be final build); 125% on four Screens | **Yes until re-run on HEAD** |
| IF-027 Ink Dim to Ink | UI | None | Re-run probe; "other Screens unchanged" is superseded by IF-036 (all Screens moved to Ink), see section 5 | **Yes until re-run on HEAD** |
| IF-028 Ink Faint off text | UI | None | Re-run probe | **Yes until re-run on HEAD** |
| IF-029 Locked rows | UI | `lockReason` unit test (supporting) | Re-run probe; grayscale capture exists | No |
| IF-030 Nav idle 4.5:1 | UI | None | Re-run probe (4 Screens x 2 modes); commit-message cause check | No |
| IF-031 Feed rows 24 px | UI | None | Re-run probe | No |
| IF-032 Timeline 24 px | UI | None (keyboard scrub covered by existing Timeline tests) | Re-run probe; **hand-walk a real mouse drag** (README: hit-testing only) | No (advisory) |
| IF-033 Speed buttons 24x24 | UI | None | Re-run probe | No |
| IF-034 Inset steppers 24x24 | UI | None | Re-run probe; activation by click/Enter/Space | No |
| IF-035 Remaining targets 24x24 | UI | None | Re-run probe; screen-wide, final build | **Yes until re-run on HEAD** |
| IF-036 Every surface meets Standard-tier floors | UI | None | Re-run `screens-2026-10-23/sweep.mjs` on HEAD (8 surfaces + Balance, x 4 scales + HC) | **Yes until re-run on HEAD** (also the unresolved 14-hit batch finding) |
| IF-037 Committed-tier deltas | UI | None (focus trap is DOM-only; vitest has no jsdom) | Re-run `sweep.mjs` (ellipsis, text overlap) and `focus.mjs` (13 checks) on HEAD | **Yes until re-run on HEAD** |
| IF-038 Spec-review findings | UI | None | Re-run `sweep.mjs` (label-in-name, box overlap) and `focus.mjs` (16 checks per story; 17 lines in the output) on HEAD | **Yes until re-run on HEAD** |
| TM-018 Playtest 2 mission fixes | Logic | `src/game/world.test.ts` lines 1594 and 1618 (free fire works a device; Hold Fire keeps it off). Present. | AC-2 (dead core hidden) and AC-3 (blast ring, tutorial copy) have no retained evidence | **Yes for AC-2/AC-3 evidence (see section 5)**; AC-1 is covered |

Counts: 20 plan stories + 3 UI + 1 Logic = 24. By type: 22 UI, 1 Integration, 1 Logic.

**Blocker definition used here:** "Blocker" means the story cannot be signed off in phase 3 without the named action. It is not a defect in the shipped behaviour; nothing here says a floor is failing at HEAD, only that it has not been measured at HEAD.

---

## 3. Gate lines

**Smoke**: `production/qa/smoke-2026-10-24-sprint-011.md` verdict **PASS**: 1664/1664 tests (67 files), lint PASS, build PASS, 8 manual items PASS at `ca6d51e`. One test run only; the plan's three-consecutive-runs requirement is still due at sign-off (phase 3). Smoke satisfies the pre-QA gate; it does not substitute for the floors re-run in section 4.

**Open bugs in scope**: BUG-0008, S3-Medium, Audio, Open (strategy music restarts before the clip ends; trigger not isolated; owner deferred to Polish). BUG-0001..0007 and BUG-0009 Closed. At `workflow: full` an open S3 fails the release checklist's bug row, so BUG-0008 does not block sprint sign-off but must be carried as a named condition. It is not exercised by any Sprint 11 story. One non-bug open item from the smoke report: Assembly stat tile `MOBILITY` breaks mid-word at 100/110/125% (`design/ux/assembly.md` Open Question 15, owner's call, cause `src/ui/ui.css:2471`). That is IF-036 AC-2's territory ("nothing clips, truncates, spills"); the sweep reports 0 clips, so either the check does not catch a mid-word break or Open Question 15 is an accepted exception. Decide which before sign-off (see CONCERNS).

---

## 4. Re-run plan on HEAD (what scripts cover what)

All headless Chrome for Testing at exactly 1280x720 against `npm run dev` on port 4200. No headed window is needed for any of these, so none competes with the owner's work. Stop the dev server and confirm port 4200 is free afterwards.

| Run | Command shape | Covers | Replaces hand-walking? |
|---|---|---|---|
| **R1** `production/qa/evidence/sprint-011/probe.mjs` | `PROBE_OUT=<new dir>/ node probe.mjs` (env `PROBE_URL`, `PROBE_CHROME` override defaults) | IF-016..035 (all 152 checks) on HEAD; also IF-038 note "World Network probe ALL PASS" | Yes for everything except the items in section 5 |
| **R2** `production/qa/evidence/screens-2026-10-23/sweep.mjs` | same harness | IF-036 AC-1/AC-2, IF-037 AC-1, IF-038 AC-1/AC-3 on Menu, Settings, Research, Brief, Assembly, Debrief, Mission HUD, Pause, Balance, World; four scales + HC | Yes |
| **R3** `production/qa/evidence/screens-2026-10-23/focus.mjs` | same harness | IF-037 AC-2/AC-3 (focus trap/restore, reduced motion, check glyph), IF-038 AC-2 (Debrief Balance Escape, invoice region) | Yes |
| **R4** `production/qa/evidence/playtest-fixes-2026-10-23/sweep.mjs` | same harness | Brief, Assembly, Debrief, Debrief with KIA, Mission HUD, hold, Pause at HEAD's HUD/Brief changes (post-`2c73542` surfaces); its own run left Menu, Research, Settings unswept | Yes, as a supplement to R2 |

**Run order and conditions:**
1. Run R1 first. Wait for the orientation card fade to finish before measuring (the unresolved 14-hit finding was "measured first in a batch, card mid fade"). If R1 or R2 reports low-contrast hits on World Network, re-run that surface alone and record both results; do not average them away.
2. Write each run to a new dated folder (`production/qa/evidence/sprint-011-head-2026-10-24/`), never over the committed outputs. Each folder's README names the HEAD commit and states "final sprint build".
3. A fresh run must report ALL PASS with zero console or page errors. A FAIL is a finding to file with `/bug-report`, not a reason to edit the script.
4. The scripts were "watched failing" at their original authoring. Do not repeat that; re-running unchanged scripts on a changed build is the point.

**Why scripts rather than hand-walking for these:** every measured criterion here (font size, composited ratio, rect size, clip) is a number. A human reading a screenshot is strictly weaker than the script, and the plan already settled on the shared probe as the gate.

---

## 5. Flagged missing ACs and evidence

| # | Item | Class | Action |
|---|---|---|---|
| F1 | Evidence is at `ad176af`; HEAD `src/` has 37 further changed files incl. `ui.css`, `WorldMap.tsx`, `worldChrome.ts`, `worldOnboard.ts` | BLOCKING for IF-026/027/028/035/036/037/038 sign-off | Run R1-R4 on HEAD |
| F2 | World Network sweep "14 low-contrast hits when measured first in a batch (orientation card mid fade), unresolved" (`2c73542` message) | BLOCKING for IF-036 AC-1 | R1/R2 with the card settled and again with it mid-fade; if the mid-fade hits are real (card text below 4.5:1 during the fade), file a bug; if they are a measurement artefact, state that in the README |
| F3 | TM-018 AC-2 (destroyed device core hidden) and AC-3 (red blast ring follows the pointer; tutorial copy) cite "harness capture ... smoke", but no named capture exists. `ca6d51e` gitignored playtest screenshots, and `production/qa/playtests/harness/` holds only scripts. `src/game/tutorial.test.ts` has no assertion on the MOVEMENT/ITEMS copy (grep for pan/zoom/recenter/grenade/blast found none). AC-2 and the ring are Visual/Feel in nature | BLOCKING (screenshot + lead sign-off for the Visual/Feel parts) | Section 6, TM-018 cases C1-C3; optionally ask lead-programmer for a tutorial-copy unit test (cheap: keys come through `BINDINGS`) |
| F4 | TM-018 AC-1: "an optional destroy's device is never auto-targeted" is asserted only indirectly by the existing Rust Haven test, not by a named test | ADVISORY | Note in sign-off; offer qa-tester a dedicated test request to lead-programmer |
| F5 | IF-020 AC-2 asks for the grayscale Garrison in all three states; only `if-020-grayscale-strained.png` exists | Advisory gap | Hand-walk H3 |
| F6 | IF-023 AC-2: spend half covered by probe ("header debits in the frame the action turns ACTIVE"); award-on-Debrief-return covered by smoke item 4 at HEAD (0 to 8 PTS) but not in a retained capture | Advisory | Accept smoke item 4 as the record, or take one capture in H4 |
| F7 | IF-030 AC-2 pass condition includes "the cause of the as-built non-remap is written in the commit message" | Advisory, verifiable by reading | `git show 05c7bd7`; a grep for "high contrast / remap / cause" returned only an unrelated line (a banner-copy line). The cause is not visibly in that commit's message. Check the Sprint 11 story commit for IF-030 specifically or record it as not found |
| F8 | IF-027 AC-2 says "Research, Brief, Assembly text colours unchanged". IF-036 then moved Ink Dim to Ink on all of those, so the unchanged-colour guard is superseded | Spec conflict, ADVISORY | Record IF-027 AC-2 as superseded by IF-036 (owner ruling 2026-10-23, `production/session-logs/decision-log.md`); verify only that `--ink-dim` is still unchanged in both palette files |
| F9 | IF-032 AC-1 (scrub from +-11 px) measured by hit-testing, not a real pointer drag (README "Not exercised") | Advisory | H2 |
| F10 | IF-018, IF-027, IF-028, IF-032, IF-033, IF-034 have no capture named for them beyond shared state captures and `if-031-035-targets.png` | Advisory (the UI gate's screenshot is satisfied by the state captures of the screen touched) | README mapping in the fresh run should name the shared captures |
| F11 | Scope drift: commit `2c73542` shipped TM-019 (hold), TM-020 (objective markers, Visual/Feel), TM-021, IF-039, WN-020/021/022, all stories marked Complete, none in `production/sprint-status.yaml`'s 24. They changed the same surfaces (HUD, Brief, Assembly, Debrief, World Network HELD BY row, orientation card) | CONCERN for the caller | Not classified or planned here (not in scope as given). Their changes are inside the R1-R4 runs' reach but their own ACs are not tested by them |
| F12 | Carried from Sprint 10 (QA condition 4): four Brief cases still unchecked in the plan | BLOCKING per the carried condition | H5-H8 below |
| F13 | `npm test` three consecutive runs not yet done (smoke ran once) | Process | Phase 3 |
| F14 | Untestable wording: none found. Every AC across the four added stories is a measurable threshold or an observable state, except TM-018 AC-2 "does not read as live from the play camera", which is a judgement call. Proposed measurable rewrite for the owner to confirm: "the destroyed device's mesh has the core `visible === false` (or emissive intensity 0) in the next rendered frame, and a 1280x720 capture from the default play camera shows no emissive glow at its position" | Advisory | Owner to confirm the rewrite |

---

## 6. Manual cases per story

Legend: **E** = evidenced at `ad176af` by the probe output (stale vs HEAD; refresh by R1). **F** = fresh hand-walk needed (not in any probe). Where only R-runs are listed, no hand-walk is required.

### IF-016 to IF-035 (World Network, probe-covered)

| Story | Case | Where it runs | Status |
|---|---|---|---|
| IF-016 | Failed campaign: banner line `ROSTER EMPTY // NO CONTRACT CAN BE TAKEN`; `rg "NETWORK COMMAND SUSPENDED" src` empty; completed campaign banner unchanged | R1 | E, refresh via R1. Smoke item 5 also passed at HEAD for the failed banner |
| IF-017 | Failed rows read and `aria-label` CAMPAIGN LOST; click stays on World Network; non-failed locked rows `REQUIRES INTEL LVL n` | R1 | E, R1. Smoke item 5 passed at HEAD |
| IF-018 | No `aria-modal`; `UNDERSTOOD` initial focus; Tab to nav, Shift+Tab back, Esc keeps the card | R1 | E, R1 |
| IF-019 | Unit: `worldOnboard.test.ts` `clockUse`. Browser: Pause, 1X, 2X, 4X, 8X clicked under the card each apply and dismiss; Feed row click leaves the card up | npm test + R1 | Unit covered at HEAD (1664 green); browser E, R1 |
| IF-020 | Control 55/54/35/34: SECURE teal, STRAINED Print White, CRITICAL Red Hot; no `amber`; Credits amber; grayscale of all three | R1 + **H3** | States E; grayscale for SECURE and CRITICAL **F** |
| IF-021 | Unrest 50/60 Ink, 61 notice, crisis 80 and 40 Red Hot, bar tone, pressure chip on row only | R1 | E, R1 |
| IF-022 | Empty: `-- CHANNEL OPEN --`, not clipped at 125; with events token absent; `NO TRAFFIC` absent from src | R1 | E, R1 |
| IF-023 | Left column SECTORS only; header Influence; header debit same frame as ACTIVE; award on return | R1 + smoke 4 | Spend E, R1; award covered by smoke item 4 at HEAD |
| IF-024 | INTEL `LEVEL n PROGRESS n / 100`; level-up wraps; four scales | R1 | E, R1 |
| IF-025 | Effect text under each button, five states x four scales, no overlap with status word | R1 | E, R1 |
| IF-026 | >=10 px every run, >=12 px readouts, 11 states; four-scale clip; four Screens at 125 | R1 | E, R1 on HEAD (BLOCKING refresh) |
| IF-027 | No Ink Dim text; >=4.5:1 as rendered, 11 states; `--ink-dim` unchanged in `src/index.css` and `src/ui/tokens.ts` | R1 + `rg` | State sweep E; palette-file check **F** (one command) |
| IF-028 | No Ink Faint text; Feed times and axis labels >=4.5:1; NOW teal | R1 | E, R1 |
| IF-029 | Locked rows alpha 1, >=4.5:1, Red Hot reason, frame differs, glyph, `aria-disabled`, default + HC; grayscale locked vs open | R1 | E (capture `if-029-grayscale-locked-vs-open.png`), R1 |
| IF-030 | Idle nav >=4.5:1; one `aria-current="page"`; colour changes under HC; four Screens | R1 | E, R1; commit-message cause check **F** (F7) |
| IF-031 | Feed rows >=24 px, no overlap | R1 | E, R1 |
| IF-032 | Hit area >=24 px; hits at +-11 px; transport centres hit their buttons | R1 + **H2** | Hit-test E; real drag **F** |
| IF-033 | 1X-8X >=24x24, `aria-pressed` intact | R1 | E, R1 |
| IF-034 | Steppers >=24x24; skip Antarctica on click/Enter/Space; absent under Influence note | R1 | Size and absence E; activation by keyboard: confirm the probe asserts it, otherwise **F** (**H2b**) |
| IF-035 | Every listed target >=24x24; `FEED CLEAR` N/A; four nav tabs; `UNDERSTOOD` x2 | R1 | E, R1 on HEAD (BLOCKING refresh) |

### IF-036, IF-037, IF-038 (every surface)

| Story | Case | Where | Status |
|---|---|---|---|
| IF-036 AC-1 | Per surface (Menu, Settings, Research, Brief, Assembly, Debrief, Mission HUD, Pause): `<10 px`, `<4.5:1` default and HC, Ink Dim text, SVG text, `targets <24` all 0; exemptions = inactive controls only (Settings RESET/RESET ALL at defaults, minimap zoom at limit) | R2 | E at `ad176af` (all 0); **F on HEAD** |
| IF-036 AC-2 | `clip @90/100/110/125` all 0 per surface | R2 + R4 | E; **F on HEAD**. Include the Assembly `MOBILITY` mid-word break question (section 3) |
| IF-037 AC-1 | No ellipsis cutting text, no text line over another, no sideways scroll; Research labels at 125 | R2 | E; **F on HEAD** |
| IF-037 AC-2 | Focus enters Settings-from-Pause, Balance, Recruitment Market; Tab stays inside; Escape closes the market; focus returns to SETTINGS / OPEN / RECRUIT; Debrief UNDERSTOOD to RETURN TO WORLD NETWORK | R3 (13 checks) | E ALL PASS; **F on HEAD** |
| IF-037 AC-3 | Reduced motion: overlay no fade; Research done node check glyph; Settings segment framed 2 px teal; Debrief rows <=120 ms fade | R3 | E; **F on HEAD** |
| IF-038 AC-1 | Label-in-name for UNDERSTOOD x3, `n UNREAD`, RECRUIT x2, Item slots, DEPLOY TEAM, OPEN RESEARCH, BALANCE DATA, AUTHORIZE PROJECT, RESET ALL, Quality segments, EXPORT JSON, SKIP TUTORIAL | R2 `label-in-name` | E; **F on HEAD** |
| IF-038 AC-2 | Debrief Balance: Escape closes, focus to BALANCE DATA; invoice is region `Mission invoice` with fade; CAMPAIGN FAILED banner `role="status"` | R3 (16 checks) | Escape and region E; confirm the probe asserts `role="status"` on the failed banner, else **F** (**H9**) |
| IF-038 AC-3 | No positioned box covers another at four scales: Brief recon column, World Network inset tag clears steppers, HUD toasts clear weapons bar, comms panel width at <=1360 px; write-failure notice Red Hot on red frame | R2 `boxoverlap` + R4 | E; **F on HEAD**. The <=1360 px comms case and the write-failure notice colour are not shown to be in the sweep; treat as **H10** |

### TM-018 (Logic)

| Case | Where | Status |
|---|---|---|
| AC-1: free fire takes down an active required objective device when no hostile in sight; Hold Fire does not; Attack on a Device remains a no-op (AC 5d) | `src/game/world.test.ts` 1594, 1618; AC 5d existing test; `npm test` | Covered. Run at HEAD: 1664/1664 includes them. Optional: mutation check (remove `nearestObjectiveDevice` fallback, confirm the first test fails) is already recorded in the story |
| **C1** AC-2: destroyed relay's emissive core hidden | Hand-walk/harness at 1280x720: deploy Rust Haven via `production/qa/playtests/harness/play.mjs`, destroy a relay, capture the relay before and after from the default camera | **F**; retained screenshot + lead-programmer sign-off in `production/qa/evidence/tm-018/` |
| **C2** AC-3a: grenade arming shows a Red Hot ring of radius 3.5 m following the pointer | Same session: arm grenade (key via `BINDINGS`), move the pointer on the ground, capture two pointer positions; measure the ring radius against `GRENADE_RADIUS` using the 3.5 m scale of a known tile/unit | **F**, retained screenshots |
| **C3** AC-3b: tutorial MOVEMENT step names pan keys, wheel zoom, recenter key; ITEMS step names the grenade key and "everyone inside the ring, the squad included" | Read from the tutorial toast in a new campaign mission, compare to `src/game/tutorial.ts` and remapped keys; note `2c73542` also added a one-shot BLAST RADIUS hint (TM-021) and changed the first step to teach the hold key, so verify the toast set as built, not the story's wording | **F**, capture each toast |

### Carried from Sprint 10 (Brief; all F; none are story ACs)

| Case | How | Status |
|---|---|---|
| **H5** Tactical-map stats rail bottom row readable at 90/100/110/125 for the three authored contracts (not only m03 at 125) | Headless, open Brief for each authored contract at each scale, scroll `mb-tac-rail` to the end, capture. R4/R2 Brief sweep covers Rust Haven only | **F**: 3 contracts x 4 scales = 12 captures |
| **H6** Reclient or Expedite between Brief and deploy: KIT lines and objectives equal the deployed mission | Walk: accept, Reclient/Expedite, return to Brief, compare KIT lines and objectives, deploy, compare to the Mission HUD | **F**, walked, not only `kitLine.test.ts` |
| **H7** A MODERATE generated contract's Brief at the four scales (threat box, KIT lines, no clipping) | Open the seeded Moderate offer in Europe at 4 scales; run the R2 clip pass for this Brief state | **F** |
| **H8** One resolution other than 1280x720 (1920x1080) for the Brief | Re-run the Brief portion with viewport 1920x1080 | **F** |

Note for H5-H8: `2c73542` changed Brief (real collateral rule line, days a win spends, QUATERNARY, Abort confirm) after Sprint 10's condition was written. Walk H5-H8 on HEAD; the new Brief lines make the threat box and KIT region longer than when the conditions were set.

### Hand-walk addenda

- **H2** IF-032 real drag: Playwright `page.mouse` down/move/up on the Timeline track from +-11 px off the drawn 12 px track; confirm the scrub value changes. **H2b** IF-034: Enter and Space on a focused stepper in addition to the click.
- **H3** IF-020 grayscale: `filter: grayscale(1)` on the page for all three Garrison states; words `SECURE` / `STRAINED` / `CRITICAL` legible; Credits computed `rgb(255, 208, 117)`.
- **H4** IF-023 award: one capture of the header on the first frame after the clean-win Debrief return (optional; smoke item 4 records 0 to 8 PTS).
- **H9** IF-038: read `role="status"` on the CAMPAIGN FAILED banner in the failed-campaign fixture.
- **H10** IF-038 AC-3 tails: HUD comms panel width at a 1360 px and a 1280 px viewport at 125% text; trigger the screen write-failure notice and measure its ink against Red Hot.

---

## 7. Estimated manual sessions

A session is one qa-tester run of up to about 2 hours including setup and teardown.

| Session | Content | Est. |
|---|---|---|
| S1 | R1 on HEAD (probe), settled and mid-fade variants for F2; README naming HEAD | 0.5 session |
| S2 | R2, R3, R4 on HEAD; triage failures | 0.75 session |
| S3 | World Network hand-walks H2, H2b, H3, H4, H9, H10, palette-file `rg`, IF-030 commit-message check | 0.5 session |
| S4 | TM-018 C1, C2, C3 in the harness (WebGL mission scene, headless Chrome for Testing) + lead sign-off | 0.5 session |
| S5 | Carried Brief cases H5-H8 | 1 session |
| | **Total** | **~3.25 sessions (4 if any R-run fails and needs a re-run)** |

No playtest sessions are required (plan, unchanged). The owner's EC-023 winnability playtest (due 2026-10-28) stays advisory.

---

## 8. Sign-off conditions for phase 3

1. R1-R4 re-run on HEAD with dated evidence folder and README naming the commit; ALL PASS, or each FAIL filed as a bug.
2. F2 resolved or filed.
3. TM-018 C1-C3 captured and signed off by lead-programmer.
4. H5-H8 (carried condition 4) walked on HEAD.
5. Three consecutive `npm test` runs, lint and build green at sign-off.
6. BUG-0008 carried as an open S3 (Polish).
7. Decision on F8 (IF-027 AC-2 superseded) and on the `MOBILITY` break vs Open Question 15.
8. Owner informed of F11 (stories outside the sprint's 24 that changed the same surfaces).
