// Rain as vertical streak line segments, two layers falling inside a 70-unit
// box that follows the camera focus. Positions wrap vertically and
// horizontally so the storm never ends and never leaves the view. Streak
// density comes from the mission weather; a clear mission mounts nothing.
import { useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three/webgpu'
import { getWorld } from '../game/runtime'
import { useSettingsStore } from '../state/settingsStore'

const BOX = 70
const HALF = BOX / 2

interface Layer {
  lines: THREE.LineSegments
  positions: Float32Array
  speeds: Float32Array
  attr: THREE.BufferAttribute
  streak: number
  count: number
  geom: THREE.BufferGeometry
  mat: THREE.LineBasicMaterial
}

function buildLayer(count: number, streak: number, opacity: number, fall: number): Layer {
  const positions = new Float32Array(count * 6)
  const speeds = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    const x = 48 + (Math.random() - 0.5) * BOX
    const y = Math.random() * BOX
    const z = 48 + (Math.random() - 0.5) * BOX
    const o = i * 6
    positions[o] = x
    positions[o + 1] = y
    positions[o + 2] = z
    positions[o + 3] = x
    positions[o + 4] = y + streak
    positions[o + 5] = z
    speeds[i] = fall * (0.85 + Math.random() * 0.3)
  }
  const geom = new THREE.BufferGeometry()
  const attr = new THREE.BufferAttribute(positions, 3)
  attr.setUsage(THREE.DynamicDrawUsage)
  geom.setAttribute('position', attr)
  const mat = new THREE.LineBasicMaterial({
    color: '#a8c4d8',
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const lines = new THREE.LineSegments(geom, mat)
  lines.frustumCulled = false
  lines.renderOrder = 20
  return { lines, positions, speeds, attr, streak, count, geom, mat }
}

const TMP_DIR = new THREE.Vector3()

export default function Rain() {
  // The mission's weather is fixed for the lifetime of this mount: the world
  // is set before the canvas renders and swapped only across remounts.
  const weather = getWorld()?.mission.weather ?? 'none'
  if (weather === 'none') return null
  return <RainLayers heavy={weather === 'heavy'} />
}

function RainLayers({ heavy }: { heavy: boolean }) {
  const scene = useThree((s) => s.scene)
  // Reduced motion drops the storm to one sparse layer regardless of the
  // mission weather; subscribing here rebuilds it when the toggle moves.
  const reduced = useSettingsStore((s) => s.reducedMotion)
  // Layers and group must come from ONE memo: StrictMode re-invokes memo
  // creators, and a second creator re-running against a cached layers value
  // would reparent the segments into a discarded group.
  const { layers, group } = useMemo(() => {
    const built = reduced
      ? [buildLayer(240, 0.45, 0.1, 12)]
      : heavy
        ? [buildLayer(1100, 0.55, 0.22, 15), buildLayer(700, 0.85, 0.13, 10)]
        : [buildLayer(480, 0.45, 0.15, 13), buildLayer(300, 0.7, 0.09, 9)]
    const g = new THREE.Group()
    for (const l of built) g.add(l.lines)
    return { layers: built, group: g }
  }, [heavy, reduced])

  useEffect(() => {
    scene.add(group)
    return () => {
      scene.remove(group)
    }
  }, [scene, group])

  const aliveRef = useMemo(() => ({ alive: false }), [])
  useEffect(() => {
    aliveRef.alive = true
    return () => {
      aliveRef.alive = false
      setTimeout(() => {
        if (aliveRef.alive) return
        for (const l of layers) {
          l.geom.dispose()
          l.mat.dispose()
        }
      }, 0)
    }
  }, [layers, aliveRef])

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const cam = state.camera
    cam.getWorldDirection(TMP_DIR)
    let cx = cam.position.x
    let cz = cam.position.z
    if (TMP_DIR.y < -0.1) {
      const t = Math.min(90, Math.max(5, -cam.position.y / TMP_DIR.y))
      cx = cam.position.x + TMP_DIR.x * t
      cz = cam.position.z + TMP_DIR.z * t
    }
    for (const l of layers) {
      const pos = l.positions
      const streak = l.streak
      for (let i = 0; i < l.count; i++) {
        const o = i * 6
        let y = pos[o + 1] - l.speeds[i] * dt
        let x = pos[o] + 0.7 * dt
        let z = pos[o + 2]
        if (y < 0) {
          y += BOX
          x = cx + (Math.random() - 0.5) * BOX
          z = cz + (Math.random() - 0.5) * BOX
        }
        const rx = x - cx
        if (rx > HALF) x -= BOX
        else if (rx < -HALF) x += BOX
        const rz = z - cz
        if (rz > HALF) z -= BOX
        else if (rz < -HALF) z += BOX
        pos[o] = x
        pos[o + 1] = y
        pos[o + 2] = z
        pos[o + 3] = x - 0.04
        pos[o + 4] = y + streak
        pos[o + 5] = z
      }
      l.attr.needsUpdate = true
    }
  }, 0)

  return null
}
