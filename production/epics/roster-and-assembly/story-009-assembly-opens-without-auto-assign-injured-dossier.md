# Story 009: Assembly opens without auto-assign; Injured dossier is inspect-only

> **Epic**: Roster and Assembly
> **Status**: Complete
> **Layer**: Feature
> **Type**: UI
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-16

## Context

**GDD**: `design/gdd/roster-and-assembly.md`
**Requirement**: `TR-roster-001`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0019: Deploy gate  
**ADR Decision Summary**: Deploy needs a contract, a squad of at least one, every member READY, and mass ≤ 400 kg; `src/game/mass.ts` owns the kilogram functions.
**ADR Version**: 2026-09-11 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Feature Layer Rules, manifest 2026-10-08).
- Forbidden: `MASS_LIMIT_KG` in `world.ts`; Tactical re-checking or relaxing the gate; raw `goto('mission')` as a start API.
- Guardrail: no per-frame work; no per-frame React state (CLAUDE.md); deterministic campaign RNG preserved.

---

## Acceptance Criteria

*From GDD `design/gdd/roster-and-assembly.md`, scoped to this story:*

- [x] **GIVEN** all 4 Squad bays empty after KIA or new injury and at least 1 Ready still on Roster, **WHEN** Assembly is opened, **THEN** all 4 bays stay empty (no auto-assign). *(GDD AC 7)*
- [x] **GIVEN** an Injured dossier, **WHEN** it is focused, **THEN** inspection is allowed and assign is refused. *(GDD AC 23)*

---

## Implementation Notes

*Derived from the governing ADRs and the Feature Layer Rules:*

- A kill or new injury may empty all four bays; opening Assembly must not refill them.
- Injured dossier focus is allowed; its assign control is refused.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 008: store-level assign rules.
- Interface epic owns Assembly layout.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-007-2026-10-15.md` (2026-10-15).*

**Verification method**: In-app browser (or `playwright-cli`) click-through + retained screenshots
**Who must sign off**: ui-programmer (lean mode: story owner) with qa-tester review
**Evidence to capture**: `production/qa/evidence/ra-009/` — screenshots at 1280x720 and at 125% text scale

Checklist:
- [x] After a debrief where every assigned operative is KIA or newly Injured and ≥ 1 Ready remains, Assembly opens with all 4 Squad bays empty (AC 1)
- [x] Deploy is refused on that screen with the NO OPERATIVES ASSIGNED reason (not a mass or contract reason)
- [x] Focusing an Injured row body opens its dossier (inspection allowed) (AC 2)
- [x] The Injured row's assign key is disabled and its tooltip reads `OPERATIVE INJURED // ADVANCE WORLD TIME TO RECOVER` (AC 2)
- [x] Focusing any dossier leaves the bay contents unchanged
- [x] No row, tooltip or bay text is clipped at 1280x720 or 125% text scale (Sprint 6 Sectors clipping risk)

Reaching the AC 1 state needs a mission outcome; use the dev Balance/debug path or a constructed save, and record which in the evidence doc.

---

## Test Evidence

**Story Type**: UI
**Required evidence**:
- UI: a retained screenshot of each screen touched (Assembly), in `production/qa/evidence/`, plus a click-through note naming the screens exercised (docs/click-through.md). Screens must work at 1280×720 without clipping or truncation.

**Status**: [x] Created — `production/qa/evidence/ra-009/` (3 screenshots at 1280x720, 100% and 125% text scale; click-through record in `README.md`). Store-level coverage already in `src/state/campaignStore.test.ts` (RA-008 "refuses to assign an Injured operative (AC 75)"; RA-014 "the last assigned dying with Ready left leaves the bay empty, auto-assigns nobody").

---

## Dependencies

- Depends on: Story 008
- Unlocks: None

---

## Completion Notes
**Completed**: 2026-10-16
**Criteria**: 2/2 passing (GDD AC 7, AC 23); QA checklist 6/6 observed. No deferred items.
**Deviations**: None. No source files changed; the behavior already existed in `src/state/debrief.ts`, `src/state/appStore.ts` and `src/ui/index.tsx` (`TeamSelect`, Injured assign title at line 1187).
**Test Evidence**: UI: retained screenshots `production/qa/evidence/ra-009/01-assembly-empty-bays-1280x720.png`, `02-injured-dossier-focused-1280x720.png`, `03-injured-dossier-125pct-1280x720.png`; click-through record `production/qa/evidence/ra-009/README.md`. Store-level test files present (existence only, not run here): `src/state/campaignStore.test.ts:696` and `:953`.
**Code Review**: Complete. `/code-review` returned APPROVED WITH SUGGESTIONS (evidence-only scope; ADR-0019 COMPLIANT; Engine Specialist N/A).
**Gates**: QL-TEST-COVERAGE skipped (lean mode). LP-CODE-REVIEW lean prompt answered "Yes — /code-review passed or was approved with suggestions" (unattended run). Phase 7 close option auto-picked "Close the story (Recommended)" under autonomous mode.

**Traceability**:

| Criterion | Test | Status |
|-----------|------|--------|
| AC 7: no auto-assign with all bays empty | `production/qa/evidence/ra-009/01-assembly-empty-bays-1280x720.png`; `src/state/campaignStore.test.ts:953` | COVERED |
| AC 23: Injured dossier inspect-only | `production/qa/evidence/ra-009/02-injured-dossier-focused-1280x720.png`; `src/state/campaignStore.test.ts:696` | COVERED |

**Advisory findings (from /code-review, carried forward)**:
- Tooltip text verified in the DOM only; the native `title` tooltip is not drawn in headless screenshots, and a tooltip on a `disabled` button is browser-dependent. Take one headed hover screenshot if on-screen proof is wanted.
- Only mouse focus tested for AC 23; keyboard and gamepad focus are stated exclusions in the README.
- AC 7 state was constructed (Squad and stored outcome set directly, then the real `applyDebrief('m01')`), as the story allows; a natural playthrough reaching it would add confidence.
- At 125% text scale the header `0 / 4 ASSIGNED` and `ROSTER 7 / 8` wrap to a second line, KESTREL sits at the roster list scroll edge with a scroll indicator, and bay labels wrap. No text is cut off (DOM scan: 0 overflowing elements). Header reflow is a layout-polish item for the Interface epic.
- qa-tester testability review was done inline (no Agent tool in the unattended run); manual QA steps, Injured rows (GHOST, RAVEN), refusal strings and cited tests were checked by hand.

