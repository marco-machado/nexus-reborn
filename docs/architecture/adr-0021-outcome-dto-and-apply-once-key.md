# ADR-0021: Outcome DTO and apply-once key

## Status
Accepted

## Date
2026-10-08

## Last Verified
2026-10-08

## Decision Makers
Marco Machado (owner); drafted with Claude via `/architecture-decision`

## Summary
The Debrief apply-once guard is a serial that the apply path mints (`setOutcome` increments `outcomeSerial` and deposits Credits on every call), so a repeated outcome deposits Credits twice; and Tactical prices the optional bonus although Economy owns pricing. One apply-once key is minted when the deploy snapshot is cut, rides the Economy slice and the outcome unchanged, and guards a single `applyDebrief` transaction for every owner; Tactical reports completed optional objective ids and Economy prices the whole invoice.

## Engine Compatibility

| Field | Value |
|-------|-------|
| **Engine** | React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 WebGPU |
| **Domain** | Core / Economy |
| **Knowledge Risk** | HIGH for the pin overall (cutoff May 2025; three.js r185 / React 19.2.8 — see `docs/engine-reference/web/VERSION.md`). This domain uses no three.js / r3f / React 19.2 APIs: LOW. |
| **References Consulted** | `docs/engine-reference/web/VERSION.md`; `docs/engine-reference/web/breaking-changes.md`; `docs/engine-reference/web/deprecated-apis.md`; `docs/agents/mission-runtime.md`; `docs/agents/strategy-time-state.md`; `docs/registry/architecture.yaml`; `src/state/appStore.ts`; `src/state/campaignStore.ts`; `src/state/save.ts`; `src/game/world.ts`; `src/game/types.ts`; `src/ui/MissionScreen.tsx`; `src/ui/index.tsx` |
| **Post-Cutoff APIs Used** | None — plain TypeScript and Zustand `getState` / `setState`. No React 19.2 `useEffectEvent` / `<Activity>`. |
| **Verification Required** | Applying the same outcome twice changes Credits, roster, sectors, Intel, Influence, `t`, Feed, telemetry and RNG state once. `setOutcome` does not change `credits`. `createWorld`'s outcome carries no priced `reward` / `bonus` and echoes `economy.applyKey`. React StrictMode double-mount of `MissionScreen` and the Debrief effect causes no double apply. |

## ADR Dependencies

| Field | Value |
|-------|-------|
| **Depends On** | ADR-0002 (Accepted — mission memory-only; Debrief is the only write-back, once), ADR-0009 (Accepted — partitioned deploy snapshot; Economy slice), ADR-0004 (Accepted — quiet replay zeros the whole net payout), ADR-0013 (Accepted — Credits ledger, `addCredits`), ADR-0020 (Accepted — campaign flags set inside the Debrief apply), ADR-0001 (Accepted — win ETA catch-up runs after write-back) |
| **Enables** | ADR-0009 implementation stories (QQ-02) with a final `economy` slice shape; Economy divergence fixes recorded in `economy-and-contracts.md` (pricing owner, collateral clamp) |
| **Blocks** | None named as epics yet |
| **Ordering Note** | Amends ADR-0009 Key Interfaces `economy` and the `MissionOutcome` shape in `architecture.md`. Amends ADR-0013 §Deposits (payout writer moves from `setOutcome` to `applyDebrief → addCredits`; priced `collateral` / `netPayout` are stored, not derived) and ADR-0015 §Mission coupling (`src/game` emits `MissionResult.telemetry`). Supersedes ADR-0020 §Context line 45 (`outcomeApplied` vs `outcomeSerial` as the guard). Does not change ADR-0009's `quietReplay` freeze, ADR-0011's durable-commit rule, or ADR-0018's catch-up order. |

## Context

### Problem Statement
Two GDD rules have no architecture behind them (TR-economy-010, TR-economy-011; `architecture-review-2026-10-08.md`):

1. **Apply-once.** `setOutcome` (`src/state/appStore.ts`) adds `netPayout(o)` to Credits and increments `outcomeSerial` on every call. The Debrief effect (`src/ui/index.tsx`) guards the campaign, World Network, ETA and telemetry apply with `campaignStore.outcomeApplied >= outcomeSerial`. Because the apply path mints the serial, a second `setOutcome` looks new: Credits are deposited again, and the effect runs the whole campaign apply again. The owner chose a deploy-minted key as canonical (cross-review 2026-10-08 W-01).
2. **Pricing owner.** `maybeOutcome` (`src/game/world.ts`) emits `reward: won ? mission.reward : 0` and `bonus: bonusEarned`, so Tactical prices the optional bonus and zeros the stored Reward on a Loss. The Economy GDD has Tactical report completed optional ids and Economy price every money line from the frozen Economy slice. ADR-0009's `bonusDefs: readonly number[]` carries no ids to price against.

### Constraints
- Mission and Debrief are memory-only (ADR-0002, ADR-0011). Hydrate lands on Menu with `outcome: null`; no apply can be pending across a reload.
- `src/game/` stays pure TypeScript with no store reads for deploy data (ADR-0009).
- Credits never overdraw and move only through guarded ledger functions (ADR-0013).
- Deterministic gameplay and RNG; per-frame data stays out of React (AGENTS.md).

### Requirements
- One key per deploy, minted when the snapshot is cut, never by the apply.
- A repeated apply with the same key is a no-op for every owner, including Credits and the Tax deposits its ETA catch-up triggers.
- Tactical emits counts and ids only; Economy prices Reward, optional bonus, Collateral and net payout, including zeros.
- Stored Reward survives a Loss and a quiet replay on the outcome.

## Decision

### 1. Key minting
`appStore` gains a session counter `deploySerial: number` (initial 0; reset to 0 by hydrate and New Operation, like `outcomeSerial` today; never in the campaign blob). The composer in `MissionScreen` increments it once per mission create and stamps the new value on the Economy slice as `applyKey`. Nothing else mints a key.

`appStore` also gains `lastAppliedKey: number` (initial 0, session only, reset with `deploySerial`). A key is applied iff `outcome.applyKey > lastAppliedKey`. Keys only increase, so neither a repeat nor a stray older key can re-apply. An aborted or torn-down deploy never applies; its key is burned and never seen again.

### 2. Economy slice (amends ADR-0009 Key Interfaces)
```ts
economy: {
  id: string
  generated: boolean
  applyKey: number                              // minted at create
  reward: number                                // stored contract Reward
  bonusDefs: Readonly<Record<string, number>>   // optional ObjectiveDef.id → bonusReward
  etaDays: number
  quietReplay: boolean                          // unchanged: frozen at create, never undefined
}
```
`bonusDefs` holds only optional objectives that carry a `bonusReward`. Every other ADR-0009 slice is unchanged.

### 3. Tactical result (what `src/game/` emits)
`MissionResult` is defined beside `MissionOutcome` in `src/state/appStore.ts` (a CONTRACT FILE) as a type. `src/game/world.ts` imports it type-only, as it already reaches `appStore` (`docs/agents/mission-runtime.md`). No new runtime import enters `src/game/`.
```ts
interface MissionResult {
  applyKey: number              // echoed from deploy.economy.applyKey
  won: boolean
  kills: number
  casualties: number
  timeSec: number
  civiliansHit: number          // unique squad-caused first hits (raw count)
  completedOptionalIds: string[]
  deadIds: string[]
  survivorHp: Record<string, number>
  quietReplay: boolean          // required; copied from deploy.economy.quietReplay
  telemetry?: MissionTelemetry
}
```
No `reward`, `bonus`, collateral or payout field. `maybeOutcome` stops reading `contractsWon` (`world.ts` `useCampaignStore` read) and `mission.reward`. Because `quietReplay` is required, the live `contractsWon` fallbacks in `reportMission` (`campaignStore.ts`) and `applyMissionResult` (`worldStore.ts`) are deleted.

### 4. Pricing (Economy, pure)
`priceOutcome(result: MissionResult, economy: EconomySlice): MissionOutcome` lives with the Credits ledger and `COLLATERAL_FINE` in `src/state/appStore.ts`. It is an Economy function and reads no store. The live HUD collateral count (`Hud.tsx`) uses the same `N` clamp. `MissionOutcome = MissionResult & { reward; bonus; collateral; netPayout }`:
- `reward = economy.reward` (also on Loss and quiet replay).
- `bonus = Σ economy.bonusDefs[id]` over unique `completedOptionalIds`; unknown ids, non-finite or negative values price 0.
- `N = max(0, floor(civiliansHit))`, non-finite → 0; `collateral = min(reward, N × COLLATERAL_FINE)`.
- `netPayout = (won && !quietReplay) ? reward + bonus − collateral : 0`; always a finite integer ≥ 0.

`setOutcome(result)` prices once, stores the priced outcome, and enters Debrief. It does not touch `credits` and does not mint anything. Debrief renders the stored priced outcome.

### 5. One transaction: `applyDebrief`
`applyDebrief(missionId: string): void` in `src/state/` reads the stored outcome and:
1. returns if there is no outcome or `outcome.applyKey <= lastAppliedKey`;
2. sets `lastAppliedKey = outcome.applyKey` first (a re-entrant call during the apply is then a no-op);
3. records telemetry (`recordMissionOutcome`; ADR-0015 gate unchanged);
4. `addCredits(outcome.netPayout)` (ADR-0013; `addCredits` ignores 0);
5. `campaignStore.reportMission` (roster, Intel, `contractsWon`, campaign flags — ADR-0020). It writes `lastReport`, which step 6 reads;
6. `worldStore.applyMissionResult` (sector, Influence, Feed, generated removal) at frozen `t0`, with KIA codenames from `lastReport`. Steps 5 and 6 must not be reordered;
7. squad and loadout cleanup for KIA and newly injured;
8. on a win, `advanceDays(economy ETA)` then Research and Roster `sync(t)` (ADR-0001, ADR-0018). Tax deposits inside `advanceDays` go through `addCredits`, so they sit under the same key.

Debrief calls `applyDebrief(missionId)` from `useLayoutEffect`, so the header never paints the pre-payout Credits balance (today `setOutcome` deposits before the first Debrief paint). Debrief holds no guard of its own. `campaignStore.outcomeApplied` and `appStore.outcomeSerial` are deleted; `reportMission` and `applyMissionResult` stay unguarded mutators that only `applyDebrief` calls on the Debrief path.

### Architecture Diagram
```
MissionScreen composer (mission create)
  deploySerial += 1 ──► economy.applyKey, bonusDefs{id→CR}, reward, quietReplay
        │
        ▼  DeployParams (ADR-0009)
src/game createWorld ── maybeOutcome ──► MissionResult { applyKey, ids, counts }
        │                                   (no CR)
        ▼
appStore.setOutcome(result)
  priceOutcome(result, economy) ──► stored MissionOutcome (priced)   — no Credits
        │
        ▼  Debrief renders the invoice
applyDebrief(missionId)
  applyKey <= lastAppliedKey ? return
  lastAppliedKey = applyKey
  telemetry → addCredits(netPayout) → reportMission → applyMissionResult
  → squad cleanup → (win) advanceDays(ETA) → sync(t)
        │
        ▼  next Screen autosave = first durable write (ADR-0011)
```

### Key Interfaces
- `appStore`: `deploySerial: number`; `lastAppliedKey: number`; `setOutcome(result: MissionResult): void`; `outcome: MissionOutcome | null`. Removed: `outcomeSerial`.
- `campaignStore`: removed `outcomeApplied`.
- `priceOutcome(result: MissionResult, economy: EconomySlice): MissionOutcome` — pure.
- `applyDebrief(missionId: string): void` — the only caller of the Debrief owner mutators.
- `collateralFine` / `netPayout` helpers read the priced fields; they no longer derive from `reward × civiliansHit` on the fly.

### Implementation Guidelines
- The composer must mint `applyKey` exactly once per mission create; `applyDebrief`, `setOutcome`, `reportMission` and `src/game/` must never mint or rewrite it.
- `setOutcome` must never change `credits`.
- `src/game/` must never emit `reward`, `bonus`, collateral or payout, and must never read `mission.reward` or `contractsWon` to build the outcome.
- The Debrief apply must run only through `applyDebrief`; no UI component calls `reportMission`, `applyMissionResult`, `addCredits` or `advanceDays` for a Debrief result.
- `lastAppliedKey` must be set before any owner mutation inside `applyDebrief`.
- `reportMission` must run before `applyMissionResult` (it supplies `lastReport`).
- Debrief must invoke `applyDebrief` before paint (`useLayoutEffect`).
- `deploySerial` and `lastAppliedKey` must never enter the campaign blob.
- Priced fields must be finite integers; non-finite inputs price as 0.

## Alternatives Considered

### Alternative 1: Keep `outcomeSerial`, add a Credits guard
- **Description**: Move the Credits deposit out of `setOutcome` into the Debrief effect under the existing `outcomeApplied >= outcomeSerial` check.
- **Pros**: Smallest diff; no new field on the slice.
- **Cons**: The serial is still minted by the apply path, so a repeated `setOutcome` still mints a fresh serial and the guard passes again. Contradicts the owner's W-01 choice.
- **Rejection Reason**: Does not fix the root cause; a duplicate outcome still looks new.

### Alternative 2: Per-owner guards on the same key
- **Description**: Each owner (Economy, campaign, World Network, ETA) stores its own last-applied key and checks it inside its own mutator.
- **Pros**: Each mutator is individually idempotent.
- **Cons**: Four copies of the same rule; a partial apply (one owner applied, another not) becomes representable; more fields to reset on hydrate and New Operation.
- **Rejection Reason**: The GDDs define apply-once as transaction-level, not per mutator (`world-network.md` AC). One guard matches the rule.

### Alternative 3: Persisted or random key
- **Description**: Persist the last applied key in the campaign blob, or mint with `crypto.randomUUID()`.
- **Pros**: The key survives reload / needs no counter.
- **Cons**: Persisting guards a state the save never holds (ADR-0002) and costs a save-version bump; random ids break deterministic tests and headless runs.
- **Rejection Reason**: A session counter is sufficient and deterministic.

## Consequences

### Positive
- One rule, one place: a duplicate outcome cannot double-pay Credits, Tax, Intel, Influence or roster changes.
- Tactical stops pricing; the invoice shows stored Reward on Loss and quiet replay as the GDD requires.
- The Debrief transaction becomes unit-testable without React.
- Closes the `quietReplay` live-fallback divergence on the outcome path (the result copies the slice boolean).

### Negative
- `MissionOutcome` splits into `MissionResult` (Tactical) and the priced `MissionOutcome` (Economy); telemetry, Debrief and tests that build outcomes by hand must be updated.
- `credits_ledger` write access changes: `setOutcome` is removed and `applyDebrief → addCredits` replaces it.

## Risks
- **StrictMode double effects.** Minting is an effect side effect: dev mounts `MissionScreen` twice, and a `squad` identity change rebuilds the world. Mitigation: each mount mints a new key for a new world. The torn-down world never ticks, because `GameCanvas` mounts only after `setReady(true)` and cleanup resets it, so it never reaches `maybeOutcome`. Skipped or burned keys are harmless under `>`. A second Debrief effect sees `lastAppliedKey` already set.
- **Partial apply on a thrown mutator.** `lastAppliedKey` is set first, so a throw mid-apply is not retried. Mitigation: owner mutators are pure state transforms that do not throw today; a thrown apply is a defect, and retrying it would risk the double apply this ADR removes.
- **Hand-built outcomes in tests.** Tests that construct `MissionOutcome` directly may bypass `priceOutcome`. Mitigation: test helpers build a `MissionResult` and price it.

## GDD Requirements Addressed

| GDD System | Requirement | How This ADR Addresses It |
|------------|-------------|--------------------------|
| economy-and-contracts.md | TR-economy-010 Apply-once key minted at deploy, on the Economy slice, echoed on the outcome; same key is a no-op including Credits and Tax deposits | `deploySerial` → `economy.applyKey` → `MissionResult.applyKey`; `applyDebrief` checks `lastAppliedKey` before every owner write |
| economy-and-contracts.md | TR-economy-011 Tactical emits completed optional ids; Economy prices bonus from frozen defs | `bonusDefs` keyed by objective id; `MissionResult.completedOptionalIds`; `priceOutcome` |
| economy-and-contracts.md | Outcome DTO `reward` is the stored contract Reward, also on Loss and quiet replay; `net_payout = 0` does not zero it | `priceOutcome` sets `reward = economy.reward` always |
| economy-and-contracts.md | Collateral `N = max(0, floor(civiliansHit))`, non-finite → 0; cap at Reward; non-finite bonus → 0 | `priceOutcome` clamps |
| tactical-mission.md | Tactical counts `N` and completion; does not emit priced `reward` / `bonus` | `MissionResult` has no CR fields |
| world-network.md | Re-entering Debrief apply with the same key repeats no write-back, ETA, Tax/Credits, Feed, market, RNG or sync | One `applyDebrief` transaction behind one key |

## Performance Implications
- **CPU**: One pricing pass and one key compare per Debrief. None per frame.
- **Memory**: Two numbers on `appStore`; one id → CR map per deploy.
- **Load Time**: None.
- **Network**: None.

## Migration Plan
1. Add `applyKey` and keyed `bonusDefs` to the Economy slice with the ADR-0009 composer work (QQ-02); until then the composer passes them on the existing `DeployParams`.
2. Split `MissionResult` / `MissionOutcome`; add `priceOutcome`; change `maybeOutcome` to emit ids and echo the key.
3. Make `setOutcome` price-and-store only.
4. Add `applyDebrief`; move the Debrief `useEffect` body into it and call it from `useLayoutEffect`. Delete `appStore.outcomeSerial` and `campaignStore.outcomeApplied` (type, persisted-field `Omit` list, initial state, `reportMission` increment). In `save.ts`, replace the hydrate and New Operation resets with `deploySerial: 0, lastAppliedKey: 0` (safe: both also null `outcome`).
5. Update `src/state/telemetry.ts` (imports `collateralFine` / `netPayout`, reads `reward` / `bonus`), Debrief rows, `Hud.tsx` collateral clamp, and tests to read the priced fields. Drop the live `quietReplay` fallbacks in `campaignStore.reportMission` and `worldStore.applyMissionResult`.

## Validation Criteria
- Unit: applying the same priced outcome twice through `applyDebrief` leaves every store equal to the state after the first apply (Credits, roster, sectors, Intel, Influence, `t`, Feed, RNG, telemetry log).
- Unit: a higher key applies; a lower key does not.
- Unit: `applyDebrief` with a null `lastReport` path (no KIA) does not throw in `applyMissionResult`.
- Unit: `setOutcome` leaves `credits` unchanged.
- Unit: Loss with optional complete → `reward` stored, `netPayout = 0`; `civiliansHit` 2.7 → collateral 10,000; NaN inputs → 0 (Economy ACs).
- Static: `src/game/` contains no `reward:` / `bonus:` on the outcome, no `contractsWon` read in `maybeOutcome`, and imports `MissionResult` type-only.
- Click-through: one mission to Debrief and back to the World Network in dev (StrictMode) shows one deposit, and the Debrief header never shows the pre-payout balance.

## Related
- Amends [ADR-0009](adr-0009-partitioned-deploy-snapshot.md) Key Interfaces (`economy` slice shape).
- Supersedes [ADR-0020](adr-0020-campaign-fail-flags.md) §Context line 45 for the apply-once guard.
- Amends [ADR-0013](adr-0013-credits-never-overdraw.md) §Deposits (payout writer, pricing helpers) and [ADR-0015](adr-0015-telemetry-never-leaves-the-machine.md) §Mission coupling (`MissionResult.telemetry`).
- Depends on [ADR-0002](adr-0002-unsaved-mission.md), [ADR-0004](adr-0004-quiet-replay.md), [ADR-0013](adr-0013-credits-never-overdraw.md), [ADR-0001](adr-0001-two-clocks.md).
- `design/gdd/economy-and-contracts.md` (Outcome DTO, Formulas, ACs); `design/gdd/tactical-mission.md` (Interactions, Economy row); `design/gdd/world-network.md` (apply-once AC); `design/gdd/gdd-cross-review-2026-10-08.md` W-01.
