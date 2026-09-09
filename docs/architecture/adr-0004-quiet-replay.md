# A won contract does not pay twice

Authored contracts stay replayable after a win so the other district and the campaign-complete mark remain reachable. A second win does not pay Credits, Influence, or Intel, and does not move control or unrest. It is still a real mission: KIA, injury, experience, and ETA apply. ETA still advances strategic time, so Tax yield still collects. The debrief names the zero.

Unlimited full-fee replay would make the generated market optional and turn ADR-0003 into a lie. A practice sandbox would take back "a kill is permanent." The remaining price is the roster and the clock.

## Consequences

A loss retry (the contract is not yet won) still pays in full. Generated contracts still leave the market and have no replay.

## Status
Accepted

## Date
2026-08-18

## Engine Compatibility

| Field | Value |
|-------|-------|
| **Engine** | Configured in `docs/technical-preferences.md`: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 WebGPU |
| **Domain** | Core |
| **Knowledge Risk** | HIGH — cutoff May 2025; pin is three.js r185 / React 19.2.8. See `docs/engine-reference/web/VERSION.md` |
| **References Consulted** | `docs/engine-reference/web/VERSION.md`; `docs/technical-preferences.md` |
| **Post-Cutoff APIs Used** | None — this decision is debrief payout rules, not an engine API |
| **Verification Required** | A second win on an already-won authored contract pays no Credits, Influence, or Intel and does not move control or unrest. KIA, injury, experience, and ETA still apply. Loss retry still pays in full. |

## ADR Dependencies

| Field | Value |
|-------|-------|
| **Depends On** | ADR-0003 (authored and generated work are the same kind) |
| **Enables** | None |
| **Blocks** | None |
| **Ordering Note** | Full-fee authored replay would make the generated market optional and contradict ADR-0003. |

## GDD Requirements Addressed

| GDD System | Requirement | How This ADR Addresses It |
|------------|-------------|--------------------------|
| docs/game-design.md §9, §19.1 | Won authored contracts stay replayable; the invoice is quiet; roster and ETA still apply | Keeps replay without a second payout or a sandbox that undoes permanence |
