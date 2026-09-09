# Weather is a script, not a roll mid-fight

Rain still only shortens CorpSec sight and quiets weapons. A mission may change weather once, to an adjacent intensity, at a tactical time fixed when the mission is created. The brief prints the opening and the coming change. The same seed produces the same script. Authored contracts carry that script in data; generated contracts roll one, including no change.

An unscripted mid-mission roll would make the brief a lie. Play-driven weather would be a rule the director cannot clock. A determined script keeps weather as information: the fight changes, and they were told.

## Consequences

Risk index uses the clearer weather on the script. Notes print both intensities and the clock. Generated contracts roll a front about two times in five, at 90–240s from insertion. Glass Veil clears heavy to light at 22:16:38. Hollow Crown clears light to none at 22:17:08. Rust Haven stays clear.

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
| **Post-Cutoff APIs Used** | None — this decision is a determined mission script, not an engine weather API |
| **Verification Required** | Brief matches opening weather and any one adjacent change at a fixed tactical time. Same seed → same script. Rain affects CorpSec sight and weapon noise only. |

## ADR Dependencies

| Field | Value |
|-------|-------|
| **Depends On** | None |
| **Enables** | None |
| **Blocks** | None |
| **Ordering Note** | Independent of Opening hour (ADR-0007). Weather is information, not a live roll. |

## GDD Requirements Addressed

| GDD System | Requirement | How This ADR Addresses It |
|------------|-------------|--------------------------|
| docs/game-design.md §10 | Weather is sight and noise only; a determined script may change once, adjacent, at a known clock; the brief tells the truth | Forbids unscripted mid-mission weather rolls |
