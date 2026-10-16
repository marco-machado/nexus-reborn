# Story 007: Same seed builds the same mission; brief and deploy agree

> **Epic**: Tactical mission
> **Status**: In Progress
> **Layer**: Feature
> **Type**: Integration
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-16

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
- Guardrail: Memory — 96×96 walk grid plus unit list; `generateCity` at mission create; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/tactical-mission.md`, scoped to this story:*

- [ ] **7.** **GIVEN** the same mission seed, **WHEN** the district, weather script, and Opening hour are built twice, **THEN** both builds match: same district, same weather script, same Opening hour.
- [ ] **8.** **GIVEN** a selected contract’s brief and the deployed mission from that seed, **WHEN** insertion, sequential objectives, extraction, force/civilian counts, Opening hour, and weather-front timing are compared, **THEN** brief and deploy agree on all six. A mismatch is a Tactical/brief bug, not a sample of generated coverage.
- [ ] **R5-a.** *(Story criterion so the AC 7 test can fail; not a GDD AC.)* **GIVEN** two different mission seeds, **WHEN** the district is built from each, **THEN** the two districts differ.
- [ ] **R5-b.** *(GDD Edge Case: unrest > 20.)* **GIVEN** a contract in a sector with unrest above 20, **WHEN** the brief and the deployed mission are compared, **THEN** both include the extra 6 civilians and 1 street patrol, and their force and civilian counts agree.
- [ ] **R5-c.** *(GDD rule 19, Difficulty extras.)* **GIVEN** a contract on Hardened, **WHEN** the brief and the deployed mission are compared, **THEN** both include the Hardened extra street patrols and civilians, and their force and civilian counts agree.

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- District, weather script, Opening hour, and objectives share one seed and one unsaved lifetime.
- A brief/deploy mismatch on insertion, sequential objectives, extraction, force/civilian counts, Opening hour, or weather-front timing is a Tactical/brief bug.
- Performance: no performance impact expected — the city is generated once per mission in createWorld (src/game/world.ts:203) and once for the brief map (src/ui/briefMap.ts:120); the story checks they agree. No per-frame work.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 008: weather tuning values.
- Story 009: Opening hour has no mechanical effect.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-008-2026-10-16.md` (2026-10-16).*

#### TM-007 — Same seed builds the same mission; brief and deploy agree (Integration)
**Test file**: `src/world/citygen.test.ts` (or `src/game/world.test.ts`) and `src/game/missionParams.test.ts`
**What to test**:
- AC 7: two builds from one seed produce equal district (walk grid, road rects, spawns), weather script and Opening hour
- AC 8: brief params vs the created world agree on insertion, objective sequence, extraction, force/civilian counts, Opening hour and weather-front time
**Extra criteria (R-5)** (promoted to acceptance criteria R5-a onward, 2026-10-16): a different seed changes the district (the test can fail); unrest > 20 extras (+6 civilians, +1 street patrol) appear in both brief and deploy; Hardened extras appear in both
**Mutation check**: seed `generateCity` from `Math.random` once → AC 7 fails
**Estimated test count**: ~4

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
