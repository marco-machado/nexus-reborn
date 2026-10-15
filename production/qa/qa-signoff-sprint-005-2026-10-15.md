## QA Sign-Off Report: Sprint 5

**Sprint**: Sprint 5, Research epic (RS-001 to RS-020)
**Date**: 2026-10-15
**Revision**: 01d0d97
**qa.level**: standard
**Smoke check**: `production/qa/smoke-2026-10-15-sprint-005.md`, PASS (9/9 items in headed Chrome at 1280x720; 1,045/1,045 tests; build and lint clean)
**Run**: `/team-qa sprint`, automation autonomous, team.size individual. qa-lead drafted the report and the orchestrator checked the verdict against the rules and agrees. QA plan: `production/qa/qa-plan-sprint-005-2026-10-14.md`.

### Test Coverage Summary

| Story | Type | Auto Test | Manual QA | Result |
|---|---|---|---|---|
| RS-001 | Logic | `research.test.ts`, `researchStore.test.ts` | — | PASS |
| RS-002 | Logic | `appStore.test.ts` | — | PASS |
| RS-003 | Logic | `appStore.test.ts` | — | PASS |
| RS-004 | Logic | `researchStore.test.ts` | — | PASS |
| RS-005 | Logic | `appStore.test.ts` | Smoke 3: refusal text on screen | PASS |
| RS-006 | Logic | `appStore.test.ts`, `research.test.ts` | Smoke 4: in-field authorize refused | PASS WITH NOTES |
| RS-007 | Logic | `researchStore.test.ts` | — | PASS |
| RS-008 | Logic | `researchStore.test.ts` | — | PASS |
| RS-009 | UI | remaining oracle and paint unit tests | `production/qa/evidence/rs-009-evidence.md` + 2 screenshots; smoke 5 probe | PASS WITH NOTES |
| RS-010 | Integration | `appStore.test.ts` | Smoke 7: loss and abort leave labs and `done` unchanged | PASS |
| RS-011 | Logic | `researchStore.test.ts` | Smoke 5: `done` in ascending endT | PASS |
| RS-012 | Logic | `researchStore.test.ts`, `research.test.ts` | — | PASS |
| RS-013 | Logic | `research.test.ts` | — | PASS |
| RS-014 | Logic | `research.test.ts` | — | PASS |
| RS-015 | Logic | `research.test.ts`, `appStore.test.ts` | — | PASS |
| RS-016 | Integration | `world.test.ts` | Smoke 6 | PASS |
| RS-017 | Integration | `world.test.ts` | Smoke 6: forced mid-mission completion leaves the running mission unchanged | PASS WITH NOTES |
| RS-018 | Logic | `research.test.ts` | — | PASS |
| RS-019 | Logic | `research.test.ts` | — | PASS |
| RS-020 | Integration | `missionParams.test.ts`, `forecast.test.ts`, `research.test.ts` | Not walked on screen (Chance UI) | PASS |

PASS WITH NOTES:
- **RS-006:** the in-field refusal text is only "Credits did not change." The story accepts this: in-field is not a Research-screen refusal reason.
- **RS-009:** two remaining labels (lab bay and detail panel) share one test id. The evidence doc still needs lead-programmer sign-off. The `H:MM:SS` format is a default pending owner confirmation (P-22).
- **RS-017:** a third acceptance criterion was added mid-sprint, with owner approval (`0bb7c15`).

### Bugs Found

None on file: `production/qa/bugs/` does not exist, which means no bug records, not a verified-clean register. None were filed this cycle. Advisory: a single 180–250 ms World Network frame has recurred since sprint 3. The measurement windows differ, so there is no trend, and the cause is unknown. Retro task R-3 covers it.

### Verdict: APPROVED WITH CONDITIONS

No open S1/S2 bug and no FAIL, so NOT APPROVED does not apply. All 20 stories have executed evidence and the smoke check is PASS, so NOT ASSESSED does not apply. RS-006, RS-009 and RS-017 are PASS WITH NOTES with documented notes, which is the APPROVED WITH CONDITIONS rule.

**Conditions**
1. Lead-programmer sign-off on `production/qa/evidence/rs-009-evidence.md`, and owner confirmation of the `H:MM:SS` remaining-time format (P-22).
2. Resolve the duplicate RS-009 remaining-label test id: make the ids unique, or record the duplication as intended in the story.
3. R-3: profile the World Network frame spike with a trace by 2026-10-21. If it is reproducible, file it via `/bug-report` before the Sprint 6 sign-off.

**Carried from Sprint 4**: condition 1 (a real mission walked to Debrief on the current build) is met by this smoke run's loss Debrief (`p7-loss-debrief`).

### Next Step

Resolve conditions 1 and 2 before advancing; condition 3 is due 2026-10-21. Add an on-screen Chance check (RS-020) to the next smoke scope. Then run `/retrospective` and `/sprint-plan new`.
