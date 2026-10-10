# Story 024: Campaign fail on empty roster

> **Epic**: Roster and Assembly
> **Status**: Ready
> **Layer**: Feature
> **Type**: Logic
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/roster-and-assembly.md`
**Requirement**: `TR-roster-007`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0020: Campaign fail flags  
**ADR Decision Summary**: campaignFailed and campaignWon are two booleans written in `reportMission`; a completed campaign survives a roster wipe.
**ADR Version**: 2026-09-11 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Feature Layer Rules, manifest 2026-10-08).
- Forbidden: re-deriving campaignFailed from roster length on hydrate.
- Guardrail: no per-frame work; no per-frame React state (CLAUDE.md); deterministic campaign RNG preserved.

---

## Acceptance Criteria

*From GDD `design/gdd/roster-and-assembly.md`, scoped to this story:*

- [ ] **GIVEN** campaign is not complete and living roster count reaches 0, **WHEN** campaign flags are read, **THEN** the campaign is failed-empty-roster, it is not also complete, and contracts are locked. *(GDD AC 38)*
- [ ] **GIVEN** campaign already complete, **WHEN** living roster count reaches 0, **THEN** campaign stays complete and is not marked failed. *(GDD AC 39)*
- [ ] **GIVEN** the director never hires and living roster count reaches 0 on an incomplete campaign, **WHEN** campaign flags are read, **THEN** the campaign is failed-empty-roster and is not also complete. *(GDD AC 77)*

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- `isCampaignFailed(rosterSize, alreadyComplete)` = `rosterSize === 0 && !alreadyComplete`, evaluated in `reportMission` with this debrief’s `allWon`.
- Never re-derive fail from length on hydrate. Contracts lock via `selectMission` no-op when failed.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- None beyond the epic’s other stories.

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

- Depends on: Story 014
- Unlocks: Story 025
