# Story 007: No celebration sting, spoken VO, or spatial shooter mix

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
- Forbidden: Never payout celebration sting, spoken VO, or spatial shooter mix.
- Forbidden: Never `PannerNode` / `StereoPannerNode`.
- Guardrail: No `public/` assets — audio loads with Vite `?url` from `inspiration/audio/`; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/audio.md`, scoped to this story:*

- [ ] GIVEN Debrief (including quiet replay) or Abort-armed pause, WHEN the mix is heard, THEN there is no celebration sting and no mission-end sting on Abort arm.
- [ ] GIVEN the shipping mix, WHEN spoken VO or a spatial-panned shooter model is listened for, THEN neither is present.

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

*N/A — no qa-lead specs at this tier (lean review mode); implement against the Acceptance Criteria above.*

---

## Test Evidence

**Story Type**: Visual/Feel
**Required evidence**:
- Visual/Feel: a listening-evidence note with the recorded settings and scenarios in `production/qa/evidence/`, plus a lead sign-off. Name the screens exercised (docs/click-through.md, Audio changes).

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 002
- Unlocks: None
