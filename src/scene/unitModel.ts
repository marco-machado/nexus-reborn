// Shared procedural unit geometry and materials for the mission and asset viewer.
// Callers own Groups; geometries, materials and generated textures are cached
// for the lifetime of the renderer. Do not dispose them per unit.
import * as THREE from 'three/webgpu'
import type { Unit } from '../game/types'
import { makeAlertTexture, makeGlowTexture, makeSlotTexture } from './textures'
import { addAgentModel, createAgentResources, type AgentResources } from './agentModel'
import { TEAL } from '../ui/tokens'

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
  agentResources: AgentResources
  enemyBody: THREE.MeshStandardMaterial
  enemyCoat: THREE.MeshStandardMaterial
  enemyHead: THREE.MeshStandardMaterial
  enemyVisor: THREE.MeshStandardMaterial
  garrisonChest: THREE.MeshStandardMaterial
  officerChest: THREE.MeshStandardMaterial
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
  vipBody: THREE.MeshStandardMaterial
  vipHead: THREE.MeshStandardMaterial
  vipTrim: THREE.MeshStandardMaterial
  vipRingMat: THREE.MeshBasicMaterial
  deviceGeom: THREE.BoxGeometry
  deviceCoreGeom: THREE.BoxGeometry
  deviceBody: THREE.MeshStandardMaterial
  deviceCore: THREE.MeshStandardMaterial
  deviceRingMat: THREE.MeshBasicMaterial
  accentMats: Map<string, THREE.MeshStandardMaterial>
  slotMats: Map<number, THREE.MeshBasicMaterial>
  factionMats: Map<string, THREE.MeshBasicMaterial>
}

let shared: Shared | null = null

export function getShared(): Shared {
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
    agentResources: createAgentResources(),
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
    // Officers read apart from the garrison at a glance: amber chest lamp.
    officerChest: new THREE.MeshStandardMaterial({
      color: '#000000',
      emissive: new THREE.Color('#ffb300'),
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
    vipBody: std('#c9d4d8', 0.85),
    vipHead: std('#8a7f6e', 0.85),
    vipTrim: new THREE.MeshStandardMaterial({
      color: '#000000',
      emissive: new THREE.Color('#9be8ff'),
      emissiveIntensity: 2.0,
    }),
    vipRingMat: new THREE.MeshBasicMaterial({
      color: '#9be8ff',
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
    deviceGeom: new THREE.BoxGeometry(0.9, 1.0, 0.9),
    deviceCoreGeom: new THREE.BoxGeometry(0.55, 0.22, 0.55),
    deviceBody: std('#1c2427', 0.9),
    // Emissive so the target reads under the bloom pass.
    deviceCore: new THREE.MeshStandardMaterial({
      color: '#000000',
      emissive: new THREE.Color('#ffb300'),
      emissiveIntensity: 2.8,
    }),
    deviceRingMat: new THREE.MeshBasicMaterial({
      color: '#ffb300',
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
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

export interface View {
  root: THREE.Group
  rig: THREE.Group
  // Devices flatten on death instead of toppling, and never animate legs.
  isDevice: boolean
  // Resting rig y scale; the hit flinch squashes against it and restores it.
  baseScaleY: number
  legL: THREE.Object3D
  legR: THREE.Object3D
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

type UnitAppearance = Pick<Unit, 'id' | 'kind' | 'archetype' | 'operative' | 'weapon' | 'tag' | 'agentSlot'>

export function buildView(u: UnitAppearance, s: Shared): View {
  const root = new THREE.Group()
  const rig = new THREE.Group()
  // Slightly larger than life so squads and hostiles read at tactical zoom;
  // heavies carry extra bulk and marksmen run lean so builds read by frame.
  let scale = 1.22
  if (u.kind === 'civilian') scale = 1.05
  else if (u.kind === 'device') scale = 1
  else if (u.archetype === 'heavy') scale = 1.36
  else if (u.archetype === 'marksman') scale = 1.14
  rig.scale.setScalar(scale)
  root.add(rig)

  let body = s.civMats[Math.floor(hashId(u.id) * s.civMats.length) % s.civMats.length]
  let coat = body
  let head = s.civHead
  if (u.kind === 'enemy') {
    body = s.enemyBody
    coat = s.enemyCoat
    head = s.enemyHead
  } else if (u.kind === 'vip') {
    body = s.vipBody
    coat = s.vipBody
    head = s.vipHead
  }

  // Legs exist for every view so the walk cycle code stays branch free; a
  // device simply never parents them.
  const agent = u.kind === 'agent'
    ? addAgentModel(rig, s.agentResources, accentMat(s, u.operative?.accent ?? TEAL), !!u.weapon)
    : null
  const legL = agent?.legL ?? new THREE.Mesh(s.legGeom, coat)
  const legR = agent?.legR ?? new THREE.Mesh(s.legGeom, coat)
  if (!agent) {
    legL.position.set(0, 0.7, -0.09)
    legR.position.set(0, 0.7, 0.09)
  }
  if (u.kind === 'device') {
    const base = new THREE.Mesh(s.deviceGeom, s.deviceBody)
    base.position.set(0, 0.5, 0)
    const core = new THREE.Mesh(s.deviceCoreGeom, s.deviceCore)
    core.position.set(0, 1.11, 0)
    rig.add(base, core)
  } else if (!agent) {
    const coatMesh = new THREE.Mesh(s.coatGeom, coat)
    coatMesh.position.set(0, 0.86, 0)
    const torso = new THREE.Mesh(s.torsoGeom, body)
    torso.position.set(0, 1.0, 0)
    const headMesh = new THREE.Mesh(s.headGeom, head)
    headMesh.position.set(0, 1.42, 0)
    rig.add(legL, legR, coatMesh, torso, headMesh)
  }

  if (u.kind === 'vip') {
    const stripe = new THREE.Mesh(s.stripeGeom, s.vipTrim)
    stripe.position.set(0, 1.29, 0)
    rig.add(stripe)
  }

  if (u.kind === 'enemy') {
    const visor = new THREE.Mesh(s.visorGeom, s.enemyVisor)
    visor.position.set(0.12, 1.44, 0)
    rig.add(visor)
    if (u.tag === 'garrison') {
      const chest = new THREE.Mesh(
        s.chestGeom,
        u.archetype === 'officer' ? s.officerChest : s.garrisonChest,
      )
      chest.position.set(0.2, 1.05, 0)
      rig.add(chest)
    }
  }

  if (u.weapon && u.kind !== 'agent') {
    const gun = new THREE.Mesh(s.gunGeom, s.gunMat)
    gun.position.set(0.34, 1.0, 0.16)
    rig.add(gun)
  }

  // Every unit gets a dim faction ring on the ground so sides read at a
  // glance: agent accent, enemy red, civilian gray. Enemies swap theirs to a
  // hot material while firing.
  let factionRingMat: THREE.MeshBasicMaterial = s.civRingMat
  if (u.kind === 'agent') factionRingMat = factionMat(s, u.operative?.accent ?? TEAL)
  else if (u.kind === 'enemy') factionRingMat = s.enemyRingIdle
  else if (u.kind === 'vip') factionRingMat = s.vipRingMat
  else if (u.kind === 'device') factionRingMat = s.deviceRingMat
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
    isDevice: u.kind === 'device',
    baseScaleY: rig.scale.y,
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

