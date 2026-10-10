# Story 023: Hire refusals and success

> **Epic**: Roster and Assembly
> **Status**: Ready
> **Layer**: Feature
> **Type**: Logic
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/roster-and-assembly.md`
**Requirement**: `TR-roster-003`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0013: Credits never overdraw  
**ADR Decision Summary**: Credits never go negative; refusal is an identity no-op; exact-balance spend is allowed.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Feature Layer Rules, manifest 2026-10-08).
- Forbidden: Credits going negative; spend-then-refuse.
- Guardrail: no per-frame work; no per-frame React state (AGENTS.md); deterministic campaign RNG preserved.

---

## Acceptance Criteria

*From GDD `design/gdd/roster-and-assembly.md`, scoped to this story:*

- [ ] **GIVEN** living roster count = 8, **WHEN** hire is authorized, **THEN** hire is refused, living count stays 8, and Credits are unchanged. *(GDD AC 30)*
- [ ] **GIVEN** Credits below that candidate’s hire cost, **WHEN** hire is authorized, **THEN** the living roster is unchanged. *(GDD AC 31)*
- [ ] **GIVEN** living count ≤ 7 and hire succeeds, **WHEN** the new body is read, **THEN** living count increased by 1, the hire is Ready, and all 4 bays are unpinned wearing current issue. *(GDD AC 32)*
- [ ] **GIVEN** a non-failed campaign with 7 living operatives including an Assault, an offered Assault candidate whose id is distinct from every living operative, and Credits at least equal to that candidate’s hire cost, **WHEN** hire is authorized, **THEN** living count is 8, both Assault ids are present on the Roster, and the hired candidate’s id is absent from the offers. Post-hire offer count and backfill remain Open Question 2. *(GDD AC 33)*

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- Roster cap 8 refuses before any debit; Credits short is an identity no-op (ADR-0013).
- A hire is Ready with all bays unpinned wearing current issue; the hired id leaves the offers. Backfill is Open Question 2.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 022: offers.

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

- Depends on: Story 022
- Unlocks: Story 025
