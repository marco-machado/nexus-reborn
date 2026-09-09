# Opening hour is per-mission, not the look

Each mission opens at its own Opening hour on the tactical clock. Lighting derives from that hour and is frozen for the deployment. Opening hour is presentation only: it does not change sight, noise, or risk. It is independent of strategic time and of weather.

Noon and a daylight-blue sky are out of scope. Legal hours are 18:00 inclusive to 01:00 exclusive. Hours in [18:00, 20:00) light as dusk; the rest of the window lights as night. Neon still reads. Generated contracts roll a uniform minute in the window from the contract seed, after the existing cosmetic stream so weather and map jitter stay put. Glass Veil and Hollow Crown stay 22:14:08. Rust Haven opens at 18:14:08. The mission rain-hiss follows weather and is silent when the weather is none.

Deriving the hour from strategic now would reopen the two-clock cut ([ADR-0001](0001-two-clocks.md)). A live sky would add a second mid-mission change beside the weather script, for a fight that lasts minutes. True noon would wash out the neon that is Spectacle.

## Consequences

Weather copy names the period when the sky is not night: `CLEAR NIGHT` is only legal at night. The HUD clock still ticks; the sky does not.

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
| **Post-Cutoff APIs Used** | None — Opening hour is an authored/rolled clock value; lighting is derived and frozen |
| **Verification Required** | Opening hour is independent of strategic time and weather. Lighting is frozen for the deployment. Legal window 18:00 inclusive–01:00 exclusive. Sight, noise, and risk do not change with hour. |

## ADR Dependencies

| Field | Value |
|-------|-------|
| **Depends On** | ADR-0001 (two clocks; hour must not be derived from strategic now) |
| **Enables** | None |
| **Blocks** | None |
| **Ordering Note** | Independent of the weather script (ADR-0006). |

## GDD Requirements Addressed

| GDD System | Requirement | How This ADR Addresses It |
|------------|-------------|--------------------------|
| docs/game-design.md §10 | Each mission opens at its own Opening hour; lighting follows; presentation only | Keeps the sky from reopening the two-clock cut or adding a second mid-mission change |
