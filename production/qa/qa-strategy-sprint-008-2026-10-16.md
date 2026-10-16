# QA Strategy: Sprint 8 (Tactical mission rules), 2026-10-16

Phase 2 of `/team-qa`. qa.level: standard. Automation: autonomous. Stage: Production.
Plan: `production/qa/qa-plan-sprint-008-2026-10-16.md`.

**Smoke Check**: PASS. Source: `production/qa/smoke-2026-10-16-sprint-008.md` (HEAD 2d49bc7; 1,395/1,395 tests, build and lint exit 0, 9/9 plan items; items 4 and 7 used labelled fixtures F1 and F2 that the plan allows). Verdict used as written; not re-run.

**Open bugs**: none on file. `production/qa/bugs/` does not exist, so this is "no bug records", not a verified-clean list.

## Method
Types are taken from each story's `Test Evidence > Story Type` line (all 16 grepped) and match the sprint brief. Spot-read in full: TM-002 (the plan's flagged AC 5d conflict), TM-009 (manual half), TM-013 and TM-015 Completion Notes. Other stories: Test Evidence and Completion Notes lines only. I did not run the suite; the smoke report did.

## Strategy table

| Story | Type | Automated Required | Manual Required | Blocker? |
|---|---|---|---|---|
| TM-001 Opening selection / Select-all | Logic | Yes. `src/game/world.test.ts` (story reconciled; rules in `src/game/selection.ts`) | No | No |
| TM-002 Dead/empty recipients no-op; Attack on Device | Logic | Yes. `world.test.ts` `orders` (5 tests, incl. "AC 5d" at ~L764) | No | No (see Concern 2) |
| TM-003 Move clears target; stop-to-engage | Logic | Yes. `world.test.ts` (5 tests) | No | No |
| TM-004 Idle auto-acquire; Attack under Hold | Logic | Yes. `world.test.ts` | No | No |
| TM-005 Hold Fire keeps standing Explicit | Logic | Yes. `world.test.ts` | No | No |
| TM-006 Hold Ground pin; Stop | Logic | Yes. `world.test.ts` (4 tests) | No | No |
| TM-007 Same seed, same mission; brief agrees | Integration | Yes (test OR playtest doc). `citygen.test.ts`, `missionParams.test.ts` | Yes: smoke path (a) brief vs deployed mission | No |
| TM-008 Weather retunes sight/noise only | Logic | Yes. `world.test.ts` (7 tests) | No | No |
| TM-009 Opening hour presentation; risk index | Logic | Yes. `forecast.test.ts`, `missionParams.test.ts`, `world.test.ts` (11 tests) | Yes: lighting half of AC 10 (screenshots exist) | **Yes, sign-off pending** |
| TM-010 Squad-caused civilian first-hits | Logic | Yes. `world.test.ts` (5 tests) | No | No |
| TM-011 Cover interrupts lane; hit chance | Logic | Yes. `world.test.ts` (7 tests) | No | No |
| TM-012 Eliminate tags; optionals never gate win | Logic | Yes. `world.test.ts` (3 tests) | No | No |
| TM-013 Loss conditions; abort emits no outcome | Integration | Yes (test OR playtest doc). `world.test.ts`, `appStore.test.ts` | Yes: smoke path (b) abort | No |
| TM-014 Quiet replay; deploy freeze | Logic | Yes. `world.test.ts` (3 tests) | No | No |
| TM-015 Hardened profile; fixed camera pose | Integration | Yes (test OR playtest doc). `missionParams.test.ts`, `world.test.ts`, `cameraPose.test.ts` (11 tests) | Yes: camera screenshots. **Done**, signed off by qa-lead 2026-10-16 | No |
| TM-016 Grenade confirm spends one cell | Logic | Yes. `world.test.ts` (6 tests) | No | No |

Automated evidence is a BLOCKING gate for all 16 at standard. All 16 name an existing test file and a green re-run in Completion Notes; every Logic/Integration story also records a code review and a mutation check per the brief. Config/Data stories: none in scope.

## Remaining manual QA

| Item | Story | State | Action |
|---|---|---|---|
| Lighting (3 checks) | TM-009 | Evidence captured (`evidence/tm-009/` 01-03, README, capture.json). README states the run was unattended and "qa-lead sign-off is not recorded". Plan boxes unticked | qa-lead reviews the 3 screenshots against the README and records sign-off in the plan and story. No re-capture needed unless the screenshots fail review |
| Camera / minimap / Hardened | TM-015 | Signed off 2026-10-16 | None |
| Smoke path (a): brief vs deployed mission (insertion, objectives, extraction, weather-front time) | TM-007 | Open. Smoke item 2 reached a live mission from the Brief but, from the lines I read, did not compare brief fields to the deployed mission | One in-browser comparison on one contract |
| Smoke path (b): Abort, no Debrief, Credits and roster unchanged | TM-013 | Covered by smoke item 6 (Abort on Rust Haven: `mission` to `world`, no `debrief`, result `none`, Credits and roster unchanged, per the report). Plan box unticked | qa-lead may tick (b) citing the smoke report; no new session |

## Manual session estimate
**1 session, about 45 to 60 minutes**, in the in-app browser at 1280x720:
- TM-009 screenshot review and sign-off: about 10 min (review only).
- TM-007 path (a), on one contract (suggest Rust Haven, which also covers a Device mission): about 20 to 30 min. Optionally a second contract if the first shows a mismatch.
- TM-013 path (b): 0 min if the smoke report is accepted as evidence; about 10 min if qa-lead wants a fresh run.

No second session unless a mismatch is found.

## Blockers
None for QA to start. Pending items before sign-off:
1. TM-009 qa-lead sign-off is not yet recorded (a story-defined manual gate, resolved by the review above).
2. TM-007 path (a) has no recorded run.

## Concerns (not blockers)
1. TM-002 and TM-008 still show unticked `- [ ]` acceptance criteria (TM-002: 1c, 1e, 5d; TM-008: 9a-9c) although both are `Complete` and their Completion Notes say all criteria pass. Process hygiene only; the tests exist. Tick them at sign-off.
2. TM-002 AC 5d: the plan flagged that `orderAttack` accepted Devices. The story now records the fix (devices rejected, test "Attack on a Device sets no Explicit target (AC 5d)" present, play-checked on Rust Haven). I did not re-read `orderAttack`. Note `world.ts` still has `kind === 'device'` branches near L700 and L753 (damage handling); I did not trace them, so whether gunfire still damages Devices is unverified here (GDD Open Question 3).
3. `story-017-*.md` is in the epic folder but outside Sprint 8 scope (sprint-008.md: complete since 2026-10-10). Its file shows 7 unticked boxes. Not assessed.
4. Smoke items 4 and 7 relied on fixtures F1 (`intelLevel: 2`) and F2 (`setDifficulty('hardened')`). Acceptable per plan; the natural Settings path to Hardened was not exercised.
5. The QA plan's "TM-001 tests in `missionStore.test.ts`" differs from the story (tests in `world.test.ts`, rules in `selection.ts`). The story file governs.
