# Story 022: Candidate market offers and hire cost

> **Epic**: Roster and Assembly
> **Status**: Ready
> **Layer**: Feature
> **Type**: Logic
> **Estimate**: 0.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/roster-and-assembly.md`
**Requirement**: `TR-roster-003`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0001: Two clocks, never both  
**ADR Decision Summary**: Strategic and tactical clocks are independent; a win spends the contract ETA as strategic days, a loss spends none.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Feature Layer Rules, manifest 2026-10-08).
- Forbidden: tactical time advancing strategic downtime or the market.
- Guardrail: no per-frame work; no per-frame React state (AGENTS.md); deterministic campaign RNG preserved.

---

## Acceptance Criteria

*From GDD `design/gdd/roster-and-assembly.md`, scoped to this story:*

- [ ] **GIVEN** a new campaign with no hires, **WHEN** the candidate market is read, **THEN** offer count is 3; each candidate has a name that matches after save/reload, a hash figure derived from id + codename, one of the 8 roles, that role’s primary weapon, Ready, current issue in all 4 bays, and HP/speed inside §8 starting-roster ranges. Post-hire count is Open Question 2 — do not assert 3 after a hire. *(GDD AC 27)*
- [ ] **GIVEN** the market already has 3 offers, **WHEN** 24 strategic hours elapse with no hire, **THEN** offer count stays 3. *(GDD AC 28)*
- [ ] **GIVEN** a candidate, **WHEN** hire cost is read, **THEN** it is in 16000–34000 CR inclusive. *(GDD AC 29)*

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- Market runs on strategic `t`; capped at 3 offers. Candidate generation in `src/game/recruits.ts` (`hireCost`) is deterministic from the serialized market RNG.
- Post-hire count is Open Question 2 — do not assert it.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 023: hire.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Logic
**Required evidence**:
- Logic: test file beside the module — `src/game/recruits.test.ts`, `src/state/campaignStore.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: None
- Unlocks: Story 023
