# IF-008 click-through: mission pause modal and two-step Abort

Run: dev server on :4208 (`npm run dev -- --strictPort --port 4208`), then
`SWEEP_URL=http://localhost:4208/ node production/qa/evidence/if-008/capture.mjs`.
Headless Chrome for Testing, 1280x720, default text scale. Result:
`capture-output.txt` (ALL PASS, no console errors). Harness assists: localStorage
clear, and the jump to a live mission through the app store (Team Deploy ->
`startMission`, first contract, default squad). Escape, the Abort presses,
Settings, the rebind capture (Stop -> Z) and Escape out of Settings are real
keyboard / pointer input.

Screens exercised (partial click-through, step 4 of docs/click-through.md):

1. `01-pause-open.png` — Escape on a live mission opens MISSION PAUSED; world
   time held across 1.5 s; phase stays `mission`; 27 binding rows printed.
2. `02-abort-armed.png` — first Abort press: CONFIRM? plus the P-01 hint;
   mission, world and phase untouched.
3. `03-abort-lapsed-still-paused.png` — 3.4 s later: back to ABORT, hint
   cleared, still paused.
4. `04-settings-from-pause.png` — Settings inside the freeze; Pause and slots
   1-4 show FIXED, mouse rows MOUSE (not offered for remap).
5. `05-pause-after-remap.png` — back on the pause menu, Stop reads Z.
6. `06-after-abort-confirm.png` — two presses inside the window: World
   Network, `outcome` null, no `nexus-save-v1` write at the boundary.

No clipping or truncation observed at 1280x720 on the pause menu or Settings.
The Abort landing (World Network) is OQ8 and not asserted as a design choice.
