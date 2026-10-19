# QA Strategy (re-run): Sprint 9 (Interface and Audio, final sprint), 2026-10-19

Phase 2 of `/team-qa`, re-run after the NOT APPROVED sign-off (`production/qa/qa-signoff-sprint-009-2026-10-19.md`). qa.level: standard. Automation: autonomous. Stage: Production.
Supersedes for this cycle: `production/qa/qa-strategy-sprint-009-2026-10-19.md` (still the source for the per-story detail and the signed evidence it lists).
Plan: `production/qa/qa-plan-sprint-009-2026-10-17.md` (reused). No verdict is named here.

**Smoke Check**: PASS WITH WARNINGS. Source: `production/qa/smoke-2026-10-19-sprint-009.md` (PASS at HEAD 0dcb87c, 1,538/1,538).
- Warning 1: the report predates commits 1c5faf0 and e410b9d. `git diff --stat 0dcb87c HEAD -- src` lists exactly 4 files: `src/scene/Input.tsx`, `src/ui/abortArm.test.ts`, `src/ui/index.tsx`, `src/ui/pauseMenuModel.ts` (57 insertions, 6 deletions). No audio, sim, or CSS file is among them.
- Refreshed at HEAD e410b9d (reported by the caller, not re-run by me): vitest 1,539/1,539 in 60 files, eslint no errors, `npm run build` completes.
- Warning 2: the report's manual items (listening pass, frame p95, the Pass A/B click-throughs) were not re-run at the new HEAD. Standing rulings carried: frame p95 9.2 ms = pass; AU-001/AU-003 listening = pass. Neither the frame loop nor audio code is in the diff (see Carry-forward).

**Open bugs in scope**: 3 on file in `production/qa/bugs/`. 0 S1, 0 S2.
- BUG-0001 S3 / P1, IF-008 AC11: Fixed (awaiting QA verification), commit 1c5faf0.
- BUG-0002 S3 / P1, IF-005 AC19: Fixed (awaiting QA verification), commit e410b9d.
- BUG-0003 S4 / P3, IF-010 / IF-001 AC1: Open (backlog; notice placement).
A "Fixed" status is the developer's claim, not a QA result. Both Interface bugs are counted as open until verified.

## Strategy table (all 17 stories)

Types are unchanged from the prior strategy (each story's own Type line matches the plan). "Re-run" = fresh manual QA this cycle; "Carry" = signed evidence from the earlier run stands.

| Story | Type | Automated Required | Manual Required | Blocker? |
|---|---|---|---|---|
| IF-001 Every surface fits 1280x720 | UI | Advisory: `evidence/if-001/sweep.mjs` re-run at HEAD (covers menu, pause, pause-settings, the surfaces the diff touches); `settingsStore.test.ts` in suite | AC20 record: amend `evidence/if-001/README.md` line 78 (step 2 chrome wording checks, step 3 Brief weather line) | YES: AC20 amendment not applied; AC20 box still ticked |
| IF-002 Non-colour cues; one OS styling | Visual/Feel | Advisory: `criticalCues.test.ts` (in suite) | Carry: lead sign-off Marco Machado PASS 2026-10-18 | No |
| IF-003 Contract navigation gates | UI | Advisory: `navGates.test.ts`, `contractNavigation.test.ts` (in suite) | Carry: capture re-run identical to signed original (team-qa review) | No |
| IF-004 Chance vs Risk; owner readouts | UI | Advisory: `worldChrome.test.ts` (in suite) | Carry: re-run transcript identical; R1/R2 rulings stand | No |
| IF-005 Research Authorize; focus return | UI | Advisory: `researchInput.test.ts` (in suite); `bug-0002-fix-2026-10-19/if-005-smoke/capture.mjs` | Re-run: Menu-Settings focus probe (`if-005-menu/probe.mjs`, expect `FAILS: 0`) plus smoke capture (AC18 nested Settings, AC19 pause close) | YES: BUG-0002 unverified by QA; AC19 box ticked pending |
| IF-006 Menu Continue / New Operation / telemetry | UI | Advisory: `menuPersistence.test.ts` (in suite) | Re-run (light): `capture.mjs` against HEAD. `MainMenu` in `src/ui/index.tsx` changed (ref plus focus effect). Probe AC9, AC17, AC21, AC25 passed before the change | No |
| IF-007 Minimap, weather chip, toasts | UI | Advisory: `tutorialStore.test.ts`, `world.test.ts` (in suite) | Re-run (light): `capture.mjs` (27/27 earlier) plus Space with a toast present; `Input.tsx` Space handling changed | No (box state: see Blockers 4) |
| IF-008 Pause modal; two-step Abort | Integration | BLOCKING: `abortArm.test.ts` (now 1,539-total suite; includes BUG-0001 regression test). Gate met if green at HEAD | Re-run: TC-06 on all five sliders (MASTER, UI CUES, COMBAT, MUSIC, AMBIENCE) plus Space regression set (below), TC-01/04/05 | YES: BUG-0001 unverified by QA; AC11 box ticked pending |
| IF-010 Debrief filing; write-failure | UI | Advisory: `filingStatus.test.ts` (in suite) | Carry: AC22/AC23 met, smoke copy ALL PASS. BUG-0003 stays open (S4) | No |
| IF-012 Assembly hire refusals; heavy-tier hint | UI | Advisory: `assemblyRows.test.ts`, `armHints.test.ts` (in suite) | Carry: capture plus probe TC-06/07 all pass | No (box state: see Blockers 4) |
| AU-001 Mixer, mute, settings persistence | Integration | BLOCKING: `audio.test.ts` (AU-001), `settingsStore.test.ts` (in suite) | Re-run (light): Settings from Menu, change MUSIC/MUTE, close, reload (smoke item 8 steps) because the Menu close path changed. No listening re-run (no audio file in the diff) | No |
| AU-002 Voices, buses, reference mix | Visual/Feel | Advisory: `audio.test.ts`, `audio.stings.test.ts` (in suite) | Carry: 25/25 rows, audio-director sign-off 2026-10-18 | Open ruling on screenshot size (below); not a blocker per prior strategy |
| AU-003 Strategy bed; city-hum lifetimes | Integration | BLOCKING: `audio.test.ts` (AU-003), `strategyAudio.test.ts` (in suite) | Carry: user listening "pass" 2026-10-19 | No (stale notes: hygiene) |
| AU-004 Rain follows weather; Alert drone | Visual/Feel | Advisory: `audio.test.ts` (in suite) | Carry: audio-director sign-off 2026-10-18 | Same screenshot-size ruling |
| AU-005 Unavailable/late audio never bursts | Integration | BLOCKING: `audio.test.ts` (3 AU-005 describes) (in suite) | Carry: cold-cache probe TC-01 to TC-05 pass | No |
| AU-006 Presentation randomness | Logic | BLOCKING: `audio.test.ts` (AU-006, 4 tests) (in suite) | None | No |
| AU-007 No celebration sting, VO, spatial mix | Visual/Feel | Advisory: `audio.noCelebration.test.ts` (in suite) | Carry: audio-director sign-off 2026-10-19 | Same screenshot-size ruling |

BLOCKING automated gate (Logic/Integration at standard): all 5 stories (AU-006, IF-008, AU-001, AU-003, AU-005) have their test files; met only if the suite is green at the HEAD under test (caller reports 1,539/1,539 at e410b9d).

## Re-run scope: fresh manual QA this cycle

All items are run by Claude headless at exactly 1280x720 (Chrome for Testing, temporary profile) against `npm run dev` on port 4200, output to a new folder under `production/qa/evidence/` (do not overwrite the author's `bug-0001-fix` / `bug-0002-fix` folders or the signed story folders). The fix commits carry author-run probes. Those are developer evidence; QA verification is a separate run with its own captures.

| # | Item | Story | What | Pass criterion |
|---|---|---|---|---|
| R1 | BUG-0001 TC-06 | IF-008 | Pause, open Settings, focus each of the 5 volume sliders in turn, press Space | For each: mission stays paused, Settings stays open, slider keeps focus, sim time unchanged |
| R2 | Space regression set | IF-008, IF-005 | (a) Space on a focused dialog button (e.g. MUTE, RESUME) activates that button only. (b) Space with nothing focused in a live mission pauses; Space with no dialog control focused while paused resumes. (c) Escape from a focused slider still closes Settings back to the pause modal. (d) Abort arm then Space on a Settings control: arm state is not confirmed by Space (relates to open design question IF-008 advisory 3) | All match AC11 and `abortArm.test.ts` expectations |
| R3 | IF-008 TC-01, TC-04, TC-05 | IF-008 | Re-run the earlier-passing probe cases (Space pause, re-arm after lapse, confirm) | Same result as the team-qa run |
| R4 | BUG-0002 verify | IF-005 | Run `if-005-menu/probe.mjs`; click SETTINGS on Menu, close by Escape and by CLOSE | `FAILS: 0`; focus returns to the SETTINGS button (not `document.body`) both ways; Tab and Shift+Tab remain trapped while open |
| R5 | Tab reachability from page start | IF-005 | The prior review left this unverified. Fresh load, Tab from the document start, confirm Menu buttons are reachable in order, including after a close | Recorded either way (it closes the "no workaround documented" question now moot if R4 passes) |
| R6 | IF-005 smoke capture | IF-005 | `if-005-smoke/capture.mjs` | ALL PASS, including AC18 and AC19 pause-origin cases (the new `settingsBtnRef` effect is Menu-only; this proves the pause path is unaffected) |
| R7 | IF-001 AC20 | IF-001 | Apply the README amendment; add the two missing items to "Exercised" (citing capture) or "Not exercised". Re-run `sweep.mjs` (40 runs) because Menu, pause, pause-settings are among its surfaces and the focus ring is new | Sweep 0 clips, 0 overlaps; README lists both items; AC20 re-ticked only after |
| R8 | Menu and toast regression | IF-006, IF-007 | `capture.mjs` for each | ALL PASS (IF-007 27/27 earlier) |
| R9 | Settings persistence | AU-001 | Open Settings from Menu, set MUSIC 40 and Mute ON, close, reload, confirm, restore | Values persist, focus returns on close |
| R10 | Suite at HEAD | all Logic/Integration | `npm run test` at the HEAD that the sign-off cites | Green; if src changes again during QA, re-run |

Estimated effort: 1 session of about 45 to 60 minutes (estimate; R1 to R6 dominate). A second pass only if R1, R4 or R7 fails.

## Carry-forward (signed evidence stands)

| Stories | Reason |
|---|---|
| IF-002 | Visual/Feel lead sign-off 2026-10-18; no CSS or cue code in the 4-file diff |
| IF-003, IF-004 | Re-run identical to signed original this morning; none of the four changed files are on those screens' paths (Input.tsx gates on `missionKeyAnswers`, mission only) |
| IF-010, IF-012 | Pass recorded this morning; no change in the diff reaches Debrief or Assembly |
| AU-002, AU-004, AU-007 | Audio-director sign-offs 2026-10-18 / 2026-10-19; `git diff --stat 0dcb87c HEAD -- src` lists no audio file, so listening evidence is still valid |
| AU-003, AU-005, AU-006 | Tests in suite; user listening pass (AU-003); cold-cache probe passed; no audio file in the diff |
| Frame p95 / listening smoke items | Standing user rulings. Diff adds a key-handler branch and one non-per-frame effect; no render loop change. Judgement, not measured: if the user wants it measured, re-run `smoke-2026-10-14/perf.mjs` |

## Blockers

1. **IF-001 AC20 amendment not applied** (`evidence/if-001/README.md` line 78). Condition 2 of the prior sign-off. Blocks IF-001 sign-off.
2. **BUG-0001 and BUG-0002 are "Fixed (awaiting QA verification)"**, not verified. Sign-off cannot rely on author probes. Verification (R1 to R6) is required, then `/bug-report verify` on each. The Fixed claim is also the only record that BUG-0002's focus-return works when Tab-reachability is unverified (R5).
3. **AC boxes**: IF-008 AC11, IF-005 AC19, IF-001 AC20 are ticked `[x]` while the prior sign-off ruled they stay unticked until the fix is verified. Untick now; re-tick only after R1/R4/R7 pass.
4. **IF-007 AC10/AC13/AC14 and IF-012 AC26/AC28**: the prior sign-off's ruling was to tick them and it says it was "not yet applied". I did not re-verify their current state this turn; check before sign-off.
5. **User ruling still open**: AU-002 / AU-004 / AU-007 screenshots at 800x788 or 800x600 vs the plan's 1280x720. The prior strategy recommends accepting as staging evidence (the stories ask for a listening note plus lead sign-off). Not decided here.

## Concerns (not blockers)
- Input.tsx now treats Space as owned by any focused INPUT, SELECT or TEXTAREA inside a `[role="dialog"]`, not only sliders. `Settings.tsx` has only `type="range"` inputs in the grep I ran (`src/ui/*.tsx`); the other dialogs (`PauseMenu.tsx`, `WorldMap.tsx`) show no select/textarea. Behavior on any future dialog field is untested; low risk now.
- Open design questions carried from the prior strategy, not rulings: IF-008 advisory 3 (a pending Abort arm survives the switch to Settings), AU-005 freshness window, AU-003 AC3 wording.
- The hygiene/follow-up list in the prior sign-off (stale AU-001/AU-003 notes, TR-audio-004, weak asserts, toast count, BUG-0003) is unchanged and not a QA-start blocker.

## Entry Criteria
- [x] Smoke report exists: `production/qa/smoke-2026-10-19-sprint-009.md` (PASS at 0dcb87c), plus caller refresh at e410b9d: 1,539/1,539, lint, build.
- [x] All 17 stories `done` in `sprint-status.yaml` (per caller).
- [ ] Manual smoke items re-run at the new HEAD: not done (warning above); R8 and R9 cover the affected paths.

## Exit Criteria
- R1 to R10 recorded with captures in a new evidence folder; no open S1/S2.
- BUG-0001 and BUG-0002 verified (or reopened and routed); BUG-0003 remains S4 backlog.
- IF-001 AC20 amended and re-ticked; AC11 and AC19 re-ticked only on pass.
- User ruling on the AU screenshot sizes recorded.
- Sign-off re-issued as `production/qa/qa-signoff-sprint-009-*.md` (new file or amended; the sign-off author names the verdict).
