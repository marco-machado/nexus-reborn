# Story 002: Voices, buses, and the reference mix

> **Epic**: Audio
> **Status**: Ready
> **Layer**: Presentation
> **Type**: Visual/Feel
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

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

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 001
- Unlocks: Story 007
