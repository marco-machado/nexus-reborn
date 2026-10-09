# Story 016: Balance Export and two-step Clear

> **Epic**: Persistence and validation
> **Status**: Ready
> **Layer**: Core
> **Type**: UI
> **Estimate**: —
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/persistence-and-validation.md`
**Requirement**: `TR-persistence-008`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0015: Telemetry never leaves the machine
**ADR Decision Summary**: Telemetry is opt-in, local, capped at 60 FIFO, with no network egress.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Foundation Layer Rules — persistence/save-load, manifest 2026-10-08).
- Forbidden: uploading telemetry to any origin.
- Guardrail: Campaign persist is coalesced Screen writes, not 20Hz stringify; no per-frame React state (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/persistence-and-validation.md`, scoped to this story:*

- [ ] GIVEN at least one telemetry record, WHEN Export JSON is used, THEN a local JSON file downloads and the action does not upload to an app origin.
- [ ] GIVEN records present, WHEN Clear is activated once, THEN records remain and the control arms a confirm.
- [ ] GIVEN records present and Clear armed, WHEN confirmed, THEN Balance is empty and the campaign blob is untouched.
- [ ] GIVEN telemetry on and a non-abort Debrief, WHEN JSON is exported, THEN that record includes outcome, duration, first contact, objectives, weapon shots and damage, damage in and out, civilian hits by source, item and ability use, KIA, payout, deployed roles.

---

## Implementation Notes

*Derived from the governing ADRs and the Foundation Layer Rules:*

- Export is a local `data:` URL JSON download in `Balance.tsx`. Clear arms a confirm on first activation; confirm calls `clearRecords` and leaves the campaign blob untouched.
- The exported non-abort record carries every field named in the AC.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- None beyond the epic boundary.

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

- Depends on: Story 013
- Unlocks: None
