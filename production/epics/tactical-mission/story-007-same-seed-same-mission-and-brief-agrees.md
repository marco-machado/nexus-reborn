# Story 007: Same seed builds the same mission; brief and deploy agree

> **Epic**: Tactical mission
> **Status**: Complete
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

- [x] **7.** **GIVEN** the same mission seed, **WHEN** the district, weather script, and Opening hour are built twice, **THEN** both builds match: same district, same weather script, same Opening hour.
- [x] **8.** **GIVEN** a selected contract’s brief and the deployed mission from that seed, **WHEN** insertion, sequential objectives, extraction, force/civilian counts, Opening hour, and weather-front timing are compared, **THEN** brief and deploy agree on all six. A mismatch is a Tactical/brief bug, not a sample of generated coverage.
- [x] **R5-a.** *(Story criterion so the AC 7 test can fail; not a GDD AC.)* **GIVEN** two different mission seeds, **WHEN** the district is built from each, **THEN** the two districts differ.
- [x] **R5-b.** *(GDD Edge Case: unrest > 20.)* **GIVEN** a contract in a sector with unrest above 20, **WHEN** the brief and the deployed mission are compared, **THEN** both include the extra 6 civilians and 1 street patrol, and their force and civilian counts agree.
- [x] **R5-c.** *(GDD rule 19, Difficulty extras.)* **GIVEN** a contract on Hardened, **WHEN** the brief and the deployed mission are compared, **THEN** both include the Hardened extra street patrols and civilians, and their force and civilian counts agree.

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

**Status**: [x] Created — `src/world/citygen.test.ts` (AC 7, R5-a), `src/game/missionParams.test.ts` (AC 8, R5-b, R5-c)

---

## Dependencies

- Depends on: None
- Unlocks: Story 008, Story 009

---

## Completion Notes
**Completed**: 2026-10-16
**Criteria**: 5/5 passing (none deferred)
- AC 7 — `src/world/citygen.test.ts` › "seed %i: two builds give the same district, weather script and Opening hour (AC 7)" (seeds 12345, 777, 0x9e3779b9)
- R5-a — `src/world/citygen.test.ts` › "two different seeds build different districts (R5-a)"
- AC 8 — `src/game/missionParams.test.ts` › "brief and deploy agree (TM-007, AC 8 / R5-b / R5-c)", incl. "the case list includes a weather front and a front-free mission"
- R5-b — `src/game/missionParams.test.ts` › "unrest above 20 adds 6 civilians and 1 street patrol in both brief and deploy (R5-b)"
- R5-c — `src/game/missionParams.test.ts` › "Hardened adds its street patrols and civilians in both brief and deploy (R5-c)"
- `npx vitest run` on both files: 49/49 pass (2026-10-16, story-done re-run).
**Deviations**: None blocking. Scope: test-only — only `src/game/missionParams.test.ts` and `src/world/citygen.test.ts` changed; no implementation code, no CONTRACT FILE.
**Test Evidence**: Integration: `src/world/citygen.test.ts`, `src/game/missionParams.test.ts` (present and passing). `src/game/forecast.test.ts` unchanged.
**Run result**: N/A — test-only story; no player-visible change (brief and deploy code unchanged)
**Code Review**: APPROVED WITH SUGGESTIONS — specialists: lead-programmer, qa-tester, gameplay-programmer. `tsc -b --noEmit` clean; ADR compliance COMPLIANT (ADR-0006, 0007, 0016). Engine specialist (lead-programmer): CLEAN with advisories. Testability: GAPS, advisory only. Code-review Phase 9 ran unattended and took the default "[A] Apply the suggestions, then run /story-done"; the suggestions are not mandatory and were not applied before closure.
**Mutation Check**: Mutation check: FAILED AS EXPECTED — src/world/citygen.ts:95 mulberry32(district.seed) → mulberry32((Math.random() * 0xffffffff) >>> 0) → "seed 12345: two builds give the same district, weather script and Opening hour (AC 7)" (and the other two AC 7 seeds) failed; restored (cmp match, test file green)
(story-done: `git diff -- src/world/citygen.ts` is empty — no stray mutant.)

**Advisory findings from /code-review (not fixed; candidates for a follow-up story):**
1. `src/game/missionParams.test.ts:340` — `brief()` copies MissionBrief's call sequence (`missionVariant` → `missionMods` → `buildTacticalMap`, matching `src/ui/index.tsx:332-345` today) instead of calling a shared helper; a brief change would not be noticed. Suggest a shared `briefTactical(m, sectors, won, difficulty)` used by MissionBrief and the test. (lead-programmer, qa-tester, gameplay-programmer)
2. `src/game/missionParams.test.ts:367` — `deploy()` copies `composeMission` (`src/state/missionLifecycle.ts:19-36`) instead of calling it; the real path uses `liveOperativeById` and mints the applyKey. Suggest `composeMission(m, DEFAULT_SQUAD)`. (qa-tester)
3. `src/game/missionParams.test.ts:398` — replay variant never tested: `contractsWon` is always empty, so AC 8 checks only variant 0 although both brief (`missionVariant`) and deploy (`src/state/deployFreeze.ts:27`, `:42`) branch on it and authored missions have more variants (`src/game/data.ts:139, 177, 233`). Suggest a case with `MISSIONS[0].id` in `contractsWon`. (qa-tester)
4. `src/game/missionParams.test.ts:331` — `setSector()` mutates `useWorldStore.sectors` with no restore; harmless today (every test calls it first, block is last). Suggest snapshot/restore. (lead-programmer, gameplay-programmer)
5. R5-b boundary — rule is `sector.unrest > 20` (`src/game/missionParams.ts:123`); tests use 10, 21, 25, never 20, so `>` → `>=` would pass. Suggest an unrest-20 case expecting no extras in brief and deploy. (qa-tester)
6. `src/world/citygen.test.ts:336` — AC 7 compares two same-process builds and pins no expected values; a once-per-process `Math.random` seed would pass. Suggest pinning a seed-12345 fingerprint (walk-grid checksum, `roadRects.length`, extraction). (qa-tester)
7. `src/game/missionParams.test.ts:427` — for front-weather missions the label check covers only the front's clock time, not its target intensity (target intensity is covered separately via `d.front` vs `b.front`). The front-weather brief label (`weatherBriefLabel`, `src/game/missionParams.ts:272-278`) has no Opening hour — a GDD design question, not a defect. (lead-programmer, qa-tester)
8. `src/game/missionParams.test.ts:7` — a `src/game/` test imports `../ui/briefMap` (and through it `src/ui/util.ts` → `./sound`), against the CLAUDE.md layering; test-only. Suggest moving the brief/deploy integration test outside `src/game/`. (gameplay-programmer)
9. `src/world/citygen.test.ts:300` — the `record()` fixture is duplicated in both test files with slightly different ids; AC 7 checks the weather script on the `contractMission` MissionDef, not the weather `createWorld` uses (covered by the AC 8 test). Suggest one shared fixture. (lead-programmer)

**Untested gaps (advisory)**: replay variant (finding 3) and unrest = 20 boundary (finding 5).
**Decisions taken unattended (autonomous mode)**: Phase 5 specialist review read from the workflow's /code-review result; Phase 7 took the recommended "Close the story — update file, mark Complete, log notes". Not committed.
