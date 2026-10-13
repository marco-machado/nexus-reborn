# WN-017 evidence — Opening desk and post-win Scan

**Date:** 2026-10-13 · **Revision:** c2ad915 + uncommitted `src/state/worldStore.test.ts` (4 new tests, "Opening desk and post-win Scan (WN-017)"). No production code changed. Partial click-through: Main menu → New Operation → World Network (steps 1, 2, 6).
**Environment:** `npm run dev -- --strictPort` (4200), headless Chromium (Playwright chromium_headless_shell-1247), 1280×720, fresh context. Driver: `drive.mjs`. Server stopped; port 4200 has no listener. Console: no errors.

| Check | Observed |
|---|---|
| Focus, six open sectors | FOCUS NEXT cycles EUROPE → AFRICA → ASIA → OCEANIA → NORTH AMERICA → SOUTH AMERICA → EUROPE; each prints CONTROL and UNREST; the focus panel prints TAX YIELD and GARRISON CONDITION |
| Pause / speed | Live 14:39:15 → 14:42:17; paused 14:42:17 → 14:42:17; 1X +1:59 per 2 s; 8X +16:07 per 2 s |
| Not only contract select | With no contract selected: focus, sector rows, Stabilize/Lobby/Expedite, Pause, four speeds, timeline, Feed, nav enabled; BRIEF locked |
| Header after first clean win | See the in-app run below (real win). The earlier headless `wn-017-04` shot used a seeded `world.influence = 8` and is superseded |

Screenshots: `wn-017-01-opening-overlay`, `-02-opening-focus`, `-03-opening-paused`, `-04-header-influence-8` (all `-1280x720.png`). No clipping or overlap seen.
Not changed: first-visit overlay and the arrival-failure open question (out of scope).
Checks: `tsc -b` clean, `eslint` clean, `vitest` 756 passed.

## In-app browser run — real first clean win (2026-10-13)

Claude desktop in-app browser, `npm run dev -- --strictPort` via `.claude/launch.json`, viewport emulated at 1280×720 (pane captures are 800×450 JPEG). Fresh New Operation (test save erased). Screens: Main menu → World Network → Brief → Assembly → Mission (Glass Veil) → Debrief → World Network.

- Start: Influence 0, Credits 128,450 (`in-app/01-opening-desk-influence-0.jpg`). Opening desk re-checked: Focus cycles six sectors, Pause holds the clock, 1X/8X change the advance.
- Mission played with the sim's own order API (`orderMove`/`orderAttack`/`orderHold`/`orderUseMed`/`orderAbility` — the calls right-click and hotkeys make), paused between steps; state read from the live modules. No store was written. Two earlier attempts lost; neither save is the one recorded here.
- Outcome DTO: `won: true`, `civiliansHit: 0`, `quietReplay: false`, `casualties: 2` (Mara, Dart KIA), `applyKey: 2`, `lastAppliedKey: 2`.
- Debrief (`in-app/02-debrief-clean-win.jpg`): CONTRACT FULFILLED, Collateral 0, Contract ETA +2 days, Payout +85,000 CR.
- World Network on return (`in-app/03-world-network-post-eta-influence-8.jpg`): header **INFLUENCE 8 PTS**, Influence panel 8, Resource Pool 8; clock 2087.05.16 LIVE (`t` 174,332, `review` null) — the post-ETA live board.
- Console: no errors.

**Observation (design question, not a defect):** the mission-result Feed event is appended at `t0` (unit-tested), but the 2-day ETA catch-up appends more than `MAX_EVENTS = 40` (`src/state/worldStore.ts:90`) events, so on return the win is no longer in the Feed. The GDD accepts this: `design/gdd/world-network.md` line 268 says the post-win criterion "does not require … retention of the mission Feed event after catch-up." Raise with design if the player should see it.

Server stopped; port 4200 has no listener.
