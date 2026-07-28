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
import type { Unit } from '../game/types'
import { makeAlertTexture, makeGlowTexture, makeSlotTexture } from './textures'

interface Shared {
  legGeom: THREE.BoxGeometry
  torsoGeom: THREE.BoxGeometry
  coatGeom: THREE.BoxGeometry
  headGeom: THREE.SphereGeometry
  visorGeom: THREE.BoxGeometry
  stripeGeom: THREE.BoxGeometry
  chestGeom: THREE.BoxGeometry
  gunGeom: THREE.BoxGeometry
  ringGeom: THREE.RingGeometry
  factionRingGeom: THREE.RingGeometry
  glowGeom: THREE.PlaneGeometry
  barBgGeom: THREE.PlaneGeometry
  barFgGeom: THREE.PlaneGeometry
  alertGeom: THREE.PlaneGeometry
  tagGeom: THREE.PlaneGeometry
  agentBody: THREE.MeshStandardMaterial
  agentCoat: THREE.MeshStandardMaterial
  agentHead: THREE.MeshStandardMaterial
  enemyBody: THREE.MeshStandardMaterial
  enemyCoat: THREE.MeshStandardMaterial
  enemyHead: THREE.MeshStandardMaterial
  enemyVisor: THREE.MeshStandardMaterial
  garrisonChest: THREE.MeshStandardMaterial
  gunMat: THREE.MeshStandardMaterial
  ringMat: THREE.MeshBasicMaterial
  glowMat: THREE.MeshBasicMaterial
  barBgMat: THREE.MeshBasicMaterial
  barFgMat: THREE.MeshBasicMaterial
  agentBarMat: THREE.MeshBasicMaterial
  alertMat: THREE.MeshBasicMaterial
  suspectMat: THREE.MeshBasicMaterial
  enemyRingIdle: THREE.MeshBasicMaterial
  enemyRingHot: THREE.MeshBasicMaterial
  civRingMat: THREE.MeshBasicMaterial
  civMats: THREE.MeshStandardMaterial[]
  civHead: THREE.MeshStandardMaterial
  accentMats: Map<string, THREE.MeshStandardMaterial>
  slotMats: Map<number, THREE.MeshBasicMaterial>
  factionMats: Map<string, THREE.MeshBasicMaterial>
}

let shared: Shared | null = null

function getShared(): Shared {
  if (shared) return shared
  const legGeom = new THREE.BoxGeometry(0.13, 0.7, 0.13)
  legGeom.translate(0, -0.35, 0)
  const std = (color: string, roughness: number): THREE.MeshStandardMaterial =>
    new THREE.MeshStandardMaterial({ color, roughness })
  shared = {
    legGeom,
    torsoGeom: new THREE.BoxGeometry(0.4, 0.55, 0.26),
    coatGeom: new THREE.BoxGeometry(0.5, 0.42, 0.34),
    headGeom: new THREE.SphereGeometry(0.14, 10, 8),
    visorGeom: new THREE.BoxGeometry(0.05, 0.06, 0.2),
    stripeGeom: new THREE.BoxGeometry(0.12, 0.045, 0.46),
    chestGeom: new THREE.BoxGeometry(0.05, 0.12, 0.12),
    gunGeom: new THREE.BoxGeometry(0.6, 0.07, 0.07),
    ringGeom: new THREE.RingGeometry(0.55, 0.76, 28).rotateX(-Math.PI / 2) as THREE.RingGeometry,
    factionRingGeom: new THREE.RingGeometry(0.4, 0.5, 24).rotateX(-Math.PI / 2) as THREE.RingGeometry,
    glowGeom: new THREE.PlaneGeometry(2.3, 2.3).rotateX(-Math.PI / 2) as THREE.PlaneGeometry,
    barBgGeom: new THREE.PlaneGeometry(0.76, 0.1),
    barFgGeom: new THREE.PlaneGeometry(0.7, 0.055).translate(0.35, 0, 0) as THREE.PlaneGeometry,
    alertGeom: new THREE.PlaneGeometry(0.28, 0.5),
    tagGeom: new THREE.PlaneGeometry(0.34, 0.34),
    agentBody: std('#414b57', 0.82),
    agentCoat: std('#303842', 0.88),
    agentHead: std('#3a434e', 0.8),
    enemyBody: std('#393233', 0.78),
    enemyCoat: std('#2c2729', 0.85),
    enemyHead: std('#2e292b', 0.8),
    enemyVisor: new THREE.MeshStandardMaterial({
      color: '#000000',
      emissive: new THREE.Color('#ff3b30'),
      emissiveIntensity: 2.4,
    }),
    garrisonChest: new THREE.MeshStandardMaterial({
      color: '#000000',
      emissive: new THREE.Color('#ff5c4a'),
      emissiveIntensity: 3,
    }),
    gunMat: new THREE.MeshStandardMaterial({ color: '#0c0e11', roughness: 0.55, metalness: 0.35 }),
    ringMat: new THREE.MeshBasicMaterial({
      color: '#7ef0d4',
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
    glowMat: new THREE.MeshBasicMaterial({
      map: makeGlowTexture(),
      color: '#7ef0d4',
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
    barBgMat: new THREE.MeshBasicMaterial({ color: '#0b0f12', transparent: true, opacity: 0.8, depthWrite: false }),
    barFgMat: new THREE.MeshBasicMaterial({ color: '#ff5a4a', transparent: true, opacity: 0.95, depthWrite: false }),
    agentBarMat: new THREE.MeshBasicMaterial({ color: '#7ef0d4', transparent: true, opacity: 0.95, depthWrite: false }),
    alertMat: new THREE.MeshBasicMaterial({
      map: makeAlertTexture(),
      color: '#ff4a3c',
      transparent: true,
      depthWrite: false,
    }),
    suspectMat: new THREE.MeshBasicMaterial({
      map: makeAlertTexture('?'),
      color: '#f0b445',
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    }),
    enemyRingIdle: new THREE.MeshBasicMaterial({
      color: '#ff4a3c',
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
    enemyRingHot: new THREE.MeshBasicMaterial({
      color: '#ffb3a0',
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
    civRingMat: new THREE.MeshBasicMaterial({
      color: '#8a8f96',
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
    civMats: ['#4a4238', '#3d4650', '#55483a', '#414a41', '#5a5044', '#38404b'].map((c) => std(c, 0.95)),
    civHead: std('#5c5348', 0.9),
    accentMats: new Map(),
    slotMats: new Map(),
    factionMats: new Map(),
  }
  return shared
}

function accentMat(s: Shared, hex: string): THREE.MeshStandardMaterial {
  let mat = s.accentMats.get(hex)
  if (!mat) {
    mat = new THREE.MeshStandardMaterial({
      color: '#000000',
      emissive: new THREE.Color(hex),
      emissiveIntensity: 2.2,
    })
    s.accentMats.set(hex, mat)
  }
  return mat
}

function factionMat(s: Shared, hex: string): THREE.MeshBasicMaterial {
  let mat = s.factionMats.get(hex)
  if (!mat) {
    mat = new THREE.MeshBasicMaterial({
      color: hex,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
    s.factionMats.set(hex, mat)
  }
  return mat
}

function slotMat(s: Shared, slot: number): THREE.MeshBasicMaterial {
  let mat = s.slotMats.get(slot)
  if (!mat) {
    mat = new THREE.MeshBasicMaterial({ map: makeSlotTexture(slot), transparent: true, depthWrite: false })
    s.slotMats.set(slot, mat)
  }
  return mat
}

interface View {
  root: THREE.Group
  rig: THREE.Group
  legL: THREE.Mesh
  legR: THREE.Mesh
  ring: THREE.Mesh | null
  faction: THREE.Mesh
  factionHot: boolean
  glow: THREE.Mesh | null
  tag: THREE.Group | null
  tagFg: THREE.Mesh | null
  tagLow: boolean
  bar: THREE.Group | null
  barFg: THREE.Mesh | null
  alert: THREE.Mesh | null
  alertHot: boolean
  yaw: number
  phase: number
}

function hashId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  return (h >>> 0) / 4294967296
}

function buildView(u: Unit, s: Shared): View {
  const root = new THREE.Group()
  const rig = new THREE.Group()
  // Slightly larger than life so squads and hostiles read at tactical zoom.
  rig.scale.setScalar(u.kind === 'civilian' ? 1.05 : 1.22)
  root.add(rig)

  let body = s.civMats[Math.floor(hashId(u.id) * s.civMats.length) % s.civMats.length]
  let coat = body
  let head = s.civHead
  if (u.kind === 'agent') {
    body = s.agentBody
    coat = s.agentCoat
    head = s.agentHead
  } else if (u.kind === 'enemy') {
    body = s.enemyBody
    coat = s.enemyCoat
    head = s.enemyHead
  }

  const legL = new THREE.Mesh(s.legGeom, coat)
  legL.position.set(0, 0.7, -0.09)
  const legR = new THREE.Mesh(s.legGeom, coat)
  legR.position.set(0, 0.7, 0.09)
  const coatMesh = new THREE.Mesh(s.coatGeom, coat)
  coatMesh.position.set(0, 0.86, 0)
  const torso = new THREE.Mesh(s.torsoGeom, body)
  torso.position.set(0, 1.0, 0)
  const headMesh = new THREE.Mesh(s.headGeom, head)
  headMesh.position.set(0, 1.42, 0)
  rig.add(legL, legR, coatMesh, torso, headMesh)

  if (u.kind === 'agent') {
    const accent = u.operative ? u.operative.accent : '#7ef0d4'
    const visor = new THREE.Mesh(s.visorGeom, accentMat(s, accent))
    visor.position.set(0.12, 1.44, 0)
    const stripe = new THREE.Mesh(s.stripeGeom, accentMat(s, accent))
    stripe.position.set(0, 1.29, 0)
    rig.add(visor, stripe)
  } else if (u.kind === 'enemy') {
    const visor = new THREE.Mesh(s.visorGeom, s.enemyVisor)
    visor.position.set(0.12, 1.44, 0)
    rig.add(visor)
    if (u.tag === 'garrison') {
      const chest = new THREE.Mesh(s.chestGeom, s.garrisonChest)
      chest.position.set(0.2, 1.05, 0)
      rig.add(chest)
    }
  }

  if (u.weapon) {
    const gun = new THREE.Mesh(s.gunGeom, s.gunMat)
    gun.position.set(0.34, 1.0, 0.16)
    rig.add(gun)
  }

  // Every unit gets a dim faction ring on the ground so sides read at a
  // glance: agent accent, enemy red, civilian gray. Enemies swap theirs to a
  // hot material while firing.
  let factionRingMat: THREE.MeshBasicMaterial = s.civRingMat
  if (u.kind === 'agent') factionRingMat = factionMat(s, u.operative ? u.operative.accent : '#7ef0d4')
  else if (u.kind === 'enemy') factionRingMat = s.enemyRingIdle
  const faction = new THREE.Mesh(s.factionRingGeom, factionRingMat)
  faction.position.y = 0.04
  faction.renderOrder = 3
  root.add(faction)

  // Agents carry the selection ring, a soft teal underglow while selected and
  // a billboarded overhead tag: slot number plaque above a health pip bar.
  let ring: THREE.Mesh | null = null
  let glow: THREE.Mesh | null = null
  let tag: THREE.Group | null = null
  let tagFg: THREE.Mesh | null = null
  if (u.kind === 'agent') {
    ring = new THREE.Mesh(s.ringGeom, s.ringMat)
    ring.position.y = 0.05
    ring.renderOrder = 5
    ring.visible = false
    root.add(ring)
    glow = new THREE.Mesh(s.glowGeom, s.glowMat)
    glow.position.y = 0.03
    glow.renderOrder = 4
    glow.visible = false
    root.add(glow)
    tag = new THREE.Group()
    tag.position.y = 2.12
    const plate = new THREE.Mesh(s.tagGeom, slotMat(s, u.agentSlot ?? 0))
    plate.position.set(0, 0.33, 0)
    plate.renderOrder = 6
    const bg = new THREE.Mesh(s.barBgGeom, s.barBgMat)
    bg.renderOrder = 6
    tagFg = new THREE.Mesh(s.barFgGeom, s.agentBarMat)
    tagFg.position.set(-0.35, 0, 0.004)
    tagFg.renderOrder = 7
    tag.add(plate, bg, tagFg)
    root.add(tag)
  }

  let bar: THREE.Group | null = null
  let barFg: THREE.Mesh | null = null
  let alert: THREE.Mesh | null = null
  if (u.kind === 'enemy') {
    bar = new THREE.Group()
    bar.position.y = 1.92
    const bg = new THREE.Mesh(s.barBgGeom, s.barBgMat)
    bg.renderOrder = 6
    barFg = new THREE.Mesh(s.barFgGeom, s.barFgMat)
    barFg.position.set(-0.35, 0, 0.004)
    barFg.renderOrder = 7
    bar.add(bg, barFg)
    bar.visible = false
    root.add(bar)
    alert = new THREE.Mesh(s.alertGeom, s.alertMat)
    alert.position.y = 2.4
    alert.renderOrder = 7
    alert.visible = false
    root.add(alert)
  }

  return {
    root,
    rig,
    legL,
    legR,
    ring,
    faction,
    factionHot: false,
    glow,
    tag,
    tagFg,
    tagLow: false,
    bar,
    barFg,
    alert,
    alertHot: true,
    yaw: 0,
    phase: hashId(u.id) * Math.PI * 2,
  }
}

const TMP_Q = new THREE.Quaternion()

// How long an enemy's ground ring stays hot and swollen after a shot.
const FIRE_PULSE = 0.15

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
        view.rig.rotation.z = (Math.PI / 2) * k
        view.rig.position.y = -0.08 * k
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

      // Facing: gun points along heading, or at the target while attacking.
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
