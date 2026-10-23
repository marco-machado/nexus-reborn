// Active-objective markers in the 3D view (TM-020): a VIP Ice ground ring on
// every place the player must go now, and a light beam over each required
// one so it reads from across the district. An optional objective gets the
// ring only, thinner, so required vs optional holds without colour. Marks
// come from game/objectiveMarks (the zone rule the sim and minimap share),
// read imperatively a few times a second; nothing per frame enters React.
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three/webgpu'
import { getWorld } from '../game/runtime'
import { objectiveMarks } from '../game/objectiveMarks'
import { useMissionStore } from '../state/missionStore'
import { useSettingsStore } from '../state/settingsStore'
import { VIP } from '../ui/tokens'

const MAX_MARKS = 8
const REFRESH_SEC = 0.2
const BEAM_H = 9

interface Slot {
  ring: THREE.Mesh
  ringMat: THREE.MeshBasicMaterial
  beam: THREE.Mesh
  optional: boolean
}

function buildPool() {
  const group = new THREE.Group()
  const disposables: { dispose: () => void }[] = []
  // Unit ring, scaled per mark: outer radius 1, a 0.12 band.
  const ringGeom = new THREE.RingGeometry(0.88, 1, 48).rotateX(-Math.PI / 2)
  const thinGeom = new THREE.RingGeometry(0.94, 1, 48).rotateX(-Math.PI / 2)
  const beamGeom = new THREE.CylinderGeometry(0.16, 0.16, BEAM_H, 10, 1, true).translate(0, BEAM_H / 2, 0)
  const beamMat = new THREE.MeshBasicMaterial({
    color: VIP,
    transparent: true,
    opacity: 0.22,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
  disposables.push(ringGeom, thinGeom, beamGeom, beamMat)
  const slots: Slot[] = []
  for (let i = 0; i < MAX_MARKS; i++) {
    const ringMat = new THREE.MeshBasicMaterial({
      color: VIP,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    disposables.push(ringMat)
    const ring = new THREE.Mesh(ringGeom, ringMat)
    ring.renderOrder = 6
    ring.visible = false
    const beam = new THREE.Mesh(beamGeom, beamMat)
    beam.visible = false
    group.add(ring, beam)
    slots.push({ ring, ringMat, beam, optional: false })
  }
  return {
    group,
    slots,
    ringGeom,
    thinGeom,
    dispose: () => {
      for (const d of disposables) d.dispose()
    },
  }
}

export default function ObjectiveMarkers() {
  const pool = useMemo(buildPool, [])
  useEffect(() => () => pool.dispose(), [pool])

  const clock = useRef({ since: REFRESH_SEC, phase: 0 })
  useFrame((_, dt) => {
    const c = clock.current
    const w = getWorld()
    const ms = useMissionStore.getState()
    const reduced = useSettingsStore.getState().reducedMotion
    c.since += dt
    if (c.since >= REFRESH_SEC) {
      c.since = 0
      const marks = w && ms.live ? objectiveMarks(w.mission.objectives, ms.objectives, w.units, w.city) : []
      for (let i = 0; i < pool.slots.length; i++) {
        const s = pool.slots[i]
        const m = marks[i]
        if (!m) {
          s.ring.visible = false
          s.beam.visible = false
          continue
        }
        s.optional = m.optional
        s.ring.geometry = m.optional ? pool.thinGeom : pool.ringGeom
        s.ring.position.set(m.x, 0.06, m.z)
        s.ring.scale.setScalar(m.r)
        s.ring.visible = true
        s.beam.position.set(m.x, 0, m.z)
        s.beam.visible = !m.optional
      }
    }
    // A slow breathe on the ring so it reads as live; steady under reduced
    // motion. Held or paused, the scene's clock is the frame clock, so the
    // marker still breathes: it is chrome, not sim.
    if (!reduced) c.phase += dt
    const k = reduced ? 1 : 0.7 + 0.3 * Math.sin(c.phase * 3)
    for (const s of pool.slots) {
      if (s.ring.visible) s.ringMat.opacity = (s.optional ? 0.55 : 0.9) * k
    }
  })

  return <primitive object={pool.group} />
}
