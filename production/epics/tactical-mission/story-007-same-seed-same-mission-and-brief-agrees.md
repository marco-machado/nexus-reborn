# Story 007: Same seed builds the same mission; brief and deploy agree

> **Epic**: Tactical mission
> **Status**: Ready
> **Layer**: Feature
> **Type**: Integration
> **Estimate**: —
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/tactical-mission.md`
**Requirement**: `TR-tactical-001`, `TR-tactical-003`, `TR-tactical-007`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0006: Weather is a script, not a roll mid-fight  
**Secondary ADRs**: ADR-0007: Opening hour is per-mission, not the look; ADR-0016: Tactical sim contract
**ADR Decision Summary**: Weather is fixed at mission create: at most one adjacent-intensity change at a set tactical time; rain only shortens CorpSec sight and quiets weapons.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript simulation logic in `src/game/`; no post-cutoff three.js or r3f API involved (ADR Engine Compatibility: Post-Cutoff APIs Used — None).

**Control Manifest Rules (this layer)**:
- Required: Same seed produces the same weather script; `generateCity(mission, spec?, gen?)` with RNG `mulberry32(district.seed)`; `CITY_SIZE = 96`; Generated contracts roll the Opening hour minute after the existing cosmetic stream.
- Forbidden: Never a second generator or WebGPU compute walk grid beside `citygen.ts`; never an unscripted mid-mission weather roll; never derive Opening hour from strategic now.
- Guardrail: Memory — 96×96 walk grid plus unit list; `generateCity` at mission create; no per-frame React state (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/tactical-mission.md`, scoped to this story:*

- [ ] **7.** **GIVEN** the same mission seed, **WHEN** the district, weather script, and Opening hour are built twice, **THEN** both builds match: same district, same weather script, same Opening hour.
- [ ] **8.** **GIVEN** a selected contract’s brief and the deployed mission from that seed, **WHEN** insertion, sequential objectives, extraction, force/civilian counts, Opening hour, and weather-front timing are compared, **THEN** brief and deploy agree on all six. A mismatch is a Tactical/brief bug, not a sample of generated coverage.

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- District, weather script, Opening hour, and objectives share one seed and one unsaved lifetime.
- A brief/deploy mismatch on insertion, sequential objectives, extraction, force/civilian counts, Opening hour, or weather-front timing is a Tactical/brief bug.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 008: weather tuning values.
- Story 009: Opening hour has no mechanical effect.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Integration
**Required evidence**:
- Integration: test file beside the module — `src/world/citygen.test.ts`, `src/game/missionParams.test.ts`, `src/game/forecast.test.ts` — must exist and pass, OR a playtest doc.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: None
- Unlocks: Story 008, Story 009
