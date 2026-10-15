# Story 001: Menu Continue: never-started vs valid save

> **Epic**: Persistence and validation
> **Status**: Complete
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

- [x] GIVEN a clean origin with no campaign blob, WHEN the Menu loads, THEN Continue is absent, Menu state is never-started (no invalid-blob reason), and New Operation is offered. Copy stays Interface.
- [x] GIVEN a campaign that reached a Screen so a valid local save exists, WHEN the origin is reloaded to the Menu, THEN Continue is present and opens the World Network for that campaign (not a new one, not a mission, not Brief, not Assembly).
- [x] GIVEN a valid local save written while a Screen was showing, WHEN Continue is activated, THEN no mission id and no Debrief outcome are restored (hydrate never restores them), and the campaign lands on the World Network with strategy, roster and laboratories from that save. (GDD Edge Cases: "If hydrate runs".)

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

**Status**: [x] Created — `src/state/save.test.ts`, describe block `menu continue: never-started vs valid save` (5 tests)

---

## Dependencies

- Depends on: None
- Unlocks: Story 002, Story 004, Story 008

---

## Completion Notes
**Completed**: 2026-10-15
**Criteria**: 3/3 passing (none deferred)
- AC1 (clean origin: never-started, Continue absent, New Operation offered) — `src/state/save.test.ts` "clean origin: Continue absent, state never-started ..." and "unavailable storage reads as never-started, not invalid". Continue/New Operation are checked through the status value (`status === 'valid'` false), per the QA plan's "assert the state value, not text"; there is no component-level assertion that MainMenu hides Continue.
- AC2 (valid save: Continue present, opens World Network for that campaign) — `src/state/save.test.ts` "valid save: reload offers Continue ..."; screenshots `production/qa/evidence/pv-001/01-menu-valid-save-continue.jpg` (Menu with Continue, New Operation, Settings) and `02-continue-opens-world-network.jpg` (World Network after Continue).
- AC3 (no mission id / Debrief outcome restored; strategy, roster, labs from save) — `src/state/save.test.ts` "Continue restores no mission id and no Debrief outcome ...".
**Deviations**: None blocking. Advisory:
- `src/state/save.ts` `hasValidSave` has no callers in `src/` now that `src/ui/index.tsx` uses `menuSaveStatus`; remove it or keep it deliberately as a public helper (not in ADR-0011 Key Interfaces).
- `src/ui/index.tsx` `useState(() => menuSaveStatus())` calls `inspectSave`, which removes a bad blob during render. Idempotent and StrictMode-safe (the old `hasValidSave` -> `readSave` path did the same), but consider dropping only at boot (`loadCampaignAtBoot`) and making the Menu read side-effect free.
- `src/state/save.ts` `droppedAtBoot` is module-level state reset only by `loadCampaignAtBoot` and `startNewOperation`; test isolation depends on order (the dropped-blob test resets via `startNewOperation`). Consider a documented test-only reset.
- Evidence `02-continue-opens-world-network.jpg` shows the first-run World Network Orientation tutorial over the screen after Continue. It shows World Network with non-default credits (supports AC2), but whether `tutorial.seen` was restored is unverified; consider re-capturing with a campaign that dismissed orientation, or note it.
**Scope**: Changes in `src/state/save.ts`, `src/ui/index.tsx` (adds `data-save-status` hook), `src/state/save.test.ts` — within the story's implementation notes.
**Test Evidence**: Integration: `src/state/save.test.ts` (present; /code-review run reported vitest 36/36 pass and `tsc -b` clean). Screenshots in `production/qa/evidence/pv-001/`.
**Run result**: OBSERVED — `production/qa/evidence/pv-001/01-menu-valid-save-continue.jpg`, `02-continue-opens-world-network.jpg`.
**Code Review**: Complete — /code-review ran (lean-mode prompt answered "Yes"). Verdict NOT ASSESSED: engine-specialist (lead-programmer, ui-programmer) and qa-tester sub-reviews did not run because the unattended run had no Agent tool; the reviewer's own pass found no required changes and would rate APPROVED WITH SUGGESTIONS; ADR-0011 COMPLIANT; standards 6/6. Re-run with specialists if full sign-off is required.
**QA coverage gate**: QL-TEST-COVERAGE skipped — Lean mode.
**Closure decision**: autonomous mode, took the recommended "Close the story" option.
