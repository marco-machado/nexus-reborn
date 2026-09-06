# Nexus Reborn

Browser game inspired by Syndicate: React 19 + Vite for the DOM screens, react-three-fiber on the three.js WebGPU renderer for the mission scene, zustand for state. `inspiration/*.png` are the art reference the screens are matched against.

Design: [`docs/game-design.md`](docs/game-design.md) — economy, contracts, research tree, or mission rules. Code wins when they disagree.

Setup and documentation map: [`README.md`](README.md). QA records and evidence format: [`docs/qa/README.md`](docs/qa/README.md).

## Done

Scripts live in `package.json`. Run `npm run lint`, `npm run test`, and `npm run build` before calling code work done. Tests sit next to their module and cover `src/game/`, `src/world/`, `src/state/`.

Click-through: [`docs/click-through.md`](docs/click-through.md) — rendering, screen flow, input, or persisted state. Name the screens actually exercised if the run is partial.

Stop every dev server you started (`npm run dev`, `vite preview`) before the turn ends. Confirm the listener on port 4200 is gone.

## Layers

Boundaries are load-bearing:

- `src/game/` — simulation and static data. Pure TypeScript, no React, no three.js. `world.ts` is the mission sim; `pathfind.ts` is routing; `atlas.ts` is the Scan projection (sectors, cities, polygons). Deploy mass, mission variants, abilities, and quality live in sibling modules.
- `src/world/citygen.ts` — procedural city, deterministic from `mission.seed`. Owns road geometry and the walk grid.
- `src/state/` — Zustand stores and the versioned campaign save.
- `src/scene/` — three.js under r3f. Reads the world imperatively every frame.
- `src/ui/` — DOM screens and the mission HUD.

`src/App.tsx` routes on `appStore.phase`: menu → world → research → brief → team → mission → debrief. Settings, Balance, pause, and tutorial toasts are overlays on the current phase.

Contracts: files whose header starts `CONTRACT FILE` — shared types, static data, stores, runtime, router, mission lifecycle. Discover with `rg -l '^// CONTRACT FILE' src`. Read the header before changing one.

## Critical guardrails

- Per-frame data stays out of React state. Preserve mission research/loadout snapshots.
- Preserve deterministic gameplay, campaign, and procedural RNG.
- Preserve mission catch-up, final remainders, and opening-frame behavior; preserve both strategic advancement paths and synchronize research/campaign consumers.
- `src/index.css` and `src/ui/tokens.ts` own the shared palette. TS/SVG/canvas colours come from `tokens.ts`; only neutral white/black tint literals are exempt. Palette changes touch both owners and nothing else.
- Add no `public/` assets. Screens must work at 1280×720 without clipping or truncation.

## Required references

Before changing any area below, read its linked reference; read every matching row for overlapping work.

| Before changing… | Read |
|---|---|
| Mission lifecycle, world access, HUD synchronization, or research application to a running mission | [Mission runtime](docs/agents/mission-runtime.md) |
| Either clock, campaign persistence/recovery, research synchronization, or debrief ETA advancement | [Strategy time and state](docs/agents/strategy-time-state.md) |
| Scene/rendering/quality, DOM/SVG/canvas styling, or UI audio loading | [Rendering and UI](docs/agents/rendering-ui.md) |
| City generation, geometry, minimap/input, procedural presentation, or asset/audio sourcing | [Geometry, input, and assets](docs/agents/geometry-input-assets.md) |
| Audio sourcing, remastering, or mixer behavior | [Audio workflow](inspiration/audio/sfx/README.md) |

## Language

Name a thing with its `CONTEXT.md` term or the identifier the code already uses. If it has neither, describe it in plain language until a term is resolved. File comments and commit messages are not names.

## Commits

Do not commit or push unless requested.

Imperative subject line, then a body that says what changed by file, why, and what was verified (lint, build, the click-through). Reference issues with `Closes #N`. This section is the commit style — do not run `git log` to infer one.

## Agent skills

### Issue tracker

GitHub Issues on `marco-machado/nexus-reborn` via `gh`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default role names: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
