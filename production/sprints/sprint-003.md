# Sprint 3 — 2026-11-06 to 2026-11-19

## Sprint Goal

Stand up the Economy ledger and invoice: Credits never overdraw, collateral and net payout price a debrief, and a loss or quiet replay pays nothing.

## Capacity

- Total days: 10 working days (one person, Fri 6 Nov through Thu 19 Nov)
- Buffer (20%): 2 days
- Available: 8 days
- Must Have uses 4.0 of those 8. Should Have uses 3.0. Nice to Have adds 1.0 and sits past the planned line, so it is cut first.
- Calibration (retro sprint 2, 2026-10-13): Sprint 2 delivered 8.5 sheet-days in about 2.7 active hours, about 3.1 sheet-days per active hour. At that pace this plan's 8.0 sheet-days is about 2.6 active hours. Many sprint 2 stories only added tests for behaviour that already existed. Part of this sprint's pricing exists too: `collateralFine` and `netPayout` are in `src/state/appStore.ts` and are used by the Debrief (`src/ui/index.tsx`) and the HUD. Check each story against that code at `/story-readiness` (retro action 2). A story that only needs tests and evidence should be re-estimated down. Record actual hours per story at close-out (retro action 3).
- Epic choice: World Network (19 of 19) is Complete. Economy and contracts is the next Core epic; its Must Have chain (001 → 003, 005 → 006 → 007) has no unmet dependency. Research, Persistence, Roster, Tactical, Interface and Audio epics stay out. Pull them in with `/sprint-plan update` if the window should be filled.
- Story granularity: balanced (10 stories planned, inside the 6–10 range).
- No milestone is defined. No risk register exists. Planning is against the Ready story backlog only.

QA plan: `production/qa/qa-plan-sprint-003-2026-10-13.md`.

## Tasks

### Must Have (Critical Path)

| ID | Task | Agent/Owner | Est. Days | Dependencies | Acceptance Criteria |
|----|------|-------------|-----------|-------------|-------------------|
| EC-001 | Credits ledger: opening balance, deposits and non-positive spends | gameplay-programmer | 1.0 | None | New campaign reads 128,450 CR; a Tax deposit A > 0 adds A and A ≤ 0 changes nothing; a spend of 0 or −1 CR leaves Credits unchanged and starts no research or hire; deposit after a `net_payout = 0` apply yields 129,450 CR |
| EC-003 | Economy keeps no Influence or Intel ledger | gameplay-programmer | 0.5 | None | Payout, Tax deposit, research debit and hire debit leave Influence and Intel as they were; a first non-quiet win payout applied by Economy alone leaves Influence 0 |
| EC-005 | Collateral prices unique squad-caused civilian first-hits | gameplay-programmer | 1.0 | None | 2 unique squad first-hits at Reward 85,000 CR = 10,000 CR; the same civilian hit twice = 5,000 CR; CorpSec-only harm = 0; one non-fatal first-hit = 5,000 CR |
| EC-006 | Collateral clamps and input sanitising | gameplay-programmer | 1.0 | EC-005 | Collateral capped at Reward (41,000 CR for 9 hits); civiliansHit −1 = 0; 2.7 floors to 2 = 10,000 CR at Reward 85,000; NaN civiliansHit and NaN bonus give Collateral 0, bonus 0 and `net_payout` 85,000 CR |
| EC-007 | Net payout: reward plus optional bonus minus collateral | gameplay-programmer | 0.5 | EC-005, EC-006 | Reward 85,000 − Collateral 10,000 = 75,000 CR; Reward 41,000 with Collateral 41,000 and bonus +6,000 = 6,000 CR; negative bonus −1,000 clamps to 0 and `net_payout` stays 85,000 CR |

### Should Have

| ID | Task | Agent/Owner | Est. Days | Dependencies | Acceptance Criteria |
|----|------|-------------|-----------|-------------|-------------------|
| EC-002 | Credits never overdraw: research and hire refusals | gameplay-programmer | 1.0 | EC-001 | At 15,999 CR a 16,000 CR project or candidate is refused with Credits, roster and research unchanged; at exactly 16,000 CR either succeeds and Credits = 0 |
| EC-008 | Worked contract examples: Hollow Crown, Rust Haven, pyrrhic win | gameplay-programmer | 0.5 | EC-007 | Hollow Crown (Reward 62,000, 13 hits, optional +9,000) gives Collateral 62,000 and net 9,000; Rust Haven (Reward 41,000, 8 hits) gives Collateral 40,000 and net 1,000; a pyrrhic non-quiet win pays 85,000 CR in full |
| EC-009 | A loss pays nothing; a failed generated contract leaves the market | gameplay-programmer | 0.5 | EC-007 | A loss has `net_payout` 0 with `reward` and Collateral still reported and Credits unchanged by the fee; an optional bonus on a loss pays nothing; a failed generated contract is gone after debrief with Credits unchanged |
| EC-010 | Quiet replay pays no fee, optionals included | gameplay-programmer | 1.0 | EC-007 | A quiet-replay win has `net_payout` 0 including the optional bonus with `reward` still 62,000; Credits stay 128,450; frozen `quietReplay` and Reward on the Economy slice are not restamped by a later `contractsWon` |

### Nice to Have

| ID | Task | Agent/Owner | Est. Days | Dependencies | Acceptance Criteria |
|----|------|-------------|-----------|-------------|-------------------|
| EC-012 | Debrief Credits apply once; no Credits move during a mission | gameplay-programmer | 1.0 | EC-001 | The same outcome key K applied twice credits `net_payout` once (203,450 CR from 128,450 + 75,000); a higher key applies; Credits stay flat while the mission runs |

## Carryover from Previous Sprint

| Task | Reason | New Estimate |
|------|--------|-------------|
| — | None. All 11 Sprint 2 stories (WN-005, 008, 009, 010, 011, 018, 013, 012, 014, 017, 019) are Complete in `production/sprint-status.yaml` and their story files. | — |

## Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Sheet estimates run far above actual (sprint 2 measured about 25×), so the sprint closes in a few active hours and the window sits empty | High | Low | Do not pad with another epic in this plan. Pull more with `/sprint-plan update` if the window should be filled |
| EC-001's opening 128,450 CR may already exist in `appStore` and duplicate a constant | Medium | Medium | Read the existing balance and Tax deposit path first. Reuse it rather than adding a second ledger (ADR-0012: no `economyStore`) |
| EC-005–EC-007 and the later invoice stories fork a second payout formula against the outcome DTO | Medium | High | Price in one place from the outcome DTO (ADR-0021). EC-008, EC-009 and EC-010 assert against that single function |
| EC-010's frozen `quietReplay` depends on the Economy deploy slice (ADR-0009) that Tactical/Persistence stories also touch | Medium | Medium | Assert against the slice as cloned at create. Do not read live `contractsWon` at apply |
| EC-012 apply-once overlaps Persistence stories 006 and 007 | Low | Medium | EC-012 is Nice to Have. Cut it first and leave the shared key to the Persistence epic if it conflicts |

## Dependencies on External Factors

- None outside this repo. Economy and contracts GDD and the governing ADRs (0002, 0003, 0004, 0008, 0009, 0012, 0013, 0021) are accepted. No milestone deadline.
- World Network Complete (WN-002, WN-003, WN-008) supplies the outcome DTO and quiet-replay flag. They are dependencies, not work.

## Definition of Done for this Sprint

- [ ] All Must Have tasks completed
- [ ] All tasks pass acceptance criteria
- [x] QA plan exists (`production/qa/qa-plan-sprint-003-2026-10-13.md`)
- [ ] All Logic/Integration stories have passing unit/integration tests
- [ ] Smoke check passed (`/smoke-check sprint`)
- [ ] QA sign-off report: APPROVED or APPROVED WITH CONDITIONS (`/team-qa sprint`)
- [ ] No S1 or S2 bugs in delivered features
- [ ] Design documents updated for any deviations
- [ ] Code reviewed and merged
