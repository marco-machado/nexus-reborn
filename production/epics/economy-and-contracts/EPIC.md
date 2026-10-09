# Epic: Economy and contracts

> **Layer**: Core
> **GDD**: design/gdd/economy-and-contracts.md
> **Architecture Module**: Economy — `appStore.credits`, `worldStore.contracts*`, invoice/`net_payout`
> **Status**: Ready
> **Stories**: 22 — see the Stories table below

## Overview

Economy and contracts is the house ledger and the work itself: **Credits** pay research and candidates; **Influence** is not kept here (World Network owns that wallet). The director accepts deniable work — three authored contracts as the campaign spine, a generated market as ongoing demand — at no up-front cost, then collects a **net payout** at debrief: Reward plus optional bonuses minus **collateral**. Collateral prices unique civilian hits by the squad. A quiet replay of already-won authored work pays no fee ([ADR-0004](../../docs/architecture/adr-0004-quiet-replay.md)). Authored and generated take the same path ([ADR-0003](../../docs/architecture/adr-0003-one-contract-kind.md)). Tax yield is received from World Network, not computed here ([ADR-0008](../../docs/architecture/adr-0008-influence-is-a-wallet.md)). Debrief applies the invoice once ([ADR-0002](../../docs/architecture/adr-0002-unsaved-mission.md)); a win spends ETA so Tax can still tick ([ADR-0001](../../docs/architecture/adr-0001-two-clocks.md)). Without this system the research gap has no market, violence has no invoice, and the World Network is only a contract picker.

## Governing ADRs

| ADR | Decision Summary | Engine Risk |
|-----|-----------------|-------------|
| [ADR-0002: A mission in progress is not saved](../../../docs/architecture/adr-0002-unsaved-mission.md) | A mission is memory only; abort discards it, and the debrief is the only boundary that applies results, once. | LOW |
| [ADR-0003: Authored and generated contracts are the same kind of work](../../../docs/architecture/adr-0003-one-contract-kind.md) | One contract kind and one brief → assembly → mission → debrief pipeline for authored and generated work. | LOW |
| [ADR-0004: A won contract does not pay twice](../../../docs/architecture/adr-0004-quiet-replay.md) | A repeat win on an authored contract pays no Credits, Influence or Intel; a loss retry pays in full. | LOW |
| [ADR-0008: Influence is a wallet; tax is Nexus income](../../../docs/architecture/adr-0008-influence-is-a-wallet.md) | Influence is the points spent on Stabilize, Lobby and Expedite; Tax yield pays only from held sectors. | LOW |
| [ADR-0009: Partitioned deploy snapshot](../../../docs/architecture/adr-0009-partitioned-deploy-snapshot.md) | Four plain-data slices (World Network, Economy, Research, Roster) are cloned onto DeployParams at create. | LOW |
| [ADR-0012: Store placement for Intel and generated contracts](../../../docs/architecture/adr-0012-store-placement.md) | Owner is not the Zustand module: Intel lives on campaignStore, generated contracts on worldStore; no economyStore. | LOW |
| [ADR-0013: Credits never overdraw](../../../docs/architecture/adr-0013-credits-never-overdraw.md) | Credits never go negative; refusal is an identity no-op; exact-balance spend is allowed. | LOW |
| [ADR-0021: Outcome DTO and apply-once key](../../../docs/architecture/adr-0021-outcome-dto-and-apply-once-key.md) | One apply-once key per deploy guards a single applyDebrief transaction; Economy prices the whole invoice. | LOW |

## GDD Requirements

| TR-ID | Requirement | ADR Coverage |
|-------|-------------|--------------|
| TR-economy-001 | Credits ledger never goes negative; overdraft refuses; exact-balance spend is allowed | ADR-0013 ✅ |
| TR-economy-002 | Economy does not keep an Influence ledger and does not award Influence | ADR-0008 ✅ |
| TR-economy-003 | Authored and generated contracts share brief → assembly → mission → debrief | ADR-0003 ✅ |
| TR-economy-004 | Quiet replay zeros the whole net payout, including optional bonuses | ADR-0004 ✅ |
| TR-economy-005 | Partitioned deploy snapshot Economy slice (Reward, bonus defs, quietReplay) | ADR-0009 ✅ |
| TR-economy-006 | Economy owns generated contract instances; live home is worldStore.contracts / contractRngState / nextContractT | ADR-0012 ✅ |
| TR-economy-007 | Tactical counts civiliansHit; Economy prices collateral and net_payout | ADR-0009 ✅ |
| TR-economy-008 | Debrief Credits apply once; abort writes nothing | ADR-0002 ✅ |
| TR-economy-009 | Tax deposit is the emitted amount; Economy does not recompute yield | ADR-0008 ✅ |
| TR-economy-010 | Apply-once key is minted at deploy, carried on the Economy slice, and echoed on the outcome DTO; an already-applied key is a no-op, including Credits and Tax deposits | ADR-0021, ADR-0002, ADR-0009 ✅ |
| TR-economy-011 | Tactical emits completed optional objective ids and no priced reward or bonus; Economy prices the optional bonus at debrief from frozen Economy-slice defs | ADR-0021, ADR-0009 ✅ |

## Definition of Done

This epic is complete when:
- All stories are implemented, reviewed, and closed via `/story-done`
- All acceptance criteria from `design/gdd/economy-and-contracts.md` are verified
- All Logic and Integration stories have passing test files beside their module (`src/game/`, `src/world/`, `src/state/`)
- All Visual/Feel and UI stories have retained screenshots in `production/qa/evidence/` — each screen touched for UI, plus a lead sign-off for Visual/Feel

## Stories

| # | Story | Type | Status | ADR |
|---|-------|------|--------|-----|
| 001 | Credits ledger: opening balance, deposits and non-positive spends | Logic | Ready | ADR-0013 |
| 002 | Credits never overdraw: research and hire refusals | Logic | Ready | ADR-0013 |
| 003 | Economy keeps no Influence or Intel ledger | Logic | Ready | ADR-0008 |
| 004 | Accepting a contract is free; one pipeline for authored and generated work | Integration | Ready | ADR-0003 |
| 005 | Collateral prices unique squad-caused civilian first-hits | Logic | Ready | ADR-0021 |
| 006 | Collateral clamps and input sanitising | Logic | Ready | ADR-0021 |
| 007 | Net payout: reward plus optional bonus minus collateral | Logic | Ready | ADR-0021 |
| 008 | Worked contract examples: Hollow Crown, Rust Haven, pyrrhic win | Logic | Ready | ADR-0021 |
| 009 | A loss pays nothing; a failed generated contract leaves the market | Logic | Ready | ADR-0021 |
| 010 | Quiet replay pays no fee, optionals included | Logic | Ready | ADR-0004 |
| 011 | Wins pay in full: loss-retry, generated and post-campaign | Logic | Ready | ADR-0004 |
| 012 | Debrief Credits apply once; no Credits move during a mission | Integration | Ready | ADR-0021 |
| 013 | Abort writes nothing to Economy | Integration | Ready | ADR-0002 |
| 014 | Generated Reward is stamped from threat band, roll and priority | Logic | Ready | ADR-0012 |
| 015 | Generated Reward clamp and immutability | Logic | Ready | ADR-0012 |
| 016 | Generated ETA by threat band | Logic | Ready | ADR-0012 |
| 017 | Authored ETA table | Logic | Ready | ADR-0001 |
| 018 | Generated expiry windows and Expedite extension | Logic | Ready | ADR-0012 |
| 019 | Generated market cap, roll timer and client | Logic | Ready | ADR-0012 |
| 020 | Generated instances leave the market, or are held when hidden | Logic | Ready | ADR-0003 |
| 021 | Campaign-complete from the three authored wins | Logic | Ready | ADR-0003 |
| 022 | Invoice prints all five money lines, zeros included | UI | Ready | ADR-0021 |

## Next Step

Run `/story-readiness production/epics/economy-and-contracts/story-001-*.md`, then `/dev-story`.
