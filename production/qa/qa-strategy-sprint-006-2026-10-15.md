# QA Strategy: Sprint 6 (Persistence and validation, PV-001..PV-018)
**Date**: 2026-10-15
**Author**: qa-lead (for `/team-qa sprint`)
**qa.level**: standard
**QA plan**: `production/qa/qa-plan-sprint-006-2026-10-15.md`
**Method**: story files read for type and ACs; named test files globbed and their describe/it names grepped; evidence directories listed and the two click-through files read; spot-run `npx vitest run src/state/telemetry.test.ts src/ui/filingStatus.test.ts src/state/settingsStore.test.ts src/state/save.test.ts` = 4 files, 158/158 pass. Full suite not re-run (smoke: 1,146/1,146). Assertion quality not reviewed (`/test-evidence-review`).

## (a) Strategy table

Type column is the story file's `Type`; it agrees with the QA plan for all 18 (no disagreements). All stories: status `done`, all ACs checked (3-4 each). Test files sit beside modules, not under `tests/`.

| Story | Type | Automated Required | Manual Required | Blocker? |
|---|---|---|---|---|
| PV-001 Menu Continue: never-started vs valid | Integration | `save.test.ts` "menu continue: never-started vs valid save" - present | Smoke only (done; screenshots in `evidence/pv-001/`, smoke s1/s2) | No |
| PV-002 New Operation two-step erase | Integration | `save.test.ts` "new operation: two-step erase of the house" - present | Smoke only (done; `evidence/pv-002/`) | No |
| PV-003 Settings envelope survives | Integration | `settingsStore.test.ts` "settings envelope survives..." + `save.test.ts` "settings slot holds Quality and Difficulty" - present | Smoke only; see gap M-3 (Settings toggle not driven) | No |
| PV-004 Continue restores last Screen | Integration | `save.test.ts` "continue restores the last screen snapshot" - present | Smoke only (done; `evidence/pv-004/`) | No |
| PV-005 Mid-mission reload and Abort | Integration | `save.test.ts` "mid-mission reload and Abort discard" (3 tests) - present | Smoke only (done); see gap M-4 (Abort clock key) | No |
| PV-006 Debrief applies once | Integration | `save.test.ts` "Debrief applies once in session memory" - present. Story/plan also list `appStore.test.ts`; story says all 3 ACs covered in `save.test.ts` | Smoke only (done) | No |
| PV-007 Next-Screen autosave commits Debrief | Integration | `save.test.ts` "Next Screen autosave durably commits..." (5 tests) - present | Smoke only (done) | No |
| PV-008 Invalid blob dropped | Logic | `save.test.ts` "invalid or unreadable campaign blob: drop all-or-nothing" - present | None | No |
| PV-009 Settings/telemetry garbage fallback | Logic | `save.test.ts` "settings and telemetry garbage fall back independently" (9 cases) - present | None | No |
| PV-010 Contradictory flags | Logic | `save.test.ts` "contradictory campaign flags drop the blob" - present | None | No |
| PV-011 Valid flag combinations | Logic | `save.test.ts` "valid flag combinations load as stored" - present | None | No |
| PV-012 Hydrate sync, RNG continues | Logic | `save.test.ts` "hydrate syncs to saved t; RNG streams continue" (4 tests) - present | None | No |
| PV-013 Telemetry opt-in, no egress | Logic | `telemetry.test.ts` describes tagged PV-013 AC1/AC2/AC3 - present | None required; see gap M-3 (toggle persistence) | No |
| PV-014 One record per outcome, cap 60 | Logic | `telemetry.test.ts` "...(PV-014)" AC1-AC3 - present | None | No |
| PV-015 Abort row and win rate | Logic | `telemetry.test.ts` "abort telemetry row and Balance win rate (PV-015)" AC1-AC4 - present | None (screenshot already retained; no-data `--` seen in smoke s8) | No |
| PV-016 Balance Export and two-step Clear | UI | `telemetry.test.ts` "Balance Export and two-step Clear (PV-016)" AC1-AC4 - present | Screenshots (3 at 1280x720 retained) + lead-programmer sign-off (not recorded) + exported-file field check (see M-1) | No on gate; sign-off open |
| PV-017 Debrief filing status | UI | `save.test.ts` "Debrief filing status reads unfiled until the next Screen" + "saveStatusStore transitions (ADR-0022)"; `src/ui/filingStatus.test.ts` - present | Screenshots (4 at 1280x720 retained) + lead-programmer sign-off (not recorded) + quiet-replay and real-mission Debrief (see M-2) | No on gate; sign-off open |
| PV-018 Write failure never reports filed | Integration | `save.test.ts` "write failure never reports filed" (8 tests) + `filingStatus.test.ts` - present | Smoke (done) + banner position at 1280x720 (see M-5) | No |

## (b) Smoke Check
**PASS** - source `production/qa/smoke-2026-10-15-sprint-006.md` (1,146/1,146 tests, 46 files; build and lint clean; 16 manual items passed; driven by Claude via Playwright with a store-assisted harness, not a person playing).

## (c) Open bugs in scope
None on file. `production/qa/bugs/` does not exist, so this is "no bug records", not a verified-clean bug list. Five smoke observations are unfiled (banner overlap, Abort `world` key, telemetry-after-reload, 219 ms boot frame, selected contract per GDD).

## (d) Manual QA cases and sessions

Estimated **3 short manual sessions, about 2.5 h total**, to run with qa-tester; none is a gate blocker. Hand to qa-tester after the lead approves.

| ID | Story | Case | Why |
|---|---|---|---|
| M-1 | PV-016 | Export JSON, open the downloaded `nexus-balance.json` from a real non-abort Debrief record; check every field in AC4 (outcome, duration, first contact, objectives, shots/damage, damage in/out, civilian hits by source, item/ability use, KIA, payout, roles). Capture a screenshot or file excerpt. | `click-through.md` seeded a won and an aborted record and checked "version 1, both records"; the story itself calls the no-request row "a recorded claim without a screenshot". AC4 is covered only by the unit test. The plan's checklist asked for the exported file to be opened and its fields checked. |
| M-2 | PV-017 | Reach a Debrief through a played mission (not seeded), screenshot paid-win AND quiet-replay Debrief at 1280x720; confirm filed after next Screen. | The retained set shows only a paid win, reached via seeded store calls and no played mission. Plan checklist item "Quiet-replay Debrief shows unfiled too" has no screenshot (automated test covers it). Smoke s3 covers a played paid win. |
| M-3 | PV-003 / PV-013 | In the browser, flip the Settings telemetry toggle (not `setState`), reload, confirm it persists; also Quality/Difficulty. | Smoke observation 3: setting read `false` after a reload when set by `setState`; toggle path never driven. Unit tests cover persistence, so confirm real UI path. |
| M-4 | PV-005 | Abort, reload, and diff the blob. Separate "Abort wrote nothing" from "next Screen wrote the clock". | Smoke observation 2; unit tests cover the former, browser run did not separate them. Low priority; can fold into M-3 session. |
| M-5 | PV-018 | Re-shoot the write-failure notice at 1280x720 on World Network; record overlap with Feed. | Smoke observation 1: banner overlaps third Feed line. Copy and position are placeholder pending `/ux-design`; log as an S4 candidate, not a defect against the AC (no AC specifies position). |

Session plan: S1 = M-1 + M-2 (Balance and Debrief, lead-programmer reviews screenshots and signs off PV-016/017); S2 = M-3 + M-4; S3 = M-5 after `/ux-design` banner decision (can wait for next sprint).

## (e) Missing ACs / evidence that would block
**No hard blocker.** Every Logic and Integration story has its named test file with tests naming its ACs; UI stories have screenshots at native size; all AC boxes are checked. Items that are not blockers but must be named in the sign-off:

1. **Lead-programmer sign-off for PV-016 and PV-017 is not recorded** (plan Exit Criteria and both stories' QA sections require it; both stories say the screenshot gate is met and the sign-off remains open). Recommend sign-off verdict APPROVED WITH CONDITIONS until recorded.
2. **Evidence location differs from plan.** Plan and story QA sections name `production/qa/evidence/sprint-006/`; that directory does not exist. Evidence is in `evidence/pv-016/`, `pv-017/`, `pv-018/` (plus pv-001, 002, 004, 013, `story-015-...`, `smoke-2026-10-15-s6/`). Accept the actual paths and record the deviation; do not move files without the owner.
3. **Specialist code review never ran** (`/code-review` ended NOT ASSESSED for PV-016, 017; Sprint 6 retro task R-1). Plan DoD asks for code review from the main session. Process risk, not a test-evidence gap.
4. **Evidence is harness-driven.** PV-017 Debrief was reached by store seeding; the smoke run used god-mode bot and `setState`. Valid for the gate, but no human has played this build (M-2/M-3 narrow the gap).
5. **Bookkeeping:** story-006 header says 1.0 d vs `sprint-status.yaml` 0.2 d, unreconciled; PV-006/PV-012 list `appStore.test.ts`/`worldStore.test.ts` as evidence though only `save.test.ts` was extended (stories justify this). Placeholder copy for the filing status and write-failure banner awaits `/ux-design`.

Verdict input for `/team-qa`: ready to proceed to manual sessions; recommended outcome APPROVED WITH CONDITIONS (1, 2, 3).
