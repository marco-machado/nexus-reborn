# Story 009: Result display, Debrief entry delay, and quiet replay banner

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

**ADR Governing Implementation**: ADR-0002: A mission in progress is not saved  
**Secondary ADRs**: ADR-0021: Outcome DTO and apply-once key; ADR-0004: A won contract does not pay twice; ADR-0016: Tactical sim contract
**ADR Decision Summary**: A mission is memory only; abort discards it, and the debrief is the only boundary that applies results, once.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: DOM / Zustand 5 work; the ADR lists no post-cutoff API (its Knowledge Risk HIGH is the project-wide pin note). Select primitives or use `useShallow` in selectors; do not use React 19.2 `<Activity>` / `useEffectEvent` to hide phases.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Presentation Layer Rules, manifest 2026-10-08).
- Required: Debrief paints the post-payout balance; `applyDebrief` runs in `useLayoutEffect`; StrictMode double-mount must not double-apply.
- Guardrail: no separate UI timer; the 2.5 s delay is Tactical elapsed time and does not progress while paused.
- Guardrail: Abort emits no invoice.
- Guardrail: colours from `src/ui/tokens.ts` / `src/index.css` only; screens work at 1280×720 without clipping (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/interface.md`, scoped to this story:*

- [ ] (AC15) GIVEN Tactical emits Win or Loss, WHEN result and outcome notifications are delivered, THEN Interface displays the result while still in Mission and enters Debrief on the outcome after Tactical’s 2.5 s elapsed-time delay. Test ordinary progressing time, paused time (delay does not progress), and a catch-up crossing both notifications before paint (Debrief may be the next painted surface). No minimum visible banner duration or separate UI timer is required. Abort emits no invoice; pricing is not checked here.
- [ ] (AC16) GIVEN a quiet replay finish, WHEN Debrief is shown, THEN the banner reads `REPLAY // FEE ALREADY COLLECTED`.

---

## Implementation Notes

*Derived from the governing ADRs and the Presentation Layer Rules:*

- Display the result while still in Mission; enter Debrief on the outcome notification, including when a catch-up crosses both before paint.
- Quiet replay banner text is exactly `REPLAY // FEE ALREADY COLLECTED`.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Economy-and-contracts story 022: the five invoice money lines.

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
- Unlocks: Story 010, Story 011
