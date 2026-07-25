// Fixed-angle isometric-style camera. Yaw 45 deg, elevation 55 deg so the eye
// clears the tallest towers at default zoom. WASD/arrows pan in screen-aligned
// ground axes, +/- and the wheel zoom, F recenters on the squad centroid.
import { useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three/webgpu'
import { getWorld } from '../game/runtime'

const YAW = Math.PI / 4
const ELEV = (55 * Math.PI) / 180
// Keep the eye above the mid-rise roofline even at full zoom-in.
const MIN_DIST = 44
const MAX_DIST = 115
const SIN_Y = Math.sin(YAW)
const COS_Y = Math.cos(YAW)
// Screen-up on the ground plane points away from the camera; screen-right is
// its perpendicular.
const FWD = { x: -SIN_Y, z: -COS_Y }
const RIGHT = { x: COS_Y, z: -SIN_Y }

function squadCentroid(out: THREE.Vector3): boolean {
  const w = getWorld()
  if (!w) return false
  let n = 0
  let sx = 0
  let sz = 0
  for (const u of w.units) {
    if (u.kind !== 'agent' || u.stance === 'dead' || u.hp <= 0) continue
    sx += u.pos.x
    sz += u.pos.z
    n++
  }
  if (n === 0) return false
  out.set(sx / n, 0, sz / n)
  return true
}

export default function CameraRig() {
  const camera = useThree((s) => s.camera)
  const gl = useThree((s) => s.gl)

  const state = useMemo(() => {
    const focus = new THREE.Vector3(48, 0, 88)
    const target = focus.clone()
    if (squadCentroid(target)) focus.copy(target)
    // Nudge the opening frame slightly north so the squad reads low center.
    focus.z -= 4
    target.z -= 4
    return {
      focus,
      target,
      dist: 72,
      targetDist: 72,
      keys: new Set<string>(),
      tmp: new THREE.Vector3(),
    }
  }, [])

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera
    cam.fov = 25
    cam.near = 2
    cam.far = 400
    cam.updateProjectionMatrix()
  }, [camera])

  useEffect(() => {
    // Some environments deliver synthetic key events with an empty code;
    // fall back to mapping e.key so the rig works everywhere.
    const KEY_TO_CODE: Record<string, string> = {
      w: 'KeyW', a: 'KeyA', s: 'KeyS', d: 'KeyD', f: 'KeyF',
      W: 'KeyW', A: 'KeyA', S: 'KeyS', D: 'KeyD', F: 'KeyF',
      '=': 'Equal', '+': 'Equal', '-': 'Minus', '_': 'Minus',
      ArrowUp: 'ArrowUp', ArrowDown: 'ArrowDown', ArrowLeft: 'ArrowLeft', ArrowRight: 'ArrowRight',
    }
    const codeOf = (e: KeyboardEvent): string => e.code || KEY_TO_CODE[e.key] || ''
    const down = (e: KeyboardEvent): void => {
      switch (codeOf(e)) {
        case 'KeyW':
        case 'ArrowUp':
        case 'KeyS':
        case 'ArrowDown':
        case 'KeyA':
        case 'ArrowLeft':
        case 'KeyD':
        case 'ArrowRight':
          if (e.code.startsWith('Arrow')) e.preventDefault()
          state.keys.add(e.code)
          break
        case 'KeyF':
          squadCentroid(state.target)
          break
        case 'Equal':
        case 'NumpadAdd':
          state.targetDist = Math.max(MIN_DIST, state.targetDist * 0.86)
          break
        case 'Minus':
        case 'NumpadSubtract':
          state.targetDist = Math.min(MAX_DIST, state.targetDist * 1.16)
          break
        default:
          break
      }
    }
    const up = (e: KeyboardEvent): void => {
      state.keys.delete(codeOf(e))
    }
    const blur = (): void => {
      state.keys.clear()
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
    }
  }, [state])

  useEffect(() => {
    const el = gl.domElement
    const wheel = (e: WheelEvent): void => {
      e.preventDefault()
      state.targetDist = Math.min(MAX_DIST, Math.max(MIN_DIST, state.targetDist * Math.exp(e.deltaY * 0.0012)))
    }
    el.addEventListener('wheel', wheel, { passive: false })
    return () => el.removeEventListener('wheel', wheel)
  }, [gl, state])

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const k = state.keys
    let u = 0
    let v = 0
    if (k.has('KeyW') || k.has('ArrowUp')) u += 1
    if (k.has('KeyS') || k.has('ArrowDown')) u -= 1
    if (k.has('KeyD') || k.has('ArrowRight')) v += 1
    if (k.has('KeyA') || k.has('ArrowLeft')) v -= 1
    if (u !== 0 || v !== 0) {
      const inv = u !== 0 && v !== 0 ? Math.SQRT1_2 : 1
      const speed = state.dist * 0.6 * dt * inv
      state.target.x += (FWD.x * u + RIGHT.x * v) * speed
      state.target.z += (FWD.z * u + RIGHT.z * v) * speed
      state.target.x = Math.max(4, Math.min(92, state.target.x))
      state.target.z = Math.max(4, Math.min(92, state.target.z))
    }
    const damp = 1 - Math.exp(-8 * dt)
    state.focus.lerp(state.target, damp)
    state.dist += (state.targetDist - state.dist) * damp
    const cosE = Math.cos(ELEV)
    state.tmp.set(
      state.focus.x + SIN_Y * cosE * state.dist,
      state.focus.y + Math.sin(ELEV) * state.dist,
      state.focus.z + COS_Y * cosE * state.dist,
    )
    camera.position.copy(state.tmp)
    camera.lookAt(state.focus)
  }, 0)

  return null
}
