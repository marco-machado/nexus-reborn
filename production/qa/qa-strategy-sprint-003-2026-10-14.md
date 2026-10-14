# QA Strategy: Sprint 003 (Economy and contracts) - 2026-10-14

Author: qa-lead. Config: qa.level=standard, team.size=individual, review_mode=lean.
Governing plan: `production/qa/qa-plan-sprint-003-2026-10-13.md` (this strategy confirms it; no reclassification).
Sprint goal: Economy ledger and invoice. Invoice UI (EC-022) is out of scope for this sprint.

## Smoke Check

PASS WITH WARNINGS - source `production/qa/smoke-2026-10-14.md` (838/838 tests, build and lint clean, 7/7 critical paths PASS in live browser). Warning: one unexplained 181 ms World Network frame; advisory only, nothing in Sprint 3 touches rendering. Not a hand-off blocker.

Independent re-verification this turn: `npm run test` => 43 files, 838/838 pass at HEAD a2bbf60 (from the brief; not re-run by me).

## Open bugs in scope

None on file (`production/qa/bugs/` has no open records for these stories, per brief).

## Strategy table

| Story | Type | Automated Required | Manual Required | Blocker? |
|---|---|---|---|---|
| EC-001 Credits ledger | Logic | Yes (BLOCKING) - present | No | No |
| EC-002 No overdraw | Logic | Yes (BLOCKING) - present | No | No |
| EC-003 No Influence/Intel ledger | Logic | Yes (BLOCKING) - present | No | No |
| EC-005 Collateral first-hits | Logic | Yes (BLOCKING) - present | No | No |
| EC-006 Collateral clamps | Logic | Yes (BLOCKING) - present | No | No |
| EC-007 Net payout | Logic | Yes (BLOCKING) - present | No | No |
| EC-008 Worked examples | Logic | Yes (BLOCKING) - present | No | No |
| EC-009 Loss pays nothing | Logic | Yes (BLOCKING) - present (appStore + worldStore) | No | No |
| EC-010 Quiet replay | Logic | Yes (BLOCKING) - present | No | No |
| EC-012 Debrief applies once | Integration | Yes (BLOCKING) - present | No (documented playtest not needed; integration test exists) | No |

No Visual/Feel, UI or Config/Data stories in scope, so no screenshot or sign-off evidence is required.

## Spot-check: describe blocks and criteria coverage

All ten named describe blocks exist in `src/state/appStore.test.ts` (EC-001 L760, EC-003 L876, EC-005 L998, EC-006 L1051, EC-007 L1153, EC-008 L1234, EC-002 L1317, EC-009 L1458, EC-010 L1578, EC-012 L1709). The EC-009 worldStore test exists at `src/state/worldStore.test.ts` L481. `applyDebrief apply-once (ADR-0021)` (cited by EC-012) exists at appStore.test.ts L525. Test names were checked against every acceptance criterion for all ten stories; assertions were read in full for the riskier stories.

Stories whose assertions I read: EC-005, EC-006 (first criteria), EC-008 (pyrrhic), EC-009 (failed generated), EC-010 (frozen slice and outcome-sourced quietness), EC-012 (all three ACs plus the Tax catch-up case). Each asserts the exact figures in its criteria (for example 203,450 CR after a double apply, 85,000 CR on a pyrrhic win, 41,000 collateral cap, instance removed from `contracts` while `keep` remains, credits equal to START_CREDITS).

Coverage notes (observations, none is a defect against its spec):
- EC-005: the "same civilian hit twice" and "CorpSec-only" criteria are asserted at the outcome-DTO level (N=1, N=0 give 5,000 and 0 CR). That matches the story's own scope note: unique-hit counting belongs to Tactical. Counting is exercised in `src/game/world.test.ts` (civiliansHit asserted 0 or 1 at L882, L1006, L1027, L1056, L1107, L1127). I confirmed those assertions exist but did not read each scenario to confirm which map to "hit twice" vs "CorpSec-only".
- EC-006: the criteria are covered, plus extra edges (Infinity, non-integer and non-finite Reward).
- EC-010 AC4 (frozen `quietReplay` false, no restamp) is covered by a dedicated test.
- EC-012: the criterion that Credits stay put during a running mission is covered by an integration test driving `createWorld` and `tick` for 120 s of sim time with a per-frame Credits check.
- Stories not fully read line by line (EC-001, EC-002, EC-003, EC-007): test titles map one-to-one to the criteria, and the suite passes 838/838. Medium confidence on these, accepted at `qa.level: standard`.

## Stories with no executed evidence

None. All ten stories have an automated test mapped to each acceptance criterion, and the full suite (838/838) executed and passed at HEAD a2bbf60.

## Blockers / missing criteria / missing evidence

None. No story is missing a test file or an acceptance criterion.

## Manual QA effort estimate

0 hours required. Optional: ~15 minutes of exploratory pass through one win and one loss debrief to eyeball the Credits balance; this is advisory and not a gate, because the invoice UI (EC-022) is not yet built.

## Residual risks (non-blocking)

- Unexplained 181 ms World Network frame (smoke warning). Advisory. Re-check at next smoke run; no Sprint 3 story touches rendering.
- Stories EC-004, EC-011, EC-013 to EC-022 are out of this sprint's scope and are not assessed here.

## Verdict for Phase 2

Ready to proceed. Sprint 003 in-scope stories have executed automated evidence for all acceptance criteria, smoke is PASS WITH WARNINGS (advisory only), and no open bugs.
