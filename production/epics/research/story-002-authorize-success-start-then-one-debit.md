# Story 002: Authorize success: start, then one debit

> **Epic**: Research
> **Status**: Ready
> **Layer**: Core
> **Type**: Logic
> **Estimate**: 0.5 d
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
- Guardrail: Credits refuse is an identity no-op; no per-frame work; no per-frame React state (CLAUDE.md).

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

- **Decided 2026-10-14 (owner, retro task R-5):** the production authorize command is `appStore.authorizeResearch(node, t)` in `src/state/appStore.ts` (ADR-0013 amended; `design/gdd/research.md` Core Rule 3 updated). Tests go in `src/state/appStore.test.ts`.

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 003: refusal and undo paths.
- Story 007: `endT`.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-005-2026-10-14.md` (Sprint 5). Type: Logic.*

**Automated**: `src/state/appStore.test.ts`.
- All three labs authorized from idle: 3 running, 1 active each
- Advanced Propellants at 16,000 CR with C = 16,000 and C = 20,000: `start` once, `spendCredits(16000)` once, no `addCredits`, Credits C − 16,000
- Non-positive cost returns before `start`: lab idle, project available, Credits unchanged
- Edge: Exact balance and surplus boundaries
- Edge: Non-finite cost treated like non-positive

**Gap**: Spy counts on `start`/`spendCredits`/`addCredits`; the GDD's post-spend re-read. Blocked on retro task R-5 (which module owns authorize).

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
