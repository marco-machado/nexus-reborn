# IF-015 click-through: Brief KIT line from objective kinds

Revision: `1bd7bbf` plus the IF-015 working-tree changes (`src/ui/kitLine.ts`,
`src/ui/kitLine.test.ts`, `src/ui/index.tsx` Brief objective rows,
`src/ui/ui.css` `.mb-obj-kit`).
Run: dev server on :4215 (`npm run dev -- --strictPort --port 4215`), then
`SWEEP_URL=http://localhost:4215/ node production/qa/evidence/if-015/capture.mjs`.
Headless Chrome for Testing, 1280x720, text scales 90 / 100 / 110 / 125
through the settings store. Result: `capture-output.txt` (ALL PASS, 70 probes,
no console or page errors). The dev server was stopped after the run; no
listener remained on 4215 or 4200.

Harness assists (named in the script header): localStorage clear; New
Operation through `save.startNewOperation`; `intelLevel` raised to 3 so every
contract passes `selectMission`'s own gate; four generated records (one per
type, seed chosen so `sequenceVariant` is 1, city `nc`, sector `eu`) injected
into `useWorldStore.contracts`, the market list the Brief resolves through
`resolveMission`; text scale through `useSettingsStore.setTextScale`; the
Brief reached through `selectMission`, the mission through `goto('team')` and
`startMission` (the app store's only way in).

Screens exercised (partial click-through: step 3 of docs/click-through.md, the
Brief for seven contracts, and the opening of step 4, the mission HUD's
objective panel):

- `m01-brief-{90,100,110,125}.png` — GLASS VEIL (reach-zone, eliminate-tag,
  extract): no KIT line on any row. AC31 "a contract with none of those kinds
  carries no KIT line".
- `m02-brief-{90,100,110,125}.png` — HOLLOW CROWN: `KIT: AN OPERATIVE HOLDS
  THE CONSOLE FOR 4 S` under the optional server pull, `... FOR 5 S` under the
  cell-block override, `KIT: THE ASSET MUST REACH THE PAD ALIVE` under the
  escort; nothing under reach-zone or extract.
- `m03-brief-{90,100,110,125}.png` — RUST HAVEN: `KIT: POWER CELLS ARM
  GRENADES, THE FAST TOOL; GUNFIRE WORKS, SLOWLY` under the optional
  transformer and the relays, `KIT: HOLD THE ZONE FOR 45 S` under the hold.
- `seizure-brief-*.png`, `suppression-brief-*.png` — generated variant 1:
  one interact (4 s) line under OVERRIDE THE CHECKPOINT LOCKS / SEIZE THE
  PLAZA CONTROL.
- `extraction-brief-*.png` — generated variant 1: interact 5 s and the pad
  line.
- `sabotage-brief-*.png` — generated variant 1: the power-cell line and a 45 s
  hold.
- `sabotage-deployed-hud-objectives-100.png` — the generated SABOTAGE
  contract deployed: MISSION DIRECTIVES lists REACH THE RELAY YARD, DESTROY
  THE THREE FUEL RELAYS, HOLD THE YARD FOR THE BURN, EXTRACT THE SQUAD, the
  same list (labels and kinds, `reach-zone, destroy, defend:45, extract`) the
  Brief printed its KIT lines from. Both read `resolveMission(missionId)`.

Clip probe: every `.mb-obj` row and `.mb-obj-kit` span is scrolled into view
(the dossier column scrolls at 125%, IF-001), then must fit its own box
(`scrollWidth`/`scrollHeight` within 1 px of the client box) and sit inside
the 1280x720 viewport; the objectives box itself is probed the same way. No
clip at any scale for any of the seven contracts.

Copy note: the DOM carries the spec string in sentence case (`KIT: an operative
holds the console for 5 s`, what `kitLine` returns and the unit test pins);
`.mb-obj-kit` uppercases it in CSS so the row matches the Brief chrome.
