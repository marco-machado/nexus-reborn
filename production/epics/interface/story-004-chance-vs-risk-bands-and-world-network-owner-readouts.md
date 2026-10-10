# Story 004: Chance vs Risk bands and World Network owner readouts

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
**Secondary ADRs**: ADR-0014: Timeline Review is a view, not a clock; ADR-0008: Influence is a wallet; tax is Nexus income
**ADR Decision Summary**: One palette, one remap table, four audio buses; DOM screens at 1280×720; keyboard and mouse only.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: DOM / Zustand 5 work; the ADR lists no post-cutoff API (its Knowledge Risk HIGH is the project-wide pin note). Select primitives or use `useShallow` in selectors; do not use React 19.2 `<Activity>` / `useEffectEvent` to hide phases.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Presentation Layer Rules, manifest 2026-10-08).
- Required: Critical state is never color-only.
- Guardrail: Do not recompute board rules in Interface.
- Guardrail: Review is a view; Scan numbers remain live.
- Guardrail: colours from `src/ui/tokens.ts` / `src/index.css` only; screens work at 1280×720 without clipping (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/interface.md`, scoped to this story:*

- [ ] (AC7) GIVEN intel < 2 vs intel ≥ 2 on the same contract, WHEN Brief and World Network chrome are compared, THEN World Network still prints Chance; Brief shows Chance at intel < 2 and Risk index bands (not a percentage) at intel ≥ 2.
- [ ] (AC27) GIVEN World Network owner outputs, WHEN the sector readout, Timeline, Influence actions and first-visit overlay are inspected, THEN printed Tax is distinguishable from payment eligibility (opening Europe does not pay; opening North America does), Live/Review are distinguishable while Scan numbers remain live, and unavailable actions show their actual owner-reported reason (unaffordable, cooldown, no target, or locked sector). No Influence action is offered for Antarctica. First-visit teaching identifies Pause/Clock speed as control over strategic time, opening Influence as unaffordable rather than broken, and Nexus-held Tax eligibility—not only panel names. Do not recompute board rules in Interface.

---

## Implementation Notes

*Derived from the governing ADRs and the Presentation Layer Rules:*

- Risk index prints as bands at intel ≥ 2, never a percentage.
- Unavailable Influence actions print the owner-reported reason; no Influence action for Antarctica.
- First-visit overlay teaching covers Pause/Clock speed, unaffordable opening Influence, and Nexus-held Tax eligibility.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 005: Timeline keyboard behaviour (AC19).

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
