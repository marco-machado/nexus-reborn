# Story 012: Assembly hire refusals and heavy-tier hint

> **Epic**: Interface
> **Status**: Ready
> **Layer**: Presentation
> **Type**: UI
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/interface.md`
**Requirement**: `TR-interface-002`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0017: One OS / input / audio mixer  
**Secondary ADRs**: ADR-0019: Deploy gate; ADR-0013: Credits never overdraw
**ADR Decision Summary**: One palette, one remap table, four audio buses; DOM screens at 1280×720; keyboard and mouse only.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: DOM / Zustand 5 work; the ADR lists no post-cutoff API (its Knowledge Risk HIGH is the project-wide pin note). Select primitives or use `useShallow` in selectors; do not use React 19.2 `<Activity>` / `useEffectEvent` to hide phases.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Presentation Layer Rules, manifest 2026-10-08).
- Required: disabled controls carry visible owner-reported reasons; critical state is never color-only.
- Guardrail: no refusal audio is required.
- Guardrail: Interface does not compute affordability or capacity.
- Guardrail: colours from `src/ui/tokens.ts` / `src/index.css` only; screens work at 1280×720 without clipping (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/interface.md`, scoped to this story:*

- [ ] (AC26) GIVEN an unseen heavy-tier advisory and an otherwise-valid heavy-tier deployment, WHEN the mission starts, THEN the existing speed-penalty hint appears once. A later valid deployment in the same campaign does not repeat it. An over-limit Assembly attempt is refused with its reason and never enters Mission; it is not the heavy-tier mission-hint trigger.
- [ ] (AC28) GIVEN candidate offers with owner-reported costs, Credits and roster capacity, WHEN Assembly is shown in unaffordable and full-roster fixtures separately, THEN hire cost versus Credits is visible and hire is disabled with the matching reason. Overdraft and Deploy refusal retain disabled controls plus visible reasons; no refusal audio is required for either.

---

## Implementation Notes

*Derived from the governing ADRs and the Presentation Layer Rules:*

- Heavy-tier speed-penalty hint fires once per campaign on mission start, not on an over-limit Assembly attempt.
- Hire cost versus Credits is visible; full roster and unaffordable each show their matching reason.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 003: missing-contract Deploy refusal.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-009-2026-10-17.md` (2026-10-17).*

#### IF-012 — Assembly hire refusals and heavy-tier hint (UI)
**Automated (where a seam exists)**:
- `src/ui/assemblyRows.test.ts`, `src/ui/armHints.test.ts`: unaffordable fixture → cost vs Credits visible, hire disabled with the matching reason; full-roster fixture likewise
- Valid heavy-tier deployment with the advisory unseen → speed-penalty hint once; a later valid deployment in the same campaign does not repeat it
- Over-limit (> 400 kg) is refused with its reason, never enters Mission, and is not the hint trigger
- Overdraft and Deploy refusals keep disabled controls plus visible reasons; no refusal sound is requested
**Verification**: Headless capture at 1280×720; evidence in `production/qa/evidence/if-012/`; sign-off: qa-lead
**Checklist**:
- [ ] Screenshots: unaffordable hire, full roster, over-limit refusal, heavy-tier hint in Mission
**Edge cases**: Mass limit 400 kg literal; Deploy refused with zero assigned or any Injured assigned

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
