# A mission in progress is not saved

The campaign save holds the World Network, the laboratories, the roster, tutorial progress, and the campaign result. A mission in progress is memory only. Aborting discards it with no debrief; there is no mid-mission resume.

Once the squad is on the ground, the director is committed. Mid-mission persistence would turn that commitment into a checkpoint and make Abort a reload.

## Consequences

Settings and telemetry live in their own slots so New Operation does not reset preferences. Strategy screens autosave; the mission and the debrief do not. The debrief is the only boundary that applies payout, sector movement, intel, influence, and roster changes, and it applies them once.

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
| **Post-Cutoff APIs Used** | None — this decision is campaign persistence, not an engine API |
| **Verification Required** | Campaign save omits a mission in progress. Abort discards the mission with no debrief. Debrief applies payout and roster changes once. |

## ADR Dependencies

| Field | Value |
|-------|-------|
| **Depends On** | None |
| **Enables** | None |
| **Blocks** | None |
| **Ordering Note** | Strategy screens autosave; mission and debrief do not. |

## GDD Requirements Addressed

| GDD System | Requirement | How This ADR Addresses It |
|------------|-------------|--------------------------|
| docs/game-design.md §17 | Campaign save is versioned and local; a mission in progress is memory only | Forbids mid-mission resume and makes Abort a discard, not a reload |
