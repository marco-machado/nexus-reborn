# Sprint 4 — 2026-10-15 to 2026-10-28

## Sprint Goal

Finish the Economy and contracts rules behind the invoice: wins pay in full, generated contracts get a stamped Reward, ETA, expiry and market cap, and abort writes nothing to Economy.

## Capacity

- Total days: 10 working days (one person, Thu 15 Oct through Wed 28 Oct)
- Buffer (20%): 2 days
- Available: 8 days
- Must Have uses 1.9 of those 8. Should Have uses 3.0. Nice to Have uses 1.8. Total 6.7 d, 1.3 d under the available line; Nice to Have is cut first.
- Dates: Sprint 3 closed on 2026-10-14, 23 days before its planned window opened (retro action 3). This plan starts the next window the day after, not on 2026-11-20. Move the dates if that is not intended.
- Calibration (retro sprint 3, 2026-10-14): Sprint 3 delivered 8.0 sheet-days in about 0.4–0.6 active hours. Nine of ten stories only added tests for behaviour that already existed. Sheet estimates stay in days here because no per-story hours exist yet (retro action 2 is still open). Check each story against `src/` at `/story-readiness` and lower `estimate_days` in `production/sprint-status.yaml` for any story that needs only tests and evidence.
- Epic choice: Economy and contracts continues (12 Ready stories left, 10 planned). Stories 010 and 012, which 011 depends on, are Complete. Research, Persistence, Roster, Tactical, Interface and Audio epics stay out.
- Update 2026-10-14: EC-021 (Should Have) and EC-022 (Nice to Have) added; seven generated-contract stories re-estimated down (EC-014 0.3, EC-015/016/017/018 0.2 each, EC-019/020 0.3 each). Basis: `src/game/contracts.ts` already has the Reward range, priority multiplier, expiry windows, `CONTRACT_TARGET = 3`, roll timer and `CONTRACT_ETA_DAYS`, with tests in `contracts.test.ts`. This is a file-level look, not `/story-readiness`; confirm each at readiness and raise it back if a gap appears. EC-004, 011, 013, 021 and 022 keep their sheet estimates because I did not check their code.
- Story granularity: balanced range is 6–10; this plan holds 12 stories at your request. The two extra are the last in the Nice to Have and Should Have tail and are cut first.
- No milestone is defined. No risk register exists. Planning is against the Ready story backlog only.

QA plan: run `/qa-plan sprint` before implementation begins (none exists for Sprint 4 yet).

## Tasks

### Must Have (Critical Path)

| ID | Task | Agent/Owner | Est. Days | Dependencies | Acceptance Criteria |
|----|------|-------------|-----------|-------------|-------------------|
| EC-014 | Generated Reward is stamped from threat band, roll and priority | gameplay-programmer | 0.3 | None | New High offer, u = 0.5, not priority = 54,500 CR; same priority = 76,500 CR; Moderate u = 0 = 30,500 CR; Moderate u = 0.75 = 38,500 CR |
| EC-015 | Generated Reward clamp and immutability | gameplay-programmer | 0.2 | EC-014 | New Severe priority offer, u = 0.5 = 95,000 CR (clamped); Expedite and a Unrest or Control change leave Reward at R |
| EC-016 | Generated ETA by threat band | gameplay-programmer | 0.2 | None | Moderate = 2 days, High = 3 days, Severe = 4 days |
| EC-017 | Authored ETA table | gameplay-programmer | 0.2 | None | Glass Veil 2 days, Hollow Crown 4 days, Rust Haven 3 days, from the authored table and not the generated threat map |
| EC-011 | Wins pay in full: loss-retry, generated and post-campaign | gameplay-programmer | 1.0 | EC-010, EC-012 (Complete) | Retry win of Glass Veil at 128,450 CR gives 213,450 CR; generated win at Reward 54,500 CR adds 54,500 CR, also after campaign-complete; a later win of an already-won Glass Veil has `net_payout = 0 CR` |

### Should Have

| ID | Task | Agent/Owner | Est. Days | Dependencies | Acceptance Criteria |
|----|------|-------------|-----------|-------------|-------------------|
| EC-004 | Accepting a contract is free; one pipeline for authored and generated work | gameplay-programmer | 1.0 | None | Accepting leaves Credits at 128,450 CR; authored and generated both visit Brief, Assembly, Mission, Debrief in order; a won Glass Veil stays selectable |
| EC-013 | Abort writes nothing to Economy | gameplay-programmer | 1.0 | EC-012 (Complete) | Confirmed Abort on an Offered generated contract or an Unwon Glass Veil gives no debrief, no invoice, Credits unchanged and the contract still Offered or Unwon |
| EC-018 | Generated expiry windows and Expedite extension | gameplay-programmer | 0.2 | EC-014 | Non-priority expiry 24–48 strategic hours; priority 8–16 hours; Expedite adds 24 hours |
| EC-019 | Generated market cap, roll timer and client | gameplay-programmer | 0.3 | None | At 3 instances a due roll keeps 3; at 2 it makes 3; client is never Sable Enterprises; next roll is due 2–6 strategic hours after a roll while under 3 |
| EC-021 | Campaign-complete from the three authored wins | gameplay-programmer | 0.5 | EC-004 | Two authored wins: campaign-complete false; Glass Veil, Hollow Crown and Rust Haven won: true; all three stay selectable |

### Nice to Have

| ID | Task | Agent/Owner | Est. Days | Dependencies | Acceptance Criteria |
|----|------|-------------|-----------|-------------|-------------------|
| EC-020 | Generated instances leave the market, or are held when hidden | gameplay-programmer | 0.3 | EC-018, EC-019 | Fulfilled, expired and raid-withdrawn instances are gone with no invoice and Credits unchanged; a Locked-hidden instance stays with its stamped Reward and ETA |
| EC-022 | Invoice prints all five money lines, zeros included | ui-programmer | 1.5 | EC-008, EC-009, EC-010 (Complete) | Reward, optional bonus, Collateral, net payout and new balance all print, zeros included, for a zero-priced win, a loss and a quiet-replay win |

## Carryover from Previous Sprint

| Task | Reason | New Estimate |
|------|--------|-------------|
| — | None. All 10 Sprint 3 stories (EC-001, 003, 005, 006, 007, 002, 008, 009, 010, 012) are Complete in `production/sprint-status.yaml` and their story files. | — |

## Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Generated-contract rules (EC-014 to EC-020) may already exist in the World Network generator and get a second implementation | Medium | High | Read the existing generator first at `/story-readiness`. Reuse it; stamp Reward, ETA and expiry once at creation (ADR-0009 immutability) |
| Sheet estimates run far above actual (about 25× in sprint 2, similar in sprint 3), so the sprint closes in under an hour | High | Low | Re-estimate per story at readiness. Pull another epic with `/sprint-plan update` if the window should be filled |
| EC-013 abort overlaps Persistence stories 005 and 006 and Tactical story 013 | Medium | Medium | Assert only that Economy is untouched. Leave save and reload behaviour to the Persistence epic |
| EC-019 roll timer needs the strategic clock owned by World Network | Low | Medium | Read the clock through the existing sync path; add no second timer |
| Sprint 3 QA artifacts are still untracked in git (retro action 1) | High | Low | Commit the five artifacts before implementation starts |

## Dependencies on External Factors

- None outside this repo. The Economy and contracts GDD and its governing ADRs are accepted. No milestone deadline.
- World Network Complete and Sprint 3 Economy stories Complete supply the outcome DTO, the Credits ledger and the invoice pricing. They are dependencies, not work.

## Definition of Done for this Sprint

- [ ] All Must Have tasks completed
- [ ] All tasks pass acceptance criteria
- [ ] QA plan exists (`production/qa/qa-plan-sprint-004-[date].md`, from `/qa-plan sprint`)
- [ ] All Logic/Integration stories have passing unit/integration tests
- [ ] Smoke check passed (`/smoke-check sprint`)
- [ ] QA sign-off report: APPROVED or APPROVED WITH CONDITIONS (`/team-qa sprint`)
- [ ] No S1 or S2 bugs in delivered features
- [ ] Design documents updated for any deviations
- [ ] Code reviewed and merged
