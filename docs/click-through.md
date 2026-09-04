# Click-through

Run this when a change can affect rendering, screen flow, input, audio, or persisted state.

`npm run dev`, open the app at exactly 1280×720, console visible. Use a clean browser profile if the check must not alter an existing local save.

A full click-through is all six steps. A partial run names the screens and interactions actually exercised, in the handoff or commit body.

1. Load the main menu, open and close Settings, then start a New Operation or Continue a saved one.
2. On the World Network, pause and resume the strategic clock, change Clock speed, open Research from the bottom navigation, inspect a project, and return to the World Network. Confirm the focused sector shows control, unrest, tax yield in Credits per 24 hours, and garrison condition — not defense, an Influence index, NETWORK THREAT, influence income, black-market impact, or total forces. Opening North America tax yield is 4,080 CR / 24h. Influence is a point wallet (0 on a new operation). Confirm the shared header (Credits, Influence, Intel, Roster, strategic clock) and the four nav tabs: WORLD NETWORK, RESEARCH, BRIEF (locked with no contract), ASSEMBLY. Confirm SECTORS, Scan (ORBITAL SCAN still up), OPEN CONTRACTS, CLOCK SPEED, Pause/Resume, TIMELINE, FEED, TIME CODE, Control key, Event forecast wording at intel 2+, and no VIEW SECTOR INTEL, GAME SPEED, or WORLD CLOCK in the chrome.
3. Select an unlocked contract, proceed through the Brief and Assembly, and deploy a valid squad. Confirm BRIEF unlocks on the nav after the contract is selected, and that Assembly is reachable from the nav without Accept Contract. On Glass Veil or Hollow Crown, the brief weather line names the coming front and clock. On Assembly, cycle an augmentation bay (AUTO / PIN / STOCK) if any slotted project is complete.
4. In the mission, select an operative, issue a move order, use the minimap, pause, open and close Settings, and resume. Confirm the canvas, HUD, minimap, and input remain live without console errors. On Glass Veil, wait through 22:16:38 and confirm the comm log and HUD weather retune. Abort from pause writes nothing to the campaign; with telemetry on, Balance should show an abort.
5. Finish the mission and inspect the debrief. Continue back to the World Network; after a first win, confirm the contract ETA advanced world time and research, injuries, recruitment, and Tax yield caught up to the new time. Confirm BRIEF is locked again after return. Replay the same authored contract, win again: debrief reads `REPLAY // FEE ALREADY COLLECTED`, the contract fee and Influence do not move, roster and ETA still apply, and Tax yield still collects because the clock advanced. A loss spends no ETA.
6. On every visited screen, check for clipping, unintended overlap, unreadable text, and broken focus or keyboard navigation at 1280×720.

## Audio changes

For sound replacements or mixer changes, also check the following. Record the
cues and transitions actually exercised when coverage is partial.

1. In Settings, exercise master, UI, combat, music, ambience, and mute with relevant sounds playing. Confirm each control affects its channel, unmuting restores the chosen levels, and settings survive a reload.
2. Listen to each replacement cue individually and during play. Check that weapon identities remain distinct, CorpSec gunfire sits below squad gunfire, interface cues stay unobtrusive, and impacts and warnings remain readable during overlapping fire. Include reload, blast, ability, confirmation, click, interaction progress, objective completion, death, and operative hit.
3. Exercise light rain, heavy rain, and dry weather. Listen across a full rain loop and weather transitions for clicks, gaps, or abrupt level changes. Leave the mission while audio is loading and after it starts; confirm its bed fades out and does not restart after departure.
4. Check the browser console for loading or decoding failures. With a cold cache, confirm earlier clicks or combat events do not replay as a delayed burst. When inspecting the audio graph, confirm finished one-shot sources disconnect and overlapping playback remains bounded.

Source provenance, rebuilding, and decoded-file checks are documented in the
[audio README](../inspiration/audio/sfx/README.md).
