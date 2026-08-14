# Click-through

Run this when a change can affect rendering, screen flow, input, or persisted state.

`npm run dev`, open the app at exactly 1280×720, console visible. Use a clean browser profile if the check must not alter an existing local save.

A full click-through is all six steps. A partial run names the screens and interactions actually exercised, in the handoff or commit body.

1. Load the main menu, open and close Settings, then start a New Operation or Continue a saved one.
2. On the world map, pause and resume the clock, change speed, open Research from the bottom navigation, inspect a project, and return to the world map.
3. Select an unlocked contract, proceed through the mission brief and team assembly, and deploy a valid squad.
4. In the mission, select an operative, issue a move order, use the minimap, pause, open and close Settings, and resume. Confirm the canvas, HUD, minimap, and input remain live without console errors.
5. Finish the mission and inspect the debrief. Continue back to the world map; after a win, confirm the contract ETA advanced world time and research, injuries, and recruitment caught up to the new time.
6. On every visited screen, check for clipping, unintended overlap, unreadable text, and broken focus or keyboard navigation at 1280×720.
