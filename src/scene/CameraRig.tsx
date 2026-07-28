// Fixed-angle isometric-style camera. Yaw 45 deg, elevation 55 deg so the eye
// clears the tallest towers at default zoom. The pan, zoom and recenter keys
// come from game/bindings; the wheel zooms; the HUD steers it from the minimap
// through the pan request in game/runtime. Nothing moves while the mission is
// paused, so the pause menu sits over a scene that holds still.
import { useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three/webgpu'
import { bindingFor, codeOf, type BindingId } from '../game/bindings'
import { getWorld, setCameraFocus, setCameraFootprint, takeCameraPan } from '../game/runtime'
import { CAMERA_YAW, type CameraFootprint } from '../game/types'
import { useMissionStore } from '../state/missionStore'

const ELEV = (55 * Math.PI) / 180
// Keep the eye above the mid-rise roofline even at full zoom-in.
const MIN_DIST = 44
const MAX_DIST = 115
const SIN_Y = Math.sin(CAMERA_YAW)
const COS_Y = Math.cos(CAMERA_YAW)
// Screen-up on the ground plane points away from the camera; screen-right is
// its perpendicular.
const FWD = { x: -SIN_Y, z: -COS_Y }
const RIGHT = { x: COS_Y, z: -SIN_Y }

// Screen corners in normalized device coords, clockwise from the top left.
const NDC: ReadonlyArray<readonly [number, number]> = [
  [-1, 1],
  [1, 1],
  [1, -1],
  [-1, -1],
]
// Cut-off for a corner ray that grazes the ground plane, far past the city at
// any zoom. The fixed tilt keeps every ray pointing down, so this only guards
// a later change to the tilt or the field of view.
const MAX_REACH = 500

// Drops the four view corners onto y=0 and writes the hits into the reused
// footprint points. Needs the camera world matrix current for the frame.
function groundFootprint(camera: THREE.Camera, ray: THREE.Vector3, out: CameraFootprint): void {
  const eye = camera.position
  for (let i = 0; i < NDC.length; i++) {
    ray.set(NDC[i][0], NDC[i][1], -1).unproject(camera).sub(eye).normalize()
    const t = ray.y < -1e-4 ? Math.min(-eye.y / ray.y, MAX_REACH) : MAX_REACH
    out[i].x = eye.x + ray.x * t
    out[i].z = eye.z + ray.z * t
  }
}

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
      // Holds action ids, not codes, so W and Up are one entry.
      keys: new Set<BindingId>(),
      tmp: new THREE.Vector3(),
      ray: new THREE.Vector3(),
      footprint: [
        { x: 0, z: 0 },
        { x: 0, z: 0 },
        { x: 0, z: 0 },
        { x: 0, z: 0 },
      ] as CameraFootprint,
    }
  }, [])

  // The rig publishes the pose from the frame loop; drop it on unmount so the
  // HUD stops drawing a view that no longer exists.
  useEffect(
    () => () => {
      setCameraFootprint(null)
      setCameraFocus(null)
    },
    [],
  )

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera
    cam.fov = 25
    cam.near = 2
    cam.far = 400
    cam.updateProjectionMatrix()
  }, [camera])

  useEffect(() => {
    const down = (e: KeyboardEvent): void => {
      const b = bindingFor(codeOf(e))
      if (!b || b.group !== 'camera') return
      // A paused mission takes no camera input. The recenter and zoom presses
      // have to stop here: the frame loop below never sees them, so without
      // this they would bank and apply the moment the menu closes.
      if (useMissionStore.getState().paused) return
      e.preventDefault()
      switch (b.id) {
        case 'panForward':
        case 'panBack':
        case 'panLeft':
        case 'panRight':
          state.keys.add(b.id)
          break
        case 'recenter':
          squadCentroid(state.target)
          break
        case 'zoomIn':
          state.targetDist = Math.max(MIN_DIST, state.targetDist * 0.86)
          break
        case 'zoomOut':
          state.targetDist = Math.min(MAX_DIST, state.targetDist * 1.16)
          break
        default:
          break
      }
    }
    // Releases are never gated: whatever the pause state, letting go stops.
    const up = (e: KeyboardEvent): void => {
      const b = bindingFor(codeOf(e))
      if (b) state.keys.delete(b.id)
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
      if (useMissionStore.getState().paused) return
      state.targetDist = Math.min(MAX_DIST, Math.max(MIN_DIST, state.targetDist * Math.exp(e.deltaY * 0.0012)))
    }
    el.addEventListener('wheel', wheel, { passive: false })
    return () => el.removeEventListener('wheel', wheel)
  }, [gl, state])

  useFrame((_, rawDt) => {
    // The pause is honoured here rather than in the key handlers alone. A key
    // held from before the pause is already in the set, and no handler runs
    // again until it is released, so this is the only place that can drop it.
    // Nothing else moves either: no pan request is taken, so one queued just
    // before the pause still lands on resume, and no damping runs, so the view
    // cannot drift out from under a frozen scene.
    if (useMissionStore.getState().paused) {
      state.keys.clear()
    } else {
      const dt = Math.min(rawDt, 0.05)
      // A pan request overrides the keys for this frame; holding a key after
      // it just carries on from the new spot.
      const pan = takeCameraPan()
      if (pan) {
        state.target.x = pan.x
        state.target.z = pan.z
      }
      const k = state.keys
      let u = 0
      let v = 0
      if (k.has('panForward')) u += 1
      if (k.has('panBack')) u -= 1
      if (k.has('panRight')) v += 1
      if (k.has('panLeft')) v -= 1
      if (u !== 0 || v !== 0) {
        const inv = u !== 0 && v !== 0 ? Math.SQRT1_2 : 1
        const speed = state.dist * 0.6 * dt * inv
        state.target.x += (FWD.x * u + RIGHT.x * v) * speed
        state.target.z += (FWD.z * u + RIGHT.z * v) * speed
      }
      // Every route to the target lands here, keys, F and the minimap alike.
      state.target.x = Math.max(4, Math.min(92, state.target.x))
      state.target.z = Math.max(4, Math.min(92, state.target.z))
      const damp = 1 - Math.exp(-8 * dt)
      state.focus.lerp(state.target, damp)
      state.dist += (state.targetDist - state.dist) * damp
    }
    // The pose is published every frame, paused or not, so the minimap keeps
    // drawing a viewport instead of dropping it while the menu is up.
    const cosE = Math.cos(ELEV)
    state.tmp.set(
      state.focus.x + SIN_Y * cosE * state.dist,
      state.focus.y + Math.sin(ELEV) * state.dist,
      state.focus.z + COS_Y * cosE * state.dist,
    )
    camera.position.copy(state.tmp)
    camera.lookAt(state.focus)
    camera.updateMatrixWorld()
    groundFootprint(camera, state.ray, state.footprint)
    setCameraFootprint(state.footprint)
    setCameraFocus(state.focus)
  }, 0)

  return null
}
