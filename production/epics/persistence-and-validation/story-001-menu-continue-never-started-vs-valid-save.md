# Story 001: Menu Continue: never-started vs valid save

> **Epic**: Persistence and validation
> **Status**: Ready
> **Layer**: Core
> **Type**: Integration
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-15

## Context

**GDD**: `design/gdd/persistence-and-validation.md`
**Requirement**: `TR-persistence-001`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0011: Campaign persistence envelope
**ADR Decision Summary**: Three storage envelopes; src/state/save.ts is the only campaign writer; drop-all on a bad blob.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Foundation Layer Rules — persistence/save-load, manifest 2026-10-08).
- Forbidden: Continue resuming a mission, Brief, or Assembly.
- Guardrail: Campaign persist is coalesced Screen writes, not 20Hz stringify; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/persistence-and-validation.md`, scoped to this story:*

- [ ] GIVEN a clean origin with no campaign blob, WHEN the Menu loads, THEN Continue is absent, Menu state is never-started (no invalid-blob reason), and New Operation is offered. Copy stays Interface.
- [ ] GIVEN a campaign that reached a Screen so a valid local save exists, WHEN the origin is reloaded to the Menu, THEN Continue is present and opens the World Network for that campaign (not a new one, not a mission, not Brief, not Assembly).
- [ ] GIVEN a valid local save written while a Screen was showing, WHEN Continue is activated, THEN no mission id and no Debrief outcome are restored (hydrate never restores them), and the campaign lands on the World Network with strategy, roster and laboratories from that save. (GDD Edge Cases: "If hydrate runs".)

---

## Implementation Notes

*Derived from the governing ADRs and the Foundation Layer Rules:*

- Hydrate lands on `menu`; Continue is offered only when `save.ts` finds a valid campaign blob, and always opens the World Network.
- Menu exposes a never-started state distinct from the invalid/unreadable state (Story 008). Copy stays Interface — see `design/ux/main-menu.md`.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 008: invalid/unreadable blob state.
- Story 002: New Operation.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-006-2026-10-15.md` (Sprint 6). Type: Integration.*

**Automated**: `src/state/save.test.ts`.
- Clean origin: Continue absent, Menu state never-started (no invalid reason), New Operation offered
- Valid save: Continue present and opens World Network for that campaign
- Continue restores no mission id and no Debrief outcome; strategy, roster and labs come from the save
- Edge: Read Menu state from one exported status, not by scanning copy
- Edge: Copy stays Interface: assert the state value, not text

**Gap**: **Source change.** Menu state must distinguish never-started from invalid/unreadable (shared with PV-008).

---

## Test Evidence

**Story Type**: Integration
**Required evidence**:
- Integration: test file beside the module — `src/state/save.test.ts`. — must exist and pass.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: None
- Unlocks: Story 002, Story 004, Story 008
