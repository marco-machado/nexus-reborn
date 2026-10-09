# Story 002: Credits never overdraw: research and hire refusals

> **Epic**: Economy and contracts
> **Status**: Ready
> **Layer**: Core
> **Type**: Logic
> **Estimate**: —
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/economy-and-contracts.md`
**Requirement**: `TR-economy-001`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0013: Credits never overdraw
**ADR Decision Summary**: Credits never go negative; refusal is an identity no-op; exact-balance spend is allowed.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Core Layer Rules, manifest 2026-10-08).
- Forbidden: UI-only overdraft disable with a store that always subtracts.
- Forbidden: Clamping a negative Credits blob to 0 on hydrate.
- Guardrail: Credits refuse is an identity no-op; one key compare and one pricing pass per Debrief; no per-frame React state (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/economy-and-contracts.md`, scoped to this story:*

- [ ] GIVEN Credits 15,999 CR and a project listed at 16,000 CR, WHEN research is authorized, THEN it is refused, Credits stay 15,999 CR, and the project does not start.
- [ ] GIVEN Credits 15,999 CR and a candidate listed at 16,000 CR, WHEN hire is authorized, THEN it is refused, Credits stay 15,999 CR, and the roster is unchanged.
- [ ] GIVEN Credits 16,000 CR and a project listed at 16,000 CR, WHEN research is authorized, THEN it succeeds and Credits = 0 CR.
- [ ] GIVEN Credits equal to a candidate's hire cost 16,000 CR, WHEN hire is authorized, THEN it succeeds and Credits = 0 CR.

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- Production Research path: re-read credits; if short, return; `if (start(node, t)) spendCredits(cost)` — do not invert to spend-then-start. `researchStore.start` is occupancy only.
- `hireOperative` is check → `acceptHire` → decrement; it does not call `spendCredits`.
- Credits refuse is an identity no-op (no subscriber wake on no-change). Hydrate drop-alls if `!finite(credits) || credits < 0`; do not clamp to 0.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 001: ledger basics.
- Research and Roster epics own the project/candidate lists.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/state/appStore.test.ts`, `src/state/researchStore.test.ts`, `src/game/recruits.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 001
- Unlocks: None
