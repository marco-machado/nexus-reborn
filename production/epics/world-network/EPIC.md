# Epic: World Network

> **Layer**: Foundation
> **GDD**: design/gdd/world-network.md
> **Architecture Module**: `worldStore` + `campaignStore.intel*` (Strategic `t`, sectors, Influence wallet, Intel, Tax yield amount)
> **Status**: Ready
> **Stories**: 19 — see the Stories table below

## Overview

The World Network is the director’s job between missions: six open sectors (Antarctica locked), a Scan of cities and contracts, and **strategic time** as a spendable resource — pause included. It is not the district and not a globe. **Control**, **Unrest**, **Tax yield**, and **Garrison condition** print per sector; there is no defense rating and no standing bar. **Influence** is a wallet spent on Stabilize, Lobby, and Expedite, not an average of Control ([ADR-0008](../../docs/architecture/adr-0008-influence-is-a-wallet.md)). **Intel** is earned in the field and spent on access and foresight. Strategic time and tactical time are independent clocks: the network does not tick in the field; a win spends ETA as catch-up, a loss spends none ([ADR-0001](../../docs/architecture/adr-0001-two-clocks.md)). Mission results write back only at debrief. Without this system the player has no board to read and no two-layer loop — only a contract list.

## Governing ADRs

| ADR | Decision Summary | Engine Risk |
|-----|-----------------|-------------|
| [ADR-0001: Two clocks, never both](../../../docs/architecture/adr-0001-two-clocks.md) | Strategic and tactical clocks are independent; a win spends the contract ETA as strategic days, a loss spends none. | LOW |
| [ADR-0002: A mission in progress is not saved](../../../docs/architecture/adr-0002-unsaved-mission.md) | A mission is memory only; abort discards it, and the debrief is the only boundary that applies results, once. | LOW |
| [ADR-0004: A won contract does not pay twice](../../../docs/architecture/adr-0004-quiet-replay.md) | A repeat win on an authored contract pays no Credits, Influence or Intel; a loss retry pays in full. | LOW |
| [ADR-0008: Influence is a wallet; tax is Nexus income](../../../docs/architecture/adr-0008-influence-is-a-wallet.md) | Influence is the points spent on Stabilize, Lobby and Expedite; Tax yield pays only from held sectors. | LOW |
| [ADR-0009: Partitioned deploy snapshot](../../../docs/architecture/adr-0009-partitioned-deploy-snapshot.md) | Four plain-data slices (World Network, Economy, Research, Roster) are cloned onto DeployParams at create. | LOW |
| [ADR-0012: Store placement for Intel and generated contracts](../../../docs/architecture/adr-0012-store-placement.md) | Owner is not the Zustand module: Intel lives on campaignStore, generated contracts on worldStore; no economyStore. | LOW |
| [ADR-0014: Timeline Review is a view, not a clock](../../../docs/architecture/adr-0014-timeline-review-is-a-view.md) | worldStore.review is a session view cursor; it never writes t and is not saved. | LOW |
| [ADR-0018: Catch-up collision order](../../../docs/architecture/adr-0018-catch-up-collision-order.md) | tick and advanceDays share private advanceFlow with one fixed collision order. | LOW |

## GDD Requirements

| TR-ID | Requirement | ADR Coverage |
|-------|-------------|--------------|
| TR-world-network-001 | Strategic and tactical clocks are independent; the World Network does not tick in the field | ADR-0001 ✅ |
| TR-world-network-002 | Only two advancement paths exist — Screen ticking and win-ETA catch-up; a loss spends none | ADR-0001 ✅ |
| TR-world-network-003 | Catch-up fires one next due at its timestamp, rearms from due t, and uses a fixed collision order | ADR-0018 ✅ |
| TR-world-network-004 | Debrief write-back happens at frozen t0, then the ETA jump | ADR-0001, ADR-0002 ✅ |
| TR-world-network-005 | Influence is a spendable wallet (Stabilize, Lobby, Expedite) with no index or standing bar | ADR-0008 ✅ |
| TR-world-network-006 | Tax yield is computed by World Network and emitted to Economy; only Nexus-held sectors pay | ADR-0008 ✅ |
| TR-world-network-007 | Intel is World Network's access resource; live home is campaignStore.intelLevel / intelProgress | ADR-0012 ✅ |
| TR-world-network-008 | Deploy snapshot World Network slice; no live store handles; no live mission or roster query | ADR-0002, ADR-0009 ✅ |
| TR-world-network-009 | Outcome DTO is applied once at debrief; abort writes nothing | ADR-0002 ✅ |
| TR-world-network-010 | Quiet replay awards 0 Influence and Intel and does not shove Control/Unrest; ETA still catch-up | ADR-0004 ✅ |
| TR-world-network-011 | Timeline Review is not an advancement path | ADR-0014 ✅ |
| TR-world-network-012 | Strategic clock runs only on the four Screens | ADR-0001 ✅ |
| TR-world-network-014 | A non-quiet win hands the mission city to Nexus; a loss of a Nexus-held city returns it to its default holder (Nexus-default is a no-op); quiet replay leaves the holder unchanged | ADR-0002, ADR-0021 ✅ |

## Definition of Done

This epic is complete when:
- All stories are implemented, reviewed, and closed via `/story-done`
- All acceptance criteria from `design/gdd/world-network.md` are verified
- All Logic and Integration stories have passing test files beside their module (`src/game/`, `src/world/`, `src/state/`)
- All Visual/Feel and UI stories have retained screenshots in `production/qa/evidence/` — each screen touched for UI, plus a lead sign-off for Visual/Feel

## Stories

| # | Story | Type | Status | ADR |
|---|-------|------|--------|-----|
| 001 | Strategic clock runs only on the four Screens | Logic | Ready | ADR-0001 |
| 002 | Win-ETA catch-up shares advanceFlow; a loss spends none | Logic | Ready | ADR-0018 |
| 003 | Debrief writes back at frozen t0, then ETA; apply-once | Integration | Ready | ADR-0001 |
| 004 | Abort leaves the World Network blob unchanged; deploy gets a frozen WN slice | Integration | Ready | ADR-0009 |
| 005 | Quiet replay awards nothing and shoves nothing; ETA still catches up | Logic | Ready | ADR-0004 |
| 006 | Timeline Review is a view, not a clock | Logic | Ready | ADR-0014 |
| 007 | Tax yield emits only from Nexus-held sectors | Logic | Ready | ADR-0008 |
| 008 | Influence wallet income from the outcome DTO | Logic | Ready | ADR-0008 |
| 009 | Stabilize and Expedite refusals | Logic | Ready | ADR-0008 |
| 010 | Stabilize staged effect over six hourly steps | Logic | Ready | ADR-0008 |
| 011 | Intel progress awards | Logic | Ready | ADR-0012 |
| 012 | Event forecast gated on Intel level | UI | Ready | ADR-0012 |
| 013 | Antarctica stays hidden; Focus cycle skips it; Focus Tax figure prints | UI | Ready | ADR-0012 |
| 014 | Scan hides contracts above the director's Intel; Chance still prints | UI | Ready | ADR-0012 |
| 015 | Mission result shoves Control and Unrest in the right direction | Logic | Ready | ADR-0002 |
| 016 | City holder after a win or a loss | Logic | Ready | ADR-0002 |
| 017 | Opening desk and post-win Scan | Integration | Ready | ADR-0001 |
| 018 | Campaign complete and failed banners, incl. pyrrhic win | Integration | Ready | ADR-0020 |
| 019 | Campaign flag edge cases | Logic | Ready | ADR-0020 |

## Next Step

Run `/story-readiness production/epics/world-network/story-001-*.md`, then `/dev-story`.
