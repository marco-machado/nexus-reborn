# Rendering and UI

## Scene

- Import from `three/webgpu`, node materials from `three/tsl`, addons from `three/addons/...`.
- `GameCanvas.tsx` drives the r3f root through `createRoot`. The stock `<Canvas>` re-runs `configure()` on every commit, which races `WebGPURenderer.init` (pmndrs/react-three-fiber#3782).
- Bloom is emissive-only (`Effects.tsx` MRT emissive target): anything that should glow uses an emissive material.
- `GameCanvas` resolves the quality tier once per mission from `settingsStore` via `game/quality.ts`.
- Hot per-frame rendering reuses preallocated pools and buffers (`Units.tsx`, `Fx.tsx`, `Rain.tsx`). Event-driven allocation stays bounded.

## Styling and UI audio loading

`ui/sound.ts` loads the audio module lazily and swallows failure; it must not import `game/audio.ts` at typecheck time.

`src/index.css` `:root` holds the CSS design tokens (`--teal`, `--amber`, `--ink`, …) that drive classes; `src/ui/ui.css` holds screen styles. `src/ui/tokens.ts` is the **single source for every colour drawn in TS/SVG**: an inline SVG fill/stroke or a canvas paint must import from there, never write a hex or rgba literal. The two carry the same values — a palette change touches `index.css` AND `tokens.ts`, and nothing else. The only literals allowed are neutral white/black tints (`#ffffff`, `rgba(255,255,255,…)`, `rgba(0,0,0,…)`) for things like rim seams and scanlines. Shared procedural-SVG helpers live in `ui/glyph.ts` (figure/portrait point formatting and visor/scanline/blur defs); shared UI click/time helpers (`act`, `mmss`, `spanLabel`, `agoLabel`, `utcNow`) live in `ui/util.ts`. Screens are checked at 1280×720; clipping or truncation at that size is a bug.
