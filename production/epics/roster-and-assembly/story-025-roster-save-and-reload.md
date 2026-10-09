# Story 025: Roster save and reload

> **Epic**: Roster and Assembly
> **Status**: Ready
> **Layer**: Feature
> **Type**: Integration
> **Estimate**: —
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/roster-and-assembly.md`
**Requirement**: `TR-roster-006`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0011: Campaign persistence envelope  
**ADR Decision Summary**: The campaign blob is versioned and written only by `save.ts` from Screen autosaves; mission and debrief are never restored.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Feature Layer Rules, manifest 2026-10-08).
- Forbidden: zustand `persist` on campaign stores; restoring a mission or debrief.
- Guardrail: no per-frame work; no per-frame React state (AGENTS.md); deterministic campaign RNG preserved.

---

## Acceptance Criteria

*From GDD `design/gdd/roster-and-assembly.md`, scoped to this story:*

- [ ] **GIVEN** living roster, pins, Experience, injuries, candidates, Item slots, and campaign flags, **WHEN** strategy save and reload, **THEN** those values match the pre-save roster blob and running mission/debrief are not restored. *(GDD AC 41)*

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- `save.ts` is the only campaign-blob writer; pins are roster content. No zustand persist middleware. Running mission and debrief are not restored; hydrate lands on menu.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- None beyond the epic’s other stories.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Integration
**Required evidence**:
- Integration: test file beside the module — `src/state/save.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 023, Story 024
- Unlocks: None
