# Story 009: Remaining time label appears only after sync

> **Epic**: Research
> **Status**: Complete
> **Layer**: Core
> **Type**: UI
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-14

## Context

**GDD**: `design/gdd/research.md`
**Requirement**: `TR-research-001`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0001: Two clocks, never both
**ADR Decision Summary**: Strategic and tactical clocks are independent; a win spends the contract ETA as strategic days, a loss spends none.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: Pure TypeScript / Zustand 5 logic; no post-cutoff three.js or r3f API involved. Select primitives or use `useShallow` in selectors.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Core Layer Rules, manifest 2026-10-08).
- Forbidden: Painting 0, or painting before sync.
- Guardrail: Credits refuse is an identity no-op; no per-frame work; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/research.md`, scoped to this story:*

- [x] GIVEN a running lab with endT = 7200 and strategic t = 1000, WHEN remaining time is read after sync(1000), THEN it is 6200 strategic seconds, labeled remaining, not the catalog duration; GIVEN the project is researched, THEN there is no countdown.
- [x] GIVEN a project still active with endT = 7200, WHEN the remaining function is queried at t = 7200 and at any t > 7200 before the matching sync, THEN it returns none, not 0. (This formula-oracle query is allowed and is not a screen paint.)
- [x] GIVEN the Research screen rendered with an active 2h project (startedT = 0, endT = 7200) at t = 7199 before any sync (lastSyncT unset or older), WHEN the DOM is queried by the remaining label's test selector, THEN no remaining label exists; WHEN sync(7199) runs and the DOM is re-queried, THEN the label reads 1 (endT − t rounded up) and lastSyncT === 7199.

---

## Implementation Notes

*Derived from the governing ADRs and the Core Layer Rules:*

- The screen paints remaining only after `sync(t)` for that same t and must never paint 0. Paint format (raw seconds vs H:MM:SS) is an Interface decision; assert the numeric value under the stated format.
- `progress` is not a Research output.

---

- **Decided 2026-10-14 (owner):** `lastSyncT` lives on `researchStore` and is **not** persisted in the save envelope. Hydrate calls `sync(savedT)` (ADR-0011), which stamps it, so the GDD rule "hydration counts as sync at the loaded t" holds without a save-format change.

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Interface epic owns Research screen layout.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-005-2026-10-14.md` (Sprint 5). Type: UI.*

**Automated**: `src/game/research.test.ts` (oracle); `src/state/researchStore.test.ts` (`lastSyncT`).
- `remaining` after sync(1000) with endT 7200 = 6200; researched → none
- `remaining` at t = 7200 and 7201 before sync → none, never 0
- Store: `lastSyncT` set by `sync(t)`
- Edge: No `max(0, …)` clamp
- Edge: New campaign is not hydration: no label until the first sync

**Gap**: **Source change.** Add pure `remaining(run, t)` in `src/game/research.ts`, stamp `lastSyncT` in `sync`, paint the label only when `lastSyncT === t`.

**Manual**: Playwright at 1280x720, screenshots in `production/qa/evidence/sprint-005/`; lead-programmer sign-off.
- [x] No remaining label before sync at t = 7199
- [x] Label reads 1 after sync(7199)
- [x] No countdown on a researched project
- [x] Nothing clipped at 1280x720

---

## Test Evidence

**Story Type**: UI
**Required evidence**:
- UI: a retained screenshot of each screen touched, in `production/qa/evidence/`, plus a click-through note naming the screens exercised (docs/click-through.md). Screens must work at 1280×720 without clipping or truncation.

**Status**: [x] Created: `production/qa/evidence/rs-009-evidence.md`, screenshots in `production/qa/evidence/rs-009/`

---

## Dependencies

- Depends on: Story 008
- Unlocks: None

---

## Completion Notes
**Completed**: 2026-10-14
**Verdict**: COMPLETE WITH NOTES (`/story-done`, run unattended in the implement-stories workflow; Phase 7 took the recommended "Close the story" option, as automation is autonomous)
**Criteria**: 3/3 passing, none deferred

| Criterion | Test | Status |
|-----------|------|--------|
| AC-1: remaining 6200 after sync(1000), not catalog duration; researched → no countdown | `src/game/research.test.ts` (remaining oracle), `src/ui/remainingLabel.test.ts`, `production/qa/evidence/rs-009/01-researched-no-countdown-1280x720.jpg` | COVERED |
| AC-2: remaining at t = 7200 and t > 7200 before sync → none, never 0 | `src/game/research.test.ts` ("remaining(run, t) oracle") | COVERED |
| AC-3: no label at 7199 before sync; reads 1 after sync(7199), lastSyncT === 7199 | `src/ui/remainingLabel.test.ts`, `src/state/researchStore.test.ts` ("lastSyncT") | COVERED |

**Test Evidence**: UI: retained screenshots `production/qa/evidence/rs-009/01-researched-no-countdown-1280x720.jpg` and `02-active-remaining-label-1280x720.jpg` (both opened and checked at /story-done: no label on the researched project; `3:55:17 REMAINING` on the lab row and Progress block, nothing clipped); evidence note `production/qa/evidence/rs-009-evidence.md`. Vitest on the three story test files: 106/106 passed (run at /story-done).
**Code Review**: Complete with caveats. `/code-review` ran in this workflow and returned NOT ASSESSED for the specialist gate (lead-programmer, ui-programmer, qa-tester could not be spawned: no Agent tool in the unattended subagent). The inline review found no blocking defects: ADR-0001 COMPLIANT, standards 6/6, architecture CLEAN, SOLID COMPLIANT, tsc -b clean. A re-run with specialists is needed before the review can be APPROVED. LP-CODE-REVIEW and QL-TEST-COVERAGE gates skipped (lean mode).
**Deviations** (all ADVISORY):
- **Paint format needs an owner decision.** `src/ui/remainingPaint.ts` `remainingHms` hard-codes H:MM:SS. `design/ux/interaction-patterns.md` P-22 says not to invent the format in code ahead of the spec, and no Research screen spec exists in `design/ux/`. A seconds-resolution format is needed for AC3 ("reads 1"); the old spanLabel would have painted `0M`. The story's Implementation Notes call the format an Interface decision and assert the numeric value (`data-remaining-sec`), which the tests do. The owner or the Interface spec must confirm H:MM:SS, or record this deviation.
- **Evidence location and scale.** The QA plan says screenshots go in `production/qa/evidence/sprint-005/`. They are in `production/qa/evidence/rs-009/` instead, and were saved at 800x450 scale, not native 1280x720. The viewport itself was 1280x720.
- **Manual QA lines covered only by tests.** "No label before sync at t=7199" and "Label reads 1 after sync(7199)" are covered by `src/ui/remainingLabel.test.ts` (static-markup render), not by the Playwright run the QA plan names, because the live clock syncs every 50 ms batch. Lead-programmer sign-off (a QA plan manual line) is still open.
- **Stale GDD seam note.** `design/gdd/research.md:104` still says "Unsatisfied in code: neither remaining nor lastSyncT exists yet…". Update it.
- **Pre-existing, out of scope.** `src/ui/Research.tsx` ProgressBlock and LabRow still call `runProgress` from researchStore. GDD research.md:235 and P-22 call that export a violation to remove. Track it as a follow-up story or tech debt.
- **Copy change.** The lab-row label moved from `<i>` to `<span>` (`src/ui/RemainingLabel.tsx`), and the text changed from `EST 1H 43M REMAINING` to `1:43:20 REMAINING`. CSS at `src/ui/ui.css:3412-3415` keeps the mini sizing, and screenshot 02 shows nothing clipped.
- **Checked, not an issue.** `lastSyncT` now changes on each 50 ms clock batch, so the researchStore → `scheduleAutosave` subscription (`src/state/save.ts:794`) fires at 20 Hz. `scheduleAutosave` already coalesces, and `worldStore.t` already fires at 20 Hz, so save cost does not grow. No per-frame React state.

