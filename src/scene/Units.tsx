// Imperative unit rendering. A pool of per-unit Groups assembled from shared
// geometries and materials, updated every frame straight from the world state.
// Handles walk cycles, death poses, selection rings, billboarded squad slot
// tags with health pips, alert markers and enemy hp bars for 60+ units
// without per-frame allocation.
import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three/webgpu'
import { getWorld } from '../game/runtime'
import { useMissionStore } from '../state/missionStore'
import { buildView, getShared, type View } from './unitModel'

const TMP_Q = new THREE.Quaternion()

// How long an enemy's ground ring stays hot and swollen after a shot.
const FIRE_PULSE = 0.15
// How long a body stays squashed after surviving a hit.
const HIT_FLINCH = 0.18

export default function Units() {
  const camera = useThree((st) => st.camera)
  const group = useMemo(() => new THREE.Group(), [])
  const pool = useRef(new Map<string, View>())

  useEffect(() => {
    const g = group
    const p = pool.current
    return () => {
      p.clear()
      g.clear()
    }
  }, [group])

  useFrame((_, rawDt) => {
    const w = getWorld()
    if (!w) return
    const s = getShared()
    const dt = Math.min(rawDt, 0.05)
    const t = w.time
    const selected = useMissionStore.getState().selected
    s.ringMat.opacity = 0.74 + 0.24 * Math.sin(t * 4.5)
    const turn = 1 - Math.exp(-14 * dt)

    for (const u of w.units) {
      let view = pool.current.get(u.id)
      if (!view) {
        view = buildView(u, s)
        pool.current.set(u.id, view)
        group.add(view.root)
      }
      view.root.position.set(u.pos.x, 0, u.pos.z)

      const dead = u.stance === 'dead' || u.hp <= 0
      if (dead) {
        const k = u.deathT !== undefined ? Math.min(1, Math.max(0, (t - u.deathT) / 0.25)) : 1
        if (view.isDevice) {
          // A destroyed device collapses in place rather than toppling.
          view.rig.rotation.z = 0
          view.rig.scale.y = 1 - 0.6 * k
          view.rig.position.y = 0
          view.faction.visible = false
          continue
        }
        view.rig.rotation.z = (Math.PI / 2) * k
        view.rig.position.y = -0.08 * k
        view.rig.scale.y = view.baseScaleY
        view.legL.rotation.z = 0
        view.legR.rotation.z = 0
        if (view.ring) view.ring.visible = false
        view.faction.visible = false
        if (view.glow) view.glow.visible = false
        if (view.tag) view.tag.visible = false
        if (view.bar) view.bar.visible = false
        if (view.alert) view.alert.visible = false
        continue
      }

      // Facing follows the heading, or the target while attacking.
      // Sim heading is atan2(dx, dz), the +X forward model needs heading - PI/2.
      let desired = u.heading - Math.PI / 2
      if (u.stance === 'attacking' && u.targetId) {
        const tgt = w.unit(u.targetId)
        if (tgt) desired = -Math.atan2(tgt.pos.z - u.pos.z, tgt.pos.x - u.pos.x)
      }
      const dy = Math.atan2(Math.sin(desired - view.yaw), Math.cos(desired - view.yaw))
      view.yaw += dy * turn
      view.root.rotation.y = view.yaw

      view.rig.rotation.z = 0
      // Hit flinch: a brief squash right after a surviving hit, so incoming
      // fire reads on the body and not only on the health bar.
      if (!view.isDevice) {
        const hs = u.lastHitT !== undefined ? t - u.lastHitT : Infinity
        const flinch = hs < HIT_FLINCH ? 1 - hs / HIT_FLINCH : 0
        view.rig.scale.y = view.baseScaleY * (1 - 0.14 * flinch)
      }
      const moving = u.stance === 'moving' || u.stance === 'fleeing'
      if (moving) {
        const ph = t * (5 + u.speed * 1.6) + view.phase
        const sw = Math.sin(ph) * 0.55
        view.legL.rotation.z = sw
        view.legR.rotation.z = -sw
        view.rig.position.y = Math.abs(Math.sin(ph)) * 0.05
      } else {
        view.legL.rotation.z *= 0.8
        view.legR.rotation.z *= 0.8
        view.rig.position.y *= 0.8
      }

      view.faction.visible = true
      if (u.kind === 'enemy') {
        // Fire pulse: the ring flares to the hot material and swells, then
        // eases back over FIRE_PULSE seconds.
        const since = u.lastFireT !== undefined ? t - u.lastFireT : Infinity
        const hot = since < FIRE_PULSE
        if (hot !== view.factionHot) {
          view.factionHot = hot
          view.faction.material = hot ? s.enemyRingHot : s.enemyRingIdle
        }
        const k = hot ? 1 - since / FIRE_PULSE : 0
        view.faction.scale.setScalar(1 + 0.4 * k)
      }
      if (view.ring) {
        const sel = selected.includes(u.id)
        view.ring.visible = sel
        if (view.glow) view.glow.visible = sel
      }
      if (view.tag && view.tagFg) {
        view.tag.visible = true
        const ratio = Math.min(1, Math.max(0.001, u.hp / u.maxHp))
        view.tagFg.scale.x = ratio
        const low = ratio <= 0.3
        if (low !== view.tagLow) {
          view.tagLow = low
          view.tagFg.material = low ? s.barFgMat : s.agentBarMat
        }
        TMP_Q.copy(view.root.quaternion).invert().multiply(camera.quaternion)
        view.tag.quaternion.copy(TMP_Q)
      }
      if (view.bar && view.barFg) {
        const show = u.alerted || u.hp < u.maxHp
        view.bar.visible = show
        if (show) {
          view.barFg.scale.x = Math.min(1, Math.max(0.001, u.hp / u.maxHp))
          TMP_Q.copy(view.root.quaternion).invert().multiply(camera.quaternion)
          view.bar.quaternion.copy(TMP_Q)
        }
      }
      // Red '!' over a guard in combat, amber '?' over one investigating.
      if (view.alert) {
        const hot = u.aiState === 'combat'
        const show = hot || u.aiState === 'suspicious'
        view.alert.visible = show
        if (show) {
          if (hot !== view.alertHot) {
            view.alertHot = hot
            view.alert.material = hot ? s.alertMat : s.suspectMat
          }
          TMP_Q.copy(view.root.quaternion).invert().multiply(camera.quaternion)
          view.alert.quaternion.copy(TMP_Q)
        }
      }
    }
  }, 0)

  return <primitive object={group} />
}
