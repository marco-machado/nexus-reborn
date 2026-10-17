# IF-007 click-through: minimap, weather chip, tutorial toasts

Run: dev server on :4217 (`npm run dev -- --strictPort --port 4217`), then
`SWEEP_URL=http://localhost:4217/ node production/qa/evidence/if-007/capture.mjs`.
Headless Chrome for Testing, 1280x720, default text scale. Result:
`capture-output.txt` (ALL PASS, no console errors). Harness assists are named
in the script header: localStorage clear, jump to a live GLASS VEIL mission
through the app store, difficulty and the holdGround remap through the
settings store actions, `world.tick()` to reach the front at sim 150 s, and a
tutorial `resetAll()` to show the full sequence. Zoom, minimap click/drag,
toast dismiss, Skip Tutorial and the slot-select key are real input.

Screens exercised (partial click-through, step 4 of docs/click-through.md):

- `01-standard-hud-weather-before-front.png` — chip HEAVY RAIN = live `heavy`.
- `02`/`03`/`04-minimap-zoom-*` — three zoom levels (in disabled at max, out
  disabled at min). Click and drag on the minimap move the camera focus
  (values in `capture-output.txt`). The map is turned by `CAMERA_YAW`, so up is
  screen up (TM-015 verified the pose numerically).
- `05`–`13-toast-*` — the nine first-mission steps (Select, Move, Attack,
  Stances, Role ability, Items, Weapon swap, Directives, Extraction), each
  naming live keys; `08` shows Stances after remapping Hold ground to J. The
  sim time advances under a toast and the `1` key selects a slot through it.
  A real click on a toast's body (not its buttons) hits the canvas
  (`elementFromPoint` = CANVAS, one canvas pointerdown): only the toast
  buttons take pointer events, so the card is not an input dead zone (AC13).
  Skip Tutorial marks every step seen.
- `14-standard-hud-weather-after-front.png` — front at 22:16:38: chip LIGHT
  RAIN = live `light`; Comm log prints `WEATHER FRONT. RAIN LIFTS. GUARD SIGHT
  INCREASED.`
- `15-minimap-hardened-scan-cones.png`, `16-hardened-hud.png` — same contract
  on Hardened: civilians, patrols and the objective pulse remain; the minimap
  source never reads difficulty.

No clipping or truncation observed at 1280x720 on the HUD, toasts or minimap.
Reduced-motion pulse freeze is in `Minimap.tsx` (steady ring) and was not
captured in this run. Sign-off: qa-lead (pending).
