# Story 017: Debrief filing-status reads unfiled until the next Screen

> **Epic**: Persistence and validation
> **Status**: Ready
> **Layer**: Core
> **Type**: UI
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/persistence-and-validation.md`
**Requirement**: `TR-persistence-009`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0022: Durable-commit (filing) status  
**Secondary ADRs**: ADR-0021: Outcome DTO and apply-once key; ADR-0011: Campaign persistence envelope
**ADR Decision Summary**: A session-only status store, written only by save.ts, reports filed / unfiled / write-failed.
**ADR Version**: 2026-10-08 (ADR `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Foundation Layer Rules — persistence/save-load, manifest 2026-10-08).
- Forbidden: a `saveStatus` field on `appStore`; `applyDebrief` calling `markUnfiled()`.
- Forbidden: Interface or owners calling the status mutators.
- Guardrail: Campaign persist is coalesced Screen writes, not 20Hz stringify; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/persistence-and-validation.md`, scoped to this story:*

- [ ] GIVEN Debrief has applied in this session (payout, sector, Intel, Influence, and roster — or quiet-replay roster + ETA catch-up only) and the director has not entered a Screen, WHEN Debrief is shown, THEN an observable filing-status indicates the invoice is not durable (unfiled) without leaving Debrief. Copy and layout stay Interface.
- [ ] GIVEN that unfiled Debrief and a successful next-Screen autosave (World Network return or Brief Replay), WHEN reload then Continue, THEN named post-apply campaign fields persist (not S, not doubled) and filing-status is not still unfiled.

---

## Implementation Notes

*Derived from the governing ADRs and the Foundation Layer Rules:*

- `startAutosave` marks `unfiled` when `lastAppliedKey` increases (compare against Zustand `prevState`); `writeSave` marks `filed` after `setItem` returns; `hydrateSave` resets to `filed`.
- Interface reads with primitive selectors; copy and layout stay Interface. Unit-test the store in `src/state/save.test.ts` alongside the screenshot.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 018: write-failed.

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

- Depends on: Story 007
- Unlocks: Story 018
