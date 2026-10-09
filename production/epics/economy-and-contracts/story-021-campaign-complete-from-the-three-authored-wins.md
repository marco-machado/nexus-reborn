# Story 021: Campaign-complete from the three authored wins

> **Epic**: Economy and contracts
> **Status**: Ready
> **Layer**: Core
> **Type**: Logic
> **Estimate**: —
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/economy-and-contracts.md`
**Requirement**: `TR-economy-003`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0003: Authored and generated contracts are the same kind of work  
**Secondary ADRs**: ADR-0020: Campaign fail flags
**ADR Decision Summary**: One contract kind and one brief → assembly → mission → debrief pipeline for authored and generated work.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Core Layer Rules, manifest 2026-10-08).
- Forbidden: A second completion rule for generated work.
- Guardrail: Credits refuse is an identity no-op; one key compare and one pricing pass per Debrief; no per-frame React state (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/economy-and-contracts.md`, scoped to this story:*

- [ ] GIVEN exactly two authored contracts won, WHEN campaign-complete is read, THEN it is false.
- [ ] GIVEN Glass Veil, Hollow Crown and Rust Haven all won, THEN campaign-complete is true.
- [ ] GIVEN all three won, WHEN instances are read, THEN all three remain selectable.

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- Winning all three authored contracts marks the campaign complete; they stay replayable. Generated wins do not mark complete.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- World Network epic Story 018/019: banners and failed flags.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/state/campaignStore.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 004
- Unlocks: None
