## QA Sign-Off Report: Sprint 7 — Roster and Assembly
**Date**: 2026-10-16
**QA level**: standard
**Scope**: 23 stories (all `done` in `production/sprint-status.yaml`): 17 Logic, 5 Integration, 1 UI
**Strategy**: `production/qa/qa-strategy-sprint-007-2026-10-16.md`
**Plan**: `production/qa/qa-plan-sprint-007-2026-10-15.md` (reused; no new plan this cycle)
**Smoke check**: NOT ASSESSED (`production/qa/smoke-2026-10-16-sprint-007.md`). Nothing failed. Item 4 (the injury-presentation half) and item 8 (frame spikes) did not run at smoke time. Both were exercised later in manual QA, but the smoke check was not re-run. The user accepted the smoke verdict and asked to proceed.
**Run**: `/team-qa sprint`, automation autonomous, team.size individual (qa-lead at gates, qa-tester for cases). Drafted by qa-lead; the orchestrator checked the verdict against the rules. Full suite 1,278/1,278 passing (50 files); build and lint exit 0. Manual QA run by Claude in the in-app browser.

### Test Coverage Summary

| Story | Type | Auto Test | Manual QA | Result |
|---|---|---|---|---|
| RA-001 | Logic | Exists, passing | — | PASS |
| RA-002 | Logic | Exists, passing | — | PASS |
| RA-004 | Logic | Exists, passing | — | PASS |
| RA-005 | Logic | Exists, passing | — | PASS |
| RA-007 | Logic | Exists, passing | — | PASS |
| RA-008 | Logic | Exists, passing | — | PASS |
| RA-009 | UI | n/a | RA9-01..08 PASS on a labelled constructed fixture; 0 clipped elements at 100% and 125% | PASS WITH NOTES |
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
| RA-021 | Logic | Passing; research-side evidence relies on research Stories 013–015 | — | PASS WITH NOTES |
| RA-022 | Logic | Exists, passing | — | PASS |
| RA-023 | Logic | Exists, passing | — | PASS |
| RA-024 | Logic | Exists, passing | — | PASS |
| RA-025 | Integration | Exists, passing (4 ACs); `/code-review` of `save.test.ts` NOT ASSESSED | — | PASS WITH NOTES |

- **RA-009**: RA9-02 first read NO CONTRACT SELECTED after RETURN TO WORLD NETWORK. That is correct under ADR-0019, which checks for a contract first, so the case's precondition was wrong. Re-run with a contract selected, it read NO OPERATIVES ASSIGNED: PASS. Retained screenshots are on disk: `production/qa/evidence/ra-009/01–03*.png`, plus `production/qa/evidence/ra-013/02, 03`.
- **RA-013**: INJ-03 was not reachable. The win's 2-day ETA catch-up (48 h) is longer than the 48 h maximum recovery. INJ-03b covered it on the fixture (GHOST 28H, expected 27.43 h). The sign-off rows in `production/qa/evidence/ra-013-evidence.md` are unchecked.
- **RA-025**: the TR-roster-006 re-map is still open (docs only).

### Bugs Found

None filed in Phase 5. No open bugs are on file for this scope (`production/qa/bugs/` does not exist). S1/S2 open: 0; S3/S4 open: 0.

### Verdict: NOT ASSESSED

- **NOT APPROVED check**: no open S1/S2 bug and no story failed.
- **Story evidence**: all 23 stories have executed evidence (passing tests and/or walked manual cases).
- **Smoke precondition**: the smoke check was NOT ASSESSED, so the rules make this sign-off NOT ASSESSED. This cycle's manual QA covered both smoke gaps (injury presentation PASS; frame time p95 ≤ 9 ms, 0 frames over 50 ms), but no smoke report records them.
- No defect was found. This verdict is neither a pass nor a fail.

**To close out** (not conditions):
1. Re-run `/smoke-check quick` so the smoke report records item 4 and item 8, then re-run `/team-qa`.
2. Run `/code-review` on `src/state/save.test.ts` (RA-025).
3. Review `production/qa/tautological-tests-2026-10-16.md`: the PASS rows currently mean "exists and passes".
4. Re-map TR-roster-006 against RA-025 (docs).
5. Get a human sign-off on the rows in `ra-013-evidence.md`.
6. Fix RA9-02's precondition in the RA-009 case file (contract selected).

### Next Step

QA did not run to completion: the missing evidence is a smoke check that ran clean. Re-run `/smoke-check`, then re-run `/team-qa`. Do not advance the build on this verdict. If the re-run smoke check passes, the expected outcome is APPROVED WITH CONDITIONS, with the PASS WITH NOTES items as the conditions. That outcome has not been verified.

### Notes

- RA-009 and INJ-03b used a labelled constructed fixture. They are not natural-play results.
- Performance was observed only, at about 120 Hz cadence in the in-app browser. No budget was asserted.
- The browser pane was hidden for part of the run. That slowed the real-time clock rate but did not change any outcome.
