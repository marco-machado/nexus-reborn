# IF-007 manual test cases: minimap, weather chip and tutorial toasts in the mission HUD

- **Story**: `production/epics/interface/story-007-minimap-weather-chip-and-tutorial-toasts-in-the-mission.md` (AC10, AC13, AC14)
- **Story type**: UI. **Evidence**: `production/qa/evidence/smoke-2026-10-19/if-007/` (smoke re-run, reviewed) plus `production/qa/evidence/team-qa-2026-10-19-s9/if-007/` (new probe captures). **Gate**: BLOCKING.
- **Written**: 2026-10-19, Sprint 9 `/team-qa` Phase 4. Executor: Claude. Sign-off: qa-lead.

## Execution mode

1. Review the smoke re-run: `capture-output.txt`, `run.log` and 16 PNGs. Confirm that `diff production/qa/evidence/if-007/capture.mjs production/qa/evidence/smoke-2026-10-19/if-007/capture.mjs` prints nothing. Run the revision check from `if-001-surface-fit-1280x720-cases.md`, Shared precondition 2.
2. The retained script captures the Hardened minimap only once (`15-minimap-hardened-scan-cones`). It asserts nothing about minimap orientation or reduced motion. Those checks run as a new probe, `production/qa/evidence/team-qa-2026-10-19-s9/if-007/probe.mjs`: headless Chromium, 1280x720, `SWEEP_URL=http://localhost:4200/`. It follows the retained script's `startMission(...)` path on Glass Veil, and its minimap shots are `.minimap-canvas` element screenshots, like the retained `mmShot`. Start the server with `npm run dev -- --strictPort` and confirm the listener on 4200. Stop it after the probe and confirm that port 4200 has no listener.
3. Fixture label: Glass Veil (`m01`), Standard and Hardened, on a fresh campaign (`docs/mission-playbook.md`, "Glass Veil (m01, SEVERE)"). Record how the script reaches the front hit (it runs the sim to the scripted time).

---

## IF-007-TC-01: Hardened does not strip minimap contents, at all three zoom levels

**ACs**: AC10
**Preconditions**: Smoke transcript and captures 02 to 04 and 15. The probe is ready.
**Steps**:
1. Read `standard minimap contents`, `hardened minimap contents`, `hardened keeps civilians and patrols on the same contract` and `minimap draw code never reads difficulty`.
2. Probe: start Glass Veil on Hardened. At the same sim time and camera focus as the Standard captures (record t and focus), capture the minimap at zoom 3 (the opening maximum). Step out to zoom 2 and zoom 1, capturing each: `probe-01-minimap-zoom-3-hardened.png`, `probe-02-minimap-zoom-2-hardened.png`, `probe-03-minimap-zoom-1-hardened.png`.
3. Place each Hardened capture next to the Standard capture at the same zoom (`02-minimap-zoom-3-standard.png`, `03-...zoom-2...`, `04-...zoom-1...`). Mark whether vision cones, patrol markers, civilian markers and the objective pulse are present.

**Expected Result**: The transcript has nonzero civilians and patrolling counts for both difficulties (today: Standard `{"civilians":22,"enemies":15,"patrolling":15}`, Hardened `{"civilians":28,"enemies":17,"patrolling":17}`). The draw-code check is PASS. In every Hardened capture all four marker classes are present, as in Standard (AC10: "Hardened does not strip cones, patrols, civilians, or the objective pulse").
**Pass Criteria**: All 4 marker classes appear in 3 of 3 Hardened captures.
**Actual Result**:
**Pass/Fail**:

## IF-007-TC-02: The minimap has three zoom levels

**ACs**: AC10
**Steps**: Read `zoom starts at max (in disabled)` and `zoom bottoms out after two steps (out disabled)`. Compare captures 02, 03 and 04.
**Expected Result**: Both lines are PASS, and the three captures show three distinct scales.
**Pass Criteria**: There are 3 levels: zoom-in is disabled at the top level and zoom-out at the bottom level.
**Actual Result**:
**Pass/Fail**:

## IF-007-TC-03: Click and drag steer the camera, and minimap up is screen up

**ACs**: AC10
**Steps**:
1. Read `minimap click moves camera focus` and `minimap drag moves camera focus`.
2. Probe: center the camera on a named landmark, either the insertion zone ring or a unit with its id recorded. Capture `probe-04-main-before.png`.
3. Click the minimap a short distance above the camera-focus marker. Capture `probe-05-main-after-up.png`.

**Expected Result**: The click and drag lines are PASS, and each changes the focus coordinates. After step 3, the landmark sits lower on screen than in step 2, because the camera moved toward screen-up (AC10: "Minimap up = screen up").
**Pass Criteria**: Click and drag both move the focus, and the landmark's screen y increases after the up-click.
**Actual Result**:
**Pass/Fail**:

## IF-007-TC-04: Each tutorial toast names the current bindings, including after a remap

**ACs**: AC13
**Steps**:
1. Read the `toast 1` to `toast 9` lines and `stances toast names the remapped key`.
2. Open `05-toast-1-selection.png` to `13-toast-9-extraction.png`.

**Expected Result**: The toasts read `TUTORIAL n/9` for SELECTION, MOVEMENT, ENGAGEMENT, STANCES, ROLE ABILITY, ITEMS, WEAPON SWAP, DIRECTIVES and EXTRACTION. The key names are `1-4`, `0 / \``, `H`, `C`, `Q`, `E / M`, `R` and `V`. After the remap, STANCES reads `J holds position. C holds fire until ordered.` AC13 lists 8 toasts. The build shows 9, adding DIRECTIVES (see Rulings). EXTRACTION and DIRECTIVES name no key. MOVEMENT and ENGAGEMENT name `Right click`.
**Pass Criteria**: Every toast that names a key names the live binding, and the remapped key appears after the remap.
**Actual Result**:
**Pass/Fail**:

## IF-007-TC-05: Toasts do not pause the sim or block input

**ACs**: AC13
**Steps**: Read `sim runs while a toast is up`, `keyboard select lands under the toast` and `world click under a toast reaches the canvas`.
**Expected Result**: The sim time advances while a toast is up (today `t 6.96 -> 8.18`). The keyboard select lands (`["a1"]`). `elementFromPoint CANVAS` with `canvas pointerdowns 1` shows that a click on the world under the toast reaches the canvas.
**Pass Criteria**: All 3 lines are PASS.
**Actual Result**:
**Pass/Fail**:

## IF-007-TC-06: Skip Tutorial marks every step seen

**ACs**: AC13
**Steps**: Read `no tutorial toast after the ninth` and `SKIP TUTORIAL marks every step seen and clears the toast`.
**Expected Result**: Both lines are PASS.
**Pass Criteria**: Every step is seen and no toast is showing.
**Actual Result**:
**Pass/Fail**:

## IF-007-TC-07: The weather chip follows live weather, and the comm log prints the front

**ACs**: AC14
**Steps**:
1. Read `weather chip matches live weather before front`, `front hit: weather changed`, `weather chip matches live weather after front` and `comm log prints the front line`.
2. Open `01-standard-hud-weather-before-front.png` and `14-standard-hud-weather-after-front.png`.

**Expected Result**: Before the front the chips include `HEAVY RAIN`. Then the transcript reads `heavy -> light`, and after the front the chips include `LIGHT RAIN`. The comm log line contains `WEATHER FRONT. RAIN LIFTS.` (today: `22:16:38 WEATHER FRONT. RAIN LIFTS. GUARD SIGHT INCREASED.`). The chip in each capture matches its transcript line.
**Pass Criteria**: The chip reads HEAVY RAIN before the front and LIGHT RAIN after it, and the comm log line is present.
**Actual Result**:
**Pass/Fail**:

## IF-007-TC-08 (probe): Reduced motion freezes the minimap pulses

**ACs**: none (a qa-lead requested check; record the requirement source)
**Steps**:
1. Find the reduced-motion requirement in `design/gdd/interface.md` and record the quote. If there is none, record that and stop: this is a gap, not a defect.
2. Probe: turn on reduced motion (the Settings control if one exists; otherwise `page.emulateMedia({ reducedMotion: 'reduce' })`). Record which method was used.
3. With the sim running, take two minimap captures 500 ms apart: `probe-06-reduced-motion-a.png` and `probe-06-reduced-motion-b.png`. Compare the objective pulse region.

**Expected Result**: The pulse region is identical in both captures. If neither method changes the pulse, record "reduced motion not exercised" as a gap.
**Pass Criteria**: The pulse is pixel-identical across the two captures, or the gap is recorded with its reason.
**Actual Result**:
**Pass/Fail**:

## IF-007-TC-09: Run hygiene

**Steps**: Read `errors:` and the last line of the smoke transcript, and the error count in `probe-output.txt`.
**Expected Result**: `errors: []` and `ALL PASS`. The probe has 0 page errors and 0 console errors.
**Pass Criteria**: 0 errors.
**Actual Result**:
**Pass/Fail**:

---

## Rulings needed

1. AC13 says toasts "name current bindings". The Extraction toast (and the Directives toast) names no key. Are they outside that requirement?
2. AC13 lists 8 toasts. The build shows 9 (`TUTORIAL n/9`, adding DIRECTIVES). Is the extra toast accepted inside AC13?

## AC boxes

- AC10: tick if TC-01, TC-02 and TC-03 pass, including the probe captures. Otherwise record why: ____
- AC13: tick if TC-04, TC-05 and TC-06 pass and Rulings 1 and 2 are settled. Otherwise record why: ____
- AC14: tick if TC-07 passes. Otherwise record why: ____
