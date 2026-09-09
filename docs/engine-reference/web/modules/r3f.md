# Module: react-three-fiber v9

Last verified: 2026-09-08

Pinned: `@react-three/fiber` **9.6.1**. Changelog: https://github.com/pmndrs/react-three-fiber/blob/master/packages/fiber/CHANGELOG.md  
v9 guide: https://r3f.docs.pmnd.rs/tutorials/v9-migration-guide

## React 19

9.0.0 is the React 19 major. 9.5.0 adds React 19.2 support. Do not suggest r3f 8 APIs or `react-three-fiber` (unscoped).

## WebGPU wiring (v9 guide)

```ts
import * as THREE from 'three/webgpu'
import { createRoot, events, extend, type ThreeToJSXElements } from '@react-three/fiber'

declare module '@react-three/fiber' {
  interface ThreeElements extends ThreeToJSXElements<typeof THREE> {}
}
extend(THREE as never)
```

`GameCanvas.tsx` already does this.

## Mission canvas

Use `createRoot`, not `<Canvas>`. Stock `Canvas` re-runs `configure()` on commit and races `WebGPURenderer.init` ([issue 3782](https://github.com/pmndrs/react-three-fiber/issues/3782)).

```ts
const renderer = new THREE.WebGPURenderer(props)
await renderer.init()
return renderer
```

## Frame loop

`useFrame` for scene mutation. Do not put per-frame unit positions in React state (`AGENTS.md`).

## Not in lockfile

9.7.0 (reconciler scheduling) is npm latest as of 2026-09-08. Do not import it until the lockfile moves.
