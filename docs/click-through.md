# Click-through

Run this when a change can affect rendering, screen flow, input, or persisted state.

`npm run dev`, open the app at exactly 1280×720, console visible. Use a clean browser profile if the check must not alter an existing local save.

A full click-through is all six steps. A partial run names the screens and interactions actually exercised, in the handoff or commit body.

1. Load the main menu, open and close Settings, then start a New Operation or Continue a saved one.
2. On the world map, pause and resume the clock, change speed, open Research from the bottom navigation, inspect a project, and return to the world map. Confirm the focused sector shows control, unrest, tax yield in Credits per 24 hours, and garrison condition — not defense, an Influence index, NETWORK THREAT, influence income, black-market impact, or total forces. Opening North America tax yield is 4,080 CR / 24h. Influence is a point wallet (0 on a new operation).
3. Select an unlocked contract, proceed through the mission brief and team assembly, and deploy a valid squad. On Glass Veil or Hollow Crown, the brief weather line names the coming front and clock. On assembly, cycle an augmentation bay (AUTO / PIN / STOCK) if any slotted project is complete.
4. In the mission, select an operative, issue a move order, use the minimap, pause, open and close Settings, and resume. Confirm the canvas, HUD, minimap, and input remain live without console errors. On Glass Veil, wait through 22:16:38 and confirm the comm log and HUD weather retune. Abort from pause writes nothing to the campaign; with telemetry on, Balance should show an abort.
5. Finish the mission and inspect the debrief. Continue back to the world map; after a first win, confirm the contract ETA advanced world time and research, injuries, recruitment, and Tax yield caught up to the new time. Replay the same authored contract, win again: debrief reads `REPLAY // FEE ALREADY COLLECTED`, the contract fee and Influence do not move, roster and ETA still apply, and Tax yield still collects because the clock advanced. A loss spends no ETA.
6. On every visited screen, check for clipping, unintended overlap, unreadable text, and broken focus or keyboard navigation at 1280×720.
