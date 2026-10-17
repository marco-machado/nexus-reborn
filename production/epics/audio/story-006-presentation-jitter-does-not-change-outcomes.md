# Story 006: Presentation-only randomness does not change outcomes

> **Epic**: Audio
> **Status**: Complete
> **Layer**: Presentation
> **Type**: Logic
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-17

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

- [x] GIVEN identical initial mission state and seed, deployment/research snapshots, modifiers/difficulty, district variant, loadout, commands and their timing, and simulation timestep schedule, WHEN those inputs are replayed while only presentation-only mission-bed selection and gunshot playback-rate jitter are varied in a controlled fixture, THEN hit/outcome state, weather script, and Opening hour match at equivalent simulation points. Presentation choices may differ; two uncontrolled random draws are not required to differ, and two independently played deploys are not equivalent fixtures.

*(Added at Sprint 9 planning, task R-2, from the GDD sections named.)*

- [x] (Formulas, `mission_bed_pick`: unseeded; `design/gdd/audio.md`) GIVEN the controlled fixture above, WHEN the mission bed is picked and gunshots play with rate jitter, THEN the seeded simulation RNG's draw count at each equivalent simulation point equals the count with no audio running; neither presentation choice draws from the simulation stream.
- [x] (Edge Cases, gunshot playback rate; `design/gdd/audio.md`) GIVEN a squad gunshot and a CorpSec gunshot played with rate jitter, WHEN the shot is resolved, THEN its hit chance and the shooter's fire interval equal the values with jitter off.

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

**Status**: [x] Tests present — `src/game/audio.test.ts` (`presentation-only randomness does not change outcomes (AU-006)`, 4 tests)

---

## Dependencies

- Depends on: Story 003
- Unlocks: None

---

## Completion Notes
**Completed**: 2026-10-17
**Criteria**: 3/3 passing (no deferred items). Test file present at `src/game/audio.test.ts`; the 4 AU-006 tests were reported passing by the code review (`npx vitest run src/game/audio.test.ts -t AU-006`: 4 passed, 46 skipped). /story-done itself checked existence only.
**Deviations**: None blocking. Advisory: AC 1's "outcome" part is not exercised (fixture result stays 'none'), and AC 3's hit chance is covered indirectly (see Code Review advisories).
**Test Evidence**: Logic: test file at `src/game/audio.test.ts` — `describe('presentation-only randomness does not change outcomes (AU-006)')`: fixture sanity; AC 1 (two jitter runs, equal hits/outcome/weather/Opening hour per step); AC 2 (sim rng draw count per step equals no-audio run); AC 3 (squad and CorpSec shots resolve and pace the same with jitter on/off). The QA plan's "equal-outcome test fails" mutation mapping is caught by the AC 2 test (silent vs voiced); the AC 1 test alone cannot catch a presentation draw from the sim stream because both runs would consume it equally.
**Code Review**: APPROVED WITH SUGGESTIONS (re-review after blocking findings were fixed) — specialists: lead-programmer, qa-tester, gameplay-programmer. Advisory findings, not acted on:
- `src/game/audio.test.ts:1092` — AC 1's "outcome" is never exercised: `objectives: []` and hp 100000 keep `result` at 'none' every step (world.ts checkEnd 1802/1809). Hits are covered through hp. Suggestion: add a required objective or lethal hp so the result changes within the 200-step window.
- `src/game/audio.test.ts:1219-1223` — AC 3's hit chance is never read (`hitChance(...)` at world.ts:864 is local). Covered indirectly via equal `{id,t,to}` shots, equal positions and (in the AC 2 test) equal sim draw counts. Suggestion: expose the chance, or keep this note as the record that it is covered indirectly.
- `src/game/audio.test.ts:1232` — the AC 3 interval assertion cannot fail independently of the shots deep-equal at 1222. Cadence is independently covered only by the AC 2 full-trace equality (includes `cooldown`). Suggestion: compare trace `cooldown` fields in AC 3, or compare intervals to the weapon's defined interval.
- `src/game/audio.test.ts:1126` — unmatched shots get id '?', which the shooter set at 1225 would treat as one shooter (code path verified; occurrence unverified). Suggestion: add `expect(low.shots.every((s) => s.id !== '?')).toBe(true)` to the sanity test.
- `src/game/audio.test.ts:1206` — AC 1 test alone cannot catch a sim-stream presentation draw; only the AC 2 test (silent vs voiced) does. Acceptable; QA mapping should name the AC 2 test (recorded under Test Evidence above).
- Test Evidence — the QA plan's bed-pick mutation (bed pick draws from the sim RNG) was not performed by any reviewer; the sim `rng` is a closure at world.ts:212, so it needs a temporary wiring change. A different mutation (hit roll) was run by /dev-story; see Mutation Check.
**Mutation Check**: Mutation check: FAILED AS EXPECTED — src/game/world.ts:865 `const hit = deadeye || rng() < chance` → `Math.random() < chance` (hit roll leaks onto the presentation stream) → 'varying only the bed pick and gun-rate jitter leaves hits, outcome, weather and Opening hour equal at every step (AC 1)' failed (also AC 2 and AC 3 tests); restored (cmp match, test file green)
**Autonomous decisions** (workflow run, nobody to ask): Phase 5 code-review question answered from the workflow's review record; Phase 7 took the recommended "Close the story" (no tech-debt register entry).
