# Story 001: Mixer: master, channels, mute, and settings persistence

> **Epic**: Audio
> **Status**: Ready
> **Layer**: Presentation
> **Type**: Integration
> **Estimate**: 1.0 d
> **Manifest Version**: 2026-10-08
> **Last Updated**: —

## Context

**GDD**: `design/gdd/audio.md`
**Requirement**: `TR-audio-001`
*(Requirement text lives in `docs/architecture/tr-registry.yaml` — read fresh at review time)*

**ADR Governing Implementation**: ADR-0011: Campaign persistence envelope  
**Secondary ADRs**: ADR-0017: One OS / input / audio mixer
**ADR Decision Summary**: Three storage envelopes; src/state/save.ts is the only campaign writer; drop-all on a bad blob.
**ADR Version**: 2026-09-10 (ADR `## Date`; no `## Last Verified`)

**Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 | **Risk**: LOW
**Engine Notes**: DOM + Web Audio and Zustand 5; no post-cutoff three.js or r3f API involved (ADR Post-Cutoff APIs Used: None). Do not use `THREE.Audio` or React 19.2 `<Activity>` / `useEffectEvent`.

**Control Manifest Rules (this layer)**:
- Required: see Implementation Notes (Presentation Layer Rules, manifest 2026-10-08).
- Forbidden: Never a fifth bus.
- Forbidden: Never write mixer values into the campaign blob.
- Guardrail: No `public/` assets — audio loads with Vite `?url` from `inspiration/audio/`; no per-frame React state (CLAUDE.md).

---

## Acceptance Criteria

*From GDD `design/gdd/audio.md`, scoped to this story:*

- [ ] GIVEN running/unlocked audio and an identifiable source on each bus, WHEN master and each channel control are exercised independently in Settings, THEN master scales all four buses, each channel control changes only its own bus control factor without changing other stored levels, mute silences all buses while preserving the chosen values, and unmuting restores those values. Deliberately silencing combat while retaining UI is valid; authored hierarchy is not enforced over player overrides.
- [ ] GIVEN recorded nondefault master, four channel levels, and mute in writable Settings storage, WHEN the session reloads, THEN all recorded audio settings match. WHEN New Operation is confirmed and the session reloads again, THEN all those settings still match (Persistence settings slot, not campaign).

*(Added at Sprint 9 planning, task R-2, from the GDD sections named.)*

- [ ] (Formulas, `staged_gain`; `design/gdd/audio.md`) GIVEN master 0.5, combat 0.8 and mute off, WHEN the combat bus's combined player-control factor is read, THEN it is 0.4; with mute on it is 0 while the stored master and combat stay 0.5 and 0.8. Master and mute apply once at the master stage, not again at each channel node.

---

## Implementation Notes

*Derived from the governing ADRs and the Presentation Layer Rules:*

- Four buses `ui` / `combat` / `music` / `ambience` → `master` → `createDynamicsCompressor()` (`limiter` in `audio.ts`, not a `LimiterNode`). Mute folds into master gain; stored channel values are unchanged.
- Mixer values live in the settings envelope (`src/state/settingsStore.ts`); New Operation clears the campaign blob only. `src/state/save.ts` stays the only campaign writer.

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 005: audio unavailable.

---

## QA Test Cases

*From `production/qa/qa-plan-sprint-009-2026-10-17.md` (2026-10-17).*

#### AU-001 — Mixer: master, channels, mute, and settings persistence (Integration)
**Automated**:
- `src/game/audio.test.ts`, `src/state/settingsStore.test.ts`: `staged_gain = 0 if muted else master × channel` with literals: master 0.5 × combat 0.8 → 0.4; mute → 0; unmute restores 0.4
- Each channel control changes only its own bus factor and no other stored level; master scales all four buses once
- Reload round trip: nondefault master, four channels and mute match; after New Operation and a second reload they still match (settings slot, not campaign)
- Exactly four buses (ui, combat, music, ambience); no fifth
**Edge cases**: Silencing combat while keeping UI is valid; the authored hierarchy is not enforced over player overrides; Master/mute applied once at the master stage, not copied to every channel node
**Mutation check**: apply master twice → the 0.4 case fails (0.2)
**Manual**: Listening pass in Settings with a source on each bus (the user listens; `docs/click-through.md` Audio changes step 1)

---

## Test Evidence

**Story Type**: Integration
**Required evidence**:
- Integration: test file beside the module — `src/game/audio.test.ts`, `src/state/settingsStore.test.ts`. — must exist and pass; plus a click-through note (docs/click-through.md, Audio changes) naming the screens exercised.

**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: None
- Unlocks: Story 002, Story 003
