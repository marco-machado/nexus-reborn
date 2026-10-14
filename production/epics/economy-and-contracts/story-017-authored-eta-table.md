# Story 017: Authored ETA table

> **Epic**: Economy and contracts
> **Status**: Complete
> **Layer**: Core
> **Type**: Logic
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-14

## Context

**GDD**: `design/gdd/economy-and-contracts.md`
**Requirement**: `TR-economy-003`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0001: Two clocks, never both  
**Secondary ADRs**: ADR-0003: Authored and generated contracts are the same kind of work
**ADR Decision Summary**: Strategic and tactical clocks are independent; a win spends the contract ETA as strategic days, a loss spends none.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Core Layer Rules, manifest 2026-10-08).
- Forbidden: Falling back to the generated threat map for authored contracts.
- Guardrail: Credits refuse is an identity no-op; one key compare and one pricing pass per Debrief; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/economy-and-contracts.md`, scoped to this story:*

- [x] GIVEN Glass Veil, WHEN its ETA is read, THEN ETA = 2 days (authored table, not the generated threat map).
- [x] GIVEN Hollow Crown, THEN ETA = 4 days (not generated High 3).
- [x] GIVEN Rust Haven, THEN ETA = 3 days (not generated Moderate 2).

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- Authored contracts use the authored `etaDays` on `MISSIONS` in `src/game/data.ts`; generated contracts use the threat map `CONTRACT_ETA_DAYS` in `src/game/contracts.ts`. *(Corrected at /story-done 2026-10-14: the earlier text named `contracts.ts` as the authored table's home.)*

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 016: generated ETA.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-004-2026-10-14.md` (Sprint 4). Type: Logic.*

**Test file**: `src/game/contracts.test.ts` *(corrected at /story-done 2026-10-14 to match Test Evidence; the plan named `data.test.ts`)*

**What to test**:
- Glass Veil = 2, Hollow Crown = 4, Rust Haven = 3 days
- Each differs from the generated value for its apparent threat

**Edge cases**: The authored table does not import `CONTRACT_ETA_DAYS`.

**Existing coverage / gap**: `data.test.ts` asserts `etaDays > 0` only; values live in `src/game/data.ts`.

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/game/contracts.test.ts`. — must exist and pass.

**Status**: [x] Created — `src/game/contracts.test.ts`, describe 'authored ETA table (story 017)'

---

## Dependencies

- Depends on: None
- Unlocks: None

---

## Completion Notes
**Completed**: 2026-10-14
**Criteria**: 3/3 passing (no deferred items)
**Deviations**: None against GDD/ADR. Advisory story-doc fixes applied: Implementation Notes named `src/game/contracts.ts` as the authored table's home (it is `MISSIONS` in `src/game/data.ts`); QA Test Cases named `src/game/data.test.ts` while Test Evidence required `src/game/contracts.test.ts` — both aligned to the actual location.
**Test Evidence**: Logic: test file at `src/game/contracts.test.ts` (describe 'authored ETA table (story 017)'). `npx vitest run src/game/contracts.test.ts` run at /story-done: 62/62 passed.
**Run result**: N/A — the story changes only a test file and static mission data read by tests; nothing new renders on screen.
**Code Review**: Ran (/code-review in the implement-stories workflow) — verdict NOT ASSESSED: the lead-programmer and qa-tester specialist sub-reviews could not be spawned (no Agent tool in the subagent). All other phases clean: ADR Compliance COMPLIANT (ADR-0001, ADR-0003), Standards 6/6, Architecture CLEAN, SOLID COMPLIANT, Testability TESTABLE; would otherwise be APPROVED WITH SUGGESTIONS. A run with agent access, or an owner decision to accept this review in its place, is still needed before it counts as an approval.
**QA gate**: QL-TEST-COVERAGE skipped — Lean mode.
**Autonomous decisions** (automation: autonomous): Phase 5 lean code-review question answered "Yes — /code-review ran" with the NOT ASSESSED result above; Phase 7 took "Close the story (Recommended)".

**Advisory findings from code review**:
- Process gap, not a code defect: Phase 7 specialist reviews (lead-programmer, qa-tester) did not run; verdict NOT ASSESSED rather than approval.
- Verified: all 3 ACs covered and passing — Glass Veil=2 (SEVERE), Hollow Crown=4 (HIGH), Rust Haven=3 (MODERATE) asserted against `MISSIONS` in `src/game/data.ts` (lines 135/173/230), each also asserted to differ from the generated `CONTRACT_ETA_DAYS` value (`src/game/contracts.ts:150`) read through `rollContract` + `contractMission`. Values match GDD `design/gdd/economy-and-contracts.md` rule 9.
- Story doc inaccuracy (Implementation Notes path) — corrected above.
- Story doc inconsistency (QA Test Cases vs Test Evidence file) — corrected above.
- QA edge case "The authored table does not import `CONTRACT_ETA_DAYS`" has no test assertion; it holds by construction (`CONTRACT_ETA_DAYS` is a non-exported `const`; `src/game/data.ts` imports only `./atlas` and `./types`). An optional import-guard test would pin it. Untested edge case: recommend a follow-up if wanted.
- Test design note: the `generatedEta` helper uses fixed sector fixtures (eu/af/oc) keyed by threat and asserts the rolled threat inside the helper; deterministic (seed 0x1234). The 'every authored contract' loop scales if `MISSIONS` grows.
