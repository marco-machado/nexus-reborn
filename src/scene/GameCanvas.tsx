// Full-viewport R3F canvas on the three WebGPURenderer (WebGL2 fallback is
// automatic inside init). Hosts the world tick driver, the city, units, fx,
// rain, input surface and the bloom pipeline.
import * as THREE from 'three/webgpu'
import { Canvas, extend, useFrame, type ThreeToJSXElements } from '@react-three/fiber'
import { getWorld } from '../game/runtime'
import { useMissionStore } from '../state/missionStore'
import Atmosphere from './Atmosphere'
import CameraRig from './CameraRig'
import CityView from './CityView'
import Effects from './Effects'
import Fx from './Fx'
import Input from './Input'
import Rain from './Rain'
import Units from './Units'

declare module '@react-three/fiber' {
  interface ThreeElements extends ThreeToJSXElements<typeof THREE> {}
}

extend(THREE as never)

// StrictMode mounts twice; cache one renderer init per canvas element.
const rendererCache = new WeakMap<object, Promise<THREE.WebGPURenderer>>()

const glFactory = (props: { canvas: HTMLCanvasElement }): Promise<THREE.WebGPURenderer> => {
  let p = rendererCache.get(props.canvas)
  if (!p) {
    const renderer = new THREE.WebGPURenderer(props as ConstructorParameters<typeof THREE.WebGPURenderer>[0])
    p = renderer.init().then(() => {
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.1
      const backend = renderer.backend as { isWebGPUBackend?: boolean }
      console.info('[scene] renderer backend: ' + (backend.isWebGPUBackend ? 'WebGPU' : 'WebGL2'))
      return renderer
    })
    rendererCache.set(props.canvas, p)
  }
  return p
}

// Advances the simulation before the priority-1 render pass in Effects.
// Passes the raw frame delta; the world substeps internally so mission time
// keeps tracking wall time across long frame gaps.
function WorldTicker() {
  useFrame((_, dt) => {
    const w = getWorld()
    const ms = useMissionStore.getState()
    if (w && ms.live && !ms.paused) w.tick(dt)
  }, 0)
  return null
}

export default function GameCanvas() {
  return (
    <div
      style={{ position: 'absolute', inset: 0, background: '#050a10' }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <Canvas
        gl={glFactory as never}
        dpr={[1, 1.75]}
        camera={{ fov: 25, near: 2, far: 400, position: [80, 45, 120] }}
      >
        <WorldTicker />
        <CameraRig />
        <Atmosphere />
        <CityView />
        <Units />
        <Fx />
        <Rain />
        <Input />
        <Effects />
      </Canvas>
    </div>
  )
}
