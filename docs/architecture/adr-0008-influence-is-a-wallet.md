# Influence is a wallet; tax is Nexus income

The World Network had an influence index (a weighted average of every sector's Control, as if that were the house's standing) and a trickle of Influence from it. Control is not owned by a corporation, so the index was a second meter with the house's name on it. Influence is only the points spent on Stabilize, Lobby, and Expedite. It is earned on contract wins. There is no index.

Credits from the Scan are Tax yield: paid every 24 strategic hours, only from sectors Nexus holds. Defense rating and NETWORK THREAT restated garrison and unrest; both are out.

## Consequences

A future reader who adds a global "standing" bar or a tax cheque from Helix-held Asia is reversing this. Opening income is North America only, because that is the only Nexus-majority sector on the opening map.

## Status
Accepted

## Date
2026-08-23

## Engine Compatibility

| Field | Value |
|-------|-------|
| **Engine** | Configured in `docs/technical-preferences.md`: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 WebGPU |
| **Domain** | Core |
| **Knowledge Risk** | HIGH — cutoff May 2025; pin is three.js r185 / React 19.2.8. See `docs/engine-reference/web/VERSION.md` |
| **References Consulted** | `docs/engine-reference/web/VERSION.md`; `docs/technical-preferences.md` |
| **Post-Cutoff APIs Used** | None — this decision is World Network economy, not an engine API |
| **Verification Required** | Influence is earned on contract wins and spent on Stabilize, Lobby, and Expedite. No influence index. Tax yield pays every 24 strategic hours from Nexus-held sectors only. |

## ADR Dependencies

| Field | Value |
|-------|-------|
| **Depends On** | None |
| **Enables** | None |
| **Blocks** | None |
| **Ordering Note** | Do not restore a global standing bar or tax from non-Nexus sectors. |

## GDD Requirements Addressed

| GDD System | Requirement | How This ADR Addresses It |
|------------|-------------|--------------------------|
| docs/game-design.md §5–6 | Influence is a spendable wallet; Tax yield is Nexus income from held sectors | Removes the influence index and non-Nexus tax, which restated Control as house standing |
