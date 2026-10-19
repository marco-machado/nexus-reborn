## QA Sign-Off Report: Sprint 7 — Roster and Assembly (re-run)
**Date**: 2026-10-16
**QA level**: standard
**Scope**: 23 stories (all `done` in `production/sprint-status.yaml`): 17 Logic, 5 Integration, 1 UI
**Strategy**: `production/qa/qa-strategy-sprint-007-2026-10-16.md` (updated; no blockers)
**Plan**: `production/qa/qa-plan-sprint-007-2026-10-15.md` (reused)
**Smoke check**: PASS (`production/qa/smoke-2026-10-16-sprint-007-quick.md`). All 8 plan items pass at `cfd2066`. It supersedes `smoke-2026-10-16-sprint-007.md` (NOT ASSESSED), which stays on file.
**Supersedes**: `production/qa/qa-signoff-sprint-007-2026-10-16.md` (NOT ASSESSED; smoke precondition unmet).
**Run**: `/team-qa sprint`, automation autonomous, team.size individual. Drafted by qa-lead; the orchestrator checked the verdict against the rules. Tests 1,278/1,278 (50 files); build and lint exit 0. Manual QA was run by Claude in the in-app browser.

### Test Coverage Summary

| Story | Type | Auto Test | Manual QA | Result |
|---|---|---|---|---|
| RA-001 | Logic | Exists, passing | — | PASS |
| RA-002 | Logic | Exists, passing | — | PASS |
| RA-004 | Logic | Exists, passing | — | PASS |
| RA-005 | Logic | Exists, passing | — | PASS |
| RA-007 | Logic | Exists, passing | — | PASS |
| RA-008 | Logic | Exists, passing | — | PASS |
| RA-009 | UI | n/a | RA9-01..08 PASS on a labelled fixture; 0 clipped elements at 100% and 125%; screenshots in `evidence/ra-009/` (3) and `evidence/ra-013/` (2) | PASS WITH NOTES |
| RA-010 | Logic | Exists, passing | — | PASS |
| RA-011 | Logic | Exists, passing | — | PASS |
| RA-012 | Logic | Exists, passing | — | PASS |
| RA-013 | Logic | Exists, passing | INJ-01, 02, 03b, 04, 05 PASS; INJ-03 not reachable; PERF-01 observed | PASS WITH NOTES |
| RA-014 | Integration | Exists, passing (5 ACs) | — | PASS |
| RA-015 | Logic | Exists, passing | — | PASS |
| RA-016 | Logic | Exists, passing | INJ-04, INJ-05 | PASS |
| RA-017 | Logic | Exists, passing | — | PASS |
| RA-018 | Integration | Exists, passing (5 ACs) | — | PASS |
| RA-019 | Integration | Exists, passing | — | PASS |
| RA-020 | Integration | Exists, passing | — | PASS |
| RA-021 | Logic | Named files (`campaignStore`, `researchStore` tests) exist and pass; the `research.test.ts` evidence is deferred to research Stories 013–015 and was not verified | — | PASS WITH NOTES |
| RA-022 | Logic | Exists, passing | — | PASS |
| RA-023 | Logic | Exists, passing | — | PASS |
| RA-024 | Logic | Exists, passing | — | PASS |
| RA-025 | Integration | Exists, passing (4 ACs); `/code-review` of `save.test.ts` NOT ASSESSED | — | PASS WITH NOTES |

- **RA-009**: RA9-02 first read NO CONTRACT SELECTED. That is correct under the ADR-0019 refusal order. The re-run with a contract selected passed. The case precondition is now fixed in the case file.
- **RA-013**: the win's 2-day ETA catch-up covers the 48 h maximum recovery, so INJ-03 is not reachable and the Assembly-side injury presentation is shown on a labelled fixture only (INJ-03b, C-8).

### Bugs Found

None filed this cycle. No open bugs are on file (`production/qa/bugs/` does not exist). S1/S2: 0; S3/S4: 0.

### Verdict: APPROVED WITH CONDITIONS

- **NOT APPROVED check**: no open S1/S2 bug and no story failed.
- **Precondition**: all 23 stories have executed evidence, and the smoke check is PASS.
- **Result**: every story is PASS or PASS WITH NOTES, with the notes documented. That makes the verdict APPROVED WITH CONDITIONS.

**Conditions**:
1. Lead sign-off on the rows in `production/qa/evidence/ra-013-evidence.md` (currently unchecked).
2. C-4: run `/code-review` on `src/state/save.test.ts` (RA-025), or have the producer accept the gap.
3. C-6: assess assertion quality against `production/qa/tautological-tests-2026-10-16.md`. PASS currently means "exists and passes".
4. C-5: re-map TR-roster-006 against RA-025 (docs only).
5. C-3: confirm that research Stories 013–015 cover RA-021's research-side ACs.
6. C-8: walk the Assembly injury presentation on natural state when a reachable path exists, or accept the fixture evidence.

Done during this run: the RA9-02 precondition in `ra-009-…-cases.md` was fixed.

### Next Step

Resolve the conditions before advancing. S3/S4 bugs may be deferred to polish (none are open). Per CLAUDE.md, the sprint closes with QA sign-off, then `/retrospective`, then `/sprint-plan new`.

### Notes

- Labelled constructed fixtures were used for RA-009, INJ-03b and the Assembly half of smoke item 4. The Debrief injury line came from a sim win.
- PERF-01 was observed only: p95 ≤ 9 ms and 0 frames over 50 ms. No budget was asserted.
- No human has played this build. Missions were driven through sim order calls.

### Conditions update — 2026-10-19 (Sprint 9 retro task R-4)

1. **Closed.** `production/qa/evidence/ra-013-evidence.md` sign-off rows signed by Marco Machado, 2026-10-19.
2. **C-4 closed.** `/code-review` run on `src/state/save.test.ts` (RA-025): ADR-0011 compliant; three test gaps confirmed by mutation and fixed (loadout restore not wipe-proof, pin bay check untested, AC3 without a control). Detail and open suggestions in the RA-025 story Completion Notes.
3. **C-6 closed.** Assessed by `production/qa/tautological-tests-2026-10-16.md`: the Sprint 7 test diff was read line by line and every test file scanned; 24 tautological tests fixed or deleted, each shown to fail under a named mutation. PASS on Sprint 7 Logic/Integration rows now means the test can fail.
4. **C-5 closed.** RA-025 re-mapped from `TR-roster-006` to `TR-persistence-005` (with `-006` and `-007` for its tamper and RNG ACs); no new registry entry.
5. **C-3 closed.** Research Stories 013–015 cover RA-021: AC 35 by RS-015 AC1 and RS-013 AC1; AC 36 by RS-014 AC1–2 and RS-013 AC2; AC 37 by RS-015 AC3 and RS-014 AC4. Re-run 2026-10-19: `research.test.ts` 17 passed, `appStore.test.ts` RS-015 3 passed.
6. **C-8 closed.** Owner accepted the labelled-fixture evidence, 2026-10-19 (no natural path: a win's ETA heals the injury before Assembly).

