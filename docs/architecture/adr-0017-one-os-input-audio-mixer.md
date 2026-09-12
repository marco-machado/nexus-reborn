# ADR-0017: One OS / input / audio mixer

> **Engine specialist**: CONCERNS (precision; no blocking API) 2026-09-10
> **Technical Director Review (TD-ADR)**: APPROVED 2026-09-10
> **Lead Programmer Review (LP-FEASIBILITY)**: FEASIBLE 2026-09-11 (re-run; prior CONCERNS 2026-09-10 closed by Key Interfaces)

One corporate OS: dual palette, DOM around the mission canvas, one remap table, four audio buses under a compressor. No `public/` art, no spoken VO, no spatial mix.

## Status
Accepted

## Date
2026-09-10

## Engine Compatibility

| Field | Value |
|-------|-------|
| **Engine** | React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 WebGPU |
| **Domain** | UI / Input / Audio |
| **Knowledge Risk** | HIGH — cutoff May 2025; pin is three.js r185 / React 19.2.8. This ADR uses DOM + Web Audio, not new three.js APIs. |
| **References Consulted** | `docs/engine-reference/web/VERSION.md`; `deprecated-apis.md`; `docs/agents/rendering-ui.md`; `src/ui/tokens.ts`; `src/index.css`; `src/App.tsx`; `src/state/appStore.ts`; `src/game/bindings.ts`; `src/game/audio.ts`; `src/ui/sound.ts`; `src/ui/strategyAudio.ts`; `src/state/settingsStore.ts`; ADR-0010; ADR-0011 |
| **Post-Cutoff APIs Used** | None. Do not use React 19.2 `<Activity>` / `useEffectEvent` to hide phases. Do not use `THREE.Audio` / `PositionalAudio` / `AudioListener`. |
| **Verification Required** | `createRoot` canvas unchanged (ADR-0010). `sound.ts` has no typecheck import of `game/audio.ts`. Strategy bed only on four Screens. Mute zeros master, not stored channel values. No celebration sting. No `PannerNode`. No `public/` art. |

## ADR Dependencies

| Field | Value |
|-------|-------|
| **Depends On** | ADR-0011 (Accepted — settings envelope holds mixer values), ADR-0006 (Accepted — rain follows live weather script) |
| **Enables** | Stories that would otherwise add `public/` art, a second palette, a gamepad path, spatial panner, or spoken VO |
| **Blocks** | None named as epics yet |
| **Ordering Note** | Must-not-contradict ADR-0010 (Accepted — canvas / HUD split / Quality teardown) and ADR-0016 (Accepted — BindingId is input; WorldApi verbs stay 0016). TR-interface-002 is **joint** with ADR-0010: clip + never-color-only here; Quality-not-a-lever / persist ≠ live teardown there. |

## Context

### Problem Statement

TR-interface-001 / 003 / 007 and TR-audio-001–004 are uncovered or partial. ADR-0011 named the settings slot, not the four-bus graph. ADR-0006 named the weather script, not bed lifetimes. Without this ADR, stories can add `public/` art, a second palette, a gamepad path, `PannerNode`, spoken VO, or `<Activity>` that keeps `GameCanvas` and beds alive.

### Constraints

- Desktop web. Keyboard and mouse. No mobile, touch, or gamepad.
- Palette dual-owned by `src/index.css` and `src/ui/tokens.ts` (`AGENTS.md`).
- Mission canvas is ADR-0010. Opaque `Scene.background`. HUD is a DOM sibling, not a transparent WebGPU composite.
- Mixer values live in the settings envelope, not the campaign blob (ADR-0011).
- Do not promote slider percents, README overlap caps, or authored base gains into GDD rules.

### Requirements

- One corporate OS; palette from `index.css` + `tokens.ts`; no `public/` art; DOM around the 3D scene (TR-interface-001).
- 1280×720 must not clip or truncate; critical state is never color-only (TR-interface-002, joint).
- Session phase router is Menu, four Screens, Mission, Debrief (TR-interface-003).
- One remap table; pause, operative slots, and mouse reserved; keyboard and mouse, desktop only (TR-interface-007).
- Four channels plus master and mute in the settings slot (TR-audio-001).
- Strategy bed on four Screens; mission bed owns the district *lifetime*; rain follows live weather (TR-audio-002).
- Unavailable or late audio must not block play or dump as a delayed burst (TR-audio-003).
- No spoken VO, no spatial shooter mix, no payout celebration sting (TR-audio-004).

## Decision

Stamp existing `tokens.ts` / `index.css` / `App.tsx` / `bindings.ts` / `audio.ts` / `sound.ts` / `strategyAudio.ts` / `settingsStore.ts`.

### 1. One OS and palette

Named colours are dual-owned by `src/index.css` `:root` and `src/ui/tokens.ts`. TS / SVG / canvas paints import from `tokens.ts`. Neutral white/black tints are the only hex/rgba literals allowed. A palette change touches both files and nothing else.

No `public/` art. Audio files load with Vite `?url` from `inspiration/audio/`.

DOM screens wrap the mission view. `MissionScreen` mounts `GameCanvas` plus `Hud` as siblings. Do not transparent-clear the WebGPU canvas or set `alpha: false` to “fix” blending (ADR-0010 / r185 premultiplied alpha).

`:root.s-high-contrast` remaps CSS variables only. SVG/canvas paints from `tokens.ts` do not follow. Do not “fix” that by runtime-reading CSS into `tokens.ts` or scattering hex.

### 2. Layout and Quality

Screens must work at 1280×720 without clipping or truncation. Critical state is never color-only.

Quality Auto / High / Medium / Low is a player setting. Using it as a design lever, or tearing the live `createRoot` pipeline, is ADR-0010 — not this ADR. This ADR does **not** close TR-interface-002 alone.

### 3. Phase router

`appStore.Phase` is `'menu' | 'world' | 'research' | 'brief' | 'team' | 'mission' | 'debrief'`. `App.tsx` routes on that union with conditionals. Do not hide phases with React 19.2 `<Activity>` — that would keep `GameCanvas` and beds mounted.

Four Screens = `world` / `research` / `brief` / `team` (`team` is Assembly). Menu, Mission, and Debrief are not Screens.

Settings, Balance, pause, and tutorial toasts are overlays. They do not change `Phase`. Pause overlay does not mute or swap beds.

Settings / Balance chrome lives in `src/ui/index.tsx` / `PauseMenu.tsx`, not `App.tsx`.

### 4. One remap table

`BINDINGS` in `src/game/bindings.ts` is the only table. Handlers, pause print, and tutorial all read it. `applyOverrides` remaps in place.

Reserve rule is `remappable(b)`: `b.codes.length > 0 && b.id !== 'pause' && b.id !== 'selectSlot'`. Mouse and wheel are non-remappable because `codes` is empty. Pause Space exception for focused dialog buttons stays (`Input.tsx`).

`BindingId` is input rows. It is **not** ADR-0016 `WorldApi` verbs. Select remains `missionStore.setSelected`. Kit / ability ids are not verbs. Pointer picking in `scene/Input.tsx` may use r3f intersection; fire-lane `THREE.Raycaster` stays forbidden (ADR-0016).

Keyboard and mouse, desktop only. No gamepad. No touch.

### 5. Mixer

Web Audio graph: `GainNode` `ui` / `combat` / `music` / `ambience` → `master` → `AudioContext.createDynamicsCompressor()` (variable `limiter` in `audio.ts` — a safety net, **not** a Web Audio `LimiterNode`) → destination.

Levels are 0..1. Write path: `setAudioLevels` + `stagedGain(master, channel, muted)`. Mute folds into master; stored channel values are unchanged. `getAudioLevels` is readback. `unlockAudio` on first gesture (context starts `suspended`).

Mixer values live in the settings envelope (ADR-0011), not the campaign blob. Do not add a fifth bus. Do not put mixer state on `save.ts`.

`sfx.threatLevel` is HUD **Alert** 0–3 on the combat bus (synthesized drone), not World Network Threat.

### 6. Beds and rain

Strategy bed lifetime is the four Screens. Owner: `src/ui/strategyAudio.ts` `bindStrategyBed` / `usesStrategyBed`. `App.tsx` only mounts the binder. Do not start/stop per Screen.

Mission city-hum “owns the district” means **mission-phase lifetime** on the ambience bus. Clip pick is `pickMissionBedUrl()` — one of three unseeded clips (`MISSION_BED_URLS`) at bed start. Do **not** key the clip to district, contract, hour, weather, or Threat.

Rain follows live Weather (`sfx.weatherBed` → `setMissionBedWeather`) under ADR-0006. Reduced-motion visual rain is not an audio mute.

### 7. Late load and forbidden mix

Unavailable or late audio must not block play. Three swallows: `ui/sound.ts`, `game/audioBridge.ts`, `settingsStore.applyAudio`. `sound.ts` lazy-imports and must not typecheck-import `game/audio.ts`. One-shots drop after `MAX_CUE_DELAY` (README fact, not a GDD knob). Bed `gen` tokens discard late decode (StrictMode-safe).

No spoken VO. No `PannerNode` / `StereoPannerNode`. No `THREE.Audio` / `PositionalAudio` / `AudioListener`. No payout celebration sting.

`exponentialRampToValueAtTime(0)` throws — code uses `0.0001`. Oscillators cannot restart; keep the threat layer.

Mixer `fetch` is local bundled URLs. That is not a telemetry channel (ADR-0015).

### Architecture Diagram

```
App.tsx  routes Phase (no <Activity>)
  four Screens  → bindStrategyBed (same source while navigating)
  mission       → GameCanvas (ADR-0010) + Hud sibling
  overlays      → Settings / Balance / pause / toasts  (Phase unchanged)

index.css :root  ←→  tokens.ts     (authored palette)
high-contrast     →  CSS vars only

BINDINGS + remappable + applyOverrides
  pause / selectSlot / empty-codes  not remappable

settingsStore audio  →  setAudioLevels / stagedGain / mute
                     →  GainNodes ui,combat,music,ambience → master → compressor
sound.ts lazy swallow; no typecheck import of game/audio.ts
pickMissionBedUrl() unseeded 1-of-3 at mission bed start
rain ← live Weather (ADR-0006)
```

### Key Interfaces

Implementation facts (not GDD knobs): `Phase`; `BINDINGS` / `BindingId` / `remappable` / `applyOverrides`; `setAudioLevels` / `getAudioLevels` / `stagedGain` / `unlockAudio`; `pickMissionBedUrl` / `MISSION_BED_URLS`; `bindStrategyBed` / `usesStrategyBed`; `ui/sound.ts` lazy contract; `createDynamicsCompressor` as the master safety net.

## Alternatives Considered

### Alternative 1: Split chrome/input vs mixer

- **Description**: Two ADRs.
- **Pros**: Smaller files.
- **Cons**: Architecture-review bundled these TRs; settings already hold both remaps and mixer.
- **Rejection Reason**: User locked one stamp-as-is ADR.

### Alternative 2: CSS-in-JS, gamepad, spatial mix

- **Description**: Second palette runtime, gamepad, `PannerNode`.
- **Pros**: “Modern” stack.
- **Cons**: Breaks one OS, desktop-only input, and TR-audio-004.
- **Rejection Reason**: Out of this game.

## Consequences

### Positive

- Closes TR-interface-001 / 003 / 007 and TR-audio-001 (bus schema) / 002 / 003 / 004.
- Stories cannot treat Balance SFX `fetch` as a network product, or hide Mission with `<Activity>`.
- Mixer cannot leak into the campaign blob.

### Negative

- TR-interface-002 remains joint with ADR-0010.
- High-contrast does not recolor SVG/canvas paints.
- `settingsStore` typecheck-imports `game/audio` while `sound.ts` must not — two import rules.

### Risks

- Autoplay unlock; ramp-to-zero; oscillator reuse; StrictMode generation tokens.
- Late-decode drop (`MAX_CUE_DELAY` stays README).
- High-contrast CSS-only; r185 opaque canvas.
- Reduced-motion visual rain ≠ audio rain mute.
- Naming collision: HUD Alert `threatLevel` vs World Network Threat vs unseeded mission bed.

## GDD Requirements Addressed

| GDD System | Requirement | How This ADR Addresses It |
|------------|-------------|--------------------------|
| interface.md | TR-interface-001 One OS; palette; no `public/` art; DOM around 3D | Dual palette; Vite `?url`; HUD sibling of `GameCanvas` |
| interface.md | TR-interface-002 1280×720; never color-only; Quality not a lever | Clip + non-color here; Quality teardown remains ADR-0010 (**joint**) |
| interface.md | TR-interface-003 Phase router | `Phase` union; overlays do not change phase |
| interface.md | TR-interface-007 One remap table; reserved rows; desktop kbm | `BINDINGS` + `remappable` |
| audio.md | TR-audio-001 Four channels + master + mute in settings | Gain graph + `stagedGain`; slot is ADR-0011 |
| audio.md | TR-audio-002 Strategy bed Screens; mission bed district lifetime; rain | `bindStrategyBed`; `pickMissionBedUrl`; weather bed |
| audio.md | TR-audio-003 Late audio must not block or burst | `sound.ts` / bridge / `applyAudio` swallows |
| audio.md | TR-audio-004 No VO, spatial mix, celebration sting | Forbidden nodes and cues |

## Performance Implications

- **CPU**: existing Web Audio graph; no spatial panner.
- **Memory**: decoded buffers; late clips dropped.
- **Load Time**: lazy `sound.ts`; beds after first gesture.
- **Network**: none. Bundled `?url` only.

## Migration Plan

Stamp existing modules. Do not add `public/` copies. Do not introduce `<Activity>`. Do not retune compressor numbers into the GDD. Do not key mission bed to district. Optional cleanup of `sound.ts` “parallel build” comment is not this ADR.

## Validation Criteria

- `tokens.ts` named colours match `index.css` `:root`.
- No `public/` art. Audio via Vite `?url`.
- 1280×720 screens do not clip or truncate.
- `App.tsx` has no `<Activity>`. Overlays do not change `Phase`.
- `remappable` excludes pause, selectSlot, and empty `codes`.
- Mute zeros master; stored channel values unchanged after unmute.
- Strategy bed continues across Screen navigation; stops off the four Screens.
- `pickMissionBedUrl` is unseeded; not a function of district id.
- `sound.ts` does not typecheck-import `game/audio.ts`.
- No `PannerNode` / `THREE.Audio` / spoken VO / celebration sting.

## Related Decisions

- [ADR-0006](adr-0006-weather-script.md) — rain follows the live script
- [ADR-0010](adr-0010-mission-renderer-and-frame-loop.md) — canvas / HUD split / Quality teardown
- [ADR-0011](adr-0011-campaign-persistence-envelope.md) — settings envelope
- [ADR-0015](adr-0015-telemetry-never-leaves-the-machine.md) — mixer `fetch` is not telemetry
- [ADR-0016](adr-0016-tactical-sim-contract.md) — BindingId ≠ WorldApi verbs
