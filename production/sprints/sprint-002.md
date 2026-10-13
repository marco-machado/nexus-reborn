# Sprint 2 — 2026-10-23 to 2026-11-05

## Sprint Goal

Finish the World Network director loop Sprint 1 left open: a quiet replay awards nothing on the board, Influence can be earned and spent, Intel gates the Scan, and campaign-complete / campaign-failed resolve.

## Capacity

- Total days: 10 working days (one person, Fri 23 Oct through Thu 5 Nov)
- Buffer (20%): 2 days
- Available: 8 days
- Must Have uses 4.0 of those 8, in the story files' sheet-days. Should Have uses the remaining 4.0. Nice to Have sits past capacity and is cut first.
- Calibration: Sprint 1 delivered 14.0 sheet-days in about 2 working days (retrospective 2026-10-12: the plan was about 5× too large). These estimates are the same uncalibrated unit. 8.5 sheet-days is about a day and a half at that pace, inside this window. Economy and later epics stay out. Pull them in with `/sprint-plan update` if the window should be filled.
- No milestone is defined. No risk register exists. Planning is against the Ready story backlog only.

QA plan: run `/qa-plan sprint` before implementation begins.

## Tasks

### Must Have (Critical Path)

| ID | Task | Agent/Owner | Est. Days | Dependencies | Acceptance Criteria |
|----|------|-------------|-----------|-------------|-------------------|
| WN-005 | Quiet replay awards nothing and shoves nothing; ETA still catches up | gameplay-programmer | 0.5 | WN-002, WN-003 | A quiet-replay win leaves Influence, Intel, Control, Unrest and the city holder at `t0`, then ETA catch-up matches a continuous advance through the same interval, including Tax; a loss retry of an authored contract not yet won, from Influence 0 and intel progress 25 at the pre-ETA boundary, ends at Influence 8 and intel progress 80 when civiliansHit = 0, and at Influence 6 and intel progress 65 when civiliansHit ≥ 1, with Control higher and the city holder Nexus; dirty Unrest is higher than the clean retry. Do not assert Credits or a numeric Unrest |
| WN-008 | Influence wallet income from the outcome DTO | gameplay-programmer | 1.0 | WN-003 | A new campaign reads Influence 0; a non-quiet win with civilians awards 6, a clean non-quiet win awards 8, a loss awards nothing |
| WN-009 | Stabilize and Expedite refusals | gameplay-programmer | 0.5 | WN-008 | Stabilize is refused below 8 Influence and while on cooldown; Expedite is refused with no generated target; a refusal leaves Influence unchanged |
| WN-010 | Stabilize staged effect over six hourly steps | gameplay-programmer | 0.5 | WN-002, WN-009 | Stabilize spends 8 immediately and lowers Unrest by 2 at each of six hourly steps through `advanceFlow`, clamped so it does not fall through the floor |
| WN-011 | Intel progress awards | gameplay-programmer | 0.5 | WN-003 | From intelProgress 25, a non-quiet win with civilians sets 65, a clean non-quiet win sets 80, and a loss or quiet-replay win leaves it |
| WN-018 | Campaign complete and failed banners, including a pyrrhic win | gameplay-programmer | 1.0 | WN-003 | Three authored wins post the campaign-complete banner and stay selectable; an empty living roster on an incomplete campaign posts campaign-failed and contract select no-ops. The pyrrhic Debrief banner and note already shipped as IF-011; this story owns the World Network banners and the select lock |

### Should Have

| ID | Task | Agent/Owner | Est. Days | Dependencies | Acceptance Criteria |
|----|------|-------------|-----------|-------------|-------------------|
| WN-013 | Antarctica stays hidden; Focus cycle skips it; Focus Tax figure prints | ui-programmer | 1.0 | WN-007 | At every Intel level Antarctica prints no Control, Unrest, Tax or Garrison, Focus never selects it, and its spends are not offered; Focus on opening Europe prints a Tax figure and that sector does not pay |
| WN-012 | Event forecast gated on Intel level | ui-programmer | 1.0 | WN-011 | Intel 1 hides Event forecast; intel 2+ lists riot, blackout, raid, trade and seizure chances for the next 6 strategic hours from `forecast.ts` |
| WN-014 | Scan hides contracts above the director's Intel; Chance still prints | ui-programmer | 1.0 | WN-011 | Chance still prints below and above intel 2; a generated contract above the director's Intel, not Expedite-waived, is absent from Scan while its record remains |
| WN-017 | Opening desk and post-win Scan | gameplay-programmer | 1.0 | WN-003, WN-008 | The first minute on World Network allows Focus across the six open sectors without a contract selected; a first clean non-quiet win shows Influence 8 and the post-ETA Scan before another Screen tick |

### Nice to Have

| ID | Task | Agent/Owner | Est. Days | Dependencies | Acceptance Criteria |
|----|------|-------------|-----------|-------------|-------------------|
| WN-019 | Campaign flag edge cases | gameplay-programmer | 0.5 | WN-018 | A complete campaign stays complete when the living roster hits 0; sector crisis does not flip the flags; an incomplete campaign that loses its last living operative is failed and not complete |

## Carryover from Previous Sprint

| Task | Reason | New Estimate |
|------|--------|-------------|
| — | None. Sprint 1's 12 stories are done. IF-009 and IF-011 were pulled back into sprint 1 on 2026-10-12 and completed there. | — |

## Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Sheet estimates are about 5× actual, so this sprint finishes in a day and a half and the window sits empty | High | Low | Do not pad with another epic in this plan. Pull more with `/sprint-plan update` if the window should be filled |
| WN-012's header says it depends on nothing and unlocks WN-011; WN-011 says it unlocks WN-012, and WN-012's out-of-scope line names WN-011 as how Intel is earned | Medium | Low | Sequence WN-011 before WN-012. Do not edit either story file to "fix" the header in this plan |
| WN-018's pyrrhic Debrief banner already shipped as IF-011 | Medium | Medium | Treat that AC as done-in-code. The open work is the World Network complete/failed banners and the select lock |
| WN-005's loss retry names World Network deltas; Credits stay with Economy | Low | Low | Assert the story numbers: clean Influence 8 and intel progress 80, dirty Influence 6 and intel progress 65, Control higher, holder Nexus, dirty Unrest higher than clean. Do not assert Credits or a numeric Unrest |
| WN-010 can fork a second collision table the way WN-002 almost did | Medium | High | Fire the staged spend through the shared `advanceFlow`. Do not author a new order |
| WN-014's hide rule needs a generated contract already on `worldStore` | Low | Medium | The market already lives there. If the read-side filter turns out to need an Economy story, cut WN-014 first among Should Have |

## Dependencies on External Factors

- None outside this repo. World Network GDD is Approved. No milestone deadline.
- WN-007, WN-002 and WN-003 are Complete in Sprint 1 and are dependencies, not work.

## Definition of Done for this Sprint

- [ ] All Must Have tasks completed
- [ ] All tasks pass acceptance criteria
- [ ] QA plan exists (`production/qa/qa-plan-sprint-002-[date].md`, from `/qa-plan sprint`)
- [ ] All Logic/Integration stories have passing unit/integration tests
- [ ] Smoke check passed (`/smoke-check sprint`)
- [ ] QA sign-off report: APPROVED or APPROVED WITH CONDITIONS (`/team-qa sprint`)
- [ ] No S1 or S2 bugs in delivered features
- [ ] Design documents updated for any deviations
- [ ] Code reviewed and merged
