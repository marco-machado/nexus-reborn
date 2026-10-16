# QA Strategy: Sprint 7 (Roster and Assembly)

**Date**: 2026-10-16 | **qa.level**: standard | **Scope**: stories as listed in the brief (RA-001, 002, 004, 005, 007 to 025; briefed as 22, counts 23, see C-1). RA-003 and RA-006 are Sprint 1 and out of scope
**Inputs**: `production/qa/qa-plan-sprint-007-2026-10-15.md`, `production/qa/smoke-2026-10-16-sprint-007.md`, story files in `production/epics/roster-and-assembly/`, `production/sprints/sprint-007.md`, `production/session-state/active.md`.
**Basis**: every story is already `done`, so this is a retrospective strategy: it confirms the evidence gate and scopes the remaining manual work, not new test authoring.

## 1. Strategy table

At `standard`, Logic and Integration stories need an automated test that exists and passes. Smoke run: 1,278/1,278 pass across 50 files. "Blocker?" means a blocker to QA sign-off, not to the story's own status.

| Story | Type | Automated Required | Manual Required | Blocker? |
|---|---|---|---|---|
| RA-001 | Logic | `src/game/mass.test.ts` (present, pass) | None | No |
| RA-002 | Logic | `mass.test.ts`, `appStore.test.ts` (present, pass) | None | No |
| RA-004 | Logic | `mass.test.ts` (present, pass) | None | No |
| RA-005 | Logic | `mass.test.ts` (present, pass) | None. Overage label text `N KG OVER THE MASS LIMIT` is covered by `production/qa/evidence/story-005-refusal-text/` (listing only; contents not opened) | No |
| RA-007 | Logic | `deployGate.test.ts`, `appStore.test.ts` (present, pass) | None | No |
| RA-008 | Logic | `campaignStore.test.ts` "Assembly assign and unassign edits (RA-008)" (8 tests). Story allows this OR `assembly.test.ts`; the helper was not extracted, so the absent file is not a gap | None (`evidence/ra-008/` screenshot is a bonus) | No |
| RA-009 | UI | None required (state half is RA-008/RA-014) | 6-check Assembly click-through. Evidence on file: `evidence/ra-009/` (3 screenshots, 1280x720, 100% and 125% text scale, README says pass). Verify, do not repeat | No |
| RA-010 | Logic | `campaignStore.test.ts` (present, pass) | None | No |
| RA-011 | Logic | `abilities.test.ts` (present, pass) | None | No |
| RA-012 | Logic | `campaignStore.test.ts` (present, pass) | None | No |
| RA-013 | Logic | `campaignStore.test.ts` (present, pass) | Injury presentation (see section 4) | No |
| RA-014 | Integration | `campaignStore.test.ts`, `researchStore.test.ts` (present, pass) | None | No (AC count: see section 5) |
| RA-015 | Logic | `campaignStore.test.ts` + `src/game/experience.test.ts` (both exist, pass) | None. Smoke item 4 observed +1 XP each | No |
| RA-016 | Logic | `campaignStore.test.ts` (present, pass) | Injury presentation (see section 4) | No |
| RA-017 | Logic | `campaignStore.test.ts` (9 tests, pass) | None. Debrief injury line `30H RECOVERY` already retained in `evidence/ra-017/01-debrief-win-catch-up-injury-30h.jpg` | No |
| RA-018 | Integration | `campaignStore.test.ts` (6 tests, pass). Story says no `appStore.test.ts` change was needed | None | No (AC count: see section 5) |
| RA-019 | Integration | `appStore.test.ts` (4 tests, pass) | Abort observed in smoke item 5 (PASS); `evidence/ra-019/` on file | No |
| RA-020 | Integration | `deployFreeze.test.ts` (4 tests, pass) | None | No |
| RA-021 | Logic | `campaignStore.test.ts` (3 tests, pass). `research.test.ts` named by the story but untouched; story documents that research Stories 013-015 cover the resolution | None | No (see section 5, concern C-3) |
| RA-022 | Logic | `recruits.test.ts`, `campaignStore.test.ts` (present, pass) | None | No |
| RA-023 | Logic | `campaignStore.test.ts` (6 tests, pass) | None. Hire observed in smoke item 6 (PASS) | No |
| RA-024 | Logic | `campaignStore.test.ts` (3 tests, pass) | None | No |
| RA-025 | Integration | `save.test.ts` (4 tests, pass) | Save/reload observed in smoke item 7 (PASS) | No (AC count and TR-ID: see section 5) |

Totals: 17 Logic + 5 Integration (RA-014, 018, 019, 020, 025) + 1 UI = 23 stories, not 22 (see C-1).

## 2. Smoke Check

**PASS** (`production/qa/smoke-2026-10-16-sprint-007-quick.md`, supersedes the earlier NOT ASSESSED report). Automated 1,278/1,278 across 50 files; build and lint clean; source unchanged at `cfd2066`; all 8 plan items pass. Item 4: sim-driven win produced Debrief `INJURED // MARA 18H RECOVERY` (Assembly side on a labelled fixture). Item 8: World Network p95 <= 9.0 ms, Assembly p95 <= 8.8 ms.

## 3. Open bugs in scope

None on file. `production/qa/bugs/` does not exist, so this is an absent record, not a verified-clean one: **NOT ASSESSED, no bug records**. File any defect found this cycle with `/bug-report`.

## 4. Manual QA scope and estimated sessions

**In scope this cycle (2 sessions, about 1.5 hours total):**

| Session | Content | Est. |
|---|---|---|
| S1 | Verify the RA-009 evidence against the 6-check list in the QA plan: 4 empty bays after a debrief that leaves >=1 Ready; Deploy refused with `NO OPERATIVES ASSIGNED`; Injured row body opens the dossier; Injured assign key disabled with tooltip `OPERATIVE INJURED // ADVANCE WORLD TIME TO RECOVER`; focusing a dossier leaves bays unchanged; no clipping at 1280x720 and 125% text scale. Check the 3 screenshots and README cover each of the 6; re-run only a check the evidence does not show | 30 min |
| S2 | Injury-presentation case (recommended below) plus smoke item 8 frame-time reading on World Network and Assembly | 45-60 min |

**Recommendation on the injury-presentation gap: add it as a manual case, yes.** Reasons:
- The unit tests prove the rule (RA-012 helper, RA-013 classification, RA-016 recovery); they do not prove the screens. Smoke item 4 said so itself.
- The gap is narrower than the smoke report implies. The Debrief side has a retained screenshot (`evidence/ra-017/`, `INJURED // MARA  30H RECOVERY`), but it is 800x588, not 1280x720, and has no 125% text-scale view. The Assembly side after a real injury (Injured row, disabled assign key, tooltip, recovery ETA) is only evidenced through RA-009's constructed fixture.
- Cost is low. Do not play for a low-HP finish. Use the fixture RA-009 already used (store a lost outcome with `survivorHp: { opN: 0.2 }`, then `applyDebrief`), or replay a mission and let the 0.35 threshold be crossed. Capture: Debrief injury line at 1280x720 and 125% text scale; Assembly after return showing the Injured row, disabled key and tooltip; one wait through recovery (advance World time) showing the row return to READY with the bay still empty (RA-016, RA-017).
- It is a UI-evidence check, so it falls under the "screenshot is never waived" rule even at `qa.level: minimal`. It does not change any story's status; it closes smoke item 4.
- Label this case as constructed-state evidence unless a real mission produces the injury. Recording which path was used is what keeps the evidence honest.

**Out of manual scope (covered or waived):** RA-001 to RA-008, RA-010 to RA-013 (logic), RA-014 to RA-025 (automated plus smoke items 3, 5, 6, 7). Smoke item 8 is a measurement, not a story; carry it only if the user wants the smoke verdict upgraded from NOT ASSESSED.

**After the manual sessions:** re-run `/smoke-check quick` as the smoke report itself prescribes.

## 5. Blockers

**No blockers remain** (re-checked 2026-10-16 after the /team-qa re-run). Every Logic and Integration story has a passing named test file; RA-009 has its UI screenshots; the manual cases ran (see `production/qa/test-cases/ra-009-assembly-opens-without-auto-assign-injured-dossier-cases.md` and `ra-013-injury-presentation-cases.md`, Execution Records): all PASS except INJ-03 (NOT REACHABLE: the win's 48 h ETA catch-up exceeded the 18 h recovery; covered by INJ-03b, a labelled fixture, PASS) and PERF-01 (observed only, advisory).

**Resolved since the first draft:**
- C-1 scope count: 23 stories, confirmed against `sprint-status.yaml` by the coordinator (my grep of it found 23 `RA-0` lines).
- C-2 AC top-up: RA-014 5, RA-018 5, RA-025 4 acceptance criteria (counted in the story files).
- Smoke item 4 injury gap and item 8 frame time: closed by the quick smoke and the executed cases.

**Concerns still open (not blockers, for sign-off notes):**
- C-3 RA-021 names `research.test.ts` but did not touch it; the story cites research Stories 013-015 as coverage.
- C-4 Specialist review: commits b5bebe2 and cfd2066 supersede the NOT ASSESSED reviews; I spot-checked only RA-001 and RA-002. `/code-review` of `src/state/save.test.ts` (RA-025) is still NOT ASSESSED per session state.
- C-5 `TR-roster-006` does not match RA-025's save/reload scope; re-map in a follow-up (documentation only).
- C-6 Assertion quality is not judged here; see `tautological-tests-2026-10-16.md` (not read by me).
- C-8 INJ-03 (real-play Assembly injury path) was not reachable; the Assembly injury presentation is evidenced by fixture only.
