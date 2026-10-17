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
- Guardrail: colours from `src/ui/tokens.ts` / `src/index.css` only; screens work at 1280×720 without clipping (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/interface.md`, scoped to this story:*

- [ ] (AC11) GIVEN a live mission with no result yet, WHEN Space or Escape is pressed, THEN a modal pause freezes sim and camera, prints remappable bindings from the live table, traps focus, offers Resume, keeps Settings inside the freeze, and Abort is not a single click.
- [ ] (AC12) GIVEN a paused mission with Abort idle, WHEN it is activated once, THEN confirmation arms without discarding. A second activation before expiry confirms immediately, with no Debrief/invoice or campaign write. In a separate fixture, letting the three-real-second timeout execute without confirmation disarms and leaves the mission paused; the next activation only re-arms. Observe the Abort boundary before any later Screen tick/autosave; the landing choice is OQ8, not this criterion.

*(Added at Sprint 9 planning, task R-2, from the GDD sections named.)*

- [ ] (EC-remap; `design/gdd/interface.md` Edge Cases) GIVEN pause open, WHEN Settings is opened from it and a remappable bind is changed, THEN the pause bindings list shows the new bind on return, and Pause, operative slots 1–4 and mouse are not offered for remap.

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

*From `production/qa/qa-plan-sprint-009-2026-10-17.md` (2026-10-17).*

#### IF-008 — Pause modal and two-step Abort (Integration)
**Automated**:
- `src/ui/abortArm.test.ts` (new) with fake timers: first activation arms and discards nothing; second before expiry confirms immediately with no Debrief/invoice/outcome and no campaign write
- 3 real seconds without confirmation disarms and the mission stays paused; the next activation only re-arms; the window runs on real time while the Tactical clock is frozen
- Space/Escape opens pause on a live mission with no result; sim and camera freeze; Resume works; Pause bind is not remappable (`BINDINGS` remappable predicate); bindings print from the live table
**Edge cases**: Settings opened from pause stays inside the freeze; nested Settings return focuses pause; Pause does not mute or swap beds (ADR-0017); Result pending during pause: delay follows Tactical elapsed time (owner follow-up, do not change the sim); Landing after Abort confirm is OQ8, not asserted
**Mutation check**: shorten the arming window to 1 s → the timeout test fails
**Manual**: Screenshots: pause open, Abort armed, Abort after timeout (still paused)

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
