# Story 008: Weather retunes CorpSec sight and weapon noise only

> **Epic**: Tactical mission
> **Status**: Complete
> **Layer**: Feature
> **Type**: Logic
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-16

## Context

**GDD**: `design/gdd/tactical-mission.md`
**Requirement**: `TR-tactical-003`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0006: Weather is a script, not a roll mid-fight  
**Secondary ADRs**: ADR-0016: Tactical sim contract
**ADR Decision Summary**: Weather is fixed at mission create: at most one adjacent-intensity change at a set tactical time; rain only shortens CorpSec sight and quiets weapons.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript simulation logic in `src/game/`; no post-cutoff three.js or r3f API involved (ADR Engine Compatibility: Post-Cutoff APIs Used — None).

**Control Manifest Rules (this layer)**:
- Required: Rain only shortens CorpSec sight and quiets weapons; a mission may change weather once, to an adjacent intensity, at a tactical time fixed at create.
- Forbidden: Never play-driven weather; never an unscripted mid-mission weather roll.
- Guardrail: Memory — 96×96 walk grid plus unit list; `generateCity` at mission create; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/tactical-mission.md`, scoped to this story:*

- [x] **9a.** **GIVEN** Standard difficulty and live weather none vs light vs heavy, **WHEN** CorpSec cone range is read, **THEN** it is 14 / 12.6 / 11.2 m respectively.
- [x] **9b.** **GIVEN** the same Standard deployments, **WHEN** accuracy, movement, and omni notice are read, **THEN** accuracy and movement equal the clear-weather values and omni notice is 4.5 m.
- [x] **9c.** **GIVEN** a scripted front at its fixed tactical time, **WHEN** the front hits, **THEN** live sight retunes, weapon-noise radius strictly decreases as rain intensity increases (do not paste `noiseMul`), a comm-log line is written, and accuracy / movement / 4.5 m notice do not change.

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- Accuracy, movement, and the 4.5 m omni notice do not change with weather.
- Assert that noise radius strictly decreases with rain intensity; do not paste `noiseMul` (code-owned, GDD OQ7).
- Performance: no performance impact expected — the weather front retunes sight and noise once in applyWeatherFront (src/game/world.ts:1967); after that the per-tick cost is one `frontLogged` flag check. No new per-frame work.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 015: Hardened +1 m vision.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-008-2026-10-16.md` (2026-10-16).*

#### TM-008 — Weather retunes CorpSec sight and weapon noise only (Logic)
**Test file**: `src/game/world.test.ts` (`weather front`)
**What to test**:
- AC 9a: Standard cone range 14 / 12.6 / 11.2 m for none / light / heavy (literals)
- AC 9b: accuracy and movement equal clear-weather values; omni notice 4.5 m
- AC 9c: at the scripted front time: sight retunes, weapon-noise radius strictly decreases as rain increases (compare radii, do not paste `noiseMul`), a comm-log line appears, accuracy / movement / 4.5 m unchanged
**Edge cases**: Hardened light rain 13.6 m (+1 m after weather); front from heavy to light (sight rises)
**Mutation check**: apply the rain multiplier to accuracy → AC 9b fails
**Estimated test count**: ~5

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/game/world.test.ts`. — must exist and pass.

**Status**: [x] Created — `src/game/world.test.ts` (`Weather retunes CorpSec sight and weapon noise only (TM-008, AC 9a / 9b / 9c)`, 7 tests)

---

## Dependencies

- Depends on: Story 007
- Unlocks: None

---

## Completion Notes
**Completed**: 2026-10-16
**Criteria**: 3/3 passing (9a, 9b, 9c), each covered by an automated test in the TM-008 describe block; none deferred
**Deviations**: None blocking. Scope: only `src/game/world.test.ts` changed (no source change); `src/game/world.ts` has no working-tree diff.
**Test Evidence**: Logic: test file at `src/game/world.test.ts` (`describe('Weather retunes CorpSec sight and weapon noise only (TM-008, AC 9a / 9b / 9c)')`, 7 tests). Code review re-ran `npx vitest run src/game/world.test.ts -t "TM-008"`: 7 passed, 126 skipped.
**Run result**: N/A — sim-only Logic story; no player-visible surface changed (test-only, no source change)
**Code Review**: APPROVED WITH SUGGESTIONS — specialists: lead-programmer, qa-tester, gameplay-programmer (lead-programmer engine result CLEAN; ADR-0006 COMPLIANT; Standards 6/6; Architecture CLEAN; SOLID COMPLIANT). Blocking findings were fixed and re-reviewed before this close.
**Mutation Check**: Mutation check: FAILED AS EXPECTED — src/game/world.ts:1272 enemy accuracy multiplied by mods.visionMul (rain multiplier applied to accuracy) → "accuracy and movement match clear weather; omni notice is 4.5 m in every weather (AC 9b)" failed; restored (cmp match, test file green)

**Advisory findings from /code-review (not fixed in this story):**
- Test Evidence line said 6 tests; the describe block has 7 `it` cases. Corrected to 7 in this close.
- `src/game/world.test.ts:3221` — the CorpSec half of "movement unchanged" compares only the static `speed` field on guards that are already dead; weather scaling applied to guard movement at move time would still pass. Only operative a1's walk is checked through behaviour. Whether AC 9b's "movement" covers CorpSec movement is not spelled out in the story (owner question).
- `src/game/world.test.ts:3197` — the duel helper writes the sim-internal `awareness` field through a cast (declared only at `src/game/world.ts:168`, not in `src/game/types.ts`). A rename would make the write a silent no-op while the test keeps passing. Consider a typed test hook.
- `src/game/world.test.ts:3233` — the Hardened light-rain 13.6 m test sits partly in Story 015's scope (Out of Scope lists Hardened +1 m vision), though this story's QA Test Cases list it as an edge case. The `describe('hardened difficulty')` test at line 1723 already covers the formula. Documentation question, not a defect.
- `src/game/world.test.ts:3108` — `g.patrol!.length = 0` uses a non-null assertion; a kept trooper with no patrol would crash every TM-008 test with a TypeError. Suggest `g.patrol?.splice(0)`. Not checked whether any seed spawns such a trooper.
- Partly refuted: no TM-008-local test covers Hardened +1 m re-added when a front hits (`src/game/world.ts:1975`), but the full suite covers it (`world.test.ts:1723-1737`). Optional TM-008-local case.
- The review did not itself run the QA plan's mutation check (read-only); it was run in /dev-story — see Mutation Check above.

**Autonomous decisions (logged):** Phase 5 specialist-review answer taken from the workflow's code-review record; Phase 7 took the recommended "Close the story" option (verdict COMPLETE WITH NOTES); tech-debt register not updated.
- 2026-10-19 (Sprint 9 R-7, retro 8 action 5): boxes 9a, 9b and 9c ticked. Re-run: `npx vitest run src/game/world.test.ts -t "TM-008"` 7 passed. The owner question on whether 9b's "movement" covers CorpSec movement (note above) is unchanged.
