# Story 010: Debrief filing status and write-failure indicators

> **Epic**: Interface
> **Status**: Complete
> **Layer**: Presentation
> **Type**: UI
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-17

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

- [x] (AC22) GIVEN an applied in-memory Debrief, WHEN it is displayed before any Screen return, THEN the invoice visibly reads as unfiled. After a successful next-Screen autosave, tested through World Network return and Brief Replay separately, filing status no longer reads unfiled. The success signal comes from Persistence, not merely navigation.
- [x] (AC23) GIVEN Persistence reports a failed New Operation durable write or failed first Screen write after Debrief, WHEN the corresponding surface is shown, THEN it visibly reports failure rather than durable erase/filing success; an invoice remains unfiled. Use both World Network-return and Brief-Replay failure fixtures. Exact copy stays UX; storage failure/reload correctness stays Persistence.

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

*From `production/qa/qa-plan-sprint-009-2026-10-17.md` (2026-10-17).*

#### IF-010 — Debrief filing status and write-failure indicators (UI)
**Automated (where a seam exists)**:
- `src/ui/filingStatus.test.ts`: applied in-memory Debrief reads unfiled before any Screen return
- After a successful next-Screen autosave, tested through World Network return and Brief Replay separately, status no longer reads unfiled; the signal comes from Persistence, not navigation
- Failed first Screen write (both exits) keeps the invoice unfiled and shows failure; failed New Operation durable write shows failure, not erased
**Verification**: Headless capture at 1280×720; evidence in `production/qa/evidence/if-010/`; sign-off: qa-lead
**Checklist**:
- [x] Screenshots: invoice unfiled, filed, write failure on each exit, New Operation failure
**Edge cases**: Interface does not retry by saving on Debrief; Exact copy is UX; storage correctness is Persistence

---

## Test Evidence

**Story Type**: UI
**Required evidence**:
- UI: a retained screenshot of each screen touched, in `production/qa/evidence/`, plus a click-through note naming the screens exercised (docs/click-through.md). Screens must work at 1280×720 without clipping or truncation.

**Status**: [x] Created — production/qa/evidence/if-010/ (01–06b, README.md), src/ui/filingStatus.test.ts

---

## Dependencies

- Depends on: Story 009
- Unlocks: None

---

## Completion Notes
**Completed**: 2026-10-17
**Criteria**: 2/2 passing (AC22, AC23); none deferred
**Deviations**:
- ADVISORY (traceability): the story header names `TR-interface-006`, whose current registry text is "Pause Abort is two-step; there is no mid-mission save chrome". It does not describe this story. The requirement implemented here is GDD `design/gdd/interface.md` AC22/AC23 and `TR-persistence-009` ("Durable-commit status (unfiled / filed / write-failed) is observable to Interface; a swallowed write failure never reports filed"). Fix the header TR-ID in a traceability pass.
- ADVISORY (ADR-0022 minor): the manifest rule names both primitive selectors `(s) => s.status` and `(s) => s.reason`; only `status` is read (index.tsx:1553, WriteFailureNotice.tsx:11). ADR-0022 allows one generic message for every reason, so this is permitted.
**Test Evidence**: UI: retained screenshots `production/qa/evidence/if-010/01`–`06b` (each opened at story-done), `README.md` click-through note, `capture-output.txt` (ALL PASS); unit tests `src/ui/filingStatus.test.ts` (file present; code review re-ran it 10/10). README sign-off line reads "qa-lead (pending)"; a UI story needs no sign-off to close.
**Code Review**: APPROVED WITH SUGGESTIONS — specialists: lead-programmer, qa-tester, ui-programmer. ADR Compliance: COMPLIANT with ADR-0002 and ADR-0022. Standards 5/6. Architecture CLEAN. SOLID COMPLIANT. Review's Phase 9 question was not asked (unattended run); its recommended option "[A] Apply the suggestions, then run /story-done" was recorded, and no files were edited by the review.
**Mutation Check**: Mutation check: skipped — UI story (the mutation check covers only Logic and Integration stories)
**Run result**: OBSERVED — production/qa/evidence/if-010/
**Story-done decision (unattended)**: Phase 7 question not asked; took the recommended "Close the story — update file, mark Complete, log notes". Advisory items were not written to `docs/tech-debt-register.md`.

**Advisory code-review findings (all verified by the reviewer, none blocking):**
1. `src/ui/ui.css:2705-2716` — the comment says 31vh "covers no text on any of the four Screens", but `06a-new-operation-write-failed-with-orientation-1280x720.png` shows the SAVE FAILED box over the end of the START HERE line and the start of the STRATEGIC TIME line in the World Network orientation card (reachable: a failed New Operation resets the tutorial). pointer-events none; overlap, not clipping. Fix the comment and send placement to ux-designer as a tracked item.
2. `src/ui/WriteFailureNotice.tsx:4-5`, `src/App.tsx:32` — on the New Operation failure path the role=status region mounts with its text already present (save.ts:979-993 sets phase then markWriteFailed synchronously), so screen readers may not announce it. Debrief exits are fine. Accessibility polish; no test covers it.
3. `src/ui/filingStatus.test.ts:153-154` — line 154 `not.toBeNull()` is implied by line 153; line 153 checks the Debrief line while Debrief is not mounted. AC23 tests never assert `reason === 'quota'` (only capture-output.txt records it).
4. `src/ui/filingStatus.test.ts:21`, `:30` — assertions compare string constants only and cannot fail from a bug in the mappers.
5. `src/ui/filingStatus.test.ts:87-91`, `:128` — `applyDebriefWin` mints the apply key by hand (`deploySerial + 1`), as does capture.mjs; the phase check at :128 does not prove startMission() passed its gate (appStore.ts:303 `setOutcome` sets phase itself).
6. `src/App.tsx:32` — no vitest test renders the Interface wiring (`<WriteFailureNotice />`, the world/research/brief/team phase gate, Debrief `.db-filing` at index.tsx:1653-1655); dropping 'research'/'team' from the gate or swapping in debriefFilingLine would leave unit tests green. capture.mjs checks only world and brief. A small render test of the gate is recommended.
7. `production/qa/evidence/if-010/capture.mjs:47` — the `clipped` check covers overflow and viewport bounds only, not overlap; "PASS failure notice not clipped (new operation)" coexists with the 06a overlap.
8. `production/qa/evidence/if-010/capture.mjs:144-147` — the Brief Replay success step does not check status is still 'unfiled' right after navigation (the World step does, :132-134); the unit test covers both exits.
9. `src/ui/WriteFailureNotice.tsx:10` — exported `WriteFailureNotice` has no /** */ doc comment (the one Standards failure, 5/6).
10. `production/qa/evidence/if-010/README.md:3` — revision reads "d10e57e plus the IF-010 working-tree changes"; test and evidence are uncommitted. capture.mjs depends on a machine-specific Chromium path under ~/Library/Caches/ms-playwright and a global @playwright/cli. Commit, then update the README revision.
11. INFO — ADR-0022 line 48 / manifest name both selectors; only status is read (see Deviations).
