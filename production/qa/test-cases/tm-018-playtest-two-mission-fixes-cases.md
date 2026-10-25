# Test Cases: TM-018 — Playtest 2 mission fixes

**Story**: `production/epics/tactical-mission/story-018-playtest-two-mission-fixes.md`
**Story Type**: Logic | **Output location**: automated evidence in `src/game/world.test.ts`; manual evidence in `production/qa/evidence/` | **Gate Level**: BLOCKING
**Sprint**: 11, Phase 4 | **Written**: 2026-10-24 | **Executor**: Claude
**Environment**: headless Chrome for Testing at 1280x720 against `npm run dev` (port 4200), driven by `production/qa/playtests/harness/play-server.mjs` (`node play-server.mjs <sessionDir> 4399`) and `play.mjs` (`PLAY_PORT=4399 node play.mjs <cmd>`).

## Coverage

| AC | Evidence | Case |
|---|---|---|
| AC-1 (free fire works a required objective device down; optional device and Hold Fire never auto-targeted; Attack on a Device a no-op) | Automated: `src/game/world.test.ts` ~line 1594 "free fire works an active objective device down when no hostile is in sight" (mutation-checked) and ~line 1618 "Hold Fire keeps free fire off an objective device"; existing "runs Rust Haven ... no bonus when skipped" and "Attack on a Device sets no Explicit target (AC 5d)". Run `npx vitest run src/game/world.test.ts`; pass = all four named tests green. | none (automated) |
| AC-2 (destroyed device goes dark), owner rewrite 2026-10-24 | Manual | TM-018-C1 |
| AC-3a (grenade blast ring) | Manual | TM-018-C2 |
| AC-3b (MOVEMENT and ITEMS copy; TM-021 additions at HEAD) | Manual | TM-018-C3 |

## Facts the cases rely on (read from source at HEAD)

- `src/game/world.ts:111` `GRENADE_RADIUS = 3.5`. Grenade arming (`src/scene/Input.tsx` ~line 166, key `G`) needs a selected living agent and `abilities.grenade.availability === 'usable'` (at least one power cell: base inventory is 1 cell, +1 per tech, + loadout cells; 4 s cooldown).
- Blast ring (`src/scene/Input.tsx` ~411-455): `RingGeometry(GRENADE_RADIUS - 0.15, GRENADE_RADIUS, 48)` (inner 3.35, outer 3.5), `MeshBasicMaterial` colour `RED_HOT`, opacity 0.85, `visible={grenadeTargeting}`, `renderOrder 8`; positioned by ref at `(e.point.x, 0.06, e.point.z)` in the ground plane's `onPointerMove`. The mesh has no name.
- Relay core (`src/scene/unitModel.ts` ~302-308): `View.core`, a `Mesh(deviceCoreGeom = BoxGeometry(0.55, 0.22, 0.55), deviceCore)` at local `y = 1.11` inside the device rig; the view root sits at `(u.pos.x, 0, u.pos.z)`. `deviceCore` is a shared `MeshStandardMaterial` (emissive VIP Ice, `emissiveIntensity 2.8`) used by every device, so the per-device "go dark" mechanism is `core.visible = false` (`src/scene/Units.tsx` ~64); emissive intensity is NOT set to 0 and must still read 2.8. On death the faction ring is also hidden and the rig collapses (`scale.y` to 0.4). Objective markers drop dead devices (`src/game/objectiveMarks.ts:43`).
- Scene access: the meshes are not exposed on `window` and have no names. `@react-three/fiber` 9.6.1 exports `_roots` (Map of canvas to root; `root.store.getState().scene`). In the dev server, import the same pre-bundled module URL the app loaded (locate at run time: `performance.getEntriesByType('resource')` entry containing `@react-three_fiber`, keep its `?v=` query) so the import resolves to the app's instance. The sim is at `(await import('/src/game/runtime.ts')).getWorld()`; relays are `w.units` with `kind === 'device' && tag === 'relay'`.
- `play-server.mjs` at HEAD has no `eval` command. Reading scene objects needs a `page.evaluate` against the harness page (see CONCERNS); the steps below write the evaluate body as "EVAL:".
- Rust Haven is mission `m03` (`src/game/data.ts` ~220), `intelReq 1`, objectives rh1 REACH THE RELAY YARD, rh-opt (optional transformer), rh2 DESTROY THE THREE FUEL RELAYS.
- Default bindings (`src/game/bindings.ts`): pan `W / Up`, `A / Left`, `S / Down`, `D / Right`; recenter `F`; wheel zoom; grenade `G`; med `E / M`; cell `R`; tactical hold `Space`; select slot `1-4`; select all `` 0 / ` ``; move order `Right click`. Toasts print keys through `bindingKeys` (`keys.join(' / ')`).

## Shared setup S0 — reach a live Rust Haven mission

1. Start `npm run dev` (port 4200); start the harness: `node production/qa/playtests/harness/play-server.mjs production/qa/evidence/<session>/ 4399` (it clears localStorage, so the campaign and tutorial start fresh).
2. `play.mjs clicktext NEW OPERATION` (exact menu label: locate at run time with `play.mjs look`); clear any first-visit card on the World Network.
3. Select Rust Haven: click the RUST HAVEN contract row (or `clicktext RUST HAVEN`); Brief opens.
4. Advance Brief to Team Assembly and press the deploy control (labels: locate at run time with `look`). Default squad op1-op4 is assigned; leave loadouts at default.
5. `play.mjs state` must return `inMission: true, live: true`. The harness now holds the game paused between commands.

---

## TM-018-C1 — Destroyed relay goes dark in the next rendered frame and in a 1280x720 capture

**AC covered**: AC-2 (owner's measurable rewrite, 2026-10-24)
**Preconditions**: S0 complete; mission live; at least one fuel relay alive; default play camera (no wheel or pan input yet beyond what the steps say).
**Steps**:
1. EVAL: list relays: `w.units.filter(u => u.kind==='device' && u.tag==='relay').map(u => ({id:u.id, x:u.pos.x, z:u.pos.z, hp:u.hp, stance:u.stance}))`. Record the target relay R (id, position, hp).
2. EVAL: locate R's core mesh: from the r3f scene, find the Group whose `position` equals `(R.x, 0, R.z)` (tolerance 0.01) and, beneath it, the Mesh with `geometry.parameters` `{width:0.55, height:0.22, depth:0.55}` and `position.y === 1.11`. Record `core.visible` (expect `true`), `core.material.emissiveIntensity` (expect 2.8) and `core.material.emissive.getHexString()`.
3. Before destruction, capture the live state: `play.mjs key F` (recenter) then pan/zoom only as needed so R is on screen; `play.mjs look relay-live`. Record R's screen position (project `(R.x, 1.11, R.z)` through the scene camera in EVAL). Confirm the VIP Ice core glow is visible there (control image).
4. Return the camera to the default play camera framing used in step 3 (record exact inputs used so step 7 reproduces them).
5. Destroy R through play: select the squad (`play.mjs key 0`), move it within throw range of R with right-clicks on open ground near the yard, then `play.mjs key G`, `play.mjs move <R screen x> <R screen y>`, `play.mjs click <R screen x> <R screen y>` to throw; repeat after the 4 s cooldown (`play.mjs wait 4500`) while cells last. If cells run out, let free fire work it down (AC-1 behaviour): order no attack, `play.mjs wait` in 5000 ms steps. Stop when EVAL shows `R.hp <= 0` or `R.stance === 'dead'`. (Relay hp: locate at run time in step 1.)
6. Immediately after the death is observed, while the harness holds: EVAL with one `requestAnimationFrame` wait, then re-read R's core: `core.visible`, `core.material.emissiveIntensity`, the parent rig `scale.y`, and the faction ring visibility.
7. Reproduce the step 3/4 camera framing; `play.mjs look relay-dead`. Compare the region around R's projected screen position with `relay-live`.
8. EVAL: check the other relays' cores are still `visible === true` (the shared material was not darkened for everyone).

**Expected Result**:
- Step 6: `core.visible === false` in the first rendered frame after the death (either `visible === false` or `emissiveIntensity === 0` satisfies the rewrite; by design it is `visible === false` and the shared material keeps 2.8). Rig `scale.y` heading to 0.4 (collapse); faction ring hidden.
- Step 7: in the 1280x720 capture from the default play camera, no VIP Ice emissive glow (and no bloom halo) at R's position; the collapsed dark base may show.
- Step 8: living relays' cores still visible and glowing.

**Actual Result**:
**Pass/Fail**:

---

## TM-018-C2 — Armed grenade shows a Red Hot ring of radius GRENADE_RADIUS that follows the pointer

**AC covered**: AC-3a
**Preconditions**: S0 complete; mission live; at least one living agent; `abilities.grenade.availability === 'usable'` (EVAL `useMissionStore.getState().abilities.grenade.availability`); at least one power cell left (`inventory.cell >= 1`).
**Steps**:
1. `play.mjs key 1` (select slot 1). EVAL: confirm `useMissionStore.getState().selected.length >= 1`.
2. EVAL: locate the blast ring: the scene Mesh whose `geometry.type === 'RingGeometry'` and `geometry.parameters` `{innerRadius: 3.35, outerRadius: 3.5, thetaSegments: 48}`. Record `visible` (expect `false` while not targeting).
3. `play.mjs key G`. EVAL: `useMissionStore.getState().grenadeTargeting === true`; ring `visible === true`.
4. Pointer position A: `play.mjs move 520 400` (open ground; pick another point if it lands on a unit or HUD). EVAL: record ring `position` (x, y, z), ground point under the pointer (raycast from the scene camera through (520, 400) onto y = 0). `play.mjs look ring-a`.
5. Pointer position B: `play.mjs move 760 460` (open ground, at least 150 px from A). Repeat the step 4 reads; `play.mjs look ring-b`.
6. EVAL: read ring `material.color.getHexString()`, `material.opacity`, `material.type`; compare the colour to the project's `RED_HOT` constant (locate at run time: the import in `src/scene/Input.tsx`).
7. Measure the drawn radius: project the ring centre and a point 3.5 m from it along world x through the camera; the screen distance must match the outer edge of the red ring in `ring-a.png` (within 3 px).
8. `play.mjs key G` again. EVAL: `grenadeTargeting === false`, ring `visible === false`.

**Expected Result**:
- Ring hidden before arming and after cancelling; visible while armed.
- Ring outer radius 3.5 world units (= `GRENADE_RADIUS`), inner 3.35; `MeshBasicMaterial`, colour equal to `RED_HOT`, opacity 0.85.
- At A and at B the ring's (x, z) equals the ground point under the pointer (tolerance 0.05 m), y = 0.06; the position at B differs from A (it followed the pointer).
- Both captures show a red ring centred on the pointer; drawn radius matches 3.5 m within 3 px.

**Actual Result**:
**Pass/Fail**:

---

## TM-018-C3 — Tutorial MOVEMENT and ITEMS copy, the SELECTION hold line and the BLAST RADIUS advisory, as built at HEAD

**AC covered**: AC-3b (plus TM-021 additions from commit 2c73542: SELECTION teaches the hold key; one-shot BLAST RADIUS hint on first grenade arming)
**Preconditions**: S0 complete on a fresh campaign (harness cleared localStorage; tutorial `seen` empty, so step 1 is live); default key bindings (no remaps in Settings).
**Steps**:
1. `play.mjs look tut-1`. Read the toast stack (`.hud-toasts`).
2. Act on step 1 as a player: click an operative (or `play.mjs key 1`). `play.mjs look tut-2`.
3. Read the MOVEMENT toast. Then verify the keys it names work: `play.mjs holdkey W 600`, `holdkey A 600`, `holdkey S 600`, `holdkey D 600` (EVAL `getCameraFocus()` from `/src/game/runtime.ts` before and after each; focus must move), `play.mjs wheel -400` and `wheel 400` (camera distance changes; compare captures), `play.mjs key F` (focus returns to the squad centroid).
4. Advance to ITEMS through the UI: for each of MOVEMENT, ENGAGEMENT, STANCES, ROLE ABILITY, either perform the action or click the toast's `X` (aria-label "Dismiss tutorial step <TITLE>"). Do not use SKIP TUTORIAL. `play.mjs look tut-6`.
5. Read the ITEMS toast.
6. With an agent selected and a cell available, `play.mjs key G` (first arming of the campaign). `play.mjs look hint-grenade`. Read the advisory toast.
7. `play.mjs key G` (cancel), then `play.mjs key G` again (second arming). EVAL `useTutorialStore.getState().hints`; `play.mjs look hint-grenade-2`.

**Expected Result** (exact strings, default bindings):
- Step 1 header `TUTORIAL 1/9 // SELECTION`; body: `Click an operative or drag a box to select. 1-4 picks a slot; 0 / ` takes the living squad. Space stops time with orders open; press it again to resume.`
- Step 3 header `TUTORIAL 2/9 // MOVEMENT`; body: `Right click on open ground moves the selection there. W / Up A / Left S / Down D / Right pan the camera, the wheel zooms, F recenters on the squad.` Each named pan key moves the camera focus, the wheel changes zoom, F recenters.
- Step 5 header `TUTORIAL 6/9 // ITEMS`; body: `E / M spends a med kit; R spends a power cell. G arms a grenade (one cell): its blast hurts everyone inside the red ring, your squad included.`
- Step 6 advisory header `ADVISORY // BLAST RADIUS`; body: `The red ring is the blast: everyone inside it takes damage, your squad included. Left click throws; G cancels.`
- Step 7: the advisory does not fire a second time (`hints` holds `hint-grenade` at most once; after dismissing it, it does not return on re-arming; `seen` contains `hint-grenade`).
- No toast text clipped or overflowing at 1280x720.

**Actual Result**:
**Pass/Fail**:

---

## CONCERNS recorded at authoring

- No `eval` command in `play-server.mjs`: C1 and C2 scene reads (core, ring, camera projection) need a `page.evaluate` on the harness page. Options: add a harness command (an edit outside this task's write scope), or run C1/C2 in a separate headless `playwright-cli` session on the same dev server. Executor to choose; record which in Actual Result.
- The r3f scene reach (`_roots` from the pre-bundled `@react-three_fiber` URL) is unverified at run time; if the import yields a second module instance (empty `_roots`), mark the step BLOCKED and name that cause.
- AC-2 rewrite says "visible === false (or emissive intensity 0)": the shared `deviceCore` material means only `visible` can satisfy it per device; a fix that zeroed the shared emissive would darken all live relays (C1 step 8 guards this).
- Relay hp and grenade-to-device damage were not read at authoring; C1 step 5 may need several throws or a long free-fire wait.
