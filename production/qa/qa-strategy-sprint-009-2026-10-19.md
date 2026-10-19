# QA Strategy: Sprint 9 (Interface and Audio, final sprint), 2026-10-19

Phase 2 of `/team-qa`. qa.level: standard. Automation: autonomous. Stage: Production.
Plan: `production/qa/qa-plan-sprint-009-2026-10-17.md` (reused, not rewritten).

**Smoke Check**: PASS — source production/qa/smoke-2026-10-19-sprint-009.md

(1538/1538 tests in 60 files; lint and build exit 0; 9/9 plan items PASS. Two user rulings are recorded there: item 9 "treat 9.2 ms as a pass", and item 7, the AU-001/AU-003 listening pass, "pass", 2026-10-19. The verdict is used as written and was not re-run.)

**Open bugs in scope**: none on file. `production/qa/bugs/` does not exist, so this means "no bug records", not a triaged-clean list.

## Method
- Read in full: all 17 story files, the QA plan, the smoke report, the Sprint 8 strategy (format), `production/sprint-status.yaml`, `production/sprints/sprint-009.md`.
- Read the evidence READMEs for if-005, if-006, if-007, if-008, if-012 and au-005 in full. Read the header, staging and sign-off sections of the au-002, au-004 and au-007 READMEs, and the header, AC3 and sign-off sections of `evidence/story-002-...-evidence.md`. The if-001, if-003, if-004 and if-010 READMEs were grepped only (sign-off and coverage lines), not read in full.
- Checked the pixel size of every retained PNG/JPG with `sips`. Opened two captures: `if-004/11-brief-intel-2.png` and `if-010/06a-...png`.
- Checked that every named test file exists, and read the `describe` names in `src/game/audio.test.ts`. I did not read any other test bodies and did not run the suite.
- Checked git: which UI source files changed after the evidence commits, and whether audio source changed after the listening passes.

**Types**: each story's own `Story Type` line matches the plan for all 17: 1 Logic, 4 Integration, 8 UI, 4 Visual/Feel, 0 Config/Data. **Differences from the plan are in test-file names only:**
- AU-003: the plan names `audio.beds.test.ts`. The story names `audio.test.ts` (`bed lifetimes (AU-003)`) and `strategyAudio.test.ts`.
- AU-006: the plan says "`audio.beds.test.ts` or `world.test.ts`". The tests are in `audio.test.ts` (`presentation-only randomness does not change outcomes (AU-006)`, line 1024). Neither `world.test.ts` nor `audio.beds.test.ts` contains an AU tag.
- AU-004: planned for `audio.beds.test.ts`, placed in `audio.test.ts`; the story file says so.
- IF-004: the smoke table says "no test file named". `src/ui/worldChrome.test.ts` exists and is named in the Completion Notes, but not on the Test Evidence Status line.

## Strategy table

| Story | Type | Automated Required | Manual Required | Blocker? |
|---|---|---|---|---|
| IF-001 Every surface fits 1280x720 | UI | Advisory: `settingsStore.test.ts` step set; `evidence/if-001/sweep.mjs` (smoke re-run: 40 runs, 0 clips, 0 overlaps) | 1280x720 screenshots: 41 at 1280x720 plus 2 at 1100x650 (sub-minimum) in `evidence/if-001/` (captured 2026-10-17). Current-tree copies are in `evidence/smoke-2026-10-19/if-001/`. No sign-off line in the README. The AC20 click-through is partial; the README lists the steps not exercised | No. qa-lead review this cycle |
| IF-002 Non-colour cues; one OS styling | Visual/Feel | Advisory: `src/ui/criticalCues.test.ts` | 26 captures (13 colour/grey pairs) at 1280x720. Lead sign-off recorded: `\| Lead (art-director) \| Marco Machado \| PASS \| 2026-10-18 \|` | No. Fully evidenced |
| IF-003 Contract navigation gates | UI | Advisory: `navGates.test.ts`, `contractNavigation.test.ts` (the review found several asserts that cannot fail) | 9 captures at 1280x720 plus `brief-vs-deployed.md`. No sign-off line. Captures predate the 2026-10-18 UI changes | No. Re-run the capture, then review |
| IF-004 Chance vs Risk; owner readouts | UI | Advisory: `src/ui/worldChrome.test.ts` | 11 captures at 1280x720. README: `Sign-off: qa-lead (pending).` The story asks qa-lead to rule whether the unit test is acceptable evidence for AC27 "SECTOR LOCKED". `11-brief-intel-2.png` (opened): the top CIVILIANS row is half-cut at the top of the tactical-stats scroll box. Captures predate the 2026-10-18 UI changes | No. Sign-off and ruling pending |
| IF-005 Research Authorize; focus return | UI | Advisory: `researchInput.test.ts`; `capture.mjs` re-run in smoke, ALL PASS (mutation check also recorded) | 7 captures at 1280x720; current-tree copies in `smoke-2026-10-19/if-005/`. No sign-off line | No. qa-lead review |
| IF-006 Menu Continue / New Operation / telemetry | UI | Advisory: `menuPersistence.test.ts` | 5 captures at 1280x720, text scale 125 only. No sign-off line. Screenshot 05 does not itself show recording off (the script asserts it). Captures predate the 2026-10-18 UI changes | No. Re-run the capture, then review |
| IF-007 Minimap, weather chip, toasts | UI | Advisory: `tutorialStore.test.ts`, `world.test.ts`; `capture.mjs` re-run in smoke, ALL PASS | 12 captures at 1280x720 and 4 minimap element crops at 210x150 (02, 03, 04, 15). README: `Sign-off: qa-lead (pending).` **AC10, AC13 and AC14 are unticked `- [ ]`** while the Completion Notes say 3/3. Hardened is captured once (max zoom, scan on) against Standard at three zooms, so there is no like-for-like pair. Nothing asserts the Hardened objective pulse. The Extraction toast names no key (spec question on AC13). The reduced-motion pulse freeze was not captured | Sign-off pending. Does not block QA start |
| IF-008 Pause modal; two-step Abort | Integration | **Yes (BLOCKING): `src/ui/abortArm.test.ts`**, 12 tests, present. Mutation check: FAILED AS EXPECTED (3000 to 1000 ms) | 6 captures at 1280x720; smoke item 5 (Pass A) drove arm, disarm and confirm. Advisory 4 (code trace, not run): Space with a Settings volume slider focused unpauses and unmounts Settings | No. One repro probe (below) |
| IF-010 Debrief filing; write-failure | UI | Advisory: `filingStatus.test.ts`; `capture.mjs` re-run in smoke, ALL PASS | 7 captures at 1280x720; current-tree copies in `smoke-2026-10-19/if-010/`. README: `Sign-off: qa-lead (pending).` `06a` (opened, original 2026-10-17 capture): the `SAVE FAILED // CAMPAIGN NOT FILED` box covers the end of the START HERE text and the start of the STRATEGIC TIME line on the orientation card. The write-failure notice is not on IF-001 AC1's declared-overlay list | Sign-off pending, plus an overlap ruling |
| IF-012 Assembly hire refusals; heavy-tier hint | UI | Advisory: `assemblyRows.test.ts`, `armHints.test.ts` | 5 captures at 1280x720. No sign-off line. **AC26 and AC28 are unticked `- [ ]`** while the Completion Notes say 2/2. The second-deploy "no repeat" check has no image (text log only). Captures predate the 2026-10-18 UI changes | No. Re-run the capture, review, tick the boxes |
| AU-001 Mixer, mute, settings persistence | Integration | **Yes (BLOCKING): `audio.test.ts` (`mixer buses and staged gain (AU-001)`), `settingsStore.test.ts`**, present. Mutation check: FAILED AS EXPECTED | Listening pass: user "pass", 2026-10-19 (smoke item 7); the Status line says so. The Completion Notes still say "AC1 audible listening pass DEFERRED" and "no click-through note recorded yet". No `evidence/au-001/` folder exists | No. Stale notes (hygiene) |
| AU-002 Voices, buses, reference mix | Visual/Feel | Advisory: `audio.test.ts` AU-002 block, `audio.stings.test.ts` | `evidence/au-002/README.md`: 25/25 rows pass. Sign-off: `- Audio-director: Marco Machado, 2026-10-18 — approved`. 3 JPGs at **800x788** (in-app pane). The "Open for Sign-off" section still says "no screenshot retained" | No. Fully evidenced |
| AU-003 Strategy bed; city-hum lifetimes | Integration | **Yes (BLOCKING): `audio.test.ts` (`bed lifetimes (AU-003)`), `strategyAudio.test.ts`**, present. Mutation check: FAILED AS EXPECTED | Listening pass: user "pass", 2026-10-19 (smoke item 7). Partial click-through is recorded in the story. The Completion Notes still say the listening check is "still pending". AC3 "in-flight decode is discarded" vs the cached buffer needs a ruling or a reword | No. Stale notes (hygiene) |
| AU-004 Rain follows weather; Alert drone | Visual/Feel | Advisory: `audio.test.ts` AU-004 block (7 tests) | Listening note: rows 1–8 and 4b pass. Sign-off: `- Audio-director: Marco Machado, 2026-10-18 — approved`. 7 JPGs at **800x788**. The story notes say row 8 was checked inside one mission only | No. Fully evidenced |
| AU-005 Unavailable/late audio never bursts | Integration | **Yes (BLOCKING): `audio.test.ts` (3 AU-005 describes)**, present. Mutation check: FAILED AS EXPECTED | `au-005/README.md` is partial: "a cold cache is not verified" and the listening row is "not run". The smoke report has no cold-cache record (grep "cold": no match), although plan smoke item 7 lists it. The file `01-menu-after-settings-1280x720.jpg` is actually 480x270, and `00-settings-open-1024x768.jpg` is 800x600 | No. Cold-cache smoke remains |
| AU-006 Presentation randomness does not change outcomes | Logic | **Yes (BLOCKING): `audio.test.ts` (AU-006, 4 tests)**, present. The plan's bed-pick mutation was not performed; a hit-roll mutation FAILED AS EXPECTED | None | No |
| AU-007 No celebration sting, VO or spatial mix | Visual/Feel | Advisory: `audio.noCelebration.test.ts` (6 tests; the review found several cannot fail) | Listening note: rows 1–6 pass. Sign-off: `- Audio-director: Marco Machado, 2026-10-19 — approved`. 5 JPGs: two at **800x600**, three at **800x788** | No. Fully evidenced |

The BLOCKING automated gate (Logic/Integration at standard) is met for all 5 stories: each test file exists, and the smoke suite passed 1538/1538. The UI evidence gate (retained screenshot of each screen touched) is met for all 8 UI stories. The Visual/Feel lead sign-off is recorded for all 4. No audio source changed after any listening pass: `git diff 0548369 HEAD` touches only `src/index.css` and `src/ui/ui.css`.

## Remaining manual QA (this cycle)

| # | Item | Story | State | Action |
|---|---|---|---|---|
| 1 | Re-run the retained `capture.mjs` scripts against HEAD | IF-003, IF-004, IF-006, IF-008, IF-012 | 15 UI source files changed after `e256bc0`, the last IF evidence commit (`ui.css` +/-504 lines, `Hud.tsx`, `Nav.tsx`, `WorldMap.tsx`, `Research.tsx`, `index.tsx`, `Minimap.tsx`, `index.css`, `tokens.ts`, ...; IF-002's Ledger Amber and focus-bracket work). The smoke re-ran only IF-001, IF-005, IF-007 and IF-010 | Claude runs each script headless at 1280x720 with `SWEEP_URL` into a new folder under `production/qa/evidence/` (do not overwrite the story folders). Expect ALL PASS |
| 2 | qa-lead review and sign-off, 8 UI stories | IF-001, 003, 004, 005, 006, 007, 010, 012 | Pending in 3 READMEs (IF-004, IF-007, IF-010); no sign-off line in the other 5 | Review the current-tree captures (smoke copies for IF-001, 005, 007, 010; item-1 output for the rest) and record sign-off per story |
| 3 | Rulings | IF-004, IF-007, IF-010 | Open | IF-004: is the unit test acceptable evidence for AC27 "SECTOR LOCKED"? Is the half-cut CIVILIANS row OK in its scroll box (check on HEAD)? IF-007: does AC13 "name current bindings" exclude the Extraction toast? IF-010: is the write-failure notice an allowed overlay over the orientation card (`06a`; check the smoke copy on HEAD)? |
| 4 | Like-for-like Hardened minimap | IF-007 | Missing: Hardened is captured at one zoom only | Claude captures Hardened at all three zooms on Glass Veil, plus the objective pulse. Reduced motion: capture it, or record it as an accepted gap |
| 5 | Repro probe: Space on a focused Settings volume slider, from pause | IF-008 | Code-trace claim only ("not run") | Claude drives it headless. If it unpauses or closes Settings, that contradicts AC11 "keeps Settings inside the freeze": file it with `/bug-report`. If not, record "not reproduced" |
| 6 | Cold-cache play with source-start logging | AU-005 | Not recorded anywhere | Claude runs a fresh headless profile (cold HTTP cache), patches `AudioBufferSourceNode.prototype.start` and records that no burst happens. Per the AC this is smoke/diagnostic coverage, not proof; no listening needed |
| 7 | Listening | AU-001, 002, 003, 004, 007 | Done (user: smoke item 7, and the three audio-director sign-offs) | None |

## Manual session estimate
**1 session, about 90 to 120 minutes** (estimate):
- Claude: item 1 (5 scripted runs, about 25–35 min), item 4 (about 15 min), item 5 (about 10 min), item 6 (about 15 min).
- qa-lead, with the user for rulings: item 2 (8 evidence sets, about 30–40 min) and item 3 (4 rulings, about 10 min).
- No listening session is needed.
- A second session only if a re-run fails or item 5 reproduces.

## Blockers
None for QA to start. Pending before sign-off:
1. qa-lead sign-off is not recorded for any of the 8 UI stories (the plan names qa-lead as sign-off for each).
2. The IF-007 (AC10, AC13, AC14) and IF-012 (AC26, AC28) acceptance-criteria boxes are unticked, although both stories are `Complete`.
3. The rulings in item 3, and the IF-007 Hardened like-for-like gap (item 4).

## Concerns (not blockers)
1. **AU screenshots are not 1280x720.** The AU-002, AU-004 and AU-007 JPGs are 800x788 or 800x600 from the in-app pane. The plan's rule says Visual/Feel evidence is captured at exactly 1280x720. These stories' own Required-evidence lines ask for a listening note plus a lead sign-off, and the screenshots only show how each scenario was staged. Recommendation: accept them as staging evidence and record the ruling, without re-capturing; this needs the user. The AU-005 file names state sizes the files do not have.
2. **TR-audio-004 mis-mapping, confirmed.** The registry text is "No spoken VO, no spatial shooter mix, and no payout celebration sting". That is AU-007's scope, but AU-002 (voices, buses, reference mix) also points at it, and no registry entry describes AU-002. IF-006 (TR-interface-003) and IF-010 (TR-interface-006) flag the same kind of mismatch in their own notes. Route this to a traceability pass; it is not a QA gate.
3. **Stale story text.** AU-001 and AU-003 Completion Notes still say "DEFERRED" and "still pending". The AU-002 "Open for Sign-off" section says no screenshot was retained. The QA Test Cases checklist boxes are unticked in IF-002, 003, 004, 005, 007, 012, AU-002, 004 and 007. This is the same pattern as Sprint 8's TM-002/TM-008 (R-7). Fix it at sign-off or list it as a condition.
4. **Weak tests are recorded but not logged.** Reviews found asserts that cannot fail in IF-003, IF-004, IF-007, IF-008, AU-001, AU-003 and AU-007, and no tech-debt register entries were written. This is the final sprint, so no later story can hold them. Accept them in the sign-off or log them.
5. **Design questions with no owner ruling:** IF-008 advisory 3 (a pending Abort arm survives the switch to Settings, so one click can abort); AU-005 (a click can sound up to about twice the freshness window after it was made); AU-003 AC3 (decode is cached, not discarded).
6. **AU-007 row 6** logged a second alert sting mid-fight with no recorded cause. It is in-mission, outside AU-007, and AU-002's AC allows stings on an officer call or a defend wave. This is an observation, not a defect.
7. Smoke item 3 covered the no-contract Deploy refusal by test, not in the browser. The 316.7 ms mission-load frame has no separate ruling (smoke report).

## Out of Scope
- IF-009 and IF-011: both story files read `Status: Complete`, from before this sprint.
- Retro tasks R-1 to R-7 (not stories). R-3 is closed in the smoke report. R-6 (OQ3, does gunfire damage Devices) is due 2026-10-28. I did not verify the status of R-4, R-5 or R-7.
- Release checklist and certification: not part of this phase.

## Entry Criteria
- [x] A smoke PASS report exists: `production/qa/smoke-2026-10-19-sprint-009.md`, "Verdict: PASS".
- [x] Build stable, per the smoke report: lint, test and build exit 0. Not re-run here. The tree was clean at session start (HEAD `0dcb87c`), and no `src/` change has landed since `7507649` (`git diff`).
- [x] Must Have stories in-progress, review or done in `sprint-status.yaml`: IF-001 done, IF-003 done, IF-005 done, IF-006 done, IF-008 done, AU-001 done, AU-003 done, AU-005 done. All 17 entries read `status: done`, and all 17 story files read `Status: Complete`.

## Exit Criteria
- Each of the 8 UI stories has a qa-lead sign-off (or a written waiver) based on captures from HEAD. The item-1 re-runs are ALL PASS, or their failures are filed.
- The 4 Visual/Feel lead sign-offs stay as recorded (already present).
- The Logic/Integration suite is green (1538/1538). Re-run it only if `src/` changes during QA.
- The item-3 rulings and the AU screenshot-size ruling are recorded in the sign-off report.
- The IF-008 item-5 probe is recorded as either "not reproduced" or a filed and triaged bug. No open S1 or S2 bug in a delivered feature.
- The AU-005 cold-cache smoke is recorded.
- The IF-007 and IF-012 AC boxes are ticked, or the reason is written down. The stale AU-001/AU-003 notes are corrected or listed as conditions.
- `production/qa/qa-signoff-sprint-009-*.md` reads APPROVED or APPROVED WITH CONDITIONS. Then `/retrospective`, then `/sprint-plan new` (per CLAUDE.md).
