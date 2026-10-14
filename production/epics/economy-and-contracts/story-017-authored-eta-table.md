# Story 017: Authored ETA table

> **Epic**: Economy and contracts
> **Status**: Ready
> **Layer**: Core
> **Type**: Logic
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

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

- [ ] GIVEN Glass Veil, WHEN its ETA is read, THEN ETA = 2 days (authored table, not the generated threat map).
- [ ] GIVEN Hollow Crown, THEN ETA = 4 days (not generated High 3).
- [ ] GIVEN Rust Haven, THEN ETA = 3 days (not generated Moderate 2).

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- Authored contracts use the authored table in `src/game/contracts.ts`; generated use the threat map.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 016: generated ETA.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-004-2026-10-14.md` (Sprint 4). Type: Logic.*

**Test file**: `src/game/data.test.ts`

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

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: None
- Unlocks: None
