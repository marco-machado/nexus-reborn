# Story 008: Pause modal and two-step Abort

> **Epic**: Interface
> **Status**: Ready
> **Layer**: Presentation
> **Type**: Integration
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/interface.md`
**Requirement**: `TR-interface-006`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0002: A mission in progress is not saved  
**Secondary ADRs**: ADR-0017: One OS / input / audio mixer
**ADR Decision Summary**: A mission is memory only; abort discards it, and the debrief is the only boundary that applies results, once.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: DOM / Zustand 5 work; the ADR lists no post-cutoff API (its Knowledge Risk HIGH is the project-wide pin note). Select primitives or use `useShallow` in selectors; do not use React 19.2 `<Activity>` / `useEffectEvent` to hide phases.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Presentation Layer Rules, manifest 2026-10-08).
- Required: Pause overlay does not mute or swap beds and does not change `Phase`.
- Required: Abort discards the mission; no Debrief/invoice or campaign write.
- Forbidden: mid-mission save chrome.
- Guardrail: colours from `src/ui/tokens.ts` / `src/index.css` only; screens work at 1280×720 without clipping (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/interface.md`, scoped to this story:*

- [ ] (AC11) GIVEN a live mission with no result yet, WHEN Space or Escape is pressed, THEN a modal pause freezes sim and camera, prints remappable bindings from the live table, traps focus, offers Resume, keeps Settings inside the freeze, and Abort is not a single click.
- [ ] (AC12) GIVEN a paused mission with Abort idle, WHEN it is activated once, THEN confirmation arms without discarding. A second activation before expiry confirms immediately, with no Debrief/invoice or campaign write. In a separate fixture, letting the three-real-second timeout execute without confirmation disarms and leaves the mission paused; the next activation only re-arms. Observe the Abort boundary before any later Screen tick/autosave; the landing choice is OQ8, not this criterion.

---

## Implementation Notes

*Derived from the governing ADRs and the Presentation Layer Rules:*

- Abort arms on first activation; second activation within three real seconds confirms; timeout disarms and stays paused.
- Pause prints remappable bindings from the live `BINDINGS` table and keeps Settings inside the freeze.
- The Abort landing choice is OQ8 — not implemented here.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 005: focus trap/return checks (AC18/AC19).

---

## QA Test Cases

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Integration
**Required evidence**:
- Integration: test beside the module — `src/state/missionStore.test.ts`, `src/state/appStore.test.ts`. — must exist and pass.
- UI: a retained screenshot of each screen touched, in `production/qa/evidence/`, plus a click-through note naming the screens exercised (docs/click-through.md).

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: None
- Unlocks: None
