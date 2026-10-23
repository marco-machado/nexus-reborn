# Story 018: Playtest 2 mission fixes — no destroy soft-lock, legible grenades and devices, camera taught

> **Epic**: Tactical mission
> **Status**: Complete
> **Layer**: Feature
> **Type**: Logic
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-23

## Context

**GDD**: `design/gdd/tactical-mission.md` (Rule 13 Combat / Destroy apply; Open Question 3 resolution 2026-10-19: a Device is a fire-lane Unit, gunfire, grenades and charges all reduce it)
**Requirement**: `TR-tactical-006`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*
**Design source**: agent playtest session 2 (`production/qa/playtests/agent-2026-10-23-s2/notes.md`, 2026-10-23): out of power cells with no hostile left, the tester could not reduce the last relay at all (no fail state, no timer) although the Brief promises "gunfire works, slowly"; three own-goal grenades with no blast-radius preview; destroyed relays looked live; camera pan and zoom found by accident after ~25 minutes.

**ADR Governing Implementation**: ADR-0016: Tactical sim contract
**ADR Decision Summary**: Five verbs; Attack names a living hostile only (no Attack or Demolish verb on a Device); fire lane, grenade and charge may still reduce Devices.
**ADR Version**: per `docs/architecture/adr-0016-tactical-sim-contract.md`
**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: HIGH (ADR-0010 for the scene ring)
**Engine Notes**: the blast ring is a plain `RingGeometry` + `MeshBasicMaterial` under r3f; positioned by ref from the ground plane's pointer events (no React state per frame).

**Control Manifest Rules (this layer)**:
- Required: deterministic sim (no new RNG draw); per-frame data out of React state.
- Forbidden: a sixth verb; Attack on a Device.

---

## Acceptance Criteria

- [x] GIVEN a required destroy objective that is active, no hostile in sight, and a free-fire operative in weapon range and line of sight of one of its devices WHEN the sim runs THEN the operative takes the device up as a target and gunfire reduces it; an optional destroy's device and a Hold Fire operative are never auto-targeted; Attack on a Device is still a no-op (AC 5d).
- [x] GIVEN a destroyed device WHEN it renders THEN its emissive core is hidden (it collapses and goes dark), so it does not read as live from the play camera.
- [x] GIVEN grenade targeting armed WHEN the pointer moves over the ground THEN a Red Hot ring of the real blast radius (`GRENADE_RADIUS`, 3.5 m) follows it; the ITEMS tutorial step names the grenade key and says the blast hurts everyone inside the ring, the squad included; the MOVEMENT step names the pan keys, the wheel zoom and the recenter key.

---

## Implementation Notes

- `src/game/world.ts`: `nearestObjectiveDevice` — devices under an active, non-optional destroy objective; `refreshAutoTarget` falls back to it when `nearestVisibleEnemy` finds nothing. `GRENADE_RADIUS` exported for the ring.
- `src/scene/unitModel.ts` / `Units.tsx`: `View.core`; hidden on device death.
- `src/scene/Input.tsx`: the blast ring mesh; `src/game/tutorial.ts`: MOVEMENT and ITEMS copy, all keys through the remap table.
- `design/gdd/tactical-mission.md` Rule 13 and the OQ3 resolution record the free-fire fallback.

---

## QA Test Cases

- **AC-1**: `src/game/world.test.ts` "free fire works an active objective device down when no hostile is in sight" (mutation-checked: removing the fallback fails it) and "Hold Fire keeps free fire off an objective device"; the existing "runs Rust Haven … no bonus when skipped" pins that the optional transformer is not auto-destroyed; "Attack on a Device sets no Explicit target (AC 5d)" unchanged.
- **AC-2 / AC-3**: harness capture `production/qa/playtests/harness` smoke (ring visible while targeting; camera zoom and pan); tutorial copy via `src/game/tutorial.ts` (keys from `BINDINGS`).

---

## Test Evidence

**Story Type**: Logic
**Status**: [x] Created — `src/game/world.test.ts` (2 new tests); vitest 1644/1644.

---

## Dependencies

- Depends on: none
- Unlocks: agent playtests 3 and 4

---

## Completion Notes
**Completed**: 2026-10-23
**Verdict**: COMPLETE
**Criteria**: 3/3
**Decision**: Claude (delegated by the owner's /goal 2026-10-23): auto-fire on required objective devices makes the owner-confirmed Brief line "power cells arm grenades, the fast tool; gunfire works, slowly" true without a new verb; optional devices stay a deliberate choice.
