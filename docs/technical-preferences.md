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

<!-- Stamped from ADR-0010, ADR-0016, ADR-0017. Do not invent FPS here. -->
- Mission canvas: stock r3f `<Canvas>`, drei `Canvas` / `View`, `new THREE.WebGLRenderer()`
- `renderAsync` / `waitForGPU` / `new PostProcessing` / EffectComposer / `@react-three/postprocessing` / `AnamorphicNode`
- GLSL `ShaderMaterial` / `onBeforeCompile` on the WebGPU path
- Per-frame unit poses in React state
- `THREE.Clock` / `THREE.Timer` as game clocks (do not migrate r3f’s internal `Clock` to silence the r183 warning)
- Vite alias `three` → `three/webgpu`
- Extra `useFrame` priority > 0 that calls `render()`, or `gl.render()` beside `pipeline.render()`
- drei `OrbitControls` / `MapControls` / `CameraControls` / `Html` / `PositionalAudio`
- Physics addons; `OrthographicCamera` / rotate-tilt camera in play
- React 19.2 `<Activity>` / `useEffectEvent` to hide phases
- `THREE.Audio` / `PositionalAudio` / `AudioListener` / `PannerNode` / `StereoPannerNode`
- `public/` art; spoken VO; spatial shooter mix; payout celebration sting

## Allowed Libraries / Addons

<!-- Add approved third-party dependencies here -->
- react, react-dom, three (`three/webgpu` in `src/scene/`), @react-three/fiber, zustand
- @react-three/drei — lockfile only; not a mission-canvas kit. Forbidden exports listed above.
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
- [ADR-0009](architecture/adr-0009-partitioned-deploy-snapshot.md) — partitioned deploy snapshot
- [ADR-0010](architecture/adr-0010-mission-renderer-and-frame-loop.md) — mission renderer and frame loop
- [ADR-0011](architecture/adr-0011-campaign-persistence-envelope.md) — campaign persistence envelope
- [ADR-0012](architecture/adr-0012-store-placement.md) — store placement (Intel, generated contracts)
- [ADR-0013](architecture/adr-0013-credits-never-overdraw.md) — Credits never overdraw
- [ADR-0014](architecture/adr-0014-timeline-review-is-a-view.md) — Timeline Review is a view
- [ADR-0015](architecture/adr-0015-telemetry-never-leaves-the-machine.md) — telemetry never leaves the machine
- [ADR-0016](architecture/adr-0016-tactical-sim-contract.md) — tactical sim contract
- [ADR-0017](architecture/adr-0017-one-os-input-audio-mixer.md) — one OS / input / audio mixer
- [ADR-0018](architecture/adr-0018-catch-up-collision-order.md) — catch-up collision order
- [ADR-0019](architecture/adr-0019-deploy-gate.md) — deploy gate
- [ADR-0020](architecture/adr-0020-campaign-fail-flags.md) — campaign fail flags

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
