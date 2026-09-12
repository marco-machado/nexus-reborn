# ADR-0012: Store placement for Intel and generated contracts

> **Engine specialist**: pass-with-notes 2026-09-10
> **Technical Director Review (TD-ADR)**: APPROVED 2026-09-10
> **Lead Programmer Review (LP-FEASIBILITY)**: FEASIBLE 2026-09-10

Owner is not the Zustand module. World Network owns Intel; it lives on `campaignStore`. Economy owns generated contract instances; they live on `worldStore` because they tick on strategic time.

## Status
Accepted

## Date
2026-09-10

## Engine Compatibility

| Field | Value |
|-------|-------|
| **Engine** | React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 WebGPU |
| **Domain** | Core |
| **Knowledge Risk** | HIGH — cutoff May 2025; pin is three.js r185 / React 19.2.8. This domain uses no three.js / r3f APIs. |
| **References Consulted** | `docs/engine-reference/web/VERSION.md`; `docs/technical-preferences.md`; `docs/agents/strategy-time-state.md`; `src/state/campaignStore.ts`; `src/state/worldStore.ts`; `src/state/save.ts` |
| **Post-Cutoff APIs Used** | None — Zustand `create()` homes, not an engine API |
| **Verification Required** | No `intelLevel` on `worldStore` or `appStore`. No `src/state/economyStore.ts`. Generated list + `contractRngState` + `nextContractT` live on `worldStore`. Intel live home is `campaignStore`. `save.ts` still the only campaign-blob writer. |

## ADR Dependencies

| Field | Value |
|-------|-------|
| **Depends On** | ADR-0011 (Accepted — campaign envelope), ADR-0003 (Accepted — one contract kind) |
| **Enables** | Stories that would otherwise invent `economyStore` or move Intel onto `worldStore` |
| **Blocks** | None named as epics yet |
| **Ordering Note** | Related / must-not-contradict only: ADR-0008 (Influence wallet stays `worldStore.influence`; ADR-0008 does not own Intel), ADR-0009 (Intel is not a WN deploy-slice field; `quietReplay` freeze unchanged), ADR-0001 (generated catch-up stays in `advanceFlow`). Credits home is `appStore` and is **out of scope** (credits-never-overdraw ADR). |

## Context

### Problem Statement

World Network owns Intel; Economy owns generated contract instances. Code puts Intel on `campaignStore` and generated offers on `worldStore`. Without an ADR, `/create-epics` can treat “owner” as “Zustand module” and ship a second Intel ledger or an `economyStore`.

### Constraints

- Three storage envelopes already decided (ADR-0011). This ADR does not change keys or `SAVE_VERSION`.
- `save.ts` is the only campaign-blob writer. No `zustand/middleware` persist.
- Authored and generated work are the same kind (ADR-0003).
- Do not add an owner-facade layer over Zustand.

### Requirements

- Name Intel’s owner and its Zustand home.
- Name generated-market owner and its Zustand home.
- Do not create `economyStore` for this cut.
- Do not split generated catch-up out of `advanceFlow`.

## Decision

Owner ≠ Zustand module. Stamp the homes that already exist. No migration. No envelope change. No version bump.

### Intel

- **Owner:** World Network — access resource (gates, Event-forecast unlock at intel 2+, authored/generated intel gates, Expedite waiver of a **generated** gate). Earn-on-win / clean bonus / loss=0 / quiet=0 apply from the outcome DTO. Does not own Risk-index math.
- **Live home:** `useCampaignStore` `intelLevel` / `intelProgress`. `awardIntel` and `reportMission` write them. `missionLocked(mission, intelLevel)` is the contract gate. `appStore.selectMission` reads `campaignStore.intelLevel`; it does not keep a second ledger.
- **Persist:** `SaveV9.campaign.intelLevel` / `intelProgress`.
- **Not:** a field of the ADR-0009 WN deploy slice. Not on `worldStore`. Not on `appStore`. Intel 2+ unlocks Event forecast (`WorldMap`); it is not a Brief-only screen gate.
- Expedite does **not** write Intel. It mutates `GeneratedContract.expedited` (+24h expiry, no Reward reroll) on `worldStore`. Gate readers stay `campaignStore` + `missionLocked`.

Do not read `campaignStore.ts`’s CONTRACT FILE header as a second Intel **owner**. The header describes the module; World Network remains the owner.

### Generated contracts

- **Owner:** Economy — instances, Reward, expiry, payout, leave-market.
- **Live home:** `useWorldStore` `contracts` / `contractRngState` / `nextContractT`. `advanceFlow` mutates them on strategic `t` (roll, expire, riot/raid/seizure hooks, crisis priority, Expedite). Do not split that catch-up out of `advanceFlow` (would desync ADR-0001).
- **Persist:** `SaveV9.world.contracts` / `contractRngState` / `nextContractT`.
- World Network **presents** Scan and Expedite; it does not own instances.
- Authored contracts remain `MISSIONS` data. `contractsWon` stays on `campaignStore` (authored win record, not a second pipeline). Quiet replay freeze stays the ADR-0009 Economy slice sampled from `contractsWon`.

### Explicitly not this ADR

- Credits ledger / overdraft (`appStore.credits`).
- Influence wallet (`worldStore.influence`, ADR-0008).
- Telemetry cap / privacy.
- A new `src/state/economyStore.ts`.

### Architecture Diagram

```
Owner: World Network          Owner: Economy
  Intel access                  generated instances
       |                              |
       v                              v
 campaignStore                  worldStore
  intelLevel/Progress            contracts
                                 contractRngState
                                 nextContractT
       \\                              /
        \\---- campaign blob ----------/
                 save.ts only
```

### Key Interfaces

- `useCampaignStore.getState().intelLevel` / `intelProgress`
- `missionLocked(mission, intelLevel)`
- `useWorldStore.getState().contracts` / `contractRngState` / `nextContractT`
- Expedite writes `contracts[].expedited` on `worldStore`
- Event forecast locked when `intelLevel < 2`

## Alternatives Considered

### Alternative 1: Move Intel onto `worldStore`

- **Description**: Colocate Intel with Influence and sectors.
- **Pros**: One “WN blob” module.
- **Cons**: Migration of `SaveV9` and every `missionLocked` caller; `campaignStore` already is the roster/intel home.
- **Rejection Reason**: Stamp-existing. Owner is WN either way; moving the store is churn.

### Alternative 2: New `economyStore`

- **Description**: Zustand module named after the owner.
- **Pros**: Owner and module match.
- **Cons**: Splits generated catch-up from `advanceFlow`; new persist slice.
- **Rejection Reason**: Would desync ADR-0001. No `economyStore.ts` today.

### Alternative 3: Generated instances beside Credits on `appStore`

- **Description**: Economy data in the Credits store.
- **Cons**: `appStore` is flow + Credits; generation fires on `worldStore.t`.
- **Rejection Reason**: Mixes session flow with the market ticker.

## Consequences

### Positive

- Closes TR-world-network-007 and TR-economy-006.
- `/create-epics` cannot emit two Intel ledgers or a new economy store without superseding this ADR.

### Negative

- Owner names and file names disagree (`campaignStore` holds WN Intel). Readers must use this ADR, not the filename.

### Risks

- Treating CONTRACT FILE headers as ownership. Mitigation: this ADR names owners.
- Moving homes “for cleanliness” later without supersede. Mitigation: GDD OQs flipped to stamped.

## GDD Requirements Addressed

| GDD System | Requirement | How This ADR Addresses It |
|------------|-------------|--------------------------|
| world-network.md | TR-world-network-007 Intel is WN’s access resource; store placement needs an ADR | Owner = World Network; home = `campaignStore.intelLevel` / `intelProgress` |
| economy-and-contracts.md | TR-economy-006 Economy owns generated instances; `worldStore` placement needs an ADR | Owner = Economy; home = `worldStore.contracts` / `contractRngState` / `nextContractT` |

## Performance Implications

- **CPU / Memory / Load Time / Network:** none. Stamp-existing; no move.

## Migration Plan

None. Document current CONTRACT FILE stores. Flip GDD “later ADR” notes to stamped. Do not bump `SAVE_VERSION`.

## Validation Criteria

- `rg intelLevel src/state` — only `campaignStore` (plus `appStore` / `save.ts` readers).
- No `src/state/economyStore.ts`.
- `worldStore` still holds `contracts`, `contractRngState`, `nextContractT`.
- `save.ts` still maps intel under `campaign` and generated market under `world`.

## Related Decisions

- [ADR-0003](adr-0003-one-contract-kind.md) — one pipeline
- [ADR-0008](adr-0008-influence-is-a-wallet.md) — Influence on `worldStore`; not Intel
- [ADR-0009](adr-0009-partitioned-deploy-snapshot.md) — Intel off the WN slice
- [ADR-0011](adr-0011-campaign-persistence-envelope.md) — envelope unchanged
