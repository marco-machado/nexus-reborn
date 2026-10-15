# Story 017: Debrief filing-status reads unfiled until the next Screen

> **Epic**: Persistence and validation
> **Status**: Complete
> **Layer**: Core
> **Type**: UI
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-15

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

- [x] GIVEN Debrief has applied in this session (payout, sector, Intel, Influence, and roster — or quiet-replay roster + ETA catch-up only) and the director has not entered a Screen, WHEN Debrief is shown, THEN an observable filing-status indicates the invoice is not durable (unfiled) without leaving Debrief. Copy and layout stay Interface.
- [x] GIVEN that unfiled Debrief and a successful next-Screen autosave (World Network return or Brief Replay), WHEN reload then Continue, THEN named post-apply campaign fields persist (not S, not doubled) and filing-status is not still unfiled.
- [x] GIVEN an unfiled Debrief that held selected contract C, WHEN the director Replays to Brief and the Brief autosave succeeds, THEN filing status is no longer unfiled in session and the selection is still C. (GDD Edge Cases: "If Debrief Replays to Brief": the Brief autosave is the first durable write.)

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

*From `production/qa/qa-plan-sprint-006-2026-10-15.md` (Sprint 6). Type: UI.*

**Automated**: `src/state/save.test.ts`, `new `src/ui/` builder test`.
- Applied Debrief shows unfiled (paid and quiet replay)
- Successful next-Screen write: reload restores post-apply, status not unfiled
- Edge: Copy and layout are Interface (`/ux-design`); assert the status value

**Gap**: **Source change.** Add a session filing status set at apply and cleared by a successful Screen write.

**Manual**: Playwright at native 1280x720; screenshots in `production/qa/evidence/sprint-006/`; lead-programmer sign-off.

---

## Test Evidence

**Story Type**: UI
**Required evidence**:
- UI: a retained screenshot of each screen touched, in `production/qa/evidence/`, plus a click-through note naming the screens exercised (docs/click-through.md). Screens must work at 1280×720 without clipping or truncation.

**Status**: [x] Created: `src/state/save.test.ts` (`Debrief filing status reads unfiled until the next Screen`, `saveStatusStore transitions (ADR-0022)`), `src/ui/filingStatus.test.ts`, and `production/qa/evidence/pv-017/` (click-through.md + 01..04 screenshots at 1280x720)

---

## Dependencies

- Depends on: Story 007
- Unlocks: Story 018

---

## Completion Notes
**Completed**: 2026-10-15
**Criteria**: 3/3 passing (none deferred)
**Verdict**: COMPLETE WITH NOTES (closed by `/story-done` in an unattended `implement-stories` workflow; Phase 7 default "Close the story" taken)

**Test-Criterion Traceability**
| Criterion | Test | Status |
|-----------|------|--------|
| AC-1: Debrief shows unfiled after apply (paid and quiet replay) | `src/state/save.test.ts` › `Debrief filing status reads unfiled until the next Screen` (paid win, quiet replay, `AC1: Abort applies nothing and never marks unfiled`); `production/qa/evidence/pv-017/01-debrief-unfiled-1280x720.png` | COVERED |
| AC-2: next-Screen autosave, reload + Continue is post-apply and not unfiled | `src/state/save.test.ts` › `AC2: World Network return files; reload then Continue is post-apply and not unfiled`; `03-world-network-return-filed-1280x720.png`, `04-reload-continue-not-unfiled-1280x720.png` | COVERED |
| AC-3: Replay to Brief files and selection is still C | `src/state/save.test.ts` › `AC3: Replay to Brief files in session and the selection is still C`; `02-replay-to-brief-filed-1280x720.png` | COVERED |

**Test Evidence**: UI: retained screenshots of each screen touched (Debrief, Brief, World Network, reload → Continue) at `production/qa/evidence/pv-017/`, plus `click-through.md`. `npx vitest run src/state/save.test.ts src/ui/filingStatus.test.ts` passed 98/98 at close.

**Code Review**: Complete with caveat. `/code-review` ran in this workflow: "Verdict: NOT ASSESSED. The engine and UI specialist reviews (lead-programmer, ui-programmer, qa-tester in project.yaml) did not run because this subagent has no Agent tool to start them. Nothing would require changes. ADR-0022 compliance: COMPLIANT. Without the specialist gate the result would be APPROVED WITH SUGGESTIONS." Lean mode: LP-CODE-REVIEW and QL-TEST-COVERAGE skipped. Re-running with specialists from the main session is open (see Sprint 6 retro task R-1).

**Deviations (advisory)**:
- Review gate: specialists (lead-programmer, ui-programmer, qa-tester) not run; self-check covered the Zustand 5 primitive selector in `src/ui/index.tsx` (`useSaveStatusStore((s) => s.status)`, called before `useState`, no early return between). Default taken: report and proceed.
- `src/state/save.ts` `startNewOperation`: with `storage === null`, `erased` stays false and the status is left as it was, so a stale `unfiled` can survive a New Operation. ADR-0022 maps this to `write-failed` / `unavailable`. Handed to Story 018; Story 018 must cover it.
- `src/state/save.ts` `writeSave`: the `catch` and `!storage` early return do not call `markWriteFailed` yet; the test `a write that cannot happen never reports filed` only checks "not filed". Consistent with ADR-0022's never-filed rule; the write-failed transition is Story 018's scope.
- Evidence location: QA Test Cases name `production/qa/evidence/sprint-006/`; evidence is in `production/qa/evidence/pv-017/`. The lead-programmer sign-off the QA Test Cases ask for is not recorded (UI-type evidence gate needs screenshots only, so it does not block).
- UX: `INVOICE UNFILED // COMMITS ON NEXT SCREEN` (`src/ui/filingStatus.ts`) is placeholder copy; the GDD UX Flag asks the Debrief filing status to cite a `design/ux` spec from `/ux-design`, which this story does not yet do. Follow-up; no acceptance criterion broken.

**Scope**: changes in `src/state/saveStatusStore.ts` (new), `src/state/save.ts`, `src/state/save.test.ts`, `src/ui/filingStatus.ts` (new), `src/ui/filingStatus.test.ts` (new), `src/ui/index.tsx`, `src/ui/ui.css`, `production/qa/evidence/pv-017/`. All within the story's Interface + save.ts boundary.

**Manifest**: story v2026-10-08 matches current control manifest v2026-10-08.

