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
- Guardrail: No `public/` assets — audio loads with Vite `?url` from `inspiration/audio/`; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/audio.md`, scoped to this story:*

- [ ] GIVEN identical initial mission state and seed, deployment/research snapshots, modifiers/difficulty, district variant, loadout, commands and their timing, and simulation timestep schedule, WHEN those inputs are replayed while only presentation-only mission-bed selection and gunshot playback-rate jitter are varied in a controlled fixture, THEN hit/outcome state, weather script, and Opening hour match at equivalent simulation points. Presentation choices may differ; two uncontrolled random draws are not required to differ, and two independently played deploys are not equivalent fixtures.

*(Added at Sprint 9 planning, task R-2, from the GDD sections named.)*

- [ ] (Formulas, `mission_bed_pick`: unseeded; `design/gdd/audio.md`) GIVEN the controlled fixture above, WHEN the mission bed is picked and gunshots play with rate jitter, THEN the seeded simulation RNG's draw count at each equivalent simulation point equals the count with no audio running; neither presentation choice draws from the simulation stream.
- [ ] (Edge Cases, gunshot playback rate; `design/gdd/audio.md`) GIVEN a squad gunshot and a CorpSec gunshot played with rate jitter, WHEN the shot is resolved, THEN its hit chance and the shooter's fire interval equal the values with jitter off.

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

*From `production/qa/qa-plan-sprint-009-2026-10-17.md` (2026-10-17).*

#### AU-006 — Presentation-only randomness does not change outcomes (Logic)
**Automated**:
- `src/game/audio.beds.test.ts` or `src/game/world.test.ts`: two controlled runs with identical seed, snapshots, difficulty, variant, loadout, commands, command timing and timestep schedule, varying only the mission-bed pick and gunshot rate jitter → hit/outcome state, weather script and Opening hour match at equal simulation steps
- The sim's `rng()` draw count is unchanged by a bed pick or by jitter (neither consumes the sim stream)
**Edge cases**: Two independently played deploys are not equivalent fixtures; Jitter keeps weapon identity and cadence; Two uncontrolled random draws are not required to differ
**Mutation check**: make the bed pick draw from the sim RNG → the equal-outcome test fails

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
