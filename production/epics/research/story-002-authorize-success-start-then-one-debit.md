# Story 002: Authorize success: start, then one debit

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
**Secondary ADRs**: ADR-0005: Research is a program; bays wear blueprints
**ADR Decision Summary**: Credits never go negative; refusal is an identity no-op; exact-balance spend is allowed.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Core Layer Rules, manifest 2026-10-08).
- Forbidden: Spend-then-start ordering.
- Forbidden: `setState({ credits })` outside hydrate.
- Guardrail: Credits refuse is an identity no-op; no per-frame work; no per-frame React state (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/research.md`, scoped to this story:*

- [ ] GIVEN each lab idle and one available project per branch, WHEN all three are authorized, THEN exactly 3 labs run, 1 active each.
- [ ] GIVEN Advanced Propellants available, Ballistics idle, listed cost 16,000 CR, pre-spend Credits C ≥ 16,000 (both the exact-balance and the surplus boundary) and `start()` returns true, WHEN the production authorize command returns, THEN `start()` was called once, `spendCredits(16000)` once, `addCredits` not called, no second `spendCredits`, the project is active, the lab running, and post-command Credits = C − 16,000.
- [ ] GIVEN a non-positive listed cost, WHEN the production authorize command is invoked, THEN it returns before `start()`, Ballistics stays idle, the project stays available, Credits are unchanged, and `addCredits` was not called.

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- Production Research path: re-read credits; if short, return; `if (start(node, t)) spendCredits(cost)` — do not invert to spend-then-start. `researchStore.start` is occupancy only; Research has no Credits ledger.
- Credits debit the moment authorization succeeds; Economy owns the refuse.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 003: refusal and undo paths.
- Story 007: `endT`.

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

- Depends on: None
- Unlocks: Story 003, Story 007
