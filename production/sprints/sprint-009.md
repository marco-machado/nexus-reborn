# Sprint 9 — 2026-10-17 to 2026-10-28 (final sprint)

## Sprint Goal

Land the Interface rules the director reads and acts through: every surface fits 1280×720 at every text scale, critical state is never colour alone, navigation gates stop a bad Brief/Assembly/Deploy, and the Menu, Research, mission HUD, pause/Abort, Debrief filing and Assembly refusals behave as the GDD says; and the audio mixer, buses, beds, weather and alert layers, and failure handling land without ever changing an outcome. This is the last sprint: it holds every story still open in the backlog.

## Capacity

- Total days: 9 (one person; Sat 17 Oct today, then Mon 19 through Wed 28 Oct)
- Buffer (20%): 1.8 days
- Available: 7.2 days
- Stories: Must Have 2.8 d, Should Have 1.6 d, Nice to Have 1.1 d = 5.5 d. Retro tasks (below) 1.4 d. Total 6.9 d, 0.3 d under the available line (buffer untouched).
- Dates (logged assumption): Sprint 8 closed on 2026-10-16 (QA sign-off, retro). Sprint 9 starts today and keeps the 2026-10-28 end Sprints 4--8 shared. Move the dates if that is not intended.
- Velocity (retro sprint 8, `production/retrospectives/retro-sprint-8-2026-10-16.md`): 3.5/3.5 sheet-days (100%), 16 stories in a 235 min commit window, about 4.1 stories per hour with the in-story review gate on. Sheet-days do not measure the work; the useful signals are stories per hour and the source-vs-test forecast (right for 13 of 16).
- Sizing rule (kept from Sprints 5--8, adjusted for Presentation): the epic's own estimates (1.0--1.5 d) are written for a green-field build and most of `src/ui/` already exists. A UI story with its logic already in a helper module is 0.2--0.3 d; one that needs a source change or heavy evidence is 0.4--0.5 d. TM-015 showed manual 1280×720 evidence is the real cost driver, so every story below carries it. Re-size at `/story-readiness`.
- Story count (retro 8; counted from the story files' `Status: Ready` lines and `production/sprint-status.yaml`): 17 — 10 Interface (IF-009 and IF-011 are Complete) and 7 Audio. Every other story in `production/epics/` is Complete. The tables below hold the same 17.
- Final sprint (user decision, 2026-10-17): Sprint 9 is the last sprint, so both remaining Presentation epics, Interface and Audio, are in it. There is no Sprint 10 to defer to; anything not done stays open.
- Story granularity: the balanced range is 6--10; this plan holds 17 by the user's decision. Logged deviation from the configured range. Sprint 7 closed 23 on similar velocity.
- No milestone is defined — planning against the story backlog alone. No risk register exists; risks are assessed from the sprint contents only.
- PR-SPRINT skipped — Lean mode.

QA plan: run `/qa-plan sprint` before implementation begins (none exists for Sprint 9; chosen automatically in autonomous mode, option [A]).

### Readiness at planning (retro 8, action 2) — criteria count only

Counted against the `/story-readiness` minimums (Logic/Integration 3, Visual/Feel and UI 2). This is the count check that stopped Sprint 7 and 8 runs; the full `/story-readiness` skill has not been run on these ten and still runs per story before `/dev-story`.

| Story | Type | ACs | Min | Count verdict |
|---|---|---|---|---|
| IF-001 | UI | 2 | 2 | OK |
| IF-002 | Visual/Feel | 2 | 2 | OK |
| IF-003 | UI | 3 | 2 | OK |
| IF-004 | UI | 2 | 2 | OK |
| IF-005 | UI | 3 | 2 | OK |
| IF-006 | UI | 4 | 2 | OK |
| IF-007 | UI | 3 | 2 | OK |
| IF-008 | Integration | 3 | 3 | OK (R-2 added 1) |
| IF-010 | UI | 2 | 2 | OK |
| IF-012 | UI | 2 | 2 | OK |
| AU-001 | Integration | 3 | 3 | OK (R-2 added 1) |
| AU-002 | Visual/Feel | 2 | 2 | OK |
| AU-003 | Integration | 3 | 3 | OK (R-2 added 1) |
| AU-004 | Visual/Feel | 2 | 2 | OK |
| AU-005 | Integration | 3 | 3 | OK (R-2 added 1) |
| AU-006 | Logic | 3 | 3 | OK (R-2 added 2) |
| AU-007 | Visual/Feel | 2 | 2 | OK |

### Code check at planning (2026-10-17)

A grep for each story's feature words under `src/`, not a read of the code. "No match" means my search terms found nothing, not that the feature is absent.

| Story | What `src/` has | Size |
|---|---|---|
| IF-001 | Text scale in 6 files (4 test lines); no sweep of all nine surfaces at four scales | Evidence-heavy: 9 surfaces × 4 scales, plus a click-through record |
| IF-002 | Semantic colour roles live in `tokens.ts` / `index.css`; non-colour cues not checked | Visual/Feel: lead sign-off; may need source changes |
| IF-003 | `deployRefusal.ts` (+ test), contract gates in 8 files | Probably test + evidence |
| IF-004 | No match for risk/chance band names | Possibly a source change; check at readiness |
| IF-005 | `authorize` in 8 files (63 test lines); focus return not confirmed | Probably test + evidence |
| IF-006 | `newOperationArm.ts`, telemetry persistence in 20 files (87 test lines) | Probably test + evidence |
| IF-007 | `Minimap.tsx`, `TutorialToasts.tsx`; 0 test lines on the weather chip | Probably tests + evidence |
| IF-008 | `PauseMenu.tsx`, `abortArm.ts` (3 test lines) | Integration; may need a test seam |
| IF-010 | `filingStatus.ts` (+ test), `WriteFailureNotice.tsx` | Probably test + evidence |
| IF-012 | `assemblyRows.ts` (+ test), `armHints.ts` (+ test) | Probably test + evidence |
| AU-001--007 | `src/ui/sound.ts` and `strategyAudio.ts` (+ test) exist; the per-story search terms (master, bus, rain, jitter, sting) are too common in `src/` to size each story | Integration/Logic probably tests; Visual/Feel need a listening note and lead sign-off |

## Tasks

### Must Have (Critical Path)

| ID | Task | Agent/Owner | Est. Days | Dependencies | Acceptance Criteria |
|----|------|-------------|-----------|-------------|-------------------|
| IF-001 | Every surface fits 1280×720 at every text scale | ui-programmer | 0.5 | None | Per story file |
| IF-003 | Contract navigation gates Brief, Assembly, and Deploy | ui-programmer | 0.3 | IF-001 | Per story file |
| IF-005 | Research Authorize, keyboard activation, and focus return | ui-programmer | 0.3 | IF-001 | Per story file |
| IF-006 | Menu Continue, New Operation, and telemetry persistence chrome | ui-programmer | 0.4 | IF-001 | Per story file |
| IF-008 | Pause modal and two-step Abort | ui-programmer | 0.3 | None (R-2 first) | Per story file |
| AU-001 | Mixer: master, channels, mute, and settings persistence | gameplay-programmer | 0.4 | None (R-2 first) | Per story file |
| AU-003 | Strategy bed and mission city-hum lifetimes | gameplay-programmer | 0.3 | AU-001 (R-2 first) | Per story file |
| AU-005 | Unavailable and late audio never block play or burst | gameplay-programmer | 0.3 | AU-001 (R-2 first) | Per story file |

### Should Have

| ID | Task | Agent/Owner | Est. Days | Dependencies | Acceptance Criteria |
|----|------|-------------|-----------|-------------|-------------------|
| IF-004 | Chance vs Risk bands and World Network owner readouts | ui-programmer | 0.3 | IF-001 | Per story file |
| IF-007 | Minimap, weather chip, and tutorial toasts in the mission HUD | ui-programmer | 0.3 | IF-001 | Per story file |
| IF-010 | Debrief filing status and write-failure indicators | ui-programmer | 0.2 | IF-009 (Complete) | Per story file |
| IF-012 | Assembly hire refusals and heavy-tier hint | ui-programmer | 0.2 | IF-001 | Per story file |
| AU-004 | Rain follows live weather; Alert tension drone | gameplay-programmer | 0.4 | AU-003 | Per story file |
| AU-006 | Presentation-only randomness does not change outcomes | gameplay-programmer | 0.2 | AU-003 (R-2 first) | Per story file |

### Nice to Have

| ID | Task | Agent/Owner | Est. Days | Dependencies | Acceptance Criteria |
|----|------|-------------|-----------|-------------|-------------------|
| IF-002 | Critical state has non-colour cues; one OS styling | ui-programmer | 0.4 | IF-001 | Per story file |
| AU-002 | Voices, buses, and the reference mix | gameplay-programmer | 0.4 | AU-001 | Per story file |
| AU-007 | No celebration sting, spoken VO, or spatial shooter mix | gameplay-programmer | 0.3 | AU-002 | Per story file |

### Retro tasks (not stories; not in `sprint-status.yaml`)

| ID | Task | Owner | Est. Days | Deadline | Done when |
|----|------|-------|-----------|----------|-----------|
| R-1 | Port the session-script fixes into `.claude/workflows/implement-stories.js`: one read-only qa-tester retry, the `allowDirty` option, and a header note that resume replays only the unchanged prefix, so a resume after an uncached failure re-runs every later step. Retro 8, action 1 | Marco | 0.2 | Before IF-001 | The repo workflow has both options and the note; committed |
| R-2 | Top up the five stories under their criteria minimum from their GDDs so `/story-readiness` does not stop them: IF-008 (`interface.md`), AU-001, AU-003, AU-005 to 3 and AU-006 from 1 to 3 (`audio.md`). Commit planning edits before the first run so preflight sees a clean tree. Retro 8, action 2 | Marco | 0.3 | Before IF-008 and AU-001 | All five have 3+ criteria; working tree clean |
| R-3 | World Network frame spike: write the closure in the smoke record from Sprint 7 item 8 and Sprint 8 item 9 (0 frames over 50 ms in 13 runs), or file `BUG-0001`. Sixth carry; there is no later sprint to carry R-3/4/5 into. Retro 8, action 3 | Marco | 0.1 | 2026-10-21 | Closure reason written, or `production/qa/bugs/BUG-0001.md` exists. **Closed 2026-10-19**: reason in `production/qa/smoke-2026-10-19-sprint-009.md` § R-3 closure (one catch-up frame on the Debrief → World return, accepted; no bug filed) |
| R-4 | Close the Sprint 7 QA conditions (old R-2): lead sign-off on `ra-013-evidence.md`, `/code-review` on `src/state/save.test.ts`, re-map TR-roster-006, confirm research Stories 013--015 cover RA-021, accept or walk C-8, assess C-6. Do each or drop it in writing | Marco | 0.3 | 2026-10-22 | Conditions update in `qa-signoff-sprint-007-2026-10-16-r2.md`. **Closed 2026-10-19**: all six conditions closed in that file's "Conditions update — 2026-10-19" |
| R-5 | One pass (old R-4): the Sprint 5 QA conditions update; drop the Definition of Done section from `.claude/docs/templates/sprint-plan.md` or have `/team-qa` tick it; write the evidence path rule (`production/qa/evidence/<story-slug>/`). Do each or drop it in writing | Marco | 0.3 | 2026-10-24 | Conditions update in `qa-signoff-sprint-005-2026-10-15.md`; decision written into the template. **Closed 2026-10-19**: conditions closed in that file; DoD dropped from the template and `/sprint-plan`; evidence rule in `.claude/docs/directory-structure.md` |
| R-6 | Game-designer decision on GDD Open Question 3: does gunfire damage Devices? Smoke saw squad auto-fire destroy relay d2 while an explicit Attack on a Device is refused. Retro 8, action 4; Sprint 8 QA condition 2 | Marco (game-designer) | 0.1 | 2026-10-28 (sprint end) | The GDD answers it; a story or bug follows if the code disagrees. **Closed 2026-10-19**: a Device is a fire-lane Unit (owner); Tactical OQ3 and living spec §10 updated; the code already agrees |
| R-7 | Tick the TM-002 and TM-008 acceptance-criteria boxes, or record why not. Sprint 8 QA condition 1; retro 8, action 5 | Marco | 0.1 | 2026-10-21 | Boxes ticked or a reason written in both story files. **Closed 2026-10-19**: TM-002 1c/1e/5d and TM-008 9a/9b/9c ticked after a test re-run |

## Carryover from Previous Sprint

| Task | Reason | New Estimate |
|------|--------|-------------|
| — (stories) | None. All 16 Sprint 8 stories (TM-001 to TM-016) are `done` in `production/sprint-status.yaml`. | — |
| Sprint 8 R-2 (Sprint 7 QA conditions) | Not started; no conditions update in `qa-signoff-sprint-007-2026-10-16-r2.md`. Now R-4 | 0.3 d |
| Sprint 8 R-3 (frame spike) | Not started; sixth carry. Numbers now exist. Now R-3 | 0.1 d |
| Sprint 8 R-4 (Sprint 5 conditions, template DoD, evidence-path rule) | Not started; third carry. Now R-5 | 0.3 d |

## Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Manual evidence is the cost driver (TM-015: 800×600 shots from the in-app pane failed the 1280×720 rule) | High | Medium | State the capture rule in every dev-story brief: headless Playwright at 1280×720, not the in-app pane (it tops out at 800×600); evidence under `production/qa/evidence/<story-slug>/`; Claude captures it, per CLAUDE.md "Do It Yourself" |
| IF-001 gates six stories and needs 9 surfaces × 4 text scales (36 captures) plus a click-through record | Medium | High | Script the sweep once in headless Playwright; run IF-001 first; if it slips, cut Nice to Have and Should Have, not IF-001 |
| The run stops again for the reasons that cost Sprint 8 about 4 resumes: no qa-tester retry, no `allowDirty`, dirty tree | High | Medium | R-1 and R-2 before IF-001; commit planning edits first |
| The file-level look misses source changes (IF-004 found no band names; Sprint 8 missed 3 of 16) | Medium | Medium | Re-size at `/story-readiness`; cut from the Nice to Have tail first |
| UI and Visual/Feel stories are not covered by the Logic mutation check, so review is the only gate | Medium | Medium | Keep lead-programmer and qa-tester review on every story; pin GDD literals in any test added |
| Retro tasks R-3/4/5 carried again (R-3 is on its sixth carry) | Medium | Low | Fixed deadlines above; do each or drop it in writing; no later sprint exists |
| OQ3 stays undecided at project end | Low | Medium | No story touches Devices; R-6 decides it by 2026-10-28, and a disagreeing code path becomes a bug, since no later sprint exists to hold a story |
| 17 stories leave 0.3 d of slack before the buffer, and this is the last sprint | Medium | High | Run in dependency order (IF-001 and AU-001 first); a cut leaves that story open at project end, so use the 1.8 d buffer before cutting, and cut from the Nice to Have tail |
| Audio Visual/Feel stories (AU-002, 004, 007) need a listening note and a lead sign-off; Claude cannot listen | High | Medium | Claude records the settings and scenarios and the automated checks; the user listens and signs off. Schedule the three together near the end of the sprint |

## Dependencies on External Factors

- R-1 and R-2 before IF-001 and AU-001; `/qa-plan sprint` before implementation begins.
- IF-002, AU-002, AU-004 and AU-007 are Visual/Feel and need a lead sign-off; the three audio ones need the user to listen.
- Headless Playwright (`npx playwright-cli`) for 1280×720 capture. Never the user's own Chrome.

## Definition of Done for this Sprint

R-5 decides whether this checklist stays in the template. Until then it is kept as the skill writes it.

- [ ] All Must Have tasks completed
- [ ] All tasks pass acceptance criteria
- [ ] QA plan exists (`production/qa/qa-plan-sprint-009-[date].md`, from `/qa-plan sprint`)
- [ ] All Logic/Integration stories have passing unit/integration tests
- [ ] Smoke check passed (`/smoke-check sprint`)
- [ ] QA sign-off report: APPROVED or APPROVED WITH CONDITIONS (`/team-qa sprint`)
- [ ] No S1 or S2 bugs in delivered features
- [ ] Design documents updated for any deviations
- [ ] Code reviewed and merged
