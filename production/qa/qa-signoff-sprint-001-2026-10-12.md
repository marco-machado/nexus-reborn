## QA Sign-Off Report: Sprint 1
**Date**: 2026-10-12
**Plan**: `production/qa/qa-plan-sprint-001-2026-10-12.md` · **Strategy**: `production/qa/qa-strategy-sprint-001-2026-10-12.md`

### Test Coverage Summary
| Story | Type | Auto Test | Manual QA | Result |
|---|---|---|---|---|
| WN-001 | Logic | `worldStore.test.ts`, `ui/clock.test.ts`: ran, passed | Not required | PASS |
| WN-002 | Logic | `worldStore.test.ts`: ran, passed | Not required | PASS |
| WN-003 | Integration | `appStore.test.ts`, `worldStore.test.ts`: ran, passed | Smoke path 6: live win, t +172,800 s exactly, apply-once re-checked. PASS | PASS |
| WN-004 | Integration | `missionParams.test.ts`, `world.test.ts`, `missionStore.test.ts`: ran, passed | Smoke path 5: confirmed Abort, world blob byte-identical. PASS | PASS |
| WN-006 | Logic | `worldStore.test.ts`, `save.test.ts`: ran, passed | Not required | PASS |
| WN-007 | Logic | `worldStore.test.ts`: ran, passed | Not required | PASS |
| WN-015 | Logic | `worldStore.test.ts`: ran, passed | Not required | PASS |
| WN-016 | Logic | `ownership.test.ts`, `worldStore.test.ts`: ran, passed | Not required | PASS |
| TM-017 | Logic | `world.test.ts`, `citygen.test.ts`: ran, passed | Not required | PASS |
| RA-006 | Logic | `deployGate.test.ts`, `appStore.test.ts`: ran, passed | Not required (screenshots in `evidence/ra-006`) | PASS |
| IF-009 | UI | Supporting: `world.test.ts` AC15 block: ran, passed | MC-2, TC01–TC08 PASS; captures in `evidence/if-009/mc2-2026-10-12/` | PASS WITH NOTES |
| IF-011 | UI | Supporting: `debriefFlags.test.ts`: ran, passed | MC-1, TC01–TC09 PASS; 16 captures re-taken (fixes C1) | PASS |

- **Automated run**: `npm run test` at 879bb68, 2026-10-12 15:44. 41 files, 705/705 passed.
- **Smoke check**: PASS (`production/qa/smoke-2026-10-12.md`).

### Bugs Found
None. Phase 5 filed no bugs, and no open bugs in scope were on file (`production/qa/bugs/` does not exist).

### Verdict: APPROVED WITH CONDITIONS
No S1/S2 bugs are open and no story failed. All 12 stories have executed evidence, and the smoke check passed. IF-009 passed with notes.

**Conditions**:
1. **IF-009 note (a)**: a designer confirms that a quiet-replay win should still take about 4,000 CR of tax yield through the ETA catch-up (`src/state/debrief.ts:56`). Only the fee is waived today. If this is not intended, file a bug against the Debrief write-back.
2. **IF-009 note (b)**: record that it is acceptable for a stale `appStore.outcome` to persist into the next mission (it is unread and guarded by the apply key), or schedule a cleanup.
3. **IF-009 story file**: tick the AC15 and AC16 checkboxes to match the MC-2 result.

### Conditions resolution (2026-10-12)
1. **Closed: by design.** `docs/game-design.md:528` says a quiet replay is "still a real mission — KIA, injury, experience, and ETA apply. ETA still advances strategic time, so Tax yield still collects" (ADR-0004; see also §1012). The code matches the GDD, so there is no bug.
2. **Closed: accepted.** The stale `appStore.outcome` during the next mission is not read by Mission and cannot be re-applied, because Debrief applies only keys above `lastAppliedKey` (ADR-0021). The owner delegated the call, and it was accepted with no cleanup scheduled.
3. **Closed.** The IF-009 AC15 and AC16 checkboxes are ticked in the story file.

### Next Step
All conditions are resolved. The build is ready for the next phase: commit this cycle's evidence, then run `/gate-check`.

### Observations (non-blocking)
- **`taxPaid: 0` leak**: `applyMissionResult` leaks a session-only `taxPaid: 0` key (`src/state/worldStore.ts:913`). Candidate S4 for `/bug-report`.
- **IF-009 lost-run delay sample**: invalid because of a harness glitch. The won-run delay measured 2.49 s of sim time, and the exact 2.5 s is asserted by unit tests.
- **IF-011 evidence sign-off row**: left unchecked. UI stories are closed by their screenshots.
- **Documentation drift C2–C4**: corrected in the 2026-10-12 plan. The superseded 2026-10-09 plan and the smoke table still cite the wrong test files for IF-009 and WN-007.
- **Perf sample**: taken in headless Chrome on a Mac, not on a target device.
- **Uncommitted evidence**: this cycle's evidence (the IF-011 captures, the IF-009 MC-2 folder, the evidence docs, test cases, plan and strategy) is not committed yet. Commit it before `/gate-check`.
