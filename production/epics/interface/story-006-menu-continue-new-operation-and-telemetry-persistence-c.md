# Story 006: Menu Continue, New Operation, and telemetry persistence chrome

> **Epic**: Interface
> **Status**: Ready
> **Layer**: Presentation
> **Type**: UI
> **Estimate**: 1.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/interface.md`
**Requirement**: `TR-interface-003`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0017: One OS / input / audio mixer  
**Secondary ADRs**: ADR-0011: Campaign persistence envelope; ADR-0015: Telemetry never leaves the machine
**ADR Decision Summary**: One palette, one remap table, four audio buses; DOM screens at 1280×720; keyboard and mouse only.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: DOM / Zustand 5 work; the ADR lists no post-cutoff API (its Knowledge Risk HIGH is the project-wide pin note). Select primitives or use `useShallow` in selectors; do not use React 19.2 `<Activity>` / `useEffectEvent` to hide phases.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Presentation Layer Rules, manifest 2026-10-08).
- Required: Interface reads Persistence validity; it does not validate the blob itself.
- Guardrail: Settings survive New Operation; campaign fields match Persistence's canonical fresh-operation fixture.
- Forbidden: calling a failed durable erase successful.
- Guardrail: colours from `src/ui/tokens.ts` / `src/index.css` only; screens work at 1280×720 without clipping (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/interface.md`, scoped to this story:*

- [ ] (AC9) GIVEN Menu with no valid campaign blob vs a valid blob, WHEN Continue is read, THEN Continue is absent vs present accordingly (Persistence owns validity).
- [ ] (AC17) GIVEN recorded nondefault Settings (Difficulty, Quality, at least one remap, text scale, telemetry toggle) and a progressed campaign, WHEN New Operation is confirmed under successful storage conditions, THEN those Settings still match; campaign Credits, Intel, contractsWon, laboratories and tutorial-seen match Persistence’s canonical fresh-operation fixture. Do not duplicate opening values or call a failed durable erase successful (AC23).
- [ ] (AC21) GIVEN Persistence reports never-started, invalid/unreadable, and valid in separate Menu fixtures, WHEN Menu is displayed, THEN Continue is absent, absent, and present respectively; invalid/unreadable has a visible reason distinct from never-started. Interface does not validate the blob itself.
- [ ] (AC25) GIVEN telemetry enabled with recorded history, WHEN recording is disabled, a mission finishes or Aborts, and recording is enabled again to inspect Balance, THEN the earlier records remain and the disabled interval added none. Successful Clear empties the log; New Operation does not. Balance remains reachable while recording is disabled because the log is nonempty (OQ9, closed).

---

## Implementation Notes

*Derived from the governing ADRs and the Presentation Layer Rules:*

- Continue presence comes from the Persistence report (never-started / invalid / valid); invalid shows a reason distinct from never-started.
- Balance stays reachable while recording is disabled if the log is nonempty; Clear empties it, New Operation does not.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 010: failed New Operation durable write chrome (AC23).

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
