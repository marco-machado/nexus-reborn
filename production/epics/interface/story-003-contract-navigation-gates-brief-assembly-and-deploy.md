# Story 003: Contract navigation gates Brief, Assembly, and Deploy

> **Epic**: Interface
> **Status**: Ready
> **Layer**: Presentation
> **Type**: UI
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/interface.md`
**Requirement**: `TR-interface-003`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0017: One OS / input / audio mixer  
**Secondary ADRs**: ADR-0019: Deploy gate; ADR-0007: Opening hour is per-mission, not the look; ADR-0006: Weather is a script, not a roll mid-fight
**ADR Decision Summary**: One palette, one remap table, four audio buses; DOM screens at 1280×720; keyboard and mouse only.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: DOM / Zustand 5 work; the ADR lists no post-cutoff API (its Knowledge Risk HIGH is the project-wide pin note). Select primitives or use `useShallow` in selectors; do not use React 19.2 `<Activity>` / `useEffectEvent` to hide phases.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Presentation Layer Rules, manifest 2026-10-08).
- Required: `src/App.tsx` routes on `appStore.phase`; overlays do not change `Phase`.
- Forbidden: React 19.2 `<Activity>` / `useEffectEvent` to hide phases.
- Guardrail: Interface presents owner outputs; it does not recompute Brief/Tactical values.
- Guardrail: colours from `src/ui/tokens.ts` / `src/index.css` only; screens work at 1280×720 without clipping (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/interface.md`, scoped to this story:*

- [ ] (AC4) GIVEN no selected contract, WHEN Brief navigation, Assembly navigation and Deploy are each exercised, THEN Brief cannot open, Assembly opens, and Deploy does not start a mission and shows the missing-contract reason.
- [ ] (AC5) GIVEN a selected unlocked contract and recorded seed/variant, Difficulty and relevant deployment inputs, WHEN Brief is opened and that same deployment is created, THEN Brief is reachable and its insertion, objectives, extraction, force/civilian counts, Opening hour and weather-front timing match the District. Record the compared inputs and fields; owner computation remains Brief/Tactical.
- [ ] (AC6) GIVEN Debrief returning to the World Network, WHEN the nav is read, THEN the selected contract is cleared and Brief is locked. For authored work on a non-failed campaign, Replay returns directly without reselecting; the contract may also be selected again later. Generated work has no Replay control. Failed-campaign Debrief is AC30.

---

## Implementation Notes

*Derived from the governing ADRs and the Presentation Layer Rules:*

- Brief nav is locked without a selected contract; Deploy shows the owner-reported missing-contract reason.
- Brief fields come from the same deployment inputs the mission is built from (seed/variant, Difficulty).
- Debrief return clears the selected contract; Replay appears only for authored work on a non-failed campaign (failed-campaign case is Story 011).

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 011: failed-campaign Debrief actions (AC30).
- Story 012: Assembly hire and over-limit refusals.

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
- Unlocks: Story 011
