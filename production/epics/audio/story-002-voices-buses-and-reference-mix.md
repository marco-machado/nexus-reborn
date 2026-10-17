# Story 002: Voices, buses, and the reference mix

> **Epic**: Audio
> **Status**: In Review
> **Layer**: Presentation
> **Type**: Visual/Feel
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: 2026-10-17

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
- Forbidden: Never `THREE.Audio` / `PositionalAudio` / `AudioListener` / `PannerNode` / `StereoPannerNode`.
- Forbidden: Never spoken VO.
- Guardrail: No `public/` assets — audio loads with Vite `?url` from `inspiration/audio/`; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/audio.md`, scoped to this story:*

- [ ] GIVEN decoded clips, a running context, mute off, and the existing default player levels over the authored mix (record the settings with the evidence), WHEN selection, UI click, confirmation, interaction progress, objective-complete, reload, blast, ability, alert sting, death, operative hit, and each weapon gunshot (squad and CorpSec) are exercised individually and in a recorded overlapping-fire scenario, THEN each required voice exists, weapon identities remain distinct, CorpSec versions of matching firearms are quieter/narrower, interface cues stay below weapon reports, and impacts/warnings remain readable. These listening comparisons apply to that reference mix, not deliberate player overrides. Independently exercise first combat contact, an answered officer call, and a defend wave: each requests its warning sting through existing admission rules. Ordinary suspicion without a separate warning event requests no sting and does not independently raise the drone; the drone follows HUD Alert rather than generic suspicion.
- [ ] GIVEN overlapping gunfire, WHEN the mix is inspected, THEN stacking remains bounded and finished one-shot sources disconnect. Exact cap integers are README runtime, not this AC’s pass numbers.

---

## Implementation Notes

*Derived from the governing ADRs and the Presentation Layer Rules:*

- Weapon reports sit above UI in the authored mix; CorpSec reuses the squad firearm recordings quieter/narrower. Player channel overrides win over the authored hierarchy.
- `sfx.threatLevel` is HUD Alert 0–3 on the combat bus. Warning stings go through existing admission rules; ordinary suspicion requests none.
- Overlap caps are README runtime (`inspiration/audio/sfx/README.md`); finished one-shots disconnect. Clips load with Vite `?url` from `inspiration/audio/` — no `public/` assets.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 004: tension drone ramp.
- Tactical Alert derivation (Tactical epic).

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-009-2026-10-17.md` (2026-10-17).*

#### AU-002 — Voices, buses, and the reference mix (Visual/Feel)
**Automated (where a seam exists)**:
- `src/game/audio.test.ts` (advisory, if a seam exists): 20 one-shots exist; finished one-shot sources disconnect; stacking stays bounded under a burst of gunshots
- Warning-sting requests: first combat contact, an answered officer call and a defend wave each request a sting; ordinary suspicion requests none and does not raise the drone
**Verification**: evidence in `production/qa/evidence/au-002/`; sign-off: audio-director (lead sign-off)
**Checklist**:
- [ ] Listening-evidence note in `production/qa/evidence/au-002/`: record the settings, then play each of the 20 cues individually and a recorded overlapping-fire scenario (the user listens; Claude records settings, scenarios and the automated results)
- [ ] Name the screens exercised (`docs/click-through.md`, Audio changes step 2)
**Edge cases**: CorpSec variants of matching firearms quieter and narrower than squad; Interface cues stay below weapon reports; Weapon identities distinct

---

## Test Evidence

**Story Type**: Visual/Feel
**Required evidence**:
- Visual/Feel: a listening-evidence note with the recorded settings and scenarios in `production/qa/evidence/`, plus a lead sign-off. Name the screens exercised (docs/click-through.md, Audio changes).

**Status**: [x] Automated tests present (`src/game/audio.test.ts` AU-002 block, `src/game/audio.stings.test.ts`); listening-evidence note prepared at `production/qa/evidence/au-002/README.md` — listening and audio-director sign-off pending

---

## Dependencies

- Depends on: Story 001
- Unlocks: Story 007

---

## Open for Sign-off
**State (2026-10-17)**: automated tests, browser probe, listening-evidence note and code review are done; closure waits only on the listening pass and the audio-director sign-off, which only a person can give. `/story-done` verdict: NOT ASSESSED (AC-1 listening comparisons not yet evaluated; Visual/Feel sign-off row pending). No failing criterion.
- **Review**: `/code-review` APPROVED WITH SUGGESTIONS — specialists: lead-programmer, qa-tester, gameplay-programmer. Engine specialist findings CLEAN; Testability GAPS (all advisory); ADR Compliance COMPLIANT with ADR-0017 (four buses, no fifth bus, threatLevel = HUD Alert on the combat bus); Architecture and SOLID CLEAN. The working-tree diff touches only tests and docs.
- **Mutation Check**: Mutation check: skipped — Visual/Feel story
- **Needs the user**: fill the Settings table (revision, browser/OS, output device), run scenarios 1-25 in `production/qa/evidence/au-002/README.md` at the reference mix, fill the Observed column, and record the audio-director sign-off; then `/story-done` this story.
- **Criteria**:
  - AC-1 automated parts covered: 20 voices exist and route to their buses, UI bus gain below combat bus gain (`src/game/audio.test.ts` AU-002 block); first contact, answered officer call and defend wave each request a sting, ordinary suspicion requests none and does not raise the drone (`src/game/audio.stings.test.ts`). Listening parts (weapon identities distinct, CorpSec quieter/narrower, interface below weapon reports at clip level, impacts/warnings readable) pending the listening pass.
  - AC-2 covered: bounded stacking and finished one-shots disconnect (`src/game/audio.test.ts` 40-shot burst; browser probe peaked at 6 concurrent gun sources, all 18 started sources ended).
- **Evidence note**: no screenshot retained; this is a listening story, so the listening-evidence note plus sign-off is the evidence the story's Test Evidence section names.
- **Manifest**: story v2026-10-08 matches current control manifest v2026-10-08.
- **Advisory findings (from `/code-review`)**:
  - `src/game/audio.test.ts:1344`: `expect(guns.length).toBeLessThan(40)` is loose on its own; the cap is caught only indirectly through the agentHit/alertSting slot checks (MAX_COMBAT_VOICES=8). Export MAX_GUN_VOICES (or a getter) and assert `guns.length <= MAX_GUN_VOICES`.
  - `src/game/audio.test.ts:1333`: the burst comment claims the per-weapon rate gate is exercised; it never fires (same key repeats every 0.3 s against a 0.025 s gap). Only the voice cap is exercised; reword the comment.
  - `src/game/audio.test.ts:1324-1329`: the "interface below combat" check compares bus gains only (UI -3 dB vs combat -1.5 dB); clip-level ordering rests on listening rows 1-4 and 21.
  - `src/game/audio.test.ts:1287`: the "selection / confirmation" cue fires confirmBlip, but `src/scene/Input.tsx` plays no cue on operative selection. Whether scene selection should click (GDD audio.md:20) is a design question for the Interface owner, not a confirmed defect.
  - `src/game/audio.test.ts:1277`: "CorpSec quieter/narrower" is checked only by URL inequality; level/bandwidth rests on listening rows 16-20.
  - `src/game/audio.stings.test.ts:78/102`: `droneRaised` only checks some level above 0; also assert `toHaveBeenLastCalledWith(useMissionStore.getState().alert)` to tie the drone to HUD Alert.
  - `src/game/audio.stings.test.ts:22`: audioBridge is fully mocked, so the forwarding in `src/game/audioBridge.ts:40-42` and `:61-63` and the `gate('alert', 0.25)` admission (`src/game/audio.ts:310`) are not tested end to end (correct today by reading).
  - `src/game/sfxClips.ts:63`: `WEAPONS` is a hand-kept copy beside the Record-typed GUN map (third copy at `src/game/audio.test.ts:22`); derive it from `Object.keys(GUN)`. The per-weapon toContain checks at `src/game/audio.test.ts:1278-1279` are near-tautological.
  - `src/game/audio.ts:234-237`: the gun cap counts all combat-bus voices, so six or more active non-gun combat one-shots drop new gunfire; the reverse case has no test or comment.
  - `production/qa/evidence/au-002/README.md:12`: browser-probe results are prose only; commit the probe snippet or a log, and record the real commit hash once the tests are committed (`src/game/audio.stings.test.ts` is untracked).
  - `src/game/audio.stings.test.ts:126` duplicates the staging `put(w, a1, { x: 46.5, z: 85.5 })` from `src/game/world.test.ts:1614`; a shared helper would remove the duplication.
- **Autonomous decisions logged**: specialist review answered from the workflow's `/code-review` record; Phase 7 close not taken (NOT ASSESSED cannot be closed without the owner, `scope_changes` always-ask).
