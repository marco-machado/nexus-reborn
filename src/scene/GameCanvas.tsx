// Full-viewport R3F canvas on the three WebGPURenderer (WebGL2 fallback is
// automatic inside init). Hosts the world tick driver, the city, units, fx,
// rain, input surface and the bloom pipeline.
//
// The root is driven through createRoot instead of <Canvas>. The stock Canvas
// restarts configure() from an undepped layout effect on every commit, and
// with an async gl factory (WebGPURenderer.init takes seconds) the overlapping
// configure calls race the pending renderer promise; children can then render
// against a torn down hooks dispatcher and log "Invalid hook call" while the
// scene recovers (pmndrs/react-three-fiber#3782). One createRoot, one
// configure and one render per canvas keeps the mount single flight.
import { StrictMode, useEffect, useRef } from 'react'
import * as THREE from 'three/webgpu'
import { createRoot, events, extend, useFrame, type ThreeToJSXElements } from '@react-three/fiber'
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
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- declaration merging needs an interface
  interface ThreeElements extends ThreeToJSXElements<typeof THREE> {}
}

extend(THREE as never)

const glFactory = async (props: { canvas: HTMLCanvasElement }): Promise<THREE.WebGPURenderer> => {
  const renderer = new THREE.WebGPURenderer(props as ConstructorParameters<typeof THREE.WebGPURenderer>[0])
  await renderer.init()
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.1
  const backend = renderer.backend as { isWebGPUBackend?: boolean }
  console.info('[scene] renderer backend: ' + (backend.isWebGPUBackend ? 'WebGPU' : 'WebGL2'))
  return renderer
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

function SceneTree() {
  return (
    <StrictMode>
      <WorldTicker />
      <CameraRig />
      <Atmosphere />
      <CityView />
      <Units />
      <Fx />
      <Rain />
      <Input />
      <Effects />
    </StrictMode>
  )
}

interface Mount {
  root: ReturnType<typeof createRoot<HTMLCanvasElement>>
  ready: Promise<unknown>
  alive: boolean
}

// StrictMode re-runs the mount effect against the same canvas element; the
// cache keeps that second pass from starting a second configure.
const mounts = new WeakMap<HTMLCanvasElement, Mount>()

export default function GameCanvas() {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return
    const size = () => ({ width: wrap.clientWidth, height: wrap.clientHeight, top: 0, left: 0 })
    let mount = mounts.get(canvas)
    if (!mount) {
      const root = createRoot(canvas)
      mount = {
        root,
        alive: false,
        ready: root.configure({
          gl: glFactory as never,
          events,
          dpr: [1, 1.75],
          camera: { fov: 25, near: 2, far: 400, position: [80, 45, 120] },
          size: size(),
        }),
      }
      mounts.set(canvas, mount)
    }
    const m = mount
    m.alive = true
    void m.ready.then(() => {
      if (m.alive) m.root.render(<SceneTree />)
    })
    const ro = new ResizeObserver(() => {
      void m.ready.then(() => {
        if (m.alive) void m.root.configure({ size: size(), dpr: [1, 1.75] })
      })
    })
    ro.observe(wrap)
    return () => {
      ro.disconnect()
      m.alive = false
      // Deferred teardown: a StrictMode remount reclaims the mount on the
      // same tick, only a real unmount reaches the timeout with alive false.
      setTimeout(() => {
        if (!m.alive) {
          mounts.delete(canvas)
          m.root.unmount()
        }
      }, 0)
    }
  }, [])

  return (
    <div
      ref={wrapRef}
      style={{ position: 'absolute', inset: 0, background: '#050a10' }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  )
}
