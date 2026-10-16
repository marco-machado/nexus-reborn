## QA Sign-Off Report: Sprint 8 — Tactical mission rules

**Date**: 2026-10-16
**QA Level**: standard
**Scope**: 16 stories, TM-001 to TM-016, all `done` in `production/sprint-status.yaml`. 13 Logic (TM-001–006, 008–012, 014, 016) and 3 Integration (TM-007, 013, 015).
**Strategy**: `production/qa/qa-strategy-sprint-008-2026-10-16.md`
**Plan**: `production/qa/qa-plan-sprint-008-2026-10-16.md` (reused, not rewritten)
**Smoke Check**: PASS at HEAD 2d49bc7 (`production/qa/smoke-2026-10-16-sprint-008.md`).
- 1,395/1,395 tests across 51 files; build and lint exit 0.
- All 9 plan items pass in the in-app browser.
- Items 4 and 7 used labelled fixtures, which the plan allows: F1 set `intelLevel` to 2 to unlock Rust Haven, and F2 called `setDifficulty('hardened')`, the same action as the Settings button.

**Run**: `/team-qa sprint`, automation autonomous, team.size individual. qa-lead drafted this report and the orchestrator checked the verdict against the verdict rules. Claude ran the manual QA in the in-app browser. qa-lead reviewed the TM-009 and TM-015 evidence.

### Test Coverage Summary

The Auto Test column is the same for every row. The story's Test Evidence names an existing test file, and that file ran in the full suite (1,395/1,395). The story's Completion Notes record a /code-review verdict that names lead-programmer and qa-tester, plus a mutation check that failed as expected.

| Story | Type | Auto Test | Manual QA | Result |
|---|---|---|---|---|
| TM-001 | Logic | Pass | Not required | PASS |
| TM-002 | Logic | Pass | Not required | PASS WITH NOTES: AC boxes unticked; Completion Notes say all criteria pass |
| TM-003 | Logic | Pass | Not required | PASS |
| TM-004 | Logic | Pass | Not required | PASS |
| TM-005 | Logic | Pass | Not required | PASS |
| TM-006 | Logic | Pass | Not required | PASS |
| TM-007 | Integration | Pass | PASS, Glass Veil Brief vs deploy (details below the table) | PASS WITH NOTES: Opening hour is not printed on the Brief, so it was compared through the front time |
| TM-008 | Logic | Pass | Not required | PASS WITH NOTES: AC boxes unticked; Completion Notes say all criteria pass |
| TM-009 | Logic | Pass | PASS, qa-lead review of `production/qa/evidence/tm-009/` (details below the table); sign-off recorded | PASS WITH NOTES: dusk and night were compared across different missions |
| TM-010 | Logic | Pass | Not required | PASS |
| TM-011 | Logic | Pass | Not required | PASS |
| TM-012 | Logic | Pass | Not required | PASS |
| TM-013 | Integration | Pass | PASS, Abort path (details below the table) | PASS WITH NOTES: a first run with the strategic clock running moved only Asia Control/Unrest, through a World Network event after the return |
| TM-014 | Logic | Pass | Not required | PASS |
| TM-015 | Integration | Pass | PASS, fixed camera, signed off by qa-lead (`production/qa/evidence/tm-015/`) | PASS |
| TM-016 | Logic | Pass | Not required | PASS |

**Manual QA details**

- **TM-007, Glass Veil Brief vs deploy**:
  - Insertion, objective order and extraction match.
  - Counts match: 22 civilians, 8 patrols, 7 garrison.
  - The weather front fired at sim t 150 s with the log line "22:16:38 WEATHER FRONT. RAIN LIFTS.", matching the Brief.
- **TM-009, qa-lead review of `production/qa/evidence/tm-009/`**:
  - All shots are 1280x720.
  - The clock moved from 22:14:10 to 22:14:43 while the sky and shadows stayed the same.
  - Dusk and night look different.
- **TM-013, Abort path**:
  - No Debrief: the phase went from mission straight to world.
  - With the strategic clock paused, these were identical before and after: credits, roster, operatives, contractsWon, Influence, sectors, contracts, events, research and strategic t.
  - The 3 s confirm window and a clean redeploy also pass.

### Bugs Found

- Filed in Phase 5: none.
- Open bugs on file (Phase 1): none. `production/qa/bugs/` does not exist, so this means there are no bug records, not that a bug list was triaged clean.
- Open by severity: S1 0, S2 0, S3 0, S4 0.

Two observations are not filed as bugs, because the governing documents define no failing behaviour for them:
- **GDD OQ3: does gunfire damage Devices?** In the smoke run, squad auto-fire took relay d2 from 120 to 0, while an explicit Attack on a Device was refused. The GDD leaves this open, so it is a design question for game-designer, not a defect.
- **TM-013 first run**: the Asia Control/Unrest movement came from a World Network event that fired while the strategic clock ran. With the clock paused, the state was identical, and no abort-path defect was observed.

### Verdict: APPROVED WITH CONDITIONS

The verdict rules were applied in order:
1. **NOT APPROVED** is not triggered. No S1 or S2 bug is open from Phase 1 or Phase 5, and no story failed.
2. **The precondition is met.** All 16 stories produced executed evidence: the automated suite ran 1,395/1,395, and 4 manual cases were walked or reviewed. The smoke check was PASS, not UNKNOWN or NOT ASSESSED.
3. **APPROVED vs APPROVED WITH CONDITIONS**: five stories are PASS WITH NOTES with documented notes (TM-002, 007, 008, 009, 013), so APPROVED WITH CONDITIONS applies.

The orchestrator checked the verdict against the same rules and agrees. It also confirmed TM-002 and TM-008 each have 3 unticked acceptance-criteria boxes.

**Conditions**
1. **TM-002 and TM-008 hygiene.** Tick the acceptance-criteria boxes in both story files, or record why they stay unticked. Their Completion Notes already say all criteria pass. Owner: story authors. No code change needed.
2. **GDD OQ3.** Game-designer decides whether gunfire damages Devices:
   - If yes, the refusal of an explicit Attack on a Device is inconsistent with auto-fire and needs a story or a bug.
   - If no, auto-fire damaging relay d2 is a defect.
   - Carry the decision into the Sprint 9 plan. It does not block sign-off because the GDD does not specify the behaviour.
3. **Labelled fixtures.** Smoke items 4 and 7 were verified through fixtures F1 and F2 rather than by reaching them in normal play, which the plan allows. Keep the labels in the smoke record. Reaching Rust Haven and the Hardened setting in normal play is still unverified end to end.
4. **TM-007 Brief gap.** The Opening hour is not printed on the Brief, so it was checked indirectly through the weather-front time. Advisory only. Raise it with the story owner if the Brief should show it.
5. **TM-009 caveat.** The dusk-vs-night comparison used two different missions. This is accepted in the recorded sign-off.

### Next Step

The conditions above are documentation and design follow-ups, and none blocks closing the sprint. Do not run /gate-check: this project runs it only when moving to a new stage. Close the sprint with this QA sign-off, then run `/retrospective`, then `/sprint-plan new`. Include the OQ3 design decision in the Sprint 9 planning inputs.
