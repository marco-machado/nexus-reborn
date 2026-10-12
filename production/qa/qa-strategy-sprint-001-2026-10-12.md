# QA Strategy: Sprint 1 (Phase 2 of /team-qa)
**Date**: 2026-10-12
**Scope**: 12 stories, all marked done in `production/sprint-status.yaml`
**Config**: qa.level standard (test evidence for Logic/Integration is BLOCKING; UI/Visual screenshots are BLOCKING at every level), team.size individual, automation autonomous
**Inputs**: `production/qa/qa-plan-sprint-001-2026-10-09.md`, `production/qa/smoke-2026-10-12.md`, story files under `production/epics/*/`, `production/qa/evidence/`

---

## Story Classification

| Story | Type | Automated Required | Manual Required | Blocker? |
|---|---|---|---|---|
| WN-001 Strategic clock only on the four Screens | Logic | Yes: `worldStore.test.ts`, `ui/clock.test.ts` (present) | No (smoke path 3, 4, 8 passed live) | No |
| WN-002 Win-ETA catch-up shares advanceFlow | Logic | Yes: `worldStore.test.ts` (present) | No | No |
| WN-003 Debrief write-back at frozen t0, then ETA, once | Integration | Yes: `appStore.test.ts`, `worldStore.test.ts` (present) | Walkthrough already done (smoke path 6, win +172,800 s, apply-once re-checked) | No |
| WN-004 Abort leaves blob unchanged; frozen deploy slice | Integration | Yes: `missionStore.test.ts`, `missionParams.test.ts`, `world.test.ts` (present) | Walkthrough already done (smoke path 5, byte-identical blob) | No |
| WN-006 Timeline Review is a view, not a clock | Logic | Yes: `worldStore.test.ts`, `save.test.ts` (present) | No | No |
| WN-007 Tax yield only from Nexus-held sectors | Logic | Yes: `worldStore.test.ts` (present) | No | No (see Concern C4) |
| WN-015 Mission result shoves Control/Unrest | Logic | Yes: `worldStore.test.ts` (present, direction only) | No | No |
| WN-016 City holder after a win or loss | Logic | Yes: `ownership.test.ts`, `worldStore.test.ts` (present) | No (existing screenshots staged, advisory only) | No |
| TM-017 Rolled hit strikes first body on the fire lane | Logic | Yes: `world.test.ts`, `citygen.test.ts` (present) | No (owner re-play of Glass Veil done 2026-10-10 per plan) | No |
| RA-006 canDeploy allows 1 to 4 Ready operatives | Logic | Yes: `deployGate.test.ts`, `appStore.test.ts` (present) | Screenshot evidence present (`ra-006/` 01-04); smoke Deploy gate PASS | No |
| IF-009 Result display, Debrief entry delay, quiet-replay ban | UI | Yes (supporting): `world.test.ts` AC15 block (4 tests), `debriefFlags.test.ts` | Screenshots present (`if-009/` 01-06) | No, evidence adequate; see C2 |
| IF-011 Pyrrhic banner and failed-campaign Debrief actions | UI | Yes (supporting): `debriefFlags.test.ts` (9 tests) | Screenshots present (`if-011/`, 13 images) but stale; re-capture needed | **Yes, conditional: stale UI evidence (C1)** |

Gate summary: Logic/Integration 10 of 10 have test files (smoke coverage table: 12 covered, 0 missing). UI 2 of 2 have screenshots on disk. One UI evidence set is stale (C1).

---

## Smoke check
PASS, `production/qa/smoke-2026-10-12.md`: 705/705 vitest across 41 files, `npm run build` OK, 8 critical paths plus save/load, RA-006 deploy gate and 60 fps perf sample exercised live in headless Chrome by Claude; port 4200 listener confirmed gone. Used as the smoke source; not re-run in this phase.

## Open bugs
None on file in scope (`production/qa/bugs/` does not exist, so this is "no bug records", not a verified-clean count). One non-bug observation from smoke: `applyMissionResult` leaks a session-only `taxPaid: 0` key (`src/state/worldStore.ts:913`); worth filing as S4 via `/bug-report`.

---

## Stories needing manual QA cases

Rule applied: UI/Visual stories and Integration stories lacking a dedicated browser walkthrough.

| Story | Needs new manual case? | Reason |
|---|---|---|
| IF-011 | **Yes (MC-1)** | Screenshots were taken at the 27fd76f revision (README: "3023990 + uncommitted"). Commits f777b18 and 96b9b05 later changed `src/ui/index.tsx` and `src/ui/ui.css` (failure focus, replay flag, banner focus) with no re-capture. Banner focus and the new CSS are unseen by any screenshot. |
| IF-009 | Optional (MC-2) | Screens present, but the plan has no IF-009 entry; add a plan row and confirm screenshots 01-06 still match the current build after the later `src/ui` commits (Debrief shared by IF-011). A quick 2-fixture spot check suffices. |
| WN-003, WN-004 | No | Plan called for a manual step-through; smoke paths 5 and 6 executed it live with measured numbers. Record that as the walkthrough of record. |
| RA-006 | No | Screens 01-04 present and Deploy gate verified live. |
| WN-016 | No | Logic story; screenshots were staged via store import, so they are illustration only, not playthrough proof. Advisory. |

### Manual cases (to be executed by Claude in headless Chrome at 1280x720, dev server port 4200)

- **MC-1 IF-011 re-capture**: four fixtures (pyrrhic-win, win, failed-loss, loss), text scales 90/100/110/125 as in the existing README. Check: `.db-failed` banner first child and dominant; focus lands on the banner on Debrief entry (96b9b05); Replay hidden on campaignFailed, present otherwise; pyrrhic note text and unchanged net payout; no clipping or page scroll. Overwrite the 13 images, append revision hash to the README, update the AC30 check.
- **MC-2 IF-009 spot check**: mission result banner Won/Lost, quiet-replay Debrief Won/Lost (`REPLAY // FEE ALREADY COLLECTED`), pause then two-step Abort returns to World Network with no Debrief. Compare to `if-009/01-06`; re-capture only if a diff shows.

## Manual session estimate
One session, about 1.5 to 2 hours of agent time: MC-1 about 60 to 75 min (16 captures plus DOM measurement), MC-2 about 20 to 30 min, write-up about 15 min. No qa-tester hand-off needed (project rule: Claude drives the browser). Stop the dev server afterwards and confirm port 4200 is free.

---

## Missing AC / evidence flags and Concerns

- **C1 (blocking for IF-011 sign-off)**: stale screenshot evidence, see MC-1. Resolve before Phase 3 sign-off.
- **C2**: QA plan of 2026-10-09 covers 8 stories; it lacks IF-009 (UI) and still lists IF-011 as "Automated: None" though `debriefFlags.test.ts` (9 tests) exists. Update the plan so the record matches.
- **C3**: Smoke coverage table lists only `debriefFlags.test.ts` for IF-009; the story's own evidence cites `src/game/world.test.ts` (AC15, 4 tests). Verify `debriefFlags.test.ts` actually covers IF-009; otherwise correct the table.
- **C4**: WN-007 story evidence notes "No `ownership.test.ts` tests" for it (`ownership.ts` has no tax function), but the plan and smoke table cite `ownership.test.ts` for WN-007. Test coverage is real in `worldStore.test.ts`; the documents should drop the ownership file for this story.
- **C5**: No `production/qa/evidence/*-evidence.md` or test-cases dir exists. None are required (no Visual/Feel stories), but IF-009 lacks the README that IF-011 has; add a short note with revision and fixture method.
- **C6**: IF-009 AC15 and AC16 criteria in the story file are unticked checkboxes (story file edit left to its owner); evidence satisfies them.
- **C7**: TM-017 and WN-015 rely on direction-only/landed tests; no gap, noted for completeness.
- **C8**: Perf sample is headless Chrome on a Mac, not a target device; acceptable at qa.level standard but note for milestone gate.

## Verdict for Phase 2
Strategy READY with one conditional blocker (C1). Proceed to Phase 3: execute MC-1 and MC-2, then sign-off.
