# ADR-0016: Tactical sim contract

> **Engine specialist**: CONCERNS (ADR-0015 number collision; approach pass-with-notes) 2026-09-10
> **Technical Director Review (TD-ADR)**: APPROVED 2026-09-10
> **Lead Programmer Review (LP-FEASIBILITY)**: FEASIBLE 2026-09-11 (re-run; prior CONCERNS 2026-09-10 closed by Key Interfaces)

Custom TypeScript sim: five verbs, fire lane, seeded 96×96 citygen, fixed camera pose, Hardened discrete profile. No physics engine. Camera *pose* is this ADR; canvas and frame loop are ADR-0010.

Numbered 0016 because ADR-0015 is Telemetry never leaves the machine (Accepted).

## Status
Accepted

## Date
2026-09-10

## Engine Compatibility

| Field | Value |
|-------|-------|
| **Engine** | React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 WebGPU |
| **Domain** | Gameplay / Geometry / Rendering |
| **Knowledge Risk** | HIGH — cutoff May 2025; pin is three.js r185 / React 19.2.8. Sim uses no three.js APIs. CameraRig uses `three/webgpu` `PerspectiveCamera` fov/lookAt (pre-cutoff). Geometry/camera MEDIUM. |
| **References Consulted** | `docs/engine-reference/web/VERSION.md`; `breaking-changes.md`; `deprecated-apis.md`; `modules/r3f.md`; `docs/agents/geometry-input-assets.md`; `design/gdd/tactical-mission.md`; `src/game/types.ts`; `src/game/world.ts`; `src/world/citygen.ts`; `src/scene/CameraRig.tsx`; `src/scene/GameCanvas.tsx`; `src/game/missionParams.ts`; `src/ui/Input.tsx` |
| **Post-Cutoff APIs Used** | CameraRig / GameCanvas import from `three/webgpu` (r185). No OrbitControls, no physics addon, no `THREE.Clock` as game clock. |
| **Verification Required** | No physics engine. Five verbs + Stop-not-sixth. Fire-lane first Unit. `generateCity(mission, spec?, gen?)` RNG from `district.seed`; `CITY_SIZE` 96 constant. Camera 45°/55°/25°, zoom 44–115 m, no rotate/tilt, minimap `CAMERA_YAW`. Hardened `DIFFICULTY_FX` does not hide minimap. `orderHoldFire` does not null standing Explicit. `orderAttack` rejects devices. CameraRig `useFrame` priority 0 after WorldTicker. |

## ADR Dependencies

| Field | Value |
|-------|-------|
| **Depends On** | ADR-0001 (Accepted), ADR-0002 (Accepted), ADR-0006 (Accepted), ADR-0007 (Accepted), ADR-0009 (Accepted — deploy freeze), ADR-0010 (Accepted — canvas helpers, not pose) |
| **Enables** | Tactical stories for verbs, fire lane, citygen, camera pose, Hardened |
| **Blocks** | None named as epics yet |
| **Ordering Note** | Does not supersede ADR-0010. Does not re-own weather script (ADR-0006) or Opening hour (ADR-0007). |

## Context

### Problem Statement

TR-tactical-002 / 006 / 007 / 008 / 009 are ADR gaps. Without a stamp, stories can add a sixth verb, a physics engine, a rotatable camera, a second generator, or Hardened-as-hidden-minimap.

### Constraints

- One system, one seed, unsaved lifetime. Do not split district / combat / weather / hour / objectives into sibling systems.
- No physics engine. Per-frame poses stay out of React.
- `createWorld` must not live-read `researchStore` / `campaignStore` / `worldStore` (ADR-0009). `missionStore` HUD writes stay ADR-0010.
- Living spec wins for Hold Fire vs standing Explicit and Attack vs Device.

### Requirements

- Five verbs plus auto-acquire; custom TypeScript sim; no physics engine.
- A missed round continues; the first Unit before cover is hit; Tactical counts `N`.
- Deterministic 96×96 m citygen and one-metre walk grid from the mission seed.
- Camera 45° yaw / 55° elevation / 25° FOV, zoom 44–115 m; no rotate or tilt; minimap up = screen up.
- Hardened is a discrete profile and must not hide minimap information.

## Decision

Stamp the existing sim as the contract. Two code defects versus living spec are **not** stamped; they must be fixed to the spec.

### Command language (TR-tactical-002)

Protected verbs: **Select**, **Move**, **Attack**, **Hold Ground**, **Hold Fire**. **Stop** is command language, not a sixth verb (`orderStop`). Kit (Q / items / grenade / swap) is not a verb. Those kit methods may stay on `WorldApi`; they are not fantasy verbs.

- **Select** — Interface input; Tactical validity. Live home is `missionStore.selected` / `setSelected`. Dead are never recipients. Opens with every living operative selected. Do **not** add `WorldApi.orderSelect`.
- **Move** — `orderMove`. Writes a path, clears Explicit, releases Hold Ground. Along the route, auto-acquire visible CorpSec when weapons are free, then resume.
- **Attack** — `orderAttack`. Explicit on a **living hostile** only. Overrides Hold Fire. Hold Ground prevents the chase, keeps the target.
- **Hold Ground** — `orderHold`. Parks/restores path. Separation will not shove the held tile. Fire still allowed.
- **Hold Fire** — `orderHoldFire`. Clears **automatic** targets and blocks auto-acquire. Does **not** null a standing Explicit. A later Attack still fires.
- **Stop** — `orderStop`. Clears path and target. Hold Ground and Hold Fire stay.

`explicitTarget` is sim-private (`SimUnit`, not the public `Unit` type). Specify the behavior on the order functions; do not export the flag.

**Defect (do not stamp):** `orderHoldFire` currently sets `targetId = null` and `explicitTarget = false`. Do not stamp `world.test.ts` cases that encode that clear. Fix to living spec.

**Defect (do not stamp):** `orderAttack` currently accepts `kind === 'device'`. `Input.tsx` also treats devices as attack picks (companion). Attack = living hostile. No Demolish verb. Fire lane / Destroy / grenade / charge may still reduce devices.

Custom sim in `src/game/world.ts`. No cannon, rapier, or three.js physics. Eight-direction 1 m walk grid. No diagonal corner cutting. No rigid-body physics.

### Fire lane (TR-tactical-006)

A missed round continues down the lane to weapon range (`strayVictim` in `tryFire`). The first Unit before cover is hit, regardless of side. Cover or failed `hasLos` interrupts. Authority is the sim walk-grid LOS, not `THREE.Raycaster` / `Mesh.raycast`. Tactical counts unique squad-caused civilian first hits as `civiliansHit` (`N`). Economy prices; Tactical does not.

Do not fork `hit_chance` numbers into this ADR. The expression lives in the GDD and `tryFire`.

### Citygen (TR-tactical-007)

`CITY_SIZE = 96` (constant; not derived from the seed). `src/world/citygen.ts` is the only generator. Signature: `generateCity(mission: MissionDef, spec?: DistrictSpec, gen?: Partial<GenParams>)`. RNG is `mulberry32(district.seed)`. Same seed → same district. Ground plane XZ, +Y up, 1 unit = 1 m. Southern insertion, walk grid, `roadRects`.

### Camera pose (TR-tactical-008)

Tactical owns pose. ADR-0010 owns `createRoot` / `getWorld` / `setCameraFootprint` helpers only.

- Yaw: `CAMERA_YAW = π/4` (45°) in `types.ts`. Minimap rotates by the same constant.
- Elevation 55°, FOV 25°, zoom distance 44–115 m: `CameraRig.tsx` (`ELEV`, `cam.fov`, `MIN_DIST` / `MAX_DIST`). `GameCanvas` `createRoot` `camera: { fov: 25, … }` is boot only; CameraRig overwrites each frame before Effects submit.
- CameraRig `useFrame` priority 0, after WorldTicker. Effects stay priority 1 (ADR-0010).
- No rotate or tilt in play. Pan / zoom / recenter are steering, not verbs.
- Do not add OrbitControls, MapControls, CameraControls, `OrthographicCamera`, or JSX `<perspectiveCamera makeDefault>`.
- `VISION_HALF_ANGLE` (55° in `types.ts`) is **not** camera elevation.

### Hardened (TR-tactical-009)

Discrete `DIFFICULTY_FX` in `src/game/missionParams.ts`. Pointer only; do not fork the table here. Standard is the authored baseline. Player setting; survives New Operation. Must not hide minimap cones or patrols. Not a free-range. Control does not add CorpSec HP. Unrest extras are Tactical-derived from the World Network snapshot.

### Architecture Diagram

```
mission / district.seed
  → generateCity(mission, spec?, gen?)
  → createWorld → WorldApi

Interface Select → missionStore.setSelected
Input → orderMove / orderAttack / orderHold / orderHoldFire / orderStop
WorldApi.tick → auto-acquire, tryFire / strayVictim, civiliansHit

CameraRig useFrame(0) after WorldTicker
  → yaw CAMERA_YAW, elev 55°, fov 25, dist 44–115
Minimap → same CAMERA_YAW (Hardened still emits cones)

Scene reads getWorld() each frame (ADR-0010)
```

### Key Interfaces

- `WorldApi.orderMove(agentIds, dest)`
- `WorldApi.orderAttack(agentIds, targetId)` — living hostile only
- `WorldApi.orderHold(agentIds, hold)`
- `WorldApi.orderHoldFire(agentIds, hold)` — auto-acquire only; standing Explicit stays
- `WorldApi.orderStop(agentIds)` — not a sixth verb
- Select: `missionStore.setSelected` (Interface). Validity is Tactical.
- `CITY_SIZE`, `CAMERA_YAW` in `types.ts`
- `DIFFICULTY_FX` in `missionParams.ts`
- `generateCity(mission, spec?, gen?)` in `citygen.ts`
- CameraRig-local `ELEV` / `MIN_DIST` / `MAX_DIST` / `fov` — do not add a CameraPose module
- Kit: `orderSwapWeapon` / `orderAbility` / `orderUseMed` / `orderUseCell` / `orderGrenade` stay on `WorldApi`; they are not verbs

## Alternatives Considered

### Alternative 1: Three ADRs (verbs / citygen / camera)

- **Description**: Split by domain so Gameplay, Geometry, and Rendering each have a record.
- **Pros**: Smaller files; camera could wait on ADR-0010.
- **Cons**: GDD forbids splitting the system; stories invent a sixth verb while camera is still open.
- **Rejection Reason**: User chose one contract covering all five TRs.

### Alternative 2: Physics engine

- **Description**: Rapier / cannon for movement and bullets.
- **Pros**: Off-the-shelf collision.
- **Cons**: Breaks seed determinism; project pin is no physics.
- **Rejection Reason**: TR-tactical-002 and `docs/technical-preferences.md`.

### Alternative 3: Stamp current Hold Fire null and Attack-on-device

- **Description**: Treat current `world.ts` / `Input.tsx` as the contract.
- **Pros**: Zero code change.
- **Cons**: Forks living spec; GDD already flagged both as defects.
- **Rejection Reason**: User chose living spec.

## Consequences

### Positive

- Closes TR-tactical-002 / 006 / 007 / 008 / 009 on paper.
- Five verbs stay the command fantasy; chrome cannot bury them by inventing a sixth.
- Camera and minimap stay coupled on `CAMERA_YAW`.
- Hardened is a fight profile, not a fog-of-war cheat.

### Negative

- One ADR spans three domains.
- Two known code defects must land as bugfixes, not as the stamped behavior.
- Elevation / zoom live in CameraRig, not `types.ts` (only yaw is shared today).

### Risks

- Stories add drei OrbitControls / MapControls / CameraControls or an Orthographic “true iso.” Mitigation: pose is this ADR; no rotate/tilt.
- `THREE.Raycaster` / `Mesh.raycast` / GPU picking as fire-lane or LOS authority. Mitigation: `hasLos` / `strayVictim` on the walk grid.
- Moving `CAMERA_YAW` without the minimap, or treating `VISION_HALF_ANGLE` as camera elevation.
- Treating `GameCanvas` boot `camera.position` as the pose contract. CameraRig overwrites each frame.
- Giving CameraRig a unique or positive `useFrame` priority (ADR-0010 extra GPU submit / tick-before-pose).
- Adding a physics addon “just for bullets.” Mitigation: forbidden.
- Stamping `orderHoldFire`’s current null or the test that encodes it.
- Per-frame camera focus/zoom in `missionStore` (ADR-0010 `per_frame_pose_in_react`).
- A second generator or WebGPU compute walk grid beside `citygen.ts`.
- Unifying CameraRig’s `Math.min(rawDt, 0.05)` with WorldTicker raw dt (pause-banked fling). Leave the clamps separate.

## GDD Requirements Addressed

| GDD System | Requirement | How This ADR Addresses It |
|------------|-------------|--------------------------|
| tactical-mission.md | TR-tactical-002 Five verbs plus auto-acquire; custom TypeScript sim with no physics engine | Names `WorldApi` orders + `missionStore` Select; `world.ts` is the sim; no physics |
| tactical-mission.md | TR-tactical-006 Missed round continues; first Unit before cover is hit; Tactical counts N | `strayVictim` / `tryFire`; `civiliansHit` |
| tactical-mission.md | TR-tactical-007 Deterministic 96×96 m citygen and one-metre walk grid from the mission seed | `CITY_SIZE`; `generateCity`; `district.seed` |
| tactical-mission.md | TR-tactical-008 Camera 45°/55°/25°, zoom 44–115 m; no rotate/tilt; minimap up = screen up | `CAMERA_YAW` + CameraRig constants; shared yaw |
| tactical-mission.md | TR-tactical-009 Hardened is a discrete profile; it must not hide minimap information | Pointer to `DIFFICULTY_FX`; minimap still emits cones |

## Performance Implications

- **CPU**: existing sim plus a stray scan per miss. No new frame budget (`docs/technical-preferences.md` still PENDING).
- **Memory**: 96×96 walk grid plus unit list.
- **Load Time**: `generateCity` at mission create.
- **Network**: none.

## Migration Plan

Stamp existing `world.ts`, `citygen.ts`, `CameraRig.tsx`, `missionParams.ts`. Fix `orderHoldFire` (do not clear standing Explicit). Fix `orderAttack` and `Input.tsx` pick filter (living hostile only). Rewrite tests that encode the Hold Fire clear. Do not add a physics engine. Do not extract camera into a new system. Optional later: hoist `ELEV` / `MIN_DIST` / `MAX_DIST` / FOV next to `CAMERA_YAW` — not required to accept this ADR.

## Validation Criteria

- No physics dependency in `package.json` / mission sim.
- `orderHoldFire(true)` leaves a standing Explicit Attack set; auto-acquire is off.
- `orderAttack` no-ops on device ids; Input does not pick devices as Attack targets.
- Same `district.seed` → same `city.walk` / `city.size === 96`.
- CameraRig yaw `CAMERA_YAW`, elevation 55°, fov 25, distance clamped 44–115; no user rotate/tilt.
- Minimap rotation uses `CAMERA_YAW`.
- Hardened extras come from `DIFFICULTY_FX`; minimap still receives cones and patrols.
- Fire-lane fixture: miss hits the first Unit before cover; cover blocks.
- CameraRig `useFrame` priority 0 after WorldTicker; Effects remain the only GPU submit.

## Related Decisions

- [ADR-0001](adr-0001-two-clocks.md) — tactical clock independent; this ADR does not re-own it
- [ADR-0002](adr-0002-unsaved-mission.md) — unsaved lifetime
- [ADR-0006](adr-0006-weather-script.md) — weather script; not this ADR
- [ADR-0007](adr-0007-opening-hour.md) — Opening hour; not this ADR
- [ADR-0009](adr-0009-partitioned-deploy-snapshot.md) — freeze into `createWorld`; no live store handles
- [ADR-0010](adr-0010-mission-renderer-and-frame-loop.md) — canvas / frame loop / camera *helpers*; pose is this ADR
