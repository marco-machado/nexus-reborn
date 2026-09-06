# Geometry, input, and assets

## Geometry and determinism

- Ground plane is XZ, +Y up, 1 unit = 1 meter. The city is `CITY_SIZE` (96) square; cell `(cx,cz)` spans `[cx, cx+1)`; centers sit at `+0.5`. Helpers: `cellIndex`, `isWalkable` in `game/types.ts`.
- `CAMERA_YAW` (`PI/4`) is shared: the camera rig orbits at it and the minimap turns by it, so up on the panel is up on screen.
- `citygen.ts` is the source of road geometry. `scene/textures.ts` and `ui/Minimap.tsx` paint from `city.roadRects`.
- `game/bindings.ts` is the only place a mission key string appears. Scene handlers switch on `bindingFor`; the pause menu prints the same table. DOM screens keep their own keys (Enter/Space on research nodes, Tab in the pause menu, arrows and Home/End on the world map timeline). The one mission-side exception is `Input.tsx` letting a focused dialog button keep Space.
- Gameplay, campaign, and procedural content use seeded RNG: `mulberry32` from `game/rng.ts` for simulation and campaign generation, `hashOf` / `rngFrom` in `ui/util.ts` for portraits and figures. Presentation-only rain and audio may use `Math.random()`.

## Assets and audio sourcing

Visual assets are generated in code: CanvasTextures (`scene/textures.ts`), SVG portraits and figures (`ui/portrait.tsx`, `ui/figure.tsx`), UI glyphs (`ui/bits.tsx`). Combat and UI one-shots and mission rain are mastered CC0 clips bundled through `game/sfxClips.ts`; strategy and mission beds are looped mp3s in `inspiration/audio/`. The alert-tension drone stays synthesized. Add no files under a `public/` dir.

Audio sourcing, remastering, or mixer changes: read [`inspiration/audio/sfx/README.md`](../../inspiration/audio/sfx/README.md) for source credits, the checksum manifest, preparation workflow, and playback checks.

For palette ownership, procedural-SVG helpers, and UI audio loading, read [Rendering and UI](rendering-ui.md).
