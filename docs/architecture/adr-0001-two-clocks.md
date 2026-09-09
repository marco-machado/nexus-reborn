# Two clocks, never both

The director is either watching the World Network or running a mission. Strategic time and tactical time are independent clocks: the network does not tick in the field, and every mission opens at an authored hour on its own clock. After a win, the debrief spends the contract's ETA as strategic days so laboratories, injuries, recruitment, and Tax yield catch up; a loss spends none.

A single shared clock would make a long firefight age the world, or force the network to pause in a way that hid that cost. The cut is the job: watch the world, or execute.

## Consequences

Any new way to advance strategic time must catch up laboratories, injury recovery, recruitment, and Tax yield at the resulting time.

Which hour a mission opens at is a separate decision. See [ADR-0007](0007-opening-hour.md).

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
| **Post-Cutoff APIs Used** | None — this decision is simulation clocks, not an engine API |
| **Verification Required** | Strategic time does not tick during a mission. A win spends contract ETA as strategic catch-up (laboratories, injuries, recruitment, Tax yield). A loss spends none. |

## ADR Dependencies

| Field | Value |
|-------|-------|
| **Depends On** | None |
| **Enables** | ADR-0007 (Opening hour is per-mission, not derived from strategic now) |
| **Blocks** | None |
| **Ordering Note** | Opening hour must stay independent of strategic time so this cut remains intact. |

## GDD Requirements Addressed

| GDD System | Requirement | How This ADR Addresses It |
|------------|-------------|--------------------------|
| docs/game-design.md §4–5 | Strategic time and tactical time are independent clocks; the World Network does not tick in the field | Makes the two-clock cut an accepted architecture decision, not only GDD prose |
| docs/game-design.md §5, §17 | After a win, debrief spends ETA as strategic days so laboratories, injuries, recruitment, and Tax yield catch up; a loss spends none | Names the only catch-up boundary and forbids a shared clock that would age the world during a firefight |
