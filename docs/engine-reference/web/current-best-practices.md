# Current best practices (post May 2025 cutoff)

Last verified: 2026-09-08

Practices that differ from typical pre-r171 / r3f-v8 training data. Project law in `AGENTS.md` and `docs/agents/rendering-ui.md` wins when these conflict.

## Renderer

- Mission canvas is `WebGPURenderer` from `three/webgpu`. Init is async. Always `await renderer.init()` before `render()`, feature checks, or texture init (r181).
- WebGL2 fallback is inside three.js init. Log `renderer.backend` (`isWebGPUBackend`). A menu load does not prove the mission renderer came up (`README.md`).
- Do not construct `WebGLRenderer` "to be safe". Do not detect WebGPU yourself and swap classes.
- Premultiplied alpha changed in r185. Keep an opaque scene background / clear color unless you are deliberately compositing over HTML.

## r3f

- Import `three/webgpu` (and `three/tsl` when needed), `extend(THREE)`, and augment `ThreeElements`.
- Mission root: `createRoot` + one `configure` / `render` per canvas (`GameCanvas.tsx`). Do not replace it with `<Canvas>`.
- Per-frame data stays out of React state. Scene objects read the world imperatively (`AGENTS.md`).

## TSL / materials

- Custom look: TSL nodes and node materials, not GLSL `ShaderMaterial`.
- Bloom is emissive-only MRT (`Effects.tsx`). Glow = emissive. Low quality drops bloom.
- Post stack class is `RenderPipeline`, not `PostProcessing` (r183).
- Prefer `three/tsl` named imports already used in-repo (`pass`, `mrt`, `output`, `emissive`, `color`, `float`, `mix`, `texture`, …).

## React 19.2

- This app is a client SPA (Vite). Ignore RSC / prerender / `cacheSignal` advice.
- Do not introduce `<Activity>` or `useEffectEvent` without a story.
- `useId` values now contain `_` not `:`. Do not parse `useId` strings.

## Vite / TypeScript

- Build is `tsc -b && vite build`. Tests are Vitest beside modules.
- Stay on Vite 6.4.3 until an explicit upgrade. Vite 8 is not this pin.

## Layers (do not "simplify")

| Path | May import three / r3f / React? |
|------|----------------------------------|
| `src/game/` | No three, no React |
| `src/world/` | No three, no React |
| `src/state/` | Zustand only for stores |
| `src/scene/` | three/webgpu, tsl, r3f |
| `src/ui/` | React DOM; not the mission renderer |

## Verify

`npm run lint`, `npm run test`, `npm run build`. Rendering changes also need the click-through at 1280×720. Stop any `vite` listener on port 4200 before the turn ends.
