# Story 020: Active objectives are marked in the 3D view

> **Epic**: Tactical mission
> **Status**: Complete
> **Layer**: Feature
> **Type**: Visual/Feel
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-23

## Context

**GDD**: `design/gdd/tactical-mission.md` (objectives; zones); `design/gdd/interface.md` (active objective is VIP Ice plus a printed token)
**Requirement**: `TR-tactical-???` — no registered requirement covers in-world objective markers (warning; register at the next `/architecture-review`).
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*
**Design source**: agent playtests 2–4 hunted 1–2 minutes per objective, spent power cells on scenery, and never found the Hollow Crown server: only the extraction ring was drawn in the scene. CD-PLAYTEST 2026-10-23: the fix counts only if interact targets are marked too.

**ADR Governing Implementation**: ADR-0016: Tactical sim contract
**ADR Decision Summary**: Objectives are sim data; the scene reads the world imperatively.
**ADR Version**: per `docs/architecture/adr-0016-tactical-sim-contract.md`
**Engine**: React 19.2.8 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: HIGH (ADR-0010 for scene work) | **Engine Notes**: a fixed pool of 8 `RingGeometry` + `CylinderGeometry` meshes with `MeshBasicMaterial`, refreshed every 0.2 s from a ref clock; no React state per frame.

**Control Manifest Rules (this layer)**:
- Required: one zone rule for every reader; per-frame data out of React state.

---

## Acceptance Criteria

- [x] GIVEN an active, unfinished objective (required or optional, any kind but extract) WHEN the mission renders THEN a VIP Ice ground ring sits on its zone (its own zone, else its landmark, else the checkpoint) or, for a destroy, on each living device of its tag; required objectives also get a light beam; extraction keeps the city's own ring; done, failed and inactive objectives get none. The sim's zone check, the minimap and the markers use the same zone rule. Reduced motion stops the ring pulse.

---

## Implementation Notes

- `src/game/objectiveMarks.ts` `objectiveZone`, `objectiveMarks`, `DEVICE_MARK_R` 1.2; `src/game/world.ts` `zoneFor` and `src/ui/Minimap.tsx` call `objectiveZone`.
- `src/scene/ObjectiveMarkers.tsx`, mounted in `src/scene/GameCanvas.tsx` after `<Fx />`.

---

## QA Test Cases

- **AC-1**: `src/game/objectiveMarks.test.ts` describe "objective marks (TM-020)" (three tests). Visual: sweep `mission-*.png` and `hold-*.png` show the rings; no art-director sign-off recorded.

---

## Test Evidence

**Story Type**: Visual/Feel
**Status**: [x] Unit tests for the placement rule; screenshots in `production/qa/evidence/playtest-fixes-2026-10-23/`. No signed `production/qa/evidence/objective-markers-evidence.md` (gap for the Visual/Feel DoD).

---

## Dependencies

- Depends on: none
- Unlocks: none

---

## Completion Notes
**Completed**: 2026-10-23 (code in `2c73542`; story file written after)
**Verdict**: COMPLETE WITH NOTES
**Criteria**: 1/1
**Decision**: Claude, delegated by the owner's /goal 2026-10-23.
**Not done**: `/code-review` not run; Visual/Feel sign-off not recorded; no tester has yet looked for the Hollow Crown server with the markers on.
