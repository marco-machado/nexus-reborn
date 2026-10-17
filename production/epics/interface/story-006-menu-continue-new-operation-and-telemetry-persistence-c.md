# Story 006: Menu Continue, New Operation, and telemetry persistence chrome

> **Epic**: Interface
> **Status**: Complete
> **Layer**: Presentation
> **Type**: UI
> **Estimate**: 1.5 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-17

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

- [x] (AC9) GIVEN Menu with no valid campaign blob vs a valid blob, WHEN Continue is read, THEN Continue is absent vs present accordingly (Persistence owns validity).
- [x] (AC17) GIVEN recorded nondefault Settings (Difficulty, Quality, at least one remap, text scale, telemetry toggle) and a progressed campaign, WHEN New Operation is confirmed under successful storage conditions, THEN those Settings still match; campaign Credits, Intel, contractsWon, laboratories and tutorial-seen match Persistence’s canonical fresh-operation fixture. Do not duplicate opening values or call a failed durable erase successful (AC23).
- [x] (AC21) GIVEN Persistence reports never-started, invalid/unreadable, and valid in separate Menu fixtures, WHEN Menu is displayed, THEN Continue is absent, absent, and present respectively; invalid/unreadable has a visible reason distinct from never-started. Interface does not validate the blob itself.
- [x] (AC25) GIVEN telemetry enabled with recorded history, WHEN recording is disabled, a mission finishes or Aborts, and recording is enabled again to inspect Balance, THEN the earlier records remain and the disabled interval added none. Successful Clear empties the log; New Operation does not. Balance remains reachable while recording is disabled because the log is nonempty (OQ9, closed).

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

*From `production/qa/qa-plan-sprint-009-2026-10-17.md` (2026-10-17).*

#### IF-006 — Menu Continue, New Operation, and telemetry persistence chrome (UI)
**Automated (where a seam exists)**:
- Three Menu fixtures: never-started → Continue absent; invalid/unreadable → Continue absent with a visible reason distinct from never-started; valid → Continue present (Interface does not validate the blob)
- New Operation two-step: first activation arms, campaign unchanged; confirm erases; Settings (Difficulty, Quality, one remap, text scale, telemetry toggle) survive; Credits, Intel, contractsWon, laboratories, tutorial-seen match Persistence's canonical fresh-operation fixture (read the fixture, do not copy its numbers)
- Telemetry: off → a finished or aborted mission adds no record; earlier records remain; Clear empties the log; New Operation keeps it; Balance reachable while recording is off and the log is nonempty
**Verification**: Headless capture at 1280×720; evidence in `production/qa/evidence/if-006/`; sign-off: qa-lead
**Checklist**:
- [x] Screenshots: Menu in the three states, armed New Operation, Balance with recording off
**Edge cases**: Failed durable erase is not reported as success (AC23, owned by IF-010); 3 real-second arming window (expiry disarms)

---

## Test Evidence

**Story Type**: UI
**Required evidence**:
- UI: a retained screenshot of each screen touched, in `production/qa/evidence/`, plus a click-through note naming the screens exercised (docs/click-through.md). Screens must work at 1280×720 without clipping or truncation.

**Status**: [x] Created — `production/qa/evidence/if-006/` (5 screenshots at 1280x720, text scale 125; `capture.mjs`, `capture-output.txt` ALL PASS; `README.md`); unit seam `src/ui/menuPersistence.test.ts`

---

## Dependencies

- Depends on: Story 001
- Unlocks: None

---

## Completion Notes
**Completed**: 2026-10-17
**Criteria**: 4/4 passing. AC9/AC21: store-level and rendered `MainMenu` markup tests for never-started, invalid and valid, plus screenshots 01-03. AC17: arm leaves the blob unchanged; confirm erases campaign fields to the fresh-operation state and keeps Settings (test checks each field was changed first); screenshot 04. AC25: disabled interval adds no record for abort or finish, with a positive control after Clear; Balance reachable with recording off (screenshot 05).
**Implementation**: Menu already had Continue gating, two-step New Operation and telemetry persistence. Added the Z3 save-status line (`src/ui/menuSaveLine.ts`, `src/ui/index.tsx`, `src/ui/ui.css`) with distinct copy per state. Re-review found the Menu CTA's closing chevron cut by its clip-path at scale 125; `.menu-actions .cta-inner` now fits and wraps rather than clips, and the IF-001 sweep now flags clip-path clipping (re-ran clean; negative control confirmed it fires).
**Deviations**: None against GDD/ADR. Advisory: TR-interface-003 does not describe this story's scope; consider re-pointing. An armed New Operation with no save keeps the label "<< NEW OPERATION >>" rather than the spec's confirm copy (left unchanged, out of scope).
**Test Evidence**: UI: screenshots in `production/qa/evidence/if-006/`; tests in `src/ui/menuPersistence.test.ts`.
**Code Review**: Two CHANGES REQUIRED rounds (test seams and evidence; then the clipped chevron and the AC25 positive control). Fixed, then re-reviewed: APPROVED WITH SUGGESTIONS, specialists: lead-programmer, qa-tester. Advisories kept: the CTA can grow taller if its copy wraps (re-run the main-menu.md 40% expansion check if copy changes); screenshot 05 does not itself show recording off (asserted in capture.mjs); the AC17 confirm path is tested through pressNewOperation/startNewOperation, not MainMenu's click handler; the 3 s arming expiry is covered only by the capture.
**Mutation Check**: skipped — UI story
