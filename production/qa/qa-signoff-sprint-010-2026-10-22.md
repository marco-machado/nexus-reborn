## QA Sign-Off Report: Sprint 10
**Date**: 2026-10-22
**qa.level**: full · **Build**: 74d3268 · **Smoke**: PASS WITH WARNINGS (`production/qa/smoke-2026-10-22-sprint-010.md`)
**Run**: `/team-qa sprint` (autonomous; decisions in `production/session-logs/decision-log.md`). Strategy: `production/qa/qa-strategy-sprint-010-2026-10-22.md`. Plan: `production/qa/qa-plan-sprint-010-2026-10-22.md` (with addendum).

### Test Coverage Summary
| Story | Type | Auto Test | Manual QA | Result |
|---|---|---|---|---|
| WN-020 Rust Haven opens at intel 1; Glass Veil/Hollow Crown at 2 | Logic | `data.test.ts`, `campaignStore.test.ts`, `appStore.test.ts`, `save.test.ts`: ran and passed (1626/1626) | Not required. Spot-checks IF013-20/21 PASS | PASS |
| EC-023 One Moderate market offer seeded at New Operation | Logic | `contracts.test.ts`, `worldStore.test.ts`, `save.test.ts`, `appStore.test.ts`: ran and passed (1626/1626) | Not required. Smoke item 4 took the seeded NEON GARDEN offer through to Debrief (sim-assisted) | PASS |
| IF-013 Four-row orientation card + sector-panel Influence moment | UI | `worldOnboard.test.ts`, `tutorialStore.test.ts` (seams): passed | 21 cases: 18 PASS, 0 FAIL, 1 BLOCKED, 2 OBSERVATION. The BLOCKED case is IF013-16, the optional real clean-win path; fixture case IF013-11 covers AC4. The observations are IF013-18 and IF013-19. Every AC PASS. Screenshots in `production/qa/evidence/if-013/manual-2026-10-22/`; evidence doc `production/qa/evidence/if-013-evidence.md`. 0 console errors | PASS WITH NOTES |
| IF-014 First-Debrief Research prompt | Integration | `debriefResearch.test.ts`, `appStore.test.ts`, `save.test.ts`, `tutorial.test.ts`: passed | 14 cases: 12 PASS, 0 FAIL, 0 BLOCKED, 2 OBSERVATION (TC01, TC07); supplementary TC07b PASS. Capture harness ALL PASS. Results in `production/qa/evidence/if-014/manual-2026-10-22/results.md` | PASS WITH NOTES |
| IF-015 Brief KIT line from objective kinds | UI (unit seam) | `kitLine.test.ts`: passed | 18 cases (12 IF-015, 6 BUG-0009): 18 PASS. All 28 Brief cells clean at 4 scales, recaptured after the BUG-0009 fix. Evidence doc `production/qa/evidence/if-015-evidence.md` | PASS |

**Smoke warnings (noted):**
1. *Resolved this cycle.* The if-001 sweep/perf harness was retargeted to Rust Haven (`production/qa/evidence/sprint-010-sweep-perf-2026-10-22/`).
   - Sweep: ALL SURFACES CLEAN, 0 console errors. Assist: all three relays were hand-killed.
   - Perf: steady p95 9.1–9.5 ms. One mission-entry frame of 342 ms and one world-return frame of 216 ms, the same shape as the 2026-10-14 baseline (356.8 / 206.4 ms).
2. *Stands.* Mission play was sim-assisted.
3. *Stands.* World Network p95 of 9.2 ms passes only on the user's earlier ruling. Max frame 33.3 ms, under 50.
4. *Stands.* Audio listening was not re-run.

### Bugs Found
| ID | Story | Severity | Status |
|---|---|---|---|
| BUG-0009 | IF-015 (Interface Brief) | S3-Medium | Verified Fixed (2026-10-22, build 74d3268, TC-01..06), not yet Closed |

No bugs were filed in Phase 5, and no S1/S2 bug is open. BUG-0008 (S3-Medium, Audio, Open, not reproduced) is carried from a system outside this sprint's scope and is not counted in this verdict.

### Verdict: APPROVED WITH CONDITIONS

**Conditions**:
1. **Close BUG-0009** with `/bug-report close BUG-0009`. It is Verified Fixed on 74d3268 but has no closure record yet.
2. ~~**Route the IF-013 observations to their owners.**~~ **Done 2026-10-22.** The owner (Marco Machado) ruled on both. The earlier text said IF013-19 was "under the owner's ruling"; that was wrong, because the story listed that ruling as still needed.
   - IF013-18: hide the note when the focus moves. Fixed in `src/ui/worldOnboard.ts` (`influenceMomentShown`) and `src/ui/WorldMap.tsx`, with a unit test in `worldOnboard.test.ts`. `npm test` 1627/1627, lint and build pass. Capture `production/qa/evidence/if-013/refocus-fix-2026-10-22/` ALL PASS.
   - IF013-19: keep on-fire marking. AC4 is reworded in the story and the behaviour is accepted.
3. ~~**IF-014 observations are documented and need no action.**~~ **Done 2026-10-22.** Both observations came from the case text, not the game, so I corrected the cases in `production/qa/test-cases/if-014-first-debrief-research-prompt-cases.md`:
   - TC01: the expected balance is now `payout + Tax deposited during the ETA catch-up`, the economy GDD identity. The first run found +4,169 Tax.
   - TC07: step 2 now passes `quietReplay: true`, as `deployFreeze.ts:27` sets for an already-won contract. That is the TC07b path, which passed.
4. **Carry the IF-015 coverage gaps into the next QA plan.**
   - The bottom row of the tactical-map stats rail sits under the fade and becomes readable when scrolled. Only m03 at 125 was checked.
   - Not walked by hand: reclient/Expedite between Brief and deploy (unit test only), MODERATE generated contracts, and other resolutions.
5. **Smoke warnings 2–4 stand.**
   - Mission play stays sim-assisted.
   - The World Network p95 relies on the earlier user ruling.
   - Audio listening is still owed and belongs with BUG-0008.
   - Whether a new player can win the EC-023 offer is a playtest question for a later sprint.

### Next Step
Resolve the conditions before advancing. S3/S4 bugs may be deferred to polish. Under the project rule, the sprint closes with this sign-off, then `/retrospective`, then `/sprint-plan new`. This is not a stage change, so do not run `/gate-check`.

---
Deciding rule (qa-lead; checked by the orchestrator against the same rules):
- No open S1/S2 bug and no FAIL ruled out NOT APPROVED.
- Every story produced executed evidence, and the smoke check was PASS WITH WARNINGS rather than UNKNOWN or NOT ASSESSED, so NOT ASSESSED does not apply. IF013-16 is a single BLOCKED case, not a BLOCKED story.
- IF-013 and IF-014 are PASS WITH NOTES with no S1/S2 open, which makes the verdict APPROVED WITH CONDITIONS.
