# Nexus Reborn

## Model Preferences
- Prefer Opus for complex design tasks
- Use Haiku for quick lookups and simple edits

## Communication Style
- Keep responses concise
- Show file paths in all code references
- Explain architectural decisions briefly

## Personal Shortcuts
- When I say "review", run /code-review on the last changed files
- When I say "status", show git status + sprint progress

## Commit Style

Use imperative subject line, then a body that says what changed by file, why, and what was verified (lint, build, the click-through).

## Technology Stack

- **Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 (`WebGPURenderer`, WebGL2 fallback)
- **Language**: TypeScript 5.8.3
- **Build System**: Vite + `tsc -b` (`npm run build`)
- **Asset Pipeline**: Code-generated geometry and materials; the only `public/` art asset is the World Network globe's Earth texture (`public/textures/earth/`, NASA Blue Marble, sourced in its README)
- **State**: Zustand 5.0.14
- **Physics**: None — mission sim is custom TypeScript in `src/game/`

## Engine Version Reference

Before suggesting three.js, r3f, or React APIs, read `docs/engine-reference/web/VERSION.md`. Do not invent post-cutoff APIs. Knowledge risk is HIGH (cutoff May 2025; pin is three.js r185 / React 19.2.8).

## Do It Yourself

Only hand the user a task you cannot complete yourself. Launching the build, clicking through critical paths, smoke checks, and screenshots are yours: run the dev server and drive it in a browser (Claude in Chrome or another browser tool). If no browser tool is available, ask the user to enable one — do not hand them the manual check.

## Gate Checks

Run `/gate-check` only when moving to a new stage (`production/gate-checks/`). A sprint closes with QA sign-off → `/retrospective` → `/sprint-plan new`, whatever a skill template's "next step" says.

## Done

Stop every dev server you started (`npm run dev`, `vite preview`) before the turn ends. Confirm the listener on port 4200 is gone.

## Layers

Important boundaries:

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
