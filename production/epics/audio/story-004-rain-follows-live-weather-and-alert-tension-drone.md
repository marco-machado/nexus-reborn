# Story 004: Rain follows live weather; Alert tension drone

> **Epic**: Audio
> **Status**: Ready
> **Layer**: Presentation
> **Type**: Visual/Feel
> **Estimate**: —
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/audio.md`
**Requirement**: `TR-audio-002`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0017: One OS / input / audio mixer  
**Secondary ADRs**: ADR-0006: Weather is a script, not a roll mid-fight; ADR-0007: Opening hour is per-mission, not the look
**ADR Decision Summary**: One palette, one remap table, four audio buses; DOM screens at 1280×720; keyboard and mouse only.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: DOM + Web Audio and Zustand 5; no post-cutoff three.js or r3f API involved (ADR Post-Cutoff APIs Used: None). Do not use `THREE.Audio` or React 19.2 `<Activity>` / `useEffectEvent`.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Presentation Layer Rules, manifest 2026-10-08).
- Forbidden: Never mute rain audio for reduced motion (visual rain only).
- Forbidden: Never stack a second drone layer.
- Guardrail: No `public/` assets — audio loads with Vite `?url` from `inspiration/audio/`; no per-frame React state (AGENTS.md).

---

## Acceptance Criteria

*From GDD `design/gdd/audio.md`, scoped to this story:*

- [ ] GIVEN live weather none, light, and heavy (including a scripted front), WHEN rain is heard across a full loop and the transitions, THEN none is silent, light and heavy are the matching recordings, transitions do not click or gap, and leaving the mission while rain is loading or playing does not restart rain after departure.
- [ ] GIVEN Alert 0 then a rise into 1–3 then mission end, WHEN the tension drone is heard, THEN it is silent at 0, ramps with Alert, sits on the combat bus, and releases when the mission ends without a stacked second layer.

---

## Implementation Notes

*Derived from the governing ADRs and the Presentation Layer Rules:*

- Rain follows live Weather (ADR-0006 script, including the one scripted front); rain hiss is silent when weather is none (ADR-0007 manifest rule). Leaving the mission while rain loads must not restart it.
- The drone is synthesized on the combat bus, follows HUD Alert 0–3 (not World Network Threat), and releases on mission end.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Weather script timing (Tactical/Weather).
- Tactical Alert derivation.

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

- Depends on: Story 003
- Unlocks: None
