# Technical Preferences

<!-- Populated by /setup-engine. Updated as the user makes decisions throughout development. -->
<!-- All agents reference this file for project-specific standards and conventions. -->

## Engine & Language

- **Engine**: React 19.2.8 + Vite 6.4.3 + @react-three/fiber 9.6.1 / three.js 0.185.1 (`WebGPURenderer`, WebGL2 fallback)
- **Language**: TypeScript 5.8.3
- **Rendering**: three.js WebGPU (WebGL2 fallback), r3f via `createRoot` in `GameCanvas.tsx`
- **Physics**: None — custom sim in `src/game/`

## Input & Platform

<!-- Written by /setup-engine. Read by /ux-design, /ux-review, /test-setup, /team-ui, and /dev-story -->
<!-- to scope interaction specs, test helpers, and implementation to the correct input methods. -->

- **Target Platforms**: Desktop browser (1280×720 minimum)
- **Input Methods**: Keyboard/Mouse
- **Primary Input**: Keyboard/Mouse
- **Gamepad Support**: None
- **Touch Support**: None
- **Platform Notes**: Mobile and touch are out of scope. Screens must not clip or truncate at 1280×720.

## Naming Conventions

- **Types / components**: PascalCase (`GameCanvas`, `WorldApi`)
- **Functions / variables**: camelCase (`buildArchitecture`, `createWorld`)
- **Files**: camelCase modules (`world.ts`); PascalCase React components (`GameCanvas.tsx`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_DT`, `TEAL`)
- **Stores**: `useXStore` in `src/state/`
- **Scenes/Prefabs**: N/A — r3f component trees, not engine scenes

## Performance Budgets

- **Target Framerate**: [PENDING — `docs/game-design.md` §20]
- **Frame Budget**: [PENDING — `docs/game-design.md` §20]
- **Draw Calls**: [PENDING — `docs/game-design.md` §20]
- **Memory Ceiling**: [PENDING — `docs/game-design.md` §20]

## Testing

- **Framework**: Vitest (`npm run test`)
- **Minimum Coverage**: [PENDING — no numeric gate]
- **Required Tests**: `src/game/`, `src/world/`, `src/state/` beside their modules

## Forbidden Patterns

<!-- Add patterns that should never appear in this project's codebase -->
- [None configured yet — add as architectural decisions are made]

## Allowed Libraries / Addons

<!-- Add approved third-party dependencies here -->
- react, react-dom, three, @react-three/fiber, @react-three/drei, zustand
- (dev) vite, typescript, vitest, eslint

## Architecture Decisions Log

<!-- Quick reference linking to full ADRs in docs/architecture/ -->
- [ADR-0001](architecture/adr-0001-two-clocks.md) — two clocks
- [ADR-0002](architecture/adr-0002-unsaved-mission.md) — unsaved mission
- [ADR-0003](architecture/adr-0003-one-contract-kind.md) — one contract kind
- [ADR-0004](architecture/adr-0004-quiet-replay.md) — quiet replay
- [ADR-0005](architecture/adr-0005-blueprint-assignment.md) — blueprint assignment
- [ADR-0006](architecture/adr-0006-weather-script.md) — weather script
- [ADR-0007](architecture/adr-0007-opening-hour.md) — Opening hour
- [ADR-0008](architecture/adr-0008-influence-is-a-wallet.md) — Influence is a wallet

## Engine Specialists

<!-- Written by /setup-engine when engine is configured. -->
<!-- Read by /code-review, /architecture-decision, /architecture-review, and team skills -->
<!-- to know which specialist to spawn for engine-specific validation. -->

- **Primary**: lead-programmer
- **Language/Code Specialist**: lead-programmer (TypeScript; no dedicated TS specialist)
- **Shader Specialist**: technical-artist (`three/tsl`, materials)
- **UI Specialist**: ui-programmer (`src/ui/`, tokens)
- **Additional Specialists**: gameplay-programmer (`src/game/`, `src/world/`, `src/state/`); performance-analyst
- **Routing Notes**: No Godot/Unity/Unreal specialist on this stack. `AGENTS.md` layer boundaries win if this table disagrees.

### File Extension Routing

<!-- Skills use this table to select the right specialist per file type. -->
<!-- If a row says [TO BE CONFIGURED], fall back to Primary for that file type. -->

| File Extension / Type | Specialist to Spawn |
|-----------------------|---------------------|
| Game code (`.ts` under `src/game`, `src/world`, `src/state`) | gameplay-programmer |
| Scene / renderer (`.ts`/`.tsx` under `src/scene`) | lead-programmer |
| Shader / material (`three/tsl`, `cityMaterials`) | technical-artist |
| UI / screen files (`.tsx`/`.css` under `src/ui`) | ui-programmer |
| Native extension / plugin files | N/A |
| General architecture review | lead-programmer |
