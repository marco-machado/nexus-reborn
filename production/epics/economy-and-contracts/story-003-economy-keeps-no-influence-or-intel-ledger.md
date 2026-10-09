# Story 003: Economy keeps no Influence or Intel ledger

> **Epic**: Economy and contracts
> **Status**: Ready
> **Layer**: Core
> **Type**: Logic
> **Estimate**: —
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/economy-and-contracts.md`
**Requirement**: `TR-economy-002`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0008: Influence is a wallet; tax is Nexus income
**ADR Decision Summary**: Influence is the points spent on Stabilize, Lobby and Expedite; Tax yield pays only from held sectors.
**ADR Version**: 2026-08-23 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Core Layer Rules, manifest 2026-10-08).
- Forbidden: Any Influence field or award in the Economy path.
- Guardrail: Credits refuse is an identity no-op; one key compare and one pricing pass per Debrief; no per-frame React state (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/economy-and-contracts.md`, scoped to this story:*

- [ ] GIVEN Influence I and Intel J and Economy apply only (World Network apply not run), WHEN Economy applies a payout, Tax deposit, research debit or hire debit, THEN Influence is still I and Intel is still J.
- [ ] GIVEN Economy Credits write only, WHEN a first non-quiet win payout is applied, THEN Influence stays 0.

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- Influence is owned by World Network; Economy never awards or stores it. Test the Economy apply path in isolation from `worldStore.applyMissionResult`.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- World Network epic Story 008 owns Influence income.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/state/appStore.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: None
- Unlocks: None
