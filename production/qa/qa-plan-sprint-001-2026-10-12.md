# QA Plan: Sprint 1 (team-qa cycle)
**Date**: 2026-10-12
**Supersedes**: `production/qa/qa-plan-sprint-001-2026-10-09.md` for this cycle. That plan covered 8 stories. It omitted IF-009, and it listed IF-011 as having no automated test.
**Strategy**: `production/qa/qa-strategy-sprint-001-2026-10-12.md`
**Config**: qa.level standard · team.size individual · automation autonomous

## Scope

Sprint 1 (`production/sprints/sprint-001.md`, 2026-10-09 to 2026-10-22): 12 stories, all `done` in `production/sprint-status.yaml`. `sprint-002.md` has no tasks.

## Story Classification

| Story | Type | Automated Required | Manual Required | Blocker? |
|---|---|---|---|---|
| WN-001 Strategic clock only on the four Screens | Logic | `src/state/worldStore.test.ts`, `src/ui/clock.test.ts` | No | No |
| WN-002 Win-ETA catch-up shares advanceFlow | Logic | `src/state/worldStore.test.ts` | No | No |
| WN-003 Debrief write-back at frozen t0, then ETA, once | Integration | `src/state/appStore.test.ts`, `src/state/worldStore.test.ts` | Walkthrough of record: smoke-2026-10-12 path 6 | No |
| WN-004 Abort leaves blob unchanged | Integration | `src/game/missionParams.test.ts`, `src/game/world.test.ts`, `src/state/missionStore.test.ts` | Walkthrough of record: smoke-2026-10-12 path 5 | No |
| WN-006 Timeline Review is a view | Logic | `src/state/worldStore.test.ts`, `src/state/save.test.ts` | No | No |
| WN-007 Tax yield only from Nexus-held sectors | Logic | `src/state/worldStore.test.ts` (corrected: `ownership.test.ts` has no tax tests) | No | No |
| WN-015 Mission result shoves Control/Unrest | Logic | `src/state/worldStore.test.ts` | No | No |
| WN-016 City holder after a win or loss | Logic | `src/game/ownership.test.ts`, `src/state/worldStore.test.ts` | No | No |
| TM-017 Rolled hit strikes first body on fire lane | Logic | `src/game/world.test.ts`, `src/world/citygen.test.ts` | No | No |
| RA-006 canDeploy 1–4 Ready operatives | Logic | `src/game/deployGate.test.ts`, `src/state/appStore.test.ts` | No (evidence `ra-006/` present) | No |
| IF-009 Result display, Debrief delay, quiet replay ban | UI | Supporting: `src/game/world.test.ts` AC15 block (corrected: not `debriefFlags.test.ts`) | MC-2 spot check | No |
| IF-011 Pyrrhic banner, failed-campaign Debrief | UI | Supporting: `src/ui/debriefFlags.test.ts` | MC-1 re-capture | Conditional: screenshots predate f777b18 and 96b9b05 |

## Automated Test Requirements

All 10 Logic/Integration stories have test files at the paths above. Evidence is `npm run test`: 705/705 per smoke-2026-10-12. No new test files are required this cycle.

## Manual QA Scope

Claude executes the cases in headless Chrome (`playwright-cli`) at 1280×720 against `npm run dev -- --strictPort --port 4200`.

- **MC-1 IF-011**: four fixtures (pyrrhic-win, win, failed-loss, loss) at text scales 90/100/110/125. Validate each of these:
  - The banner is the first child and dominant.
  - Focus lands on the banner on entry.
  - Replay is hidden only when the campaign has failed.
  - The pyrrhic note text is right and the payout is unchanged.
  - Nothing clips and the page does not scroll.

  Re-capture into `production/qa/evidence/if-011/`. Cases: `production/qa/test-cases/if-011-pyrrhic-win-banner-cases.md`.
- **MC-2 IF-009**: check that these match `if-009/01-06`:
  - The mission result banner for Won and Lost.
  - The Debrief entry delay.
  - Quiet-replay Debrief for Won and Lost.
  - The two-step Abort, with no Debrief after it.

  Cases: `production/qa/test-cases/if-009-result-display-debrief-delay-cases.md`.

## Out of Scope

- **WN-003 and WN-004 manual walkthroughs**: already executed live as smoke-2026-10-12 paths 5 and 6, with measured values.
- **Logic stories**: their acceptance criteria are the unit tests.
- **Target-device performance**: the smoke sample was headless Chrome on a Mac, so this is deferred to the milestone gate.
- **Audio and later epics**: not in Sprint 1.

## Entry Criteria

1. A smoke report with PASS exists: `production/qa/smoke-2026-10-12.md`. Met.
2. The build is stable, with no crash on launch. Met (smoke path 1).
3. All Must Have stories are `in-progress`, `review` or `done`. Met: all 12 are `done`.
4. The dev server binds port 4200, and the port is free afterwards.

## Exit Criteria

- MC-1 and MC-2 are executed, with Actual Result and Pass/Fail filled in.
- The IF-011 screenshots are re-captured at the current HEAD.
- Every story is PASS, or FAIL with a bug filed in `production/qa/bugs/`.
- The sign-off report is written.
