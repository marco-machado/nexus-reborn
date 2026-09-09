# Breaking changes — three.js r176 → r185, r3f 8 → 9, React 19.2

Last verified: 2026-09-08

Source of truth for three.js: [Migration Guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide). Entries below are the ones that can hit a WebGPU + TSL + r3f mission scene. Loader-only and editor-only items are omitted unless this repo already imports them.

Pinned: three.js **r185** (0.185.1). Do not apply **185 → 186** until `/setup-engine upgrade`.

## three.js r176 → r177 (2025-05-30)

- `ColorManagement.fromWorkingColorSpace()` → `workingToColorSpace()`
- `ColorManagement.toWorkingColorSpace()` → `colorSpaceToWorking()`
- Object/Scene JSON format 4.6 → 4.7
- `PeppersGhostEffect` removed

## three.js r177 → r178 (2025-06-30)

- `MultiplyBlending` and `SubtractiveBlending` require `Material.premultipliedAlpha = true`

## three.js r178 → r179 (2025-08-02)

- `Timer` moved into core (`THREE.Timer`); no add-on import
- `USDZLoader` → `USDLoader`
- `TRAAPassNode` → `TRAANode` (new setup)
- WebGL `reverseDepthBuffer` → `reversedDepthBuffer`
- TSL `label()` → `setName()`
- `GaussianBlurNode`: custom `sigma` must be doubled to match old strength

## three.js r179 → r180 (2025-09-03)

- `DepthOfFieldNode` new API
- `RGBELoader` → `HDRLoader`; `RGBMLoader` removed
- `resolution` on `ReflectorNode` / `AnamorphicNode` / `GaussianBlurNode` → scalar `resolutionScale`

## three.js r180 → r181 (2025-11-19)

- PBR / PMREM appearance changed (energy conservation, indirect specular)
- `WebGPURenderer.renderAsync()`, `computeAsync()`, `clearAsync()`, `initTextureAsync()`, `hasFeatureAsync()` **deprecated**. Call `await renderer.init()` (or use `setAnimationLoop`) then the sync methods.
- `waitForGPU()` **removed**
- TSL `PI2` → `TWO_PI`
- `PassNode.setResolution()` / `getResolution()` → `setResolutionScale()` / `getResolutionScale()`

This project already `await renderer.init()` in `GameCanvas.tsx`. Do not reintroduce `renderAsync()`.

## three.js r181 → r182 (2025-12-10)

- `WebGLRenderer` `PCFSoftShadowMap` deprecated; use `PCFShadowMap`
- `WebGPURenderer` `colorBufferType` → `outputBufferType`; `getColorBufferType()` → `getOutputBufferType()`

## three.js r182 → r183 (2026-02-20)

- **`PostProcessing` renamed to `RenderPipeline`** — this repo already uses `RenderPipeline` in `Effects.tsx`
- `Clock` deprecated; use `Timer` (this repo's clocks are game-time strings, not `THREE.Clock`)
- `WebGLCubeRenderTarget` cannot be used with `WebGPURenderer`; use `CubeRenderTarget`
- `MeshPostProcessingMaterial` removed
- WebGPU shadows improved; old shadow bias values may be too high
- `RoomEnvironment` / `Sky` look different (gamma / position)

## three.js r183 → r184 (2026-04-16)

- Background / environment map rotation aligned with object rotation
- `FileLoader.load()` and `ImageBitmapLoader.load()` no longer return a value; use `onLoad`
- `VTKLoader` deprecated
- `FBXLoader` auto-converts +Z-up to +Y-up

## three.js r184 → r185 (2026-07-01) — current pin

- `WebGPURenderer` premultiplied alpha changed. If blending looks wrong: opaque `Scene.background` or `renderer.setClearColor()`. Transparent clear only when blending with HTML.
- `SSAAPassNode.clearColor` / `clearAlpha` removed; clear on the renderer
- TSL: `positionLocal` in `material.positionNode` no longer updates skinned vertex transforms; use `positionGeometry` for pre-transform verts
- TSL `directionToColor()` → `packNormalToRGB()`; `colorToDirection()` → `unpackRGBToNormal()`
- `Object3D.updateWorldMatrix()` honors `matrixWorldNeedsUpdate`. If `matrixAutoUpdate === false` and you write `matrix`, set `matrixWorldNeedsUpdate = true`
- `TiledLighting` removed; use `ClusteredLighting`
- `Matrix3.translate()` / `scale()` / `rotate()` deprecated
- `AnamorphicNode` removed; use `BloomNode`
- `SVGLoader.createShapes()` → `shapePaths.toShapes()`
- `LWOLoader` deprecated

## three.js r185 → r186 (not pinned)

Do not use. If someone pastes r186 APIs: `Object3D.dispose()` now exists and custom `dispose()` must call `super.dispose()`; `Source` → `TextureSource`; `PCFSoftShadowMap` removed on WebGPU (use `PCFShadowMap`).

## @react-three/fiber 8 → 9

From [fiber CHANGELOG](https://github.com/pmndrs/react-three-fiber/blob/master/packages/fiber/CHANGELOG.md) and [v9 migration](https://r3f.docs.pmnd.rs/tutorials/v9-migration-guide):

- 9.0.0: React 19 support (major)
- WebGPU: `import * as THREE from 'three/webgpu'`, `import * as TSL from 'three/tsl'`, `extend(THREE)`, module augmentation of `ThreeElements`
- Async `gl` factory must `await renderer.init()`
- Pinned **9.6.1**. 9.7.0 exists on npm; not in the lockfile.

This repo must not use stock `<Canvas>` for the mission view. `GameCanvas.tsx` uses `createRoot` because `<Canvas>` re-runs `configure()` on commit and races `WebGPURenderer.init` ([pmndrs/react-three-fiber#3782](https://github.com/pmndrs/react-three-fiber/issues/3782)).

## React 19.2 (2025-10-01) → 19.2.8 (lockfile)

From the [React changelog](https://github.com/facebook/react/blob/main/CHANGELOG.md):

- New: `<Activity>`, `useEffectEvent`, `cacheSignal` (RSC), performance tracks
- `useId` IDs use `_` instead of `:`
- 19.2.1–19.2.8 are patches. This project does not use RSC. Do not add `<Activity>` / `useEffectEvent` unless a story requires them.

## Vite

Pinned **6.4.3**. Vite **8.2.2** is current on npm (2026-09-08). That is an upgrade, not this pin.
