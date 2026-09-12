# ADR-0013: Credits never overdraw

> **Engine specialist**: pass-with-notes 2026-09-10
> **Technical Director Review (TD-ADR)**: APPROVED 2026-09-10
> **Lead Programmer Review (LP-FEASIBILITY)**: FEASIBLE 2026-09-11

Economy owns the Credits ledger. The account never goes negative. Research and hire authorization refuse on overdraft; exact-balance spend is allowed. This stamps the existing `appStore` guards; it does not add `economyStore`.

## Status
Accepted

## Date
2026-09-10

## Engine Compatibility

| Field | Value |
|-------|-------|
| **Engine** | React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 WebGPU |
| **Domain** | Economy / Core |
| **Knowledge Risk** | HIGH — cutoff May 2025; pin is three.js r185 / React 19.2.8. This domain uses no three.js / r3f APIs. Traceability Engine Risk for TR-economy-001: LOW. |
| **References Consulted** | `docs/engine-reference/web/VERSION.md`; `docs/engine-reference/web/breaking-changes.md`; `docs/engine-reference/web/deprecated-apis.md`; `docs/technical-preferences.md`; `docs/agents/strategy-time-state.md`; `src/state/appStore.ts`; `src/state/researchStore.ts`; `src/state/campaignStore.ts`; `src/state/worldStore.ts`; `src/state/save.ts`; `src/ui/Research.tsx` |
| **Post-Cutoff APIs Used** | None — Zustand `create()` ledger, not an engine API |
| **Verification Required** | `spendCredits` refuses `amount <= 0` and `amount > credits`; exact-balance spend → 0; `addCredits` ignores non-positive; `hireOperative` overdraft leaves roster and credits unchanged; `setOutcome` never subtracts (`netPayout` ≥ 0 for production producers); hydrate drop-alls `credits < 0`; no `src/state/economyStore.ts`; `researchStore` has no credits field. |

## ADR Dependencies

| Field | Value |
|-------|-------|
| **Depends On** | ADR-0012 (Accepted — Credits home is `appStore`; no `economyStore`), ADR-0011 (Accepted — campaign blob drop-all), ADR-0002 (Accepted — abort writes nothing) |
| **Enables** | Closes TR-economy-001; leftover of TR-research-005 (Economy debit / no research Credits ledger) |
| **Blocks** | None named as epics yet |
| **Ordering Note** | Related / must-not-contradict: ADR-0008 (Influence is a different wallet on `worldStore`); ADR-0009 (Economy deploy slice is Reward / `quietReplay`, not the live Credits ledger); ADR-0004 (quiet replay zeros `net_payout`). Does not move Credits off `appStore`. Does not restamp `quietReplay`. |

## Context

### Problem Statement

Credits fund research and hiring. Without an accepted ADR, `/create-epics` can invent a second Credits ledger on Research, clamp a negative save to 0, or treat overdraft-disabled chrome as the only guard. TR-economy-001 is still a gap; TR-research-005 is partial because overdraft lives here.

### Constraints

- Owner ≠ Zustand module (ADR-0012). Economy owns Credits; live home stays `appStore.credits`.
- No `src/state/economyStore.ts`.
- `save.ts` is the only campaign-blob writer. No zustand persist middleware.
- Abort writes nothing (ADR-0002). Mid-mission Credits writes are forbidden.
- Influence is not this ledger (ADR-0008).
- `src/game/` stays pure TypeScript and does not own the Credits account.

### Requirements

- Ledger never goes negative.
- Research and hire refuse overdraft; account unchanged; exact-balance spend allowed (→ 0).
- Zero and negative spends ignored. Tax and payouts ignore non-positive amounts.
- Research does not keep a Credits ledger. No refund on abort.
- Hydrate does not clamp a negative blob to 0.

## Decision

Stamp the existing ledger. No migration. No envelope change. No `SAVE_VERSION` bump.

### Ownership and home

- **Owner:** Economy — Credits account, refuse/debit, deposits of Tax emit and `net_payout`.
- **Live home:** `useAppStore` `credits`. Opening `INITIAL_CREDITS = 128450`.
- **Persist:** `SaveV9.app.credits`. Invalid if `!finite(credits) || credits < 0` — drop-all, do not clamp to 0.
- **Not:** a field of the ADR-0009 Economy deploy slice. Not on `researchStore`, `campaignStore`, or `worldStore`. Not Influence.

### Debit sites (two; both refuse overdraft)

1. `spendCredits(amount)` — `amount > 0 && credits >= amount` then subtract, else identity no-op (`return s`, so refused spends do not notify Zustand subscribers). Research production path (`Research.tsx`): re-read `credits`; if short, return; `if (start(node, t)) spendCredits(cost)`. `researchStore.start` is occupancy only and does not read Credits.
2. `hireOperative(candidateId)` — unknown candidate or `credits < cost` → return. Then `acceptHire`; if that fails, return (no debit). Then decrement by `candidate.cost`. Does **not** call `spendCredits`. Do not invert to spend-then-hire (charges a refused roster) or hire-then-`spendCredits` (free hire if spend no-ops).

### Deposits

- `addCredits(amount)` — `amount > 0` only. `worldStore.depositTax` calls this with the emitted Tax amount; do not recompute yield (ADR-0008).
- `setOutcome` adds `netPayout(o)`. `netPayout` is 0 on quietReplay or loss; else `reward - collateralFine + bonus`. `collateralFine = min(reward, civiliansHit * COLLATERAL_FINE)` with `COLLATERAL_FINE = 5000`. Production producers keep this ≥ 0. Accepting a contract is free (`selectMission` does not debit).

### Presentation vs ledger

Interface may disable authorize/hire when short. Chrome is not the guard. The store primitives are.

### Explicitly not this ADR

- Moving Credits off `appStore`.
- A `src/game` `tryDebit` helper (`spendCredits` stays `void`).
- Restamping `quietReplay` from live `contractsWon` (ADR-0009).
- Tightening hydrate from `finite()` to `integer()` (would expand ADR-0011).
- `committedFunds()` as a second Credits field (derived in-flight sum only).
- Production `useAppStore.setState({ credits })` except hydrate — that bypasses guards.

### Architecture Diagram

```
Owner: Economy
  Credits ledger (never < 0)
       |
       v
  appStore.credits
    spendCredits  ← Research.tsx (start() then debit)
    hireOperative ← check → acceptHire → decrement
    addCredits    ← worldStore.depositTax
    setOutcome    ← +netPayout (≥ 0)
       |
       v
  SaveV9.app.credits
    save.ts only
    !finite || < 0 → drop-all (no clamp)

Not this ledger:
  researchStore.start     occupancy only
  campaignStore.acceptHire roster only
  worldStore.influence     ADR-0008
  ADR-0009 economy slice   Reward / quietReplay freeze
```

### Key Interfaces

- `useAppStore.getState().credits`
- `spendCredits(amount: number): void` — identity no-op on refuse
- `addCredits(amount: number): void` — ignores non-positive
- `hireOperative(candidateId: string): void` — check → `acceptHire` → decrement
- `netPayout` / `collateralFine` / `INITIAL_CREDITS` / `COLLATERAL_FINE` in `appStore.ts`
- `researchStore.start(node, t): boolean` — occupancy only
- `campaignStore.acceptHire` — roster only
- `worldStore` `depositTax` → `addCredits`
- `save.ts` `app.credits < 0` or non-finite → invalid blob

## Alternatives Considered

### Alternative 1: Pure `tryDebit(balance, amount)` in `src/game`

- **Description**: Stores call a pure function; easier unit tests without Zustand.
- **Pros**: `src/game` purity; boolean result.
- **Cons**: Extra module; existing `appStore.test.ts` already covers the guards; AGENTS.md keeps the ledger in `src/state`.
- **Rejection Reason**: YAGNI. Stamp existing.

### Alternative 2: UI-only disable

- **Description**: Research/hire buttons disable when `cost > credits`; store always subtracts.
- **Pros**: Less store logic.
- **Cons**: Any non-UI caller overdraws. GDD forbids overdraw even if chrome is bypassed.
- **Rejection Reason**: The ledger must refuse.

### Alternative 3: New `economyStore`

- **Description**: Zustand module named after the owner, holding Credits.
- **Pros**: Owner name and filename match.
- **Cons**: New persist slice; splits the account from session flow; forbidden by ADR-0012.
- **Rejection Reason**: No `economyStore.ts`. Credits stay on `appStore`.

### Alternative 4: Clamp a negative blob to 0 on hydrate

- **Description**: If `SaveV9.app.credits < 0`, write 0 and continue.
- **Pros**: Player keeps the rest of the house.
- **Cons**: A half-house with a repaired wallet. ADR-0011 drop-all.
- **Rejection Reason**: Invalid Credits is drop-all, not a clamp.

## Consequences

### Positive

- Closes TR-economy-001. Completes the leftover of TR-research-005 (Economy debit / no research ledger; abort already ADR-0002).
- `/create-epics` cannot emit a Research Credits wallet or clamp-negative hydrate without superseding this ADR.

### Negative

- Two debit sites (`spendCredits` vs `hireOperative`'s own decrement). Hire order is load-bearing and easy to "clean up" wrongly.
- `researchStore.start` can run unbilled (tests do). Production must bill only a true start.
- Owner name (Economy) and file name (`appStore`) disagree — same cut as ADR-0012 Intel.

### Risks

- Identity no-op on refuse must stay `return s` so subscribers are not woken for a no-change.
- Do not "fix" hire to `spendCredits` after `acceptHire` (free hire) or debit before `acceptHire` (charge on roster refuse).
- `campaignStore` comment "fee cleared first" is stale vs check → `acceptHire` → decrement; stamp the code.
- Production `Research.tsx` must not invert to spend-then-start (charges a refused lab).
- `committedFunds()` must not be persisted or debited as a second ledger.
- This ADR prices Credits from the outcome's `quietReplay` / `netPayout`; it does not own restamping `quietReplay` (`world.ts` / `setOutcome` still do that today — ADR-0009).
- Do not attach zustand persist to credits (ADR-0011).
- Production must not `setState({ credits })` except hydrate.
- Do not tighten hydrate to `integer()` here.
- `netPayout` does not clamp a hostile negative `bonus`; production producers keep bonus ≥ 0.
- Do not treat `spendInfluence` as a Credits path.

## GDD Requirements Addressed

| GDD System | Requirement | How This ADR Addresses It |
|------------|-------------|--------------------------|
| economy-and-contracts.md | TR-economy-001 Credits ledger never negative; overdraft refuse; exact-balance spend allowed | Names `spendCredits` / `hireOperative` refuse; exact balance → 0; hydrate drop-all if `credits < 0` |
| research.md | TR-research-005 Authorize via Economy debit; no research Credits ledger; no refund on abort | `researchStore` has no credits field; production bills only `start() === true`; abort writes nothing (ADR-0002) |
| roster-and-assembly.md | Hire on overdraw refused; Roster does not keep a Credits ledger | `hireOperative` pre-check; `acceptHire` does not touch Credits |

## Performance Implications

- **CPU**: None. Identity no-op on refuse.
- **Memory**: None. One number on `appStore`.
- **Load Time**: None. No envelope change.
- **Network**: None.

## Migration Plan

None. Document current CONTRACT FILE guards. Do not bump `SAVE_VERSION`.

## Validation Criteria

- `spendCredits(START + 1)` leaves credits unchanged; `spendCredits(START)` → 0; 0 and negative amounts no-op.
- Hire overdraft: credits and roster unchanged.
- `rg credits src/state/researchStore.ts` — no field.
- No `src/state/economyStore.ts`.
- `save.ts` still rejects `credits < 0` without clamping.

## Related Decisions

- [ADR-0002](adr-0002-unsaved-mission.md) — abort / apply-once
- [ADR-0004](adr-0004-quiet-replay.md) — quiet replay zeros net
- [ADR-0008](adr-0008-influence-is-a-wallet.md) — Influence / Tax emit
- [ADR-0009](adr-0009-partitioned-deploy-snapshot.md) — Economy slice is not the live ledger
- [ADR-0011](adr-0011-campaign-persistence-envelope.md) — envelope / drop-all
- [ADR-0012](adr-0012-store-placement.md) — Credits home; this ADR was out of scope there
