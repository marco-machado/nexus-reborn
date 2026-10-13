# Story 008: Influence wallet income from the outcome DTO

> **Epic**: World Network
> **Status**: Complete
> **Layer**: Foundation
> **Type**: Logic
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-12

## Context

**GDD**: `design/gdd/world-network.md`
**Requirement**: `TR-world-network-005`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0008: Influence is a wallet; tax is Nexus income  
**Secondary ADRs**: ADR-0004: A won contract does not pay twice
**ADR Decision Summary**: Influence is the points spent on Stabilize, Lobby and Expedite; Tax yield pays only from held sectors.
**ADR Version**: 2026-08-23 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Foundation Layer Rules, manifest 2026-10-08).
- Forbidden: An Influence index / standing bar derived from Control.
- Guardrail: catch-up CPU proportional to dues inside the jumped span; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/world-network.md`, scoped to this story:*

- [x] GIVEN a new campaign, WHEN Influence is read, THEN it is 0.
- [x] GIVEN Influence 0, a non-quiet win, `civiliansHit ≥ 1`, WHEN World Network applies the outcome DTO, THEN Influence = 6.
- [x] GIVEN Influence 0, a non-quiet win, `civiliansHit = 0`, WHEN World Network applies the outcome DTO, THEN Influence = 8.
- [x] GIVEN Influence I, a loss, WHEN World Network applies the outcome DTO, THEN Influence = I.

---

## Implementation Notes

*Derived from the governing ADRs and the Foundation Layer Rules:*

- Influence is a spendable wallet — points, not an index or standing bar, and not an average of Control.
- Tax yield pays Nexus income; Influence never does.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 009/010: spending Influence.

---

## QA Test Cases

From `/qa-plan` sprint 2 (2026-10-12). Logic. Files: `src/game/influence.test.ts`, `src/state/worldStore.test.ts`.

- A new campaign reads Influence 0.
- Influence 0, non-quiet win, `civiliansHit ≥ 1` applies to 6. `civiliansHit = 2` is still 6.
- Influence 0, non-quiet win, `civiliansHit = 0` applies to 8.
- Influence I on a loss stays I. I = 0 stays 0.
- The award is a delta: Influence 3 and a non-quiet dirty win ends at 9.
- Quiet-replay income and spending are out of this story.

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/game/influence.test.ts`, `src/state/worldStore.test.ts`. — must exist and pass.

**Status**: [x] Created — `src/game/influence.test.ts`, `src/state/worldStore.test.ts`

---

## Dependencies

- Depends on: Story 003
- Unlocks: Story 009, Story 017

## Completion Notes
**Completed**: 2026-10-12
**Criteria**: 4/4 passing, each covered by a test in `src/state/worldStore.test.ts`
**Deviations**: None. Income logic already existed in `applyMissionResult`; this story added tests only.
**Test Evidence**: Logic: `src/state/worldStore.test.ts` (5 new tests), `src/game/influence.test.ts` (1 new test); 113 tests pass, `tsc -b` clean
**Code Review**: Complete (`/code-review` 2026-10-12: APPROVED)
