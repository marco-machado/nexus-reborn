# Story 010: Debrief filing status and write-failure indicators

> **Epic**: Interface
> **Status**: Ready
> **Layer**: Presentation
> **Type**: UI
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/interface.md`
**Requirement**: `TR-interface-006`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0002: A mission in progress is not saved  
**Secondary ADRs**: ADR-0022: Durable-commit (filing) status
**ADR Decision Summary**: A mission is memory only; abort discards it, and the debrief is the only boundary that applies results, once.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: DOM / Zustand 5 work; the ADR lists no post-cutoff API (its Knowledge Risk HIGH is the project-wide pin note). Select primitives or use `useShallow` in selectors; do not use React 19.2 `<Activity>` / `useEffectEvent` to hide phases.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Presentation Layer Rules, manifest 2026-10-08).
- Required: read filing status with primitive selectors `useSaveStatusStore((s) => s.status)` and `(s) => s.reason`; re-render before the first painted frame.
- Forbidden: writing the filing status from a component; treating `filed` as "memory equals blob" after later ticks.
- Guardrail: colours from `src/ui/tokens.ts` / `src/index.css` only; screens work at 1280×720 without clipping (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/interface.md`, scoped to this story:*

- [ ] (AC22) GIVEN an applied in-memory Debrief, WHEN it is displayed before any Screen return, THEN the invoice visibly reads as unfiled. After a successful next-Screen autosave, tested through World Network return and Brief Replay separately, filing status no longer reads unfiled. The success signal comes from Persistence, not merely navigation.
- [ ] (AC23) GIVEN Persistence reports a failed New Operation durable write or failed first Screen write after Debrief, WHEN the corresponding surface is shown, THEN it visibly reports failure rather than durable erase/filing success; an invoice remains unfiled. Use both World Network-return and Brief-Replay failure fixtures. Exact copy stays UX; storage failure/reload correctness stays Persistence.

---

## Implementation Notes

*Derived from the governing ADRs and the Presentation Layer Rules:*

- Unfiled until Persistence reports a successful next-Screen autosave; test World Network return and Brief Replay separately.
- One generic failure message may cover all reasons; exact copy stays UX.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 006: Menu/New Operation success path.

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

- Depends on: Story 009
- Unlocks: None
