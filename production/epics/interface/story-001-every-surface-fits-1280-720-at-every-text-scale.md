# Story 001: Every surface fits 1280×720 at every text scale

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
**ADR Decision Summary**: One palette, one remap table, four audio buses; DOM screens at 1280×720; keyboard and mouse only.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: DOM / Zustand 5 work; the ADR lists no post-cutoff API (its Knowledge Risk HIGH is the project-wide pin note). Select primitives or use `useShallow` in selectors; do not use React 19.2 `<Activity>` / `useEffectEvent` to hide phases.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Presentation Layer Rules, manifest 2026-10-08).
- Required: Screens must work at 1280×720 without clipping or truncation.
- Required: Settings, Balance, pause, and tutorial toasts are overlays; they do not change `Phase`.
- Guardrail: no per-frame React state (AGENTS.md).
- Guardrail: colours from `src/ui/tokens.ts` / `src/index.css` only; screens work at 1280×720 without clipping (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/interface.md`, scoped to this story:*

- [ ] (AC1) GIVEN every listed surface (Menu, World Network, Research, Brief, Assembly, Mission HUD, pause, Debrief, Settings) at 1280×720 and each text scale 90 / 100 / 110 / 125%, WHEN the surface is shown, THEN no element's text is cut off by its container, no element's bounding box intersects another's except declared overlays (Settings, Balance, pause, toasts), and scrolled overflow remains reachable. Smaller-than-minimum windows scroll and do not compress panels.
- [ ] (AC20) GIVEN a click-through at 1280×720 following `docs/click-through.md`, WHEN the run is recorded, THEN the record names every unexercised screen or interaction. A partial run is not a pass of the unexercised set.

---

## Implementation Notes

*Derived from the governing ADRs and the Presentation Layer Rules:*

- Text scale is a settings value applied through CSS variables; panels scroll below minimum window size rather than compressing.
- Declared overlays are the only permitted bounding-box intersections.
- The click-through record follows `docs/click-through.md` and names every unexercised screen or interaction.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 002: semantic colour roles and non-color cues.

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

- Depends on: None
- Unlocks: Story 002, Story 003, Story 004, Story 005, Story 006, Story 007, Story 008, Story 009, Story 010, Story 011, Story 012
