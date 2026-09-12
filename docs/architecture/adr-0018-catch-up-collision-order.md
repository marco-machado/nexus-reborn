# ADR-0018: Catch-up collision order

> **Engine specialist**: APPROVE 2026-09-11
> **Technical Director Review (TD-ADR)**: APPROVED 2026-09-11
> **Lead Programmer Review (LP-FEASIBILITY)**: FEASIBLE 2026-09-11

Strategic catch-up fires one next due process-kind at its timestamp, rearms that kind from the due timestamp (not from now), and breaks equal timestamps with a fixed collision order. Screen ticking and win-ETA `advanceDays` share `advanceFlow`. Do not bulk-apply N hours of effects at the jump instant.

This does not supersede ADR-0001 (two clocks / two advancement paths). It names the protocol ADR-0001 left unnamed (TR-world-network-003).

## Status
Accepted

## Date
2026-09-11

## Engine Compatibility

| Field | Value |
|-------|-------|
| **Engine** | React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 WebGPU |
| **Domain** | Core / Timing |
| **Knowledge Risk** | HIGH — cutoff May 2025; pin is three.js r185 / React 19.2.8. This domain uses no three.js / r3f APIs. |
| **References Consulted** | `docs/engine-reference/web/VERSION.md`; `breaking-changes.md`; `deprecated-apis.md`; `docs/technical-preferences.md`; `docs/agents/strategy-time-state.md`; `design/gdd/world-network.md`; `design/gdd/research.md`; `design/gdd/roster-and-assembly.md`; `src/state/worldStore.ts`; `src/ui/clock.ts` |
| **Post-Cutoff APIs Used** | None — catch-up is `worldStore.advanceFlow`, not an engine API |
| **Verification Required** | `tick` and `advanceDays` share `advanceFlow`. Equal timestamps use expiry → World Event → contract generation → staged spend → pressure → Tax yield. Rearm from due `t`, not now. Research `sync(t)` and roster dues do not import this table. `setReview` does not run `advanceFlow`. Game clocks are not `THREE.Timer`. |

## ADR Dependencies

| Field | Value |
|-------|-------|
| **Depends On** | ADR-0001 (Accepted — two advancement paths and catch-up boundary) |
| **Enables** | Completes TR-world-network-003 |
| **Blocks** | None named as epics yet |
| **Ordering Note** | Does not supersede ADR-0001. Must not contradict ADR-0012 (generated catch-up stays in `advanceFlow`), ADR-0014 (Review is not advancement), ADR-0004 (quiet-replay win still ETA catch-up), ADR-0010 (tactical `world.tick` remainder catch-up is a different clock). |

## Context

### Problem Statement

TR-world-network-003 is partial: ADR-0001 names catch-up and forbids a shared clock, but not one-due-at-its-timestamp, rearm-from-due-t, or the collision order. Without a stamp, stories can bulk-apply hours at an ETA jump, rearm from now (skipping intervals), reorder kinds, or import this table into Research or Roster.

### Constraints

- Only two strategic advancement paths (ADR-0001): Screen `tick` via `useWorldClock`; win-ETA `advanceDays`. Loss spends none.
- Generated contract instances stay on `worldStore`; do not split catch-up out of `advanceFlow` (ADR-0012).
- `setReview` must not run `advanceFlow` (ADR-0014).
- Game clocks are not `THREE.Clock` / `THREE.Timer` (ADR-0010).
- Brownfield: stamp `advanceFlow` as it exists. Do not invent a new order. GDD `world-network.md` Core Rule 4: do not author a new table in the extract.
- Research labs complete in one `sync(t)` (`research.md`). Roster dues apply independently and must not import this table (`roster-and-assembly.md`).

### Requirements

- Fire one next due at its timestamp.
- Rearm from the due timestamp, not from now.
- Equal timestamps: expiry → World Event → contract generation → staged spend → pressure → Tax yield.
- Both advancement paths are the same time-ordered catch-up.
- Do not bulk-apply N hours of effects at the jump instant.
- Debrief: mission write-back at frozen `t0`, then ETA jump.

## Decision

Stamp the existing `advanceFlow` protocol. Do not reorder it.

`advanceFlow(f, t)` is the only World Network catch-up. It stays **module-private** in `src/state/worldStore.ts`. `worldStore.tick` and `worldStore.advanceDays` both run it against a mutable `WorldFlow`. After commit, Tax Credits deposit via Economy (`addCredits`). Research `sync(t)` and campaign `sync(t)` run after `t` advances; they are not inside `advanceFlow`.

Each loop iteration:

1. Compute the next due timestamp `stepT` as min(earliest contract `expiresAtT`, `nextEventT`, `nextContractT`, earliest spend `nextT`, earliest pressure due, `nextTaxT`).
2. If `stepT > t`, stop.
3. Fire exactly one process kind at `stepT` using the collision chain below, then loop (recompute `stepT`).

Collision order at equal `stepT` (first matching branch):

1. **expiry** — all generated contracts with `expiresAtT <= stepT`
2. **World Event** — one roll at `nextEventT`
3. **contract generation** — one checkpoint at `nextContractT` (roll if below target, always rearm)
4. **staged spend** — all Influence spend steps with `nextT <= stepT`
5. **pressure** — all open sectors whose pressure due `<= stepT`
6. **Tax yield** — emit for Nexus-held open sectors; always rearm `nextTaxT`

The Tax branch is the implicit `else`. A seventh due added to `Math.min` without a new branch is silently Tax. New kinds need an explicit branch and a collision-order update.

Rearm from the due timestamp, never from catch-up `t` / now:

- World Event: `nextEventT += EVENT_MIN + rng * EVENT_SPAN` (add to the fired due).
- Contract generation: `nextContractT += CONTRACT_MIN_SEC + rng * CONTRACT_SPAN_SEC`.
- Staged spend: remaining steps `nextT = nextT + stepSec`.
- Pressure: `pressure[id] = at + PRESSURE_INTERVAL_SEC` (`at` is the due that fired).
- Tax: `nextTaxT += TAX_INTERVAL_SEC`.
- Expiry has no process timer; each contract carries `expiresAtT`.

Within one kind at the same timestamp, that kind may apply every due item (all expiring contracts; all due spends; all due pressure sectors; all Nexus Tax emits). World Event and contract-generation checkpoints remain one-per-step.

World Event and staged-spend branches also call `settlePressure` as unrest side-effects. That is outside collision order (it does not steal a Tax or expiry step).

Debrief order stays ADR-0001 / ADR-0002: apply outcome at frozen `t0`, then `advanceDays` if win (quiet replay included). Catch-up must not run before write-back. Abort does not jump `t`.

`advanceDays` calls `depositTax` / `addCredits` inside the Zustand `set` updater; `tick` deposits then `set`. Do not collapse those sites into bulk rates.

Keep `advanceFlow` on the main thread. Keep `useWorldClock` as rAF (not `THREE.Timer`, not r3f `useFrame`, not `setAnimationLoop`). ScreenChrome must stay unmounted on menu / mission / debrief so rAF cannot interleave with ETA catch-up. rAF clamps to `worldStore` `MAX_DT` (0.25s wall); that is not offline-hour catch-up and must stay distinct from `advanceDays`.

Not this ADR / not this table:

- Research `sync(t)` completing every lab with `t >= endT` in one call.
- Roster injury / recruit dues applying independently.
- Tactical `world.tick` opening-second clamp and remainder catch-up (ADR-0010).
- Timeline Review (ADR-0014).

### Architecture Diagram

```
useWorldClock (four Screens)          win debrief
  tick(dt) → t += dt*speed*TIME_SCALE   apply outcome at t0
  → advanceFlow(flow, t)                → advanceDays(eta)
                                           → t += days*DAY
                                           → advanceFlow(flow, t)
  depositTax(flow.taxPaid)
  commitFlow → worldStore
  then research.sync(t) / campaign.sync(t)   (not inside advanceFlow)

advanceFlow loop:
  stepT = min(expire, event, contract, spend, pressure, tax)
  if stepT > t: stop
  else fire ONE kind by collision order, rearm that kind from due, loop
```

### Key Interfaces

- `advanceFlow(flow: WorldFlow, t: number): boolean` — private in `src/state/worldStore.ts`. Returns whether anything moved. Do not export it. Do not export a `ProcessKind` enum or a public collision-order table.
- `WorldStoreState.tick(dt)` / `advanceDays(days)` — the only callers that advance strategic `t` through this protocol.
- Do not add a third caller that jumps `t` without `advanceFlow`.

## Alternatives Considered

### Alternative 1: Per-item priority queue

- **Description**: Schedule every contract expiry, spend step, and sector pressure as individual queue items instead of kind-level if/else.
- **Pros**: Finer interleaving when many items share a timestamp.
- **Cons**: Changes determinism vs the live sim and tests; GDD forbids inventing a new order.
- **Rejection Reason**: Brownfield stamp. Kind-level order is the current sim.

### Alternative 2: Bulk-apply N hours at the jump instant

- **Description**: On ETA, multiply rates by elapsed hours and apply once.
- **Pros**: Cheaper for long jumps.
- **Cons**: Desyncs Screen tick vs win-ETA; skips per-due RNG and Feed; GDD forbids.
- **Rejection Reason**: TR-world-network-003 and ADR-0001 require both paths to be the same catch-up.

## Consequences

### Positive

- ETA jump equals continuous ticking across the same span.
- Collision order is an architecture stamp, not tribal knowledge in `advanceFlow`.
- Research and Roster stay on their own completion rules.

### Negative

- Long ETA spans walk every due (CPU scales with dues, not wall-clock).
- Kind-level order can batch several same-kind items before another kind at the same timestamp; that is accepted.

### Risks

- A future store split that pulls generated contracts out of `advanceFlow` desyncs ADR-0001 / ADR-0012.
- Rearming from now after a jump skips intervals; tests must keep due-based rearm (pressure test already does).
- Do not migrate this clock to `THREE.Timer`, r3f `useFrame`, `setAnimationLoop`, React 19.2 `<Activity>`, or `useEffectEvent`.
- A Worker off-thread `advanceFlow` would desync RNG vs `worldStore.test.ts` jump≡tick.
- A seventh due in `Math.min` without a new branch is silently Tax.

## GDD Requirements Addressed

| GDD System | Requirement | How This ADR Addresses It |
|------------|-------------|--------------------------|
| world-network.md | TR-world-network-003: one next due at timestamp; rearm from due `t`; fixed collision order | Stamps `advanceFlow` loop, rearm, and expiry → event → contract → spend → pressure → tax |
| world-network.md | Core Rule 3: both paths same time-ordered catch-up | `tick` and `advanceDays` share `advanceFlow` |
| world-network.md | Debrief write-back at `t0` then ETA jump | Restates; does not re-own ADR-0002 |
| research.md | Labs complete in one `sync(t)`; not WN one-due protocol | Explicitly out of this table |
| roster-and-assembly.md | Two roster dues at same `t` apply independently; do not import WN collision table | Explicitly out of this table |

## Performance Implications

- **CPU**: Proportional to dues inside the jumped span. No extra budget claimed.
- **Memory**: One `WorldFlow` working set per catch-up.
- **Load Time**: None.
- **Network**: None.

## Migration Plan

None. Stamp existing `advanceFlow`. Do not reorder the if/else. Do not add a public queue type. Do not collapse the two `depositTax` sites.

## Validation Criteria

- `advanceDays` lands where continuous ticking would (`worldStore.test.ts`).
- Pressure rearms from due `at`, not from now.
- Tax interval rearms from `nextTaxT`.
- Loss does not call `advanceDays`.
- `setReview` does not run `advanceFlow`.
- Research `sync(t)` may complete multiple labs in one call.
- Optional follow-up: an equal-`stepT` collision-order test. Jump-identity tests already lock tick vs `advanceDays`.

## Related Decisions

- [ADR-0001](adr-0001-two-clocks.md) — two clocks
- [ADR-0002](adr-0002-unsaved-mission.md) — unsaved mission / debrief apply-once
- [ADR-0004](adr-0004-quiet-replay.md) — quiet replay (ETA still catch-up)
- [ADR-0010](adr-0010-mission-renderer-and-frame-loop.md) — tactical remainder catch-up (different clock)
- [ADR-0012](adr-0012-store-placement.md) — generated catch-up stays in `advanceFlow`
- [ADR-0014](adr-0014-timeline-review-is-a-view.md) — Timeline Review is a view
