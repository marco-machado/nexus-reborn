# Story 003: Strategy bed and mission city-hum lifetimes

> **Epic**: Audio
> **Status**: Ready
> **Layer**: Presentation
> **Type**: Integration
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/audio.md`
**Requirement**: `TR-audio-002`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0017: One OS / input / audio mixer  
**ADR Decision Summary**: One palette, one remap table, four audio buses; DOM screens at 1280×720; keyboard and mouse only.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: DOM + Web Audio and Zustand 5; no post-cutoff three.js or r3f API involved (ADR Post-Cutoff APIs Used: None). Do not use `THREE.Audio` or React 19.2 `<Activity>` / `useEffectEvent`.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Presentation Layer Rules, manifest 2026-10-08).
- Forbidden: Never key the mission bed clip to district, contract, hour, weather, or Threat.
- Forbidden: Never React 19.2 `<Activity>` / `useEffectEvent` to hide phases.
- Guardrail: No `public/` assets — audio loads with Vite `?url` from `inspiration/audio/`; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/audio.md`, scoped to this story:*

- [ ] GIVEN navigation World Network → Research → Brief → Assembly, WHEN the strategy bed is heard, THEN the same source keeps playing and it is the industrial loop on music. WHEN the director enters Menu, Mission, or Debrief, THEN that bed stops.
- [ ] GIVEN a mission start, WHEN the mission bed starts, THEN it is one of the three city-hum clips, not keyed to contract, district, Opening hour, weather, or Threat, and it stops on leave.

---

## Implementation Notes

*Derived from the governing ADRs and the Presentation Layer Rules:*

- Strategy bed lifetime is the four Screens (`bindStrategyBed`, `src/ui/strategyAudio.ts`); Menu, Mission, and Debrief stop it. Pause/Settings overlays do not mute or swap beds.
- `pickMissionBedUrl()` is an unseeded 1-of-3 pick; city hum owns mission-phase lifetime and stops on leave.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 004: rain.
- Story 006: determinism of the bed pick.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Integration
**Required evidence**:
- Integration: test file beside the module — `src/game/audio.test.ts`. — must exist and pass; plus a click-through note (docs/click-through.md, Audio changes) naming the screens exercised.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 001
- Unlocks: Story 004
