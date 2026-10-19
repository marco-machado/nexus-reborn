# Story 007: No celebration sting, spoken VO, or spatial shooter mix

> **Epic**: Audio
> **Status**: Complete
> **Layer**: Presentation
> **Type**: Visual/Feel
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-19

## Context

**GDD**: `design/gdd/audio.md`
**Requirement**: `TR-audio-004`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0017: One OS / input / audio mixer  
**ADR Decision Summary**: One palette, one remap table, four audio buses; DOM screens at 1280×720; keyboard and mouse only.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: DOM + Web Audio and Zustand 5; no post-cutoff three.js or r3f API involved (ADR Post-Cutoff APIs Used: None). Do not use `THREE.Audio` or React 19.2 `<Activity>` / `useEffectEvent`.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Presentation Layer Rules, manifest 2026-10-08).
- Forbidden: Never payout celebration sting, spoken VO, or spatial shooter mix.
- Forbidden: Never `PannerNode` / `StereoPannerNode`.
- Guardrail: No `public/` assets — audio loads with Vite `?url` from `inspiration/audio/`; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/audio.md`, scoped to this story:*

- [x] GIVEN Debrief (including quiet replay) or Abort-armed pause, WHEN the mix is heard, THEN there is no celebration sting and no mission-end sting on Abort arm.
- [x] GIVEN the shipping mix, WHEN spoken VO or a spatial-panned shooter model is listened for, THEN neither is present.

---

## Implementation Notes

*Derived from the governing ADRs and the Presentation Layer Rules:*

- Debrief (including quiet replay) and Abort-armed pause play no sting. Acknowledgements are a selection click on the UI bus.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 002: the reference mix.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-009-2026-10-17.md` (2026-10-17).*

#### AU-007 — No celebration sting, spoken VO, or spatial shooter mix (Visual/Feel)
**Automated (where a seam exists)**:
- Mocked-context test (advisory, if a seam exists): entering Debrief, including quiet replay, requests no sting; arming Abort requests no mission-end sting
- Smoke grep (not a suite test): no `PannerNode`, `StereoPannerNode`, `THREE.Audio`, `PositionalAudio` or `AudioListener` under `src/` (control manifest Never list)
**Verification**: evidence in `production/qa/evidence/au-007/`; sign-off: audio-director (lead sign-off)
**Checklist**:
- [ ] Listening-evidence note in `production/qa/evidence/au-007/`: Debrief (win, loss, quiet replay) and Abort-armed pause; listen for any VO or panned shooter mix (the user listens)
**Edge cases**: Quiet replay Debrief stays paperwork-quiet; Abort confirm stops the mission bed as on any leave; Spoken VO or spatial audio is out of scope unless §18 reopens

---

## Test Evidence

**Story Type**: Visual/Feel
**Required evidence**:
- Visual/Feel: a listening-evidence note with the recorded settings and scenarios in `production/qa/evidence/`, plus a lead sign-off. Name the screens exercised (docs/click-through.md, Audio changes).

**Status**: [x] Listening pass run 2026-10-19 (rows 1–6 pass; row 6 on headphones), audio-director sign-off recorded, screenshots retained for the three Debriefs and both Abort states — `production/qa/evidence/au-007/`. Advisory automated test `src/game/audio.noCelebration.test.ts` (6 tests, `7a38fcd`).

---

## Dependencies

- Depends on: Story 002
- Unlocks: None

---

## Open for Sign-off
**State (2026-10-17)**: advisory automated test, smoke grep, browser probe, listening-evidence note and code review are done; closure waits only on the listening pass and the audio-director sign-off, which only a person can give. `/story-done` verdict: NOT ASSESSED (AC-1 and AC-2 are "when the mix is heard" and nobody has listened; Visual/Feel sign-off pending). No failing criterion. No code change was needed: the shipping code has no celebration sting, no mission-end sting on Abort, no VO and no panner.
- **Review**: `/code-review` APPROVED WITH SUGGESTIONS — specialists: lead-programmer, qa-tester, gameplay-programmer. Engine specialist findings ISSUES FOUND (advisory only); Testability N/A for a Visual/Feel story (manual steps checked and doable); ADR Compliance COMPLIANT (ADR-0017); Standards 6/6 apply to a test file; Architecture CLEAN; SOLID COMPLIANT. `npx vitest run src/game/audio.noCelebration.test.ts`: 6 passed (re-run by `/story-done` 2026-10-17, 6 passed).
- **Mutation Check**: Mutation check: skipped — Visual/Feel story
- **Needs the user**: fill the Settings table (revision, browser/OS, output device) in `production/qa/evidence/au-007/README.md`, run scenarios 1-6 at the reference mix (headphones for scenario 6), fill the Observed and Status columns, and record the audio-director sign-off; then `/story-done` this story.
- **Criteria**:
  - AC-1 (no celebration sting on Debrief incl. quiet replay; no mission-end sting on Abort arm): automated parts in `src/game/audio.noCelebration.test.ts` (advisory, with the gaps below); listening scenarios 1-5 pending.
  - AC-2 (no spoken VO, no spatial-panned shooter mix): smoke grep for panner/speech APIs under `src/` returned no matches (re-run 2026-10-17); cue-set pin test; browser probe counted 0 panners and 0 utterances; listening scenario 6 pending.
- **Evidence note**: no screenshot retained; this is a listening story, so the listening-evidence note plus sign-off is the evidence its Test Evidence section names.
- **Manifest**: story v2026-10-08 matches current control manifest v2026-10-08. TR-audio-004 registry text ("No spoken VO, no spatial shooter mix, and no payout celebration sting") matches the story.
- **Evidence corrections made by `/story-done`**: `production/qa/evidence/au-007/README.md` Status lines reworded so they claim only what the tests check (outcome tests vs `threatLevel(0)`/`phase` asserts, Abort-arm test checks a pure controller, `abortMission` vs the MissionScreen cleanup, scenario 5 as the only evidence for the bed stop on Abort confirm), the revision line marked for replacement with the commit that adds the test, and the browser probe labelled a one-off observation.
- **Advisory findings (from `/code-review`)**:
  - SIGN-OFF PENDING: all six scenarios in `production/qa/evidence/au-007/README.md` are "not run", the audio-director sign-off is "(pending)", and the Settings rows (Revision, Browser/OS, Output device) are "(fill in)". Only a person can do this.
  - `src/game/audio.noCelebration.test.ts:161-172`: the Abort-arm test cannot fail; `src/ui/abortArm.ts` has no imports, so `allCalls()===0` holds by construction. The audio played on Abort is in `src/ui/PauseMenu.tsx:137-138` and is not run. Label it as a purity check of the arm controller, or test the click handler's audio.
  - `src/game/audio.noCelebration.test.ts:128,142,156,182`: the `applyDebrief` and `abortMission` checks cannot catch a regression where one would be added; `src/state/debrief.ts` and `src/state/missionLifecycle.ts` import no audio. The real end-of-mission audio paths (Debrief `useLayoutEffect` at `src/ui/index.tsx:1580-1582`, MissionScreen unmount cleanup at `src/ui/MissionScreen.tsx:29-33`) are never mounted.
  - `src/game/audio.noCelebration.test.ts:113,122-123`: "nothing after the result" only checks alertSting and threatLevel and does not clear spies at the result; adding `sfx.objectiveChime()` or `sfx.confirmBlip()` to setResultNow (`src/game/world.ts:1789-1794`) would pass, and `.every(...)` is true on an empty list. Fix: record counts at the result, then assert only `toHaveBeenCalledWith(0)` follows.
  - `src/game/audio.noCelebration.test.ts:131-157`: the quiet-replay and loss tests have no threatLevel(0)-only check; the loss test never asserts `phase === 'debrief'` though its name says Debrief is reached.
  - `src/game/audio.noCelebration.test.ts:187-190`: the cue-set pin covers only `missionSfx` method names, not the `src/ui/sound.ts:56-106` exports, and cannot catch a celebration clip played through an existing cue name. Pin the ui/sound export keys too.
  - `production/qa/evidence/au-007/README.md:10-11` claimed more than the tests check (reworded by `/story-done`, see above).
  - QA edge case "Abort confirm stops the mission bed as on any leave" has no automated coverage; README scenario 5 is the only evidence (README now says so).
  - `production/qa/evidence/au-007/README.md:8` pins `5594e65` + uncommitted test, stale once committed (now marked for replacement); the browser probe counts have no script or log in the evidence folder (now labelled a one-off observation).
- **Autonomous decisions logged**: specialist review answered from the workflow's `/code-review` record; Phase 7 close not taken (NOT ASSESSED cannot be closed without the owner, `scope_changes` always-ask); story set to In Review per the workflow's sign-off exception; nothing committed.

## Completion Notes
**Completed**: 2026-10-19
**Criteria**: 2/2 passing (AC-1 no sting on Debrief incl. quiet replay or on Abort arm: listening rows 1–5; AC-2 no VO, no spatial shooter mix: row 6 on headphones, plus 0 panner and 0 speech calls logged over the whole pass — user listening pass 2026-10-19). Staging shortcuts: row 2's squad was marked dead without the damage path (no death thuds, no KIA); rows 1 and 3 removed every guard silently. Row 6 logged a second alert sting mid-fight (cause not recorded); it is in-mission, outside this story.
**Deviations**: None. No code change; smoke grep for panner/speech APIs under `src/` re-run 2026-10-19, no matches. The `/code-review` advisories under "Open for Sign-off" stand (Abort-arm and `applyDebrief`/`abortMission` checks cannot fail; "nothing after the result" checks only two cues; quiet-replay and loss tests lack the `threatLevel(0)`-only and `phase` asserts; cue-set pin skips `ui/sound` exports).
**Test Evidence**: Visual/Feel: listening-evidence note with settings, scenarios, staging and audio-director sign-off (Marco Machado, 2026-10-19 — approved) at `production/qa/evidence/au-007/README.md`; retained screenshots `01-debrief-paid-win.jpg`, `02-debrief-loss.jpg`, `03-debrief-quiet-replay.jpg`, `04-abort-armed.jpg`, `05-abort-confirm-world-network.jpg` in the same folder; automated test `src/game/audio.noCelebration.test.ts` (file presence checked; not re-run at close).
**Code Review**: APPROVED WITH SUGGESTIONS — specialists: lead-programmer, qa-tester, gameplay-programmer
**Mutation Check**: skipped — Visual/Feel story
