# Deprecated / removed APIs — don't use X → use Y

Last verified: 2026-09-08

Pinned three.js **r185**. Check this table before suggesting renderer, TSL, or r3f APIs. Official list: [Migration Guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide).

## Imports and renderer

| Don't use | Use | Since |
|-----------|-----|-------|
| `import … from 'three'` in `src/scene/` | `import * as THREE from 'three/webgpu'` | r170 → r171 |
| `import { WebGPURenderer } from 'three/addons/…'` | `three/webgpu` | r170 → r171 |
| TSL from `'three/nodes'` or addons paths that are now core | `import { … } from 'three/tsl'` | r170 → r171 |
| `new THREE.WebGLRenderer()` for the mission canvas | `new THREE.WebGPURenderer(…)` then `await renderer.init()` | project pin |
| Stock r3f `<Canvas>` for the mission view | `createRoot` in `GameCanvas.tsx` | r3f#3782 |
| `renderer.renderAsync()` / `computeAsync()` / `clearAsync()` | `await renderer.init()` then `render()` / `compute()` / `clear()` | r180 → r181 |
| `renderer.waitForGPU()` | removed; see [three#32012](https://github.com/mrdoob/three.js/issues/32012) | r180 → r181 |
| `new PostProcessing(renderer)` | `new RenderPipeline(renderer)` | r182 → r183 |
| `THREE.Clock` | `THREE.Timer` (not this game's UTC / mission clock strings) | r182 → r183 |
| `WebGLCubeRenderTarget` with WebGPU | `CubeRenderTarget` | r182 → r183 |

## TSL

| Don't use | Use | Since |
|-----------|-----|-------|
| `varying()` | `toVarying()` | r172 → r173 |
| `vertexStage()` | `toVertexStage()` | r172 → r173 |
| `label()` | `setName()` | r178 → r179 |
| `PI2` | `TWO_PI` | r180 → r181 |
| `directionToColor()` | `packNormalToRGB()` | r184 → r185 |
| `colorToDirection()` | `unpackRGBToNormal()` | r184 → r185 |
| `positionLocal` in `material.positionNode` when you need pre-skin verts | `positionGeometry` | r184 → r185 |
| `rangeFog(color, near, far)` | `fog(color, rangeFogFactor(near, far))` | r171 → r172 |
| `storageObject()` | `storage().setPBO(true)` | r170 → r171 |
| `burn()` / `dodge()` / `screen()` / `overlay()` (TSL blend names) | `blendBurn()` / `blendDodge()` / `blendScreen()` / `blendOverlay()` | r170 → r171 |

## Materials, lighting, post

| Don't use | Use | Since |
|-----------|-----|-------|
| Raw GLSL `ShaderMaterial` / `onBeforeCompile` on the WebGPU path | TSL / `NodeMaterial` (`cityMaterials.ts`, `architectureRenderer.ts`) | project + WebGPU |
| `AnamorphicNode` | `BloomNode` (`bloom()` from `three/addons/tsl/display/BloomNode.js`) | r184 → r185 |
| `TiledLighting` | `ClusteredLighting` | r184 → r185 |
| `MeshGouraudMaterial` | `MeshLambertMaterial` | r172 → r173 |
| `MeshPostProcessingMaterial` | removed | r182 → r183 |
| `PCFSoftShadowMap` (WebGL deprecated r182; WebGPU removed r186) | `PCFShadowMap` | r181 → r182 / r185 → r186 |
| `PassNode.setResolution()` | `setResolutionScale()` | r180 → r181 |

## Color and math

| Don't use | Use | Since |
|-----------|-----|-------|
| `ColorManagement.fromWorkingColorSpace()` | `workingToColorSpace()` | r176 → r177 |
| `ColorManagement.toWorkingColorSpace()` | `colorSpaceToWorking()` | r176 → r177 |
| `Matrix3.translate()` / `.scale()` / `.rotate()` | other matrix APIs; these are deprecated | r184 → r185 |

## Not this project's clocks

`src/ui/clock.ts`, `missionParams.formatClock`, and `missionStore.setClock` are **game clocks**, not `THREE.Clock`. Do not "migrate" them to `THREE.Timer`.

## React 19.2 — do not reach for unless a story asks

| API | Status |
|-----|--------|
| `<Activity>` | New in 19.2.0. Not used. |
| `useEffectEvent` | New in 19.2.0. Not used. |
| `cacheSignal` | RSC. This game has no server components. |
