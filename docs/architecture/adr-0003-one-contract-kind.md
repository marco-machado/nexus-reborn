# Authored and generated contracts are the same kind of work

A contract is work with a client, a city, a type, a threat, a reward, and an ETA. The three authored contracts are the campaign spine; the generated market is the world's ongoing demand. Both take the same path: brief, assembly, mission, debrief.

A second pipeline for "story" work would make generated contracts filler and let the two drift. They must not.

## Consequences

Winning all three authored contracts marks the campaign complete; they stay replayable. A generated contract that is fulfilled or failed leaves the market. Type chooses the district family and the objective set for both.

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
| **Post-Cutoff APIs Used** | None — this decision is contract pipeline shape, not an engine API |
| **Verification Required** | Authored and generated contracts share brief → assembly → mission → debrief. Type selects district family and objectives for both. |

## ADR Dependencies

| Field | Value |
|-------|-------|
| **Depends On** | None |
| **Enables** | ADR-0004 (quiet replay only makes sense if authored work is the same kind as generated work) |
| **Blocks** | None |
| **Ordering Note** | Do not introduce a second "story" pipeline. |

## GDD Requirements Addressed

| GDD System | Requirement | How This ADR Addresses It |
|------------|-------------|--------------------------|
| docs/game-design.md §9, §11 | Authored spine and generated market are the same kind of contract | One pipeline so generated work cannot drift into filler |
