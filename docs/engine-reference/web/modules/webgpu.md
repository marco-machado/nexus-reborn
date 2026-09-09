# Module: WebGPURenderer

Last verified: 2026-09-08

Pinned: three.js r185 / 0.185.1. Official: [Migration Guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide), [r185 notes](https://github.com/mrdoob/three.js/releases/tag/r185).

## Imports

```ts
import * as THREE from 'three/webgpu'
```

Do not import the renderer from `'three'` or from `three/addons/renderers/webgpu/...`.

## Init

```ts
const renderer = new THREE.WebGPURenderer({ canvas })
await renderer.init()
```

After r181, sync `render()` / `clear()` / feature checks require init first. `renderAsync()` is deprecated. `waitForGPU()` is removed.

This repo's factory lives in `GameCanvas.tsx`. It sets `ACESFilmicToneMapping` and logs `backend.isWebGPUBackend`.

## Fallback

`init()` selects WebGPU or WebGL2. Do not add a second renderer class. Record the backend in QA (`README.md`).

## r185 blending

Premultiplied alpha implementation changed. Prefer opaque `Scene.background` or `setClearColor()`. Transparent clear only when compositing over HTML.

## Shadows / buffers

- Prefer `PCFShadowMap` over `PCFSoftShadowMap` (deprecated on WebGL in r182; removed on WebGPU in r186).
- `colorBufferType` → `outputBufferType` (r182).
- Do not use `WebGLCubeRenderTarget` with this renderer; use `CubeRenderTarget` (r183).

## Post

Use `RenderPipeline` from `three/webgpu` (`Effects.tsx`). The old name `PostProcessing` is gone as of r183.

## Wrong

```ts
// BAD — pre-r171 and training-data default
import * as THREE from 'three'
const renderer = new THREE.WebGLRenderer({ canvas })
renderer.render(scene, camera)
```
