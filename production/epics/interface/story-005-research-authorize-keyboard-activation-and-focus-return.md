# Story 005: Research Authorize, keyboard activation, and focus return

> **Epic**: Interface
> **Status**: Ready
> **Layer**: Presentation
> **Type**: UI
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/interface.md`
**Requirement**: `TR-interface-007`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0017: One OS / input / audio mixer  
**Secondary ADRs**: ADR-0013: Credits never overdraw; ADR-0014: Timeline Review is a view, not a clock
**ADR Decision Summary**: One palette, one remap table, four audio buses; DOM screens at 1280×720; keyboard and mouse only.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: DOM / Zustand 5 work; the ADR lists no post-cutoff API (its Knowledge Risk HIGH is the project-wide pin note). Select primitives or use `useShallow` in selectors; do not use React 19.2 `<Activity>` / `useEffectEvent` to hide phases.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Presentation Layer Rules, manifest 2026-10-08).
- Required: `BINDINGS` is the only remap table; keyboard and mouse, desktop only.
- Forbidden: gamepad or touch.
- Guardrail: debit/start correctness stays Economy/Research; Interface does not debit.
- Guardrail: colours from `src/ui/tokens.ts` / `src/index.css` only; screens work at 1280×720 without clipping (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/interface.md`, scoped to this story:*

- [ ] (AC8) GIVEN an available, unresearched project with prerequisites satisfied and its laboratory idle, WHEN Credits are below its listed cost, THEN Authorize is disabled and its unaffordable reason is visible. In a separate otherwise-identical affordable fixture, activating Authorize starts the project and shows Active rather than merely opening inspection; debit/start correctness stays Economy/Research.
- [ ] (AC18) GIVEN Pause then nested Settings then return, WHEN focus is observed, THEN focus restores to the pause modal (§20 nested Settings return).
- [ ] (AC19) GIVEN a focused Research project node, WHEN pointer activation, Enter and Space are exercised in separate fixtures, THEN each selects the project and displays its details without starting research or changing Credits or laboratory occupancy. GIVEN the selected available, unresearched project has satisfied prerequisites, an idle laboratory and sufficient Credits, WHEN its focused enabled Authorize control is activated by pointer, Enter or Space in separate fixtures, THEN each starts the project and presents its Active state; debit/start correctness remains Economy/Research. GIVEN the Timeline at a recorded live state, WHEN Left/Right, Home and End are exercised, THEN Left/Right move Review backward/forward within its window, Home selects the oldest point, and End returns Live; the Review action does not mutate live state. GIVEN Pause or Settings, WHEN Tab/Shift+Tab and close are exercised, THEN focus stays trapped while open and returns to the opening context when closed; nested Settings return satisfies AC18. These are separate observable checks, not a requirement for full keyboard travel across every panel.

---

## Implementation Notes

*Derived from the governing ADRs and the Presentation Layer Rules:*

- Node activation (pointer, Enter, Space) selects and inspects only; only the enabled Authorize control starts research.
- Pause and Settings trap focus and restore it to the opening context; nested Settings returns to the pause modal.
- Timeline Left/Right/Home/End drive Review only and never mutate live state.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Research epic story 009: remaining-time label.
- Research epic story 002: authorize debit ordering.

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: UI
**Required evidence**:
- UI: a retained screenshot of each screen touched, in `production/qa/evidence/`, plus a click-through note naming the screens exercised (docs/click-through.md). Screens must work at 1280×720 without clipping or truncation.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 001
- Unlocks: None
