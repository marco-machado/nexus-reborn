# TM-020 — Objective markers in the 3D view — Sprint 11 execution results

**Story type**: Visual/Feel | **Gate**: BLOCKING (lead sign-off) | **Build**: HEAD `131a5c1`, dev server http://localhost:4200 (not started or stopped by this run)
**Cases**: `production/qa/test-cases/tm-020-objective-markers-in-the-3d-view-cases.md` (TM-020-01 to 08)
**Date**: 2026-10-25 | **Tester**: qa-tester (Claude)

## Method

- Headless Chrome for Testing 1280x720, `--use-angle=swiftshader`, via `playwright-core`: `probe.mjs` (this folder). Nothing opened on screen.
- Missions reached through the harness `fixture` store steps, then `selectMission` + `goto('team')` + `startMission()`.
- Scene reads: the app's own r3f module (`/node_modules/.vite/deps/@react-three_fiber.js?v=cbb1798c`, from performance resource entries), `_roots` → connected canvas root → `store.getState().scene`, marker pool = the Group with 16 children (Ring/Cylinder alternating). Found in every run. Oracle = `objectiveMarks(...)` called in the page.
- Assists (recorded): `orderMove` of the living agents to gate, console, yard-a (76.3, 44), target; `orderHoldFire(agents, true)` before entering yard-a in rh run 4, released after the TM-03 reads; devices killed with the fixture shortcut (`stance 'dead'`, `hp 0`); `setReducedMotion` through the settings store (not the Settings UI); TM-019 casualty hold released with Space when `held` was true (4 times in run 1, 2 in run hc8, 2 in run rh-3); TM-03 run 3 froze the sim with `setHeld(true, 'QA FREEZE')` the instant `rh1` completed and released it after the reads; minimap set to zoom 0 by clicking "Zoom minimap out" twice (it starts at max zoom).
- Runs: run 1 (all cases; logs `run1-probe-output.txt/json`); run `hc8` (TM-01, 02, 06a, 07, 08 re-run after the minimap zoom/frame fix; `hc8-probe-output.*`); `rh` run 2 (`rh-run2-probe-output.*`) run 3 (`rh-run3-probe-output.*`), and run 4 with Hold Fire (`rh-probe-output.*`). PNGs are from the last run that produced them: 01, 02, 06-start, 07, 08 from `hc8`; 04, 05 from run 1; 03 and 06-only from rh run 4.
- Captures are kept in this folder (coordinator instruction), not at `production/qa/evidence/tm-020-*.png` as the cases file says.

## Automated

`npx vitest run src/game/objectiveMarks.test.ts`:

```
 Test Files  1 passed (1)
      Tests  3 passed (3)
```

## Results

| Case | AC | Coverage | Actual Result | PASS/FAIL/BLOCKED |
|---|---|---|---|---|
| TM-020-01 | 1a, 1c, 1e | probe scene read + oracle + PNG | Rows: only `hc1` active. `gate` = {72, 48.5, r 3.5}. Exactly 1 visible slot: pos (72, 0.06, 48.5), scale 3.5, inner 0.88, colour `9be8ff` (= VIP `#9be8ff`), beam visible at (72, 0, 48.5). No slot for hc-opt/hc2/hc3/hc4. Oracle `[{72, 48.5, r 3.5, required}]` matches. PNG `tm-020-01-required-gate.png`. | PASS |
| TM-020-02 | 1a, 1c, 1e | probe + oracle + 2 PNGs | `hc1` done after orderMove (11.3 s); `hc2`, `hc-opt` active (hc-opt timer 1:30 on HUD). 2 slots: server (83, 43.5) scale 2, inner 0.94, beam false; console (73, 37) scale 2, inner 0.88, beam true at (73, 0, 37). Both `9be8ff`. No slot at gate. Oracle matches. PNG console shows ring + beam (by eye); PNG server shows thin ring, no beam. | PASS |
| TM-020-03 | 1b, 1c, 1e | probe + oracle + 2 PNGs (rh run 4) | Assists: `orderHoldFire(a1-a4, true)` before entering yard-a (all four agents read `holdFire: true`); orderMove to (76.3, 44); `setHeld(true)` the instant `rh1` done (12.0 s). `rh2`, `rh-opt` active, `rh1` done. Devices: d1 relay (68.5, 39.5) hp 115.1, d2 relay (76.5, 43.5) hp 120, d3 relay (72.5, 35.5) hp 120, d4 transformer (77.5, 37.5) hp 120, all alive. Read 1: **4 visible rings**: d1, d2, d3 at their positions, scale 1.2, inner 0.88, colour `9be8ff`, beam visible at the same x, z; transformer scale 1.2, inner 0.94, no beam; no ring on yard-a. Oracle: the same 4. PNG `tm-020-03-relays-3.png` (by eye: three rings with beams on the relays, one ring without a beam on the transformer). Killed d1 (fixture shortcut: stance dead, hp 0); `rh2` still active, not done. Read 2: **3 visible rings**: transformer (no beam), d2 and d3 (beams); no slot within 0.5 of d1 (68.5, 39.5). Oracle: the same 3. PNG `tm-020-03-relays-2.png`. Hold fire and the freeze were released afterwards. | PASS |
| TM-020-04 | 1e, 1a | probe + oracle + 2 PNGs (run 1) | Before: console slot (73, 37) visible with beam. `hc2` done after 7.2 s at console. After: no slot at console; `hc3` active and its ring at extraction (48, 88) scale 4, inner 0.88, beam true; hc-opt (still active) thin ring at server. Oracle matches. | PASS |
| TM-020-05 | 1e (failed) | probe + oracle + PNG (run 1) | After 76.4 s more, `hc-opt.failed` true, mission live. Only slot: hc3 at (48, 88) with beam; none within 0.5 of server. (hc2 already done, so the console clause does not apply.) Oracle matches. | PASS |
| TM-020-06 | 1d | probe + decal read + 2 PNGs | (a) Start: the only slot is at the gate, none near extraction (48, 88, r 4); decal InstancedMesh found: 20 instances, centred (48, 88), emissive `7ef0d4`. (b) After rh2/rh-opt (shortcut kills) and rh3 (45 s defend, by play): only `rh4` active; 0 visible slots; oracle `[]`; decal unchanged (20, centre (48, 88), `7ef0d4`). PNG (b) by eye: dashed teal ring only, no VIP ring, no beam. | PASS |
| TM-020-07 | 1g | probe 60-frame samples + PNG | Off: optional opacity 0.220 to 0.549 (spread 0.329), required 0.360 to 0.898 (spread 0.538). On (store setter): optional 0.55 and required 0.9 on all 60 frames, spread 0. Off again: spreads 0.330 / 0.540. `scale.x` 2 on every frame in all three samples. PNG `tm-020-07-reduced.png`. | PASS |
| TM-020-08 | 1f | probe pixel scan + PNGs + crops | Zoom 0 (out button disabled). Draw frame 210x150 (CSS 208x148, dpr 1), s 1.1049, ox 30, oy 0. hc1 state: expected (123.36, 94.14) r 4; best-fit VIP circle offset 1.58 px (81% of 72 points hit). hc2 state: expected (133.13, 85.94) r 4; offset 1.12 px (97%); no VIP circle at the server (0%). Run 1 read 0% because the minimap started at max zoom; fixed by clicking zoom out. | PASS |

## Notes

- **TM-020-03 history**: in rh runs 1 to 3, without Hold Fire, squad free fire destroyed relay `d1` on the way into yard-a before `rh2` activated, so those runs read 3 rings then 2 (scene and oracle agreed every time). In run 4 Hold Fire was set first (coordinator instruction, after TM-018 "Hold Fire keeps free fire off an objective device"), and all three relays were alive when the destroy stage began. That run is the result.
- **Case text error (TM-020-07)**: the expected ranges [0.63, 0.90] / [0.385, 0.55] do not follow from the case's own formula `k = 0.7 + 0.3 sin(3t)`, which gives k in [0.4, 1.0], so [0.36, 0.90] / [0.22, 0.55]. The observed values fit the formula, and the pass criteria (spread > 0.05; 0 under reduced motion) are met. This is a cases-file correction, not a defect.
- **Design question (coordinator ruling)**: on a destroy objective the minimap pulses `objectiveZone` (landmark, else checkpoint), while the 3D rings sit on the devices. Recorded here as a question for design, not as a defect. TM-020-08 used non-destroy states, as the case says.
- **Observation, not judged**: `tm-020-06-extraction-only.png` shows two large white ellipses inside the extraction decal. Their source was not checked. They are not marker slots (0 visible slots).
- The TM-019 casualty hold fired during the runs and was released with Space each time. Agents died by play in every run (for example, in run hc8 DART flatlined before hc2).
- Markers kept refreshing while the sim was held (TM-03 run 3 reads under `setHeld`), as the case's setup says.
- Pool slot y = 0.06 and beam y = 0 in every read. Ring `scale.z` always equalled `scale.x`.

## Story verdict

**PASS (QA execution): 8 of 8 cases PASS, no defects found.** The story closes only when the art lead and QA lead sign off below (BLOCKING gate).

Per AC: AC-1a PASS (01, 02, 04) · AC-1b PASS (03: 4 rings, then 3 with none on the dead relay) · AC-1c PASS (01, 02, 03 reads) · AC-1d PASS (06) · AC-1e PASS (01, 02, 04, 05, 03) · AC-1f PASS (08 + oracle matched every read) · AC-1g PASS (07).

## Lead sign-off

| Role | Name | Date | Verdict | Signed |
|---|---|---|---|---|
| Art director / lead (Visual/Feel) | | | | [ ] |
| QA lead | | | | [ ] |
