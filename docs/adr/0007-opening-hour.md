# Opening hour is per-mission, not the look

Each mission opens at its own Opening hour on the tactical clock. Lighting derives from that hour and is frozen for the deployment. Opening hour is presentation only: it does not change sight, noise, or risk. It is independent of strategic time and of weather.

Noon and a daylight-blue sky are out of scope. Legal hours are 18:00 inclusive to 01:00 exclusive. Hours in [18:00, 20:00) light as dusk; the rest of the window lights as night. Neon still reads. Generated contracts roll a uniform minute in the window from the contract seed, after the existing cosmetic stream so weather and map jitter stay put. Glass Veil and Hollow Crown stay 22:14:08. Rust Haven opens at 18:14:08. The mission rain-hiss follows weather and is silent when the weather is none.

Deriving the hour from strategic now would reopen the two-clock cut ([ADR-0001](0001-two-clocks.md)). A live sky would add a second mid-mission change beside the weather script, for a fight that lasts minutes. True noon would wash out the neon that is Spectacle.

## Consequences

Weather copy names the period when the sky is not night: `CLEAR NIGHT` is only legal at night. The HUD clock still ticks; the sky does not.
