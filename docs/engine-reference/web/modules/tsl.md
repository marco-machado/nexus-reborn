# Module: TSL (three/tsl)

Last verified: 2026-09-08

Pinned: three.js r185. Official: [Migration Guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide) (r170 → r171 import split; later TSL renames).

## Imports

```ts
import { pass, mrt, output, emissive, color, float, mix, texture } from 'three/tsl'
import { bloom } from 'three/addons/tsl/display/BloomNode.js'
```

Core TSL is `three/tsl`. Display nodes such as bloom stay under addons until the migration guide says otherwise.

## In this repo

- `Effects.tsx`: `pass`, `mrt`, `output`, `emissive`, `bloom`
- `architectureRenderer.ts`: `color`, `float`, `instancedBufferAttribute`, `mix`, `normalLocal`, `positionWorld`, `texture`, `vec2`

Match those names. Do not invent GLSL `ShaderMaterial` for WebGPU.

## Renames agents still suggest

| Old | New |
|-----|-----|
| `label()` | `setName()` |
| `PI2` | `TWO_PI` |
| `varying()` | `toVarying()` |
| `vertexStage()` | `toVertexStage()` |
| `directionToColor()` | `packNormalToRGB()` |
| `colorToDirection()` | `unpackRGBToNormal()` |
| `positionLocal` in `positionNode` (skinned) | `positionGeometry` |

## Bloom

Emissive-only MRT. Surfaces that should glow set emissive. Low quality omits bloom (`Effects.tsx`, `TIER_PARAMS`).

## Wrong

```ts
// BAD — WebGL-era custom shader on a WebGPU canvas
material.onBeforeCompile = (shader) => { /* GLSL */ }
```
