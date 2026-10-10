# Story 006: Presentation-only randomness does not change outcomes

> **Epic**: Audio
> **Status**: Ready
> **Layer**: Presentation
> **Type**: Logic
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/audio.md`
**Requirement**: `TR-audio-003`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0017: One OS / input / audio mixer  
**Secondary ADRs**: ADR-0016: Tactical sim contract
**ADR Decision Summary**: One palette, one remap table, four audio buses; DOM screens at 1280×720; keyboard and mouse only.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: DOM + Web Audio and Zustand 5; no post-cutoff three.js or r3f API involved (ADR Post-Cutoff APIs Used: None). Do not use `THREE.Audio` or React 19.2 `<Activity>` / `useEffectEvent`.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Presentation Layer Rules, manifest 2026-10-08).
- Forbidden: Never draw mission-bed or gunshot playback-rate jitter from the seeded gameplay RNG.
- Guardrail: No `public/` assets — audio loads with Vite `?url` from `inspiration/audio/`; no per-frame React state (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/audio.md`, scoped to this story:*

- [ ] GIVEN identical initial mission state and seed, deployment/research snapshots, modifiers/difficulty, district variant, loadout, commands and their timing, and simulation timestep schedule, WHEN those inputs are replayed while only presentation-only mission-bed selection and gunshot playback-rate jitter are varied in a controlled fixture, THEN hit/outcome state, weather script, and Opening hour match at equivalent simulation points. Presentation choices may differ; two uncontrolled random draws are not required to differ, and two independently played deploys are not equivalent fixtures.

---

## Implementation Notes

*Derived from the governing ADRs and the Presentation Layer Rules:*

- Bed pick and gunshot rate jitter use unseeded presentation randomness; the sim RNG (`world.ts`), weather script, and Opening hour must be unaffected. Build a controlled fixture that varies only those two draws.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 003: bed lifetime.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/game/audio.test.ts`, `src/game/world.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 003
- Unlocks: None
