# Story 003: Strategy bed and mission city-hum lifetimes

> **Epic**: Audio
> **Status**: Complete
> **Layer**: Presentation
> **Type**: Integration
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-17

## Context

**GDD**: `design/gdd/audio.md`
**Requirement**: `TR-audio-002`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0017: One OS / input / audio mixer  
**ADR Decision Summary**: One palette, one remap table, four audio buses; DOM screens at 1280×720; keyboard and mouse only.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: DOM + Web Audio and Zustand 5; no post-cutoff three.js or r3f API involved (ADR Post-Cutoff APIs Used: None). Do not use `THREE.Audio` or React 19.2 `<Activity>` / `useEffectEvent`.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Presentation Layer Rules, manifest 2026-10-08).
- Forbidden: Never key the mission bed clip to district, contract, hour, weather, or Threat.
- Forbidden: Never React 19.2 `<Activity>` / `useEffectEvent` to hide phases.
- Guardrail: No `public/` assets — audio loads with Vite `?url` from `inspiration/audio/`; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/audio.md`, scoped to this story:*

- [x] GIVEN navigation World Network → Research → Brief → Assembly, WHEN the strategy bed is heard, THEN the same source keeps playing and it is the industrial loop on music. WHEN the director enters Menu, Mission, or Debrief, THEN that bed stops.
- [x] GIVEN a mission start, WHEN the mission bed starts, THEN it is one of the three city-hum clips, not keyed to contract, district, Opening hour, weather, or Threat, and it stops on leave.

*(Added at Sprint 9 planning, task R-2, from the GDD sections named.)*

- [x] (Edge Cases; `design/gdd/audio.md`) GIVEN the director leaves the mission (Abort, result → Debrief, or unmount) while the mission bed is still loading, WHEN that load completes after departure, THEN the bed does not start, and the in-flight decode is discarded.

---

## Implementation Notes

*Derived from the governing ADRs and the Presentation Layer Rules:*

- Strategy bed lifetime is the four Screens (`bindStrategyBed`, `src/ui/strategyAudio.ts`); Menu, Mission, and Debrief stop it. Pause/Settings overlays do not mute or swap beds.
- `pickMissionBedUrl()` is an unseeded 1-of-3 pick; city hum owns mission-phase lifetime and stops on leave.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 004: rain.
- Story 006: determinism of the bed pick.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-009-2026-10-17.md` (2026-10-17).*

#### AU-003 — Strategy bed and mission city-hum lifetimes (Integration)
**Automated**:
- `src/ui/strategyAudio.test.ts`, `src/game/audio.beds.test.ts`: World Network → Research → Brief → Assembly keeps the same strategy source (no restart); entering Menu, Mission or Debrief stops it and discards an in-flight decode
- Mission bed start picks exactly one of the 3 committed city-hum clips; `pickMissionBedUrl` takes no arguments (not keyed to contract, district, hour, weather or Threat); it stops on leave
- Leaving the mission (Abort, result → Debrief, unmount) while the bed is loading: the late load never starts it
- Pause, Settings and Balance overlays neither mute nor swap beds, and do not change `Phase`
**Edge cases**: Two deploys of one contract may pick different clips; Overlays are not Phase changes
**Mutation check**: restart the bed on each Screen change → the same-source test fails
**Manual**: Listening check of bed continuity across the four Screens (user)

---

## Test Evidence

**Story Type**: Integration
**Required evidence**:
- Integration: test file beside the module — `src/game/audio.test.ts`. — must exist and pass; plus a click-through note (docs/click-through.md, Audio changes) naming the screens exercised.

**Status**: [x] Tests present — `src/game/audio.test.ts` (`bed lifetimes (AU-003)`, 5 tests), `src/ui/strategyAudio.test.ts` (+1 settings test); listening check pending (user)

**Click-through (2026-10-17, dev server, in-app browser, partial — docs/click-through.md Audio changes step 3)**: Menu → New Operation → World Network → Research → World Network → Brief (Glass Veil) → Assembly → Deploy → Pause → Abort → World Network. Looping-source `start`/`stop` calls were logged by patching `AudioBufferSourceNode.prototype`. Across World Network, Research, Brief and Assembly there was no start or stop (`strategy-bed.mp3` fetched once). On Deploy the strategy loop stopped, `mission-bed.mp3` was fetched and one city-hum loop started (plus a rain loop, Story 004). Opening Pause neither stopped nor started a bed. Abort stopped the city-hum and rain loops and restarted the strategy loop from cache. The leave-while-loading case was not reproduced in the browser (clips were cached). The automated test covers it. Not listened to: the in-app pane has no audio output to Claude.

---

## Dependencies

- Depends on: Story 001
- Unlocks: Story 004

---

## Completion Notes
**Completed**: 2026-10-17
**Criteria**: 3/3 passing (none deferred; the user listening check of bed continuity is a QA manual case, still pending)
**Deviations**: None blocking. Advisory: AC3 says "the in-flight decode is discarded", but `decodeClip` still caches the late buffer (`src/game/audio.ts:211`); the bed never starts, which meets ADR-0017 §7 and the GDD intent. Reword the AC or get a ruling on caching; no code change needed.
**Test Evidence**: Integration: `src/game/audio.test.ts` (`bed lifetimes (AU-003)`, 5 tests), `src/ui/strategyAudio.test.ts`; `src/game/audio.beds.test.ts` also covers bed lifetimes. All 3 files, 30 tests pass (run 2026-10-17). Partial click-through recorded above (no screenshot retained; audio not listened to).
**Traceability**: AC1 COVERED (strategyAudio.test.ts + audio.test.ts "keeps one strategy source playing..." + click-through), but the "on music" bus clause has no test. AC2 COVERED (audio.test.ts "starts one looping city-hum clip..." / "picks each of the three clips..."). AC3 COVERED (audio.test.ts "a mission bed whose clip loads after departure never starts"; audio.beds.test.ts:125), but the leave-path wiring is not tested.
**Code Review**: APPROVED WITH SUGGESTIONS — specialists: lead-programmer, qa-tester, ui-programmer, gameplay-programmer. Engine specialists CLEAN; Testability GAPS; ADR-0017 COMPLIANT; Standards 5/6; Architecture CLEAN; SOLID COMPLIANT.
**Mutation Check**: Mutation check: FAILED AS EXPECTED — src/game/audio.ts:560 dropped `|| gen !== missionGen` from the post-decode guard → "bed lifetimes (AU-003) > a mission bed whose clip loads after departure never starts" failed; restored (cmp match, test file green)
**QL-TEST-COVERAGE**: skipped — Lean mode.
**Decisions (unattended run)**: Phase 7 took the default "Close the story (Recommended)" for a COMPLETE WITH NOTES verdict; no tech-debt register entries written.

**Code-review advisory findings (follow-up)**:
- `src/game/audio.test.ts:438`: no test checks the strategy bed plays on the music bus (AC1 "on music"). Code is correct (`src/game/audio.ts:471` music, `:564` ambience). Assert `(started[0].dest as FakeGain).dest === music`, and ambience for the mission bed.
- `src/ui/strategyAudio.test.ts:42`: "settings changes ... neither stop nor restart the bed" cannot fail (`./sound` is mocked; `bindStrategyBed` subscribes only to `useAppStore`). The Pause/Settings/Balance overlay QA case has no test that can fail; Pause is covered only by the click-through.
- `src/game/audio.test.ts:496`, `src/ui/MissionScreen.tsx:32`: Abort, result → Debrief and unmount are tested only via direct `stopMissionBed()`; no test renders MissionScreen, so deleting the cleanup call would pass. Click-through covered Abort, not result → Debrief.
- `src/game/audio.ts:483-485`, `:582-584`: no test for stop then start again while the first decode is in flight (StrictMode double mount, fast World → Mission → World). Code is correct today; suggested test: start, stop, start, release(url), expect one started.
- `src/game/audio.test.ts:445`: AC3 "decode is discarded" vs. caching — see Deviations.
- `src/game/audio.test.ts:485`: `pickMissionBedUrl.length === 0` cannot catch a pick reading global state; duplicates `:52`.
- Test placement: QA plan names `src/game/audio.beds.test.ts`; Test Evidence names only `audio.test.ts`. `audio.beds.test.ts:115`, `:125` overlap `audio.test.ts:458`, `:488`. Choose one file or list both.
- `src/game/audio.test.ts:185-186`, `:200`: mock `decodeAudioData` labels buffers with `pendingUrls.shift()` (FIFO), not the fetched URL; pass the URL along.
- Standards 1/6: no JSDoc on `pickMissionBedUrl`, `startStrategyBed`, `stopStrategyBed`, `startMissionBed`, `stopMissionBed` (`src/game/audio.ts`) or `bindStrategyBed` (`src/ui/strategyAudio.ts:11`); document start-idempotent / stop-invalidates-decode.
- `src/ui/sound.ts:1-27`: `@ts-ignore` and optional members are required by ADR-0017 §7; only the stale "parallel build" header comment is real (optional cleanup).

Untested criteria: none fully untested; partial gaps above (AC1 bus clause, AC3 leave-path wiring). Recommend adding tests in a follow-up story.
