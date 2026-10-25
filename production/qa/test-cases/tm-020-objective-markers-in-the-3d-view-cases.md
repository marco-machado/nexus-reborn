# TM-020 — Objective markers in the 3D view — Manual test cases

**Story**: `production/epics/tactical-mission/story-020-objective-markers-in-the-3d-view.md`
**Story type**: Visual/Feel | **Evidence output**: `production/qa/evidence/` (retained PNGs `tm-020-*.png` + sign-off doc `production/qa/evidence/objective-markers-evidence.md`) | **Gate**: BLOCKING (lead sign-off)
**Build under test**: HEAD `131a5c1` (marker code from `2c73542`)
**Cycle**: Sprint 11 QA. Not in the Sprint 11 QA plan; added to this cycle by the coordinator.
**Sources**: story `## Acceptance Criteria` (one AC, split here into AC-1a to AC-1g); `src/scene/ObjectiveMarkers.tsx`; `src/game/objectiveMarks.ts`; `src/ui/Minimap.tsx`; `src/game/world.ts` (`activateRequired`, `zoneFor`); `src/game/data.ts` (m02 Hollow Crown, m03 Rust Haven).
**Existing captures (unsigned, not evidence for this pass)**: `production/qa/evidence/playtest-fixes-2026-10-23/mission-90.png`, `mission-100.png`, `mission-110.png`, `mission-125.png`, `mission-hc.png`.

## AC split

| ID | Clause of the AC |
|---|---|
| AC-1a | Active, unfinished non-extract objective gets a VIP Ice ground ring on its zone (own zone, else landmark, else checkpoint) |
| AC-1b | A destroy objective gets a ring on each living device of its tag (none on dead devices, none on other tags) |
| AC-1c | Required objectives also get a light beam; optional ones do not |
| AC-1d | Extraction keeps the city's own ring (no extra marker for the extract objective) |
| AC-1e | Done, failed and inactive objectives get no marker |
| AC-1f | Sim zone check, minimap and markers use one zone rule |
| AC-1g | Reduced motion stops the ring pulse |

## Automated coverage (AC-1a, AC-1b, AC-1e, AC-1f — supporting, runs in `npm test`)

`src/game/objectiveMarks.test.ts`, describe `objective marks (TM-020)`:
1. `a zone objective marks its own zone, its landmark, else the checkpoint` — AC-1a / AC-1f (`objectiveZone`).
2. `marks every active objective, required and optional, and skips done, inactive and extract` — AC-1a, AC-1d, AC-1e.
3. `a destroy rings each living device of its tag, not the dead or other tags` — AC-1b.

Shared rule (AC-1f) by code reading: `src/game/world.ts` `zoneFor` returns `objectiveZone(def, city)`; `src/ui/Minimap.tsx` (draw pass, active-objective pulse) calls `objectiveZone(def, city)`. `src/game/world.test.ts` `zoneOf` (near line 2305) is a hand mirror of the rule, not a call of it. Note: the automated tests do not cover `failed` rows (see CONCERNS).

## Common setup

- `npm run dev` on port 4200. Headless Chrome for Testing (the binary `play-server.mjs` names), viewport exactly 1280x720. Never the user's Chrome. Nothing visible opens on the user's screen.
- **Navigation and captures**: `production/qa/playtests/harness/play-server.mjs <sessionDir>` on port 4399, driven by `node production/qa/playtests/harness/play.mjs <cmd>` (`fixture`, `clicktext`, `click`, `key`, `wait`, `look`). `fixture` gives the mid-campaign state (Intel 2, Rust Haven won, tutorial seen), so both m02 Hollow Crown and m03 Rust Haven are selectable. In a mission the harness holds the game paused between commands; markers keep refreshing while paused (they run on the frame clock, not the sim clock).
- **Scene reads need a probe**: `play.mjs` has no evaluate command, and the harness may not be edited in this pass. Scene, store and minimap reads run from a scratchpad probe script (`playwright-core` from the global `@playwright/cli`, same Chrome for Testing binary, 1280x720) that reproduces the harness `fixture` steps, then enters the mission through `useAppStore.getState().selectMission(id)`, team screen, `startMission()`. Record in each Actual Result whether the harness or the probe produced each fact.
- **Marker pool accessor (locate at run time)**: the r3f root is made with `createRoot(canvas)` in `src/scene/GameCanvas.tsx`. Import the app's own `@react-three/fiber` instance (the pre-bundled URL containing `/node_modules/.vite/deps/@react-three_fiber.js`, read from `performance.getEntriesByType('resource')`), take `_roots.get(<mission canvas>).store.getState().scene`, and find the `Group` with 16 children alternating `Mesh(RingGeometry)` / `Mesh(CylinderGeometry)` (8 slots, ring then beam). If the root or the group cannot be found, the case is **BLOCKED on the probe**, not FAIL; say so.
- **Reading a slot** (per `ObjectiveMarkers.tsx`):
  - Ring shown: `ring.visible === true`. Position `ring.position` (x, 0.06, z). Radius `ring.scale.x` (= zone `r`, or `DEVICE_MARK_R` 1.2 on a device).
  - Required vs optional: `ring.geometry.parameters.innerRadius` is `0.88` (required) or `0.94` (optional, thinner band).
  - Beam: `beam.visible` (true only for required); `beam.position` equals the ring's x, z with y 0.
  - Colour: `ring.material.color.getHexString()` equals the `VIP` token in `src/ui/tokens.ts` (VIP Ice).
  - Pulse: `ring.material.opacity` = `0.9 * k` (required) or `0.55 * k` (optional), `k = 0.7 + 0.3 sin(3t)`; reduced motion `k = 1`. Ring **scale does not pulse** in either mode.
  - Refresh period 0.2 s: wait ≥ 0.5 s of frames after any state change before reading.
- **Expected marks oracle**: `objectiveMarks(world.mission.objectives, useMissionStore.getState().objectives, world.units, world.city)` from `/src/game/objectiveMarks.ts` with `getWorld()` from `/src/game/runtime.ts`. The scene must match the oracle, and the oracle must match the hand-derived expectation in each case (zones read from `world.city.landmarks` / `checkpoint`).
- **Captures**: before each capture, `panCameraTo(x, z)` (`/src/game/runtime.ts`) onto the mark, wait 1 s, capture at 1280x720 to `production/qa/evidence/tm-020-<case>.png`.
- **State advance**: move the squad with `getWorld().orderMove(<living agent ids>, {x, z})` and let the clock run (`wait`). Killing a device by play (demolition cells / gunfire) is preferred; the fixture shortcut is setting the device unit's `stance = 'dead'` (and `hp = 0`) through `getWorld().units`. Record which was used.

---

## Test Case: TM-020-01 — Required objective: ring plus beam on its landmark

**Story type**: Visual/Feel | **Output**: `production/qa/evidence/` | **Gate**: BLOCKING
**AC covered**: AC-1a, AC-1c, AC-1e (pending objectives unmarked)
**Preconditions**: Dev server on 4200; harness `fixture`; m02 Hollow Crown deployed with the default squad; mission live, first frames rendered; only `hc1` (REACH THE COMPOUND GATE, required, `landmark: 'gate'`) active.
**Steps**:
1. Read `useMissionStore.getState().objectives`; confirm only `hc1` has `active: true`, none `done`/`failed`.
2. Read `world.city.landmarks.gate` → `{x, z, r}`.
3. Locate the marker pool; list every slot with `ring.visible === true`.
4. For the visible slot read ring position, `scale.x`, `geometry.parameters.innerRadius`, `material.color`, `beam.visible`, `beam.position`.
5. Compare with the oracle output.
6. `panCameraTo(gate.x, gate.z)`, wait 1 s, capture `tm-020-01-required-gate.png`.
**Expected Result**: Exactly 1 visible ring; position x, z = `gate.x`, `gate.z` (±0.01), y 0.06; `scale.x` = `gate.r`; innerRadius 0.88; colour = `VIP`; `beam.visible === true` at the same x, z. No ring for `hc-opt`, `hc2`, `hc3` (pending) or `hc4` (extract). Oracle returns the same single mark. Screenshot shows a VIP Ice ring with a vertical beam at the compound gate.
**Pass Criteria**: All Expected Result checks true AND PNG retained.
**Actual Result**:
**Pass/Fail**:

## Test Case: TM-020-02 — Required and optional active together: optional gets a thin ring and no beam

**Story type**: Visual/Feel | **Output**: `production/qa/evidence/` | **Gate**: BLOCKING
**AC covered**: AC-1a, AC-1c, AC-1e (done `hc1` unmarked)
**Preconditions**: TM-020-01 state; squad moved into `landmarks.gate` so `hc1` completes; per `activateRequired`, `hc2` (required interact, `landmark: 'console'`) and `hc-opt` (optional interact, `landmark: 'server'`, `failSec` 90) now active.
**Steps**:
1. Order the squad into the gate zone; run the clock until `hc1.done === true`.
2. Pause (harness hold); confirm `hc2.active` and `hc-opt.active` true, `hc1.done` true.
3. Read `landmarks.console` and `landmarks.server`.
4. Wait ≥ 0.5 s of frames; list visible slots and read each slot as in TM-020-01.
5. Compare with the oracle.
6. Capture `tm-020-02-console-required.png` (camera on console) and `tm-020-02-server-optional.png` (camera on server).
**Expected Result**: Exactly 2 visible rings. Console ring: innerRadius 0.88, beam visible, at console x, z, scale = console r. Server ring: innerRadius 0.94, `beam.visible === false`, at server x, z, scale = server r. No ring at the gate. Both VIP colour. Screenshots: beam over the console; thinner ring, no beam, at the server.
**Pass Criteria**: All checks true AND both PNGs retained. Run the steps inside the 90 s `hc-opt` window (else `hc-opt` fails and the case is re-run).
**Actual Result**:
**Pass/Fail**:

## Test Case: TM-020-03 — Destroy with several devices: one ring per living device, destroyed one loses its ring

**Story type**: Visual/Feel | **Output**: `production/qa/evidence/` | **Gate**: BLOCKING
**AC covered**: AC-1b, AC-1c, AC-1e
**Preconditions**: Harness `fixture`; m03 Rust Haven deployed; squad moved into `landmarks['yard-a']` so `rh1` completes; `rh2` (required destroy, tag `relay`, three devices) and `rh-opt` (optional destroy, tag `transformer`) now active.
**Steps**:
1. Confirm `rh2.active` and `rh-opt.active` true, `rh1.done` true.
2. List `world.units` with `kind === 'device'`: ids, tag, pos, stance.
3. Wait ≥ 0.5 s; list visible marker slots and read each.
4. Capture `tm-020-03-relays-3.png` with the camera on the relay yard.
5. Destroy exactly one relay (by play, or fixture shortcut); confirm its `stance === 'dead'` and `rh2` still active, not done.
6. Wait ≥ 0.5 s; list visible slots again.
7. Capture `tm-020-03-relays-2.png` on the same camera spot.
**Expected Result**: Step 3: 3 rings on the relay positions (x, z ±0.01), `scale.x` 1.2, innerRadius 0.88, beams visible; 1 ring on the transformer, `scale.x` 1.2, innerRadius 0.94, no beam; no ring on the yard-a zone. Total 4. Step 6: 3 rings — 2 relays (with beams) + transformer; no ring at the dead relay's position. Oracle matches both times.
**Pass Criteria**: Visible count 4 then 3; no visible ring within 0.5 of the dead relay; all other checks true; both PNGs retained.
**Actual Result**:
**Pass/Fail**:

## Test Case: TM-020-04 — Completed objective: its ring disappears

**Story type**: Visual/Feel | **Output**: `production/qa/evidence/` | **Gate**: BLOCKING
**AC covered**: AC-1e, AC-1a (next objective picks up the marker)
**Preconditions**: TM-020-02 state (Hollow Crown, `hc2` and `hc-opt` active, console ring + beam visible).
**Steps**:
1. Record the console slot (visible, position) and capture `tm-020-04-before.png` on the console.
2. Hold the squad in `landmarks.console` and run the clock until `hc2.done === true` (5 s channel).
3. Pause; read the objective rows.
4. Wait ≥ 0.5 s; list visible slots.
5. Capture `tm-020-04-after.png` on the same camera spot.
**Expected Result**: After step 2, no visible ring or beam within 0.5 of the console. `hc3` (escort, `landmark: 'extraction'`) becomes active and its required ring + beam appear at `city.landmarks.extraction` (same zone as the city's extraction decal; expected, as the escort is not an extract objective). `hc-opt` ring present only if `hc-opt` is still active, absent if it was done or failed.
**Pass Criteria**: Zero visible slots at the console after completion AND visible set equals the oracle AND both PNGs retained.
**Actual Result**:
**Pass/Fail**:

## Test Case: TM-020-05 — Failed optional objective: its ring disappears

**Story type**: Visual/Feel | **Output**: `production/qa/evidence/` | **Gate**: BLOCKING
**AC covered**: AC-1e (failed)
**Preconditions**: TM-020-02 state; squad kept away from the server.
**Steps**:
1. Confirm the thin server ring is visible.
2. Run the clock past `hc-opt`'s 90 s `failSec` without entering the server zone.
3. Confirm `hc-opt.failed === true` and the mission still live.
4. Wait ≥ 0.5 s; list visible slots.
5. Capture `tm-020-05-server-failed.png` on the server.
**Expected Result**: No visible ring within 0.5 of the server; console ring + beam still visible (if `hc2` not done).
**Pass Criteria**: All checks true AND PNG retained.
**Actual Result**:
**Pass/Fail**:

## Test Case: TM-020-06 — Extraction keeps the city's own ring, no objective marker added

**Story type**: Visual/Feel | **Output**: `production/qa/evidence/` | **Gate**: BLOCKING
**AC covered**: AC-1d
**Preconditions**: (a) Hollow Crown at mission start (TM-020-01 state). (b) Rust Haven with `rh4` (EXTRACT THE SQUAD) the only active objective, reached by play or by completing `rh1`-`rh3`.
**Steps**:
1. State (a): read `world.city.extraction` → `{x, z, r}`; list visible marker slots.
2. Locate the city's extraction decal (`InstancedMesh` of 20 `BoxGeometry` dashes in `CityView.tsx`; locate at run time) and confirm it is in the scene.
3. Capture `tm-020-06-extraction-start.png` on the extraction zone.
4. State (b): confirm only `rh4` is active; wait ≥ 0.5 s; list visible marker slots.
5. Capture `tm-020-06-extraction-only.png` on the extraction zone.
**Expected Result**: (a) No marker slot within `r` of extraction; the dashed teal decal (emissive `#7ef0d4`) is present. (b) Zero visible marker slots; the decal is unchanged (same 20 instances, same position). Screenshots show only the dashed ring, no VIP ring, no beam.
**Pass Criteria**: Visible-slot count 0 in (b), none near extraction in (a), decal present in both, PNGs retained.
**Actual Result**:
**Pass/Fail**:

## Test Case: TM-020-07 — Reduced motion stops the ring pulse

**Story type**: Visual/Feel | **Output**: `production/qa/evidence/` | **Gate**: BLOCKING
**AC covered**: AC-1g
**Preconditions**: TM-020-02 state (one required ring, one optional ring visible); `reducedMotion` off.
**Steps**:
1. Sample, over 60 consecutive `requestAnimationFrame` callbacks (~1 s), each visible slot's `ring.material.opacity` and `ring.scale.x`.
2. Turn reduced motion on through Settings (`useSettingsStore.getState().setReducedMotion(true)` if the UI route is not used; record which).
3. Wait 0.5 s; repeat the 60-frame sample.
4. Capture `tm-020-07-reduced.png` on the console.
5. Turn reduced motion off; sample 60 frames again.
**Expected Result**: Step 1: required opacity varies within [0.63, 0.90], optional within [0.385, 0.55], spread > 0.05. Step 3: required opacity exactly 0.9 and optional exactly 0.55 on every frame (spread 0). Step 5: variation returns. `scale.x` constant in all three samples (it never pulses; see CONCERNS).
**Pass Criteria**: Step 3 opacity max − min = 0 for every visible slot AND Step 1 and Step 5 spread > 0.05 AND PNG retained.
**Actual Result**:
**Pass/Fail**:

## Test Case: TM-020-08 — Minimap marker sits where the ring sits

**Story type**: Visual/Feel | **Output**: `production/qa/evidence/` | **Gate**: BLOCKING
**AC covered**: AC-1f
**Preconditions**: TM-020-01 state (Hollow Crown, `hc1` active); minimap at zoom 0 (whole map fits, no follow pan); reduced motion on (steady minimap ring at full radius).
**Steps**:
1. Read the 3D ring slot's x, z and `scale.x`.
2. Compute the expected minimap pixel using the `Minimap.tsx` layout at zoom 0: `s = min(w, h) / (size * (sin Y + cos Y))`, `originX = -size * sin Y`, `ox, oy` = centring offsets, `px = (x cos Y − z sin Y − originX) * s + ox`, `py = (x sin Y + z cos Y) * s + oy`, radius `max(4, r * s)`, with `Y = CAMERA_YAW`, `size = world.city.size`, `w, h` the `.minimap-canvas` CSS size.
3. Read the `.minimap-canvas` pixels (`getImageData`, scaled by its DPR) on a circle of that radius round (px, py) and check for the objective colour (`COLOR.objective`, VIP).
4. Capture `tm-020-08-minimap.png` (full frame) and a crop of the minimap.
5. Repeat steps 1-4 in TM-020-02 state (required `hc2` on the console).
**Expected Result**: Objective-coloured stroke on the computed circle, centre within 2 px of (px, py) in both states. The minimap pulses only the first active required objective, so in TM-020-02 state it sits on the console, not the server.
**Pass Criteria**: Centre offset ≤ 2 px in both states AND PNGs retained.
**Actual Result**:
**Pass/Fail**:

---

## Lead sign-off

Sign-off doc to write after the run: `production/qa/evidence/objective-markers-evidence.md` (lists the retained `tm-020-*.png` files and case results).

| Role | Name | Date | Verdict | Signed |
|---|---|---|---|---|
| Art director / lead (Visual/Feel) | | | | [ ] |
| QA lead | | | | [ ] |
