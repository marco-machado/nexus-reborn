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
import {
  TIER_PARAMS,
  createFrameProbe,
  getMissionTier,
  resolveTier,
  setMissionTier,
  stepDownTier,
} from '../game/quality'
import type { FrameProbe } from '../game/quality'
import { useMissionStore } from '../state/missionStore'
import { useSettingsStore } from '../state/settingsStore'
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
  const webgpu = backend.isWebGPUBackend === true
  // The quality tier is resolved once per mission mount, here, where the
  // backend is finally known: AUTO reads it, an explicit setting passes
  // through. Scene components read the resolved tier at their own mount.
  const tier = resolveTier(useSettingsStore.getState().quality, webgpu)
  setMissionTier(tier)
  console.info(
    '[scene] renderer backend: ' +
      (webgpu ? 'WebGPU' : 'WebGL2') +
      ', quality tier: ' +
      tier.toUpperCase(),
  )
  return renderer
}

// DPR bounds for the mounted tier; valid once the gl factory has resolved it.
function tierDpr(): [number, number] {
  return [1, TIER_PARAMS[getMissionTier()].dprMax]
}

// Steps a sustained-slow AUTO mission down one tier: persists the concrete
// tier in settings and posts a comm-log notice. Rain, bloom and DPR are read
// at mount, so the change lands on the next mission rather than tearing the
// live pipeline down mid-fight (the manual r3f root makes that unsafe).
function FrameGovernor() {
  const probeRef = useRef<FrameProbe | null>(null)
  useFrame((_, dt) => {
    if (useSettingsStore.getState().quality !== 'auto') return
    if (probeRef.current === null) probeRef.current = createFrameProbe()
    if (!probeRef.current.sample(dt)) return
    const next = stepDownTier(getMissionTier())
    if (!next) return
    useSettingsStore.getState().setQuality(next)
    const ms = useMissionStore.getState()
    ms.addLog({
      t: ms.clock,
      who: 'SYS',
      msg:
        'PERFORMANCE GOVERNOR: SUSTAINED FRAME LOAD. QUALITY SET TO ' +
        next.toUpperCase() +
        ' FROM THE NEXT MISSION.',
    })
  }, 0)
  return null
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
      <FrameGovernor />
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
    void m.ready.then(async () => {
      if (!m.alive) return
      // The gl factory has resolved the tier by now; apply its DPR bound
      // before the first render so no frame draws at the boot ratio.
      await m.root.configure({ size: size(), dpr: tierDpr() })
      if (m.alive) m.root.render(<SceneTree />)
    })
    const ro = new ResizeObserver(() => {
      void m.ready.then(() => {
        if (m.alive) void m.root.configure({ size: size(), dpr: tierDpr() })
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
