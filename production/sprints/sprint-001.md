# Sprint 1 — 2026-10-09 to 2026-10-22

## Sprint Goal

Prove the two-clock contract on the living board: strategic time advances only on the four Screens, a win spends ETA through the shared catch-up, a loss spends none, and debrief is the only write-back.

## Capacity

- Total days: 10 working days (one person, Fri 9 Oct through Thu 22 Oct)
- Buffer (20%): 2 days
- Available: 8 days
- Must Have uses 7.0 of those 8. Should Have uses the remaining 1.0. Nice to Have sits past capacity and is cut first.

QA plan: run `/qa-plan sprint` before implementation begins.

## Tasks

### Must Have (Critical Path)

| ID | Task | Agent/Owner | Est. Days | Dependencies | Acceptance Criteria |
|----|------|-------------|-----------|-------------|-------------------|
| WN-001 | Strategic clock runs only on the four Screens | gameplay-programmer | 1.0 | None | 1× on World Network, Research, Brief, or Assembly advances `t` by 60s per accepted real second; a 1s stall admits 0.25s (15 strategic seconds); Menu, Mission, Debrief, and pause do not move `t` |
| WN-002 | Win-ETA catch-up shares advanceFlow; a loss spends none | gameplay-programmer | 1.5 | WN-001 | A win spends ETA through the same `advanceFlow` as `tick` (one due, rearm from that due `t`, ADR-0018 order); a loss leaves `t` at `t0` and emits no Tax from ETA; `advanceDays` and `tick` fire the same dues |
| WN-004 | Abort leaves the World Network blob unchanged; deploy gets a frozen slice | gameplay-programmer | 1.5 | None | Confirmed Abort keeps `t`, sectors, owners, Influence, intel, events, spends, and `nextTaxT`; deploy receives only `{sector id, Control, Unrest}`; `createWorld` does not read the live stores |
| WN-003 | Debrief writes back at frozen t0, then ETA, once | gameplay-programmer | 2.0 | WN-002 | A win writes Control, Unrest, ownership, Influence, and Intel at frozen `t0`, then catch-up; the same debrief serial does not apply twice; an older key applies nothing |
| WN-006 | Timeline Review is a view, not a clock | gameplay-programmer | 1.0 | WN-001 | Scrubbing Review does not change live Control, Unrest, owners, or `t`; a tick with `review` older than one day snaps `review` to null, as do `advanceDays`, hydrate, and New Operation |

### Should Have

| ID | Task | Agent/Owner | Est. Days | Dependencies | Acceptance Criteria |
|----|------|-------------|-----------|-------------|-------------------|
| WN-007 | Tax yield emits only from Nexus-held sectors | gameplay-programmer | 1.0 | WN-002 | A Nexus-held sector emits its printed yield; Contested and any other holder emit 0; opening North America emits 4,080 CR |

### Nice to Have

| ID | Task | Agent/Owner | Est. Days | Dependencies | Acceptance Criteria |
|----|------|-------------|-----------|-------------|-------------------|
| WN-015 | Mission result shoves Control and Unrest in the right direction | gameplay-programmer | 1.0 | WN-003 | A non-quiet win raises Control; a non-quiet loss lowers it; civilians hit raise Unrest above a clean win |
| WN-016 | City holder after a win or a loss | gameplay-programmer | 1.0 | WN-003 | A non-quiet win sets the mission city to Nexus; a non-quiet loss of a Nexus-held city restores that city’s default holder |

## Carryover from Previous Sprint

| Task | Reason | New Estimate |
|------|--------|-------------|
| — | No previous sprint | — |

## Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Every selected story has `Estimate: —`, so these day counts are uncalibrated | Medium | Medium | Re-estimate after WN-001. Cut WN-015 and WN-016 first |
| WN-003 and WN-004 are Integration stories on the debrief and deploy boundary | Medium | High | Land WN-001 and WN-002 first. Tests sit beside the module the story names |
| Catch-up order in WN-002 is easy to fork into a second table | Medium | High | Assert one shared `advanceFlow`. Do not author a new collision order |
| The loop already plays, and the story criteria may not match the code | Medium | Medium | Run `/story-readiness` on WN-001 before `/dev-story` |

## Dependencies on External Factors

- None. World Network GDD is Approved (independent review 2026-09-14). No milestone deadline.

## Definition of Done for this Sprint

- [ ] All Must Have tasks completed
- [ ] All tasks pass acceptance criteria
- [ ] QA plan exists (`production/qa/qa-plan-[sprint-slug]-[date].md`, from `/qa-plan sprint`)
- [ ] All Logic/Integration stories have passing unit/integration tests
- [ ] Smoke check passed (`/smoke-check sprint`)
- [ ] QA sign-off report: APPROVED or APPROVED WITH CONDITIONS (`/team-qa sprint`)
- [ ] No S1 or S2 bugs in delivered features
- [ ] Design documents updated for any deviations
- [ ] Code reviewed and merged
