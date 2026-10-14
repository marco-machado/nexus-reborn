# Story 018: Generated expiry windows and Expedite extension

> **Epic**: Economy and contracts
> **Status**: Complete
> **Layer**: Core
> **Type**: Logic
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-14

## Context

**GDD**: `design/gdd/economy-and-contracts.md`
**Requirement**: `TR-economy-006`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0012: Store placement for Intel and generated contracts  
**Secondary ADRs**: ADR-0018: Catch-up collision order
**ADR Decision Summary**: Owner is not the Zustand module: Intel lives on campaignStore, generated contracts on worldStore; no economyStore.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Core Layer Rules, manifest 2026-10-08).
- Forbidden: Expedite writing Intel.
- Guardrail: Credits refuse is an identity no-op; one key compare and one pricing pass per Debrief; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/economy-and-contracts.md`, scoped to this story:*

- [x] GIVEN a new generated offer that is not initially priority, THEN its expiry is 24–48 strategic hours.
- [x] GIVEN a new generated offer that is initially priority, THEN its expiry is 8–16 strategic hours.
- [x] GIVEN a generated offer with expiry E, WHEN Expedite is applied, THEN expiry = E + 24 strategic hours.

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- Expiry fires through `advanceFlow` (expiry is first in the collision order). Expedite does not write Intel.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 015: Reward unchanged by Expedite.
- Story 020: removal on expiry.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-004-2026-10-14.md` (Sprint 4). Type: Logic.*

**Test file**: `src/game/contracts.test.ts`, `src/state/worldStore.test.ts`

**What to test**:
- Expiry - createdT inside 24-48 h (regular) and 8-16 h (priority)
- Expedite adds exactly 24 h

**Edge cases**: Both ends of each window; Expedite writes no Intel.

**Existing coverage / gap**: Bounds are likely covered (`contracts.test.ts` ~L88, L113; `worldStore.test.ts` ~L362, L427); confirm exactness.

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/game/contracts.test.ts`, `src/state/worldStore.test.ts`. — must exist and pass.

**Status**: [x] Created — `src/game/contracts.test.ts` (describe 'generated expiry windows (story 018)'), `src/state/worldStore.test.ts` (describe 'Expedite expiry extension (story 018)')

---

## Dependencies

- Depends on: Story 014
- Unlocks: Story 020

---

## Completion Notes
**Completed**: 2026-10-14
**Criteria**: 3/3 passing (none deferred)
**Deviations**: None
**Test Evidence**: Logic: test files present at `src/game/contracts.test.ts` and `src/state/worldStore.test.ts`; both run green in this review (191/191, `npx vitest run` on the two files).
**Run result**: N/A — the change is a pure-TS helper (`contractLifeSec`) and tests; no acceptance criterion names anything on screen and no UI file changed.
**Code Review**: Complete — /code-review ran in the implement-stories workflow. Verdict: NOT ASSESSED (lead-programmer and qa-tester reviews could not be started: the reviewing subagent had no Agent tool). Everything else was reviewed by hand with no code defects found (ADR-0012 and ADR-0018 compliant, 191/191 tests pass, `tsc -b` clean). Lean mode: QL-TEST-COVERAGE skipped; LP-CODE-REVIEW replaced by the /code-review question (autonomous run, answered "Yes — /code-review ran" with the result above).

**Traceability**:
| Criterion | Test | Status |
|-----------|------|--------|
| AC-1: regular offer expiry 24-48 h | `src/game/contracts.test.ts` — 'a regular offer stands 24 h at the low end and 48 h at the high end', 'every rolled regular offer expires 24-48 strategic hours after creation' | COVERED |
| AC-2: priority offer expiry 8-16 h | `src/game/contracts.test.ts` — 'an initially priority offer stands 8 h ... 16 h ...', 'every rolled priority offer expires 8-16 strategic hours after creation' | COVERED |
| AC-3: Expedite sets expiry to E + 24 h | `src/state/worldStore.test.ts` — 'moves expiry from E to exactly E + 24 strategic hours and writes no Intel'; `src/game/contracts.test.ts` — 'the Expedite extension is exactly 24 strategic hours' | COVERED |

**Advisory findings (from /code-review)**:
- Process gap: project.yaml sets engine 'Web' and specialists.code 'lead-programmer'; Logic stories need that reviewer plus qa-tester, and neither could run (no Agent tool). The reviewer did their checks by hand: test hooks exported (`contractLifeSec`, `EXPEDITE_EXTENSION_SEC`), every QA case maps to a test, both window ends and 'Expedite writes no Intel' covered. Re-run /code-review where Agent is available if NOT ASSESSED must be cleared.
- Determinism preserved: `finishContract` in `src/game/contracts.ts` still takes the seed draw first, then one life draw passed to `contractLifeSec(priority, next(rng))`; `Math.round` moved inside the helper, so `expiresAtT = t + life` yields the same numbers. RNG order unchanged.
- ADR-0012 compliant: Expedite (`src/state/worldStore.ts:929`) changes only worldStore contracts (`expedited` + `EXPEDITE_EXTENSION_SEC`); the new worldStore test confirms campaignStore `intelLevel`/`intelProgress` untouched and `createdT` kept.
- Story file had ACs unchecked and Test Evidence '[ ] Not yet created' — updated by this /story-done.
- `src/game/contracts.test.ts` regular-window test asserts `priority === false` on every `rollMany(300)` offer; it relies on the default fixture never rolling a priority offer. Consider filtering on priority instead of asserting it.
- `src/game/contracts.test.ts` imports `EXPEDITE_EXTENSION_SEC` from './influence' below the './world' import, apart from the other ./ game-module imports. Cosmetic only.
