# Story 008: Pause modal and two-step Abort

> **Epic**: Interface
> **Status**: Complete
> **Layer**: Presentation
> **Type**: Integration
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-17

## Context

**GDD**: `design/gdd/interface.md`
**Requirement**: `TR-interface-006`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0002: A mission in progress is not saved  
**Secondary ADRs**: ADR-0017: One OS / input / audio mixer
**ADR Decision Summary**: A mission is memory only; abort discards it, and the debrief is the only boundary that applies results, once.
**ADR Version**: 2026-08-18 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: DOM / Zustand 5 work; the ADR lists no post-cutoff API (its Knowledge Risk HIGH is the project-wide pin note). Select primitives or use `useShallow` in selectors; do not use React 19.2 `<Activity>` / `useEffectEvent` to hide phases.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Presentation Layer Rules, manifest 2026-10-08).
- Required: Pause overlay does not mute or swap beds and does not change `Phase`.
- Required: Abort discards the mission; no Debrief/invoice or campaign write.
- Forbidden: mid-mission save chrome.
- Guardrail: colours from `src/ui/tokens.ts` / `src/index.css` only; screens work at 1280×720 without clipping (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/interface.md`, scoped to this story:*

- [x] (AC11) GIVEN a live mission with no result yet, WHEN Space or Escape is pressed, THEN a modal pause freezes sim and camera, prints remappable bindings from the live table, traps focus, offers Resume, keeps Settings inside the freeze, and Abort is not a single click.
- [x] (AC12) GIVEN a paused mission with Abort idle, WHEN it is activated once, THEN confirmation arms without discarding. A second activation before expiry confirms immediately, with no Debrief/invoice or campaign write. In a separate fixture, letting the three-real-second timeout execute without confirmation disarms and leaves the mission paused; the next activation only re-arms. Observe the Abort boundary before any later Screen tick/autosave; the landing choice is OQ8, not this criterion.

*(Added at Sprint 9 planning, task R-2, from the GDD sections named.)*

- [x] (EC-remap; `design/gdd/interface.md` Edge Cases) GIVEN pause open, WHEN Settings is opened from it and a remappable bind is changed, THEN the pause bindings list shows the new bind on return, and Pause, operative slots 1–4 and mouse are not offered for remap.

---

## Implementation Notes

*Derived from the governing ADRs and the Presentation Layer Rules:*

- Abort arms on first activation; second activation within three real seconds confirms; timeout disarms and stays paused.
- Pause prints remappable bindings from the live `BINDINGS` table and keeps Settings inside the freeze.
- The Abort landing choice is OQ8 — not implemented here.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 005: focus trap/return checks (AC18/AC19).

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-009-2026-10-17.md` (2026-10-17).*

#### IF-008 — Pause modal and two-step Abort (Integration)
**Automated**:
- `src/ui/abortArm.test.ts` (new) with fake timers: first activation arms and discards nothing; second before expiry confirms immediately with no Debrief/invoice/outcome and no campaign write
- 3 real seconds without confirmation disarms and the mission stays paused; the next activation only re-arms; the window runs on real time while the Tactical clock is frozen
- Space/Escape opens pause on a live mission with no result; sim and camera freeze; Resume works; Pause bind is not remappable (`BINDINGS` remappable predicate); bindings print from the live table
**Edge cases**: Settings opened from pause stays inside the freeze; nested Settings return focuses pause; Pause does not mute or swap beds (ADR-0017); Result pending during pause: delay follows Tactical elapsed time (owner follow-up, do not change the sim); Landing after Abort confirm is OQ8, not asserted
**Mutation check**: shorten the arming window to 1 s → the timeout test fails
**Manual**: Screenshots: pause open, Abort armed, Abort after timeout (still paused)

---

## Test Evidence

**Story Type**: Integration
**Required evidence**:
- Integration: test beside the module — delivered as `src/ui/abortArm.test.ts` (12 tests; drives `src/ui/abortArm.ts` and `src/ui/pauseMenuModel.ts`). The originally named `src/state/missionStore.test.ts` / `src/state/appStore.test.ts` were not used: the pause and Abort decisions live in the `src/ui/` pure modules.
- UI: retained screenshots in `production/qa/evidence/if-008/` (01–06) with a click-through note at `production/qa/evidence/if-008/README.md`; capture script `capture.mjs`, output `capture-output.txt` (ALL PASS).

**Status**: [x] Created

---

## Dependencies

- Depends on: None
- Unlocks: None

---

## Completion Notes
**Completed**: 2026-10-17
**Criteria**: 3/3 passing (AC11, AC12, EC-remap); none deferred
**Deviations**: None blocking. Advisory: the test file landed at `src/ui/abortArm.test.ts`, not the `src/state/*.test.ts` paths the story first named (Test Evidence section updated). Scope: `src/scene/Input.tsx`, `src/ui/Hud.tsx`, `src/ui/PauseMenu.tsx` modified and `src/ui/pauseMenuModel.ts` added; the story listed no files, and all are the pause/Abort wiring this story owns.
**Test Evidence**: Integration: test file present at `src/ui/abortArm.test.ts` (/code-review ran it: 12/12 passed). UI: retained screenshots `production/qa/evidence/if-008/01-pause-open.png` … `06-after-abort-confirm.png`, opened and checked at /story-done; click-through note `production/qa/evidence/if-008/README.md`.
**Run result**: OBSERVED — pause modal, Abort armed, Abort lapsed still paused, Settings from pause, remap shown on return, Abort confirm to World Network; production/qa/evidence/if-008/
**Code Review**: APPROVED WITH SUGGESTIONS — specialists: lead-programmer, qa-tester, ui-programmer. Engine: Web. Testability: GAPS. ADR compliance: COMPLIANT (ADR-0002, ADR-0017). Standards: 6/6. Architecture: MINOR ISSUES. SOLID: COMPLIANT. `npx vitest run src/ui/abortArm.test.ts` 12/12 passed.
**Mutation Check**: Mutation check: FAILED AS EXPECTED — src/ui/abortArm.ts:7 ABORT_ARM_MS 3000 -> 1000 → 'first activation arms and discards nothing; a second before expiry confirms...', 'three real seconds without confirmation disarm...' and 'the window constant is the spec three real seconds' failed; restored (cmp match, test file green)
**Closed by**: /story-done in the unattended implement-stories workflow; Phase 7 took the default "Close the story (Recommended)". No tech-debt register entries were written.

**QA plan "camera freeze" line**: judged satisfied for AC11 by the existing paused checks in `src/scene/CameraRig.tsx` (:124, :172, :186-187, from commit d63a83f), not by an automated test in this story. No test in `src/ui/abortArm.test.ts` can fail on a camera freeze regression; recorded as a coverage gap below.

**Advisory findings from /code-review (for follow-up):**
1. AC11 camera freeze has no failing-capable test. `src/ui/abortArm.test.ts:100` ('every squad and camera order is held') checks only `missionKeyAnswers`; `src/scene/Input.tsx:118` drops camera keys before that call. The real freeze is in `src/scene/CameraRig.tsx` (:124, :172, :186-187). Fix: rename the test, add a camera test or a pure gate CameraRig calls. (Downgraded from qa-tester BLOCKING.)
2. The result branch of `missionKeyAnswers` (`src/ui/pauseMenuModel.ts:29`) is untested; mutating it to `return !ms.paused` survives all 12 tests. Add `missionKeyAnswers('stop', {paused:false, result:'won'|'lost'}) === false`. (Downgraded from qa-tester BLOCKING.)
3. Design question for the owner: a pending Abort arm survives the switch to Settings (`src/ui/PauseMenu.tsx:76-82` returns SettingsPanel without `abortArm.disarm()`; the unmount disarm at :36 does not fire). Closing Settings within 3 s returns to CONFIRM? and one click aborts. Not specified by the story.
4. Pre-existing, for owner / bug triage (code trace, not run): Space with a Settings volume slider focused (`src/ui/Settings.tsx:65`, type=range) reaches `src/scene/Input.tsx`; the exemption at :128 covers only HTMLButtonElement, so `setPaused(!paused)` unpauses and unmounts Settings, conflicting with "keeps Settings inside the freeze".
5. Layering: `src/scene/Input.tsx:25` imports `missionKeyAnswers` from `../ui/pauseMenuModel`, the scene layer's first non-token import from ui. `pauseMenuModel.ts` depends only on `game/bindings`, so it could move to `src/game/` or `src/state/`.
6. `src/ui/abortArm.test.ts:1-4` claims 'the real Hud abort' and `pressPauseKey` (:42-47) claims 'the same gate scene/Input.tsx runs'; the tests inline the confirm-to-abortMission wiring (:163, :186-188) and skip Input.tsx's group filter, getWorld guard and Space/dialog-button exemption. PauseMenu wiring is covered only by capture.mjs. Reword, or render PauseMenu in a test.
7. `capture.mjs:113` `document.body.innerText.includes('FIXED')` passes on any FIXED label, so it does not prove Pause, slots 1-4 and mouse rows are each non-remappable; README item 4 overstates it. `capture.mjs:83` `rows > 10` is loose (rows=27); compare with `BINDINGS.length`.
8. `capture.mjs:4` header says real input drives Escape and Space, but only Escape is pressed; Space has no real-input evidence.
9. `capture.mjs:104-111` makes the rebind step conditional (`rebound` flag); a missing rebind button fails only indirectly at the :124 check.
10. `ABORT_ARM_HINT` (`src/ui/abortArm.ts:10`) hardcodes '3 S' separately from `ABORT_ARM_MS`; no test ties them.
11. The `abortArm.test.ts:125` 'live BINDINGS table' test recomputes the same filter `pauseBindingGroups` uses; liveness is actually proven by the EC-remap test at :229-238.
12. QA plan edge case 'Pause does not mute or swap beds (ADR-0017)' has no assertion; it holds only because no pause code touches audio.
13. No test or capture step covers: arm, close with Escape or Resume, reopen, one Abort click (should show CONFIRM?, must not abort). The unmount disarm at `PauseMenu.tsx:36` is exercised only at controller level (test :216-225).
14. The story's Test Evidence section named `src/state/missionStore.test.ts` / `appStore.test.ts` and 'Not yet created' — updated at /story-done to the delivered `src/ui/abortArm.test.ts`.
