# Story 003: Authorize when Economy refuses or start() fails

> **Epic**: Research
> **Status**: Ready
> **Layer**: Core
> **Type**: Logic
> **Estimate**: —
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/research.md`
**Requirement**: `TR-research-005`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0013: Credits never overdraw
**ADR Decision Summary**: Credits never go negative; refusal is an identity no-op; exact-balance spend is allowed.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Core Layer Rules, manifest 2026-10-08).
- Forbidden: A Cancel/Stop/Abort-project API.
- Forbidden: Refunding with `addCredits`.
- Guardrail: Credits refuse is an identity no-op; no per-frame work; no per-frame React state (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/research.md`, scoped to this story:*

- [ ] GIVEN the production authorize command is invoked for available Advanced Propellants on an idle Ballistics lab while Economy will refuse the 16,000 CR spend, WHEN it returns (ignoring any disabled control), THEN `start()` is not called, Ballistics stays idle, and the project stays available.
- [ ] GIVEN `start()` returns true and `spendCredits` leaves the post-spend Credits read equal to C, which is unequal to C − 16,000, WHEN authorize returns, THEN `start()` was called before return, `spendCredits` was called once, Credits were re-read in the same command after `spendCredits`, the lab is idle, the project is available, Credits still equal C, and `addCredits` and `setState({ credits })` were not called. An early return that never called `start()` is not a pass. The undo is internal, not a Cancel API.
- [ ] GIVEN Credits at least the cost, WHEN authorize calls `start()` and it returns false, THEN `spendCredits` is not called, Credits are unchanged, the lab stays idle, and the project stays available.

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- The undo is internal to authorize (release the occupancy); do not add a public cancel/stop/abort export.
- The visible sentence says Credits did not change and the lab was not occupied. 'No reason enum' is a static source check (no exported reason enum or type), not a runtime assertion.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 002: success path.
- Story 005: refusal copy.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/game/research.test.ts`, `src/state/researchStore.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 002
- Unlocks: Story 005
