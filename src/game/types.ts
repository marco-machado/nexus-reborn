// CONTRACT FILE. Shared types for scene, gameplay, and UI modules.
// Coordinate system: ground plane is XZ, +Y up. 1 world unit = 1 meter.
// The city is a square grid of size*size cells, cell size 1 unit, cell (cx,cz)
// spans world x in [cx, cx+1), z in [cz, cz+1). World origin at city corner.

export type Vec2 = { x: number; z: number }

export type WeaponId = 'assault' | 'pistol' | 'smg' | 'longrifle' | 'shotgun'

export interface WeaponDef {
  id: WeaponId
  name: string
  damage: number
  range: number
  cooldown: number
  magazine: number
  reload: number
  spread: number
  tracer: string
}

export type AgentRole =
  | 'assault'
  | 'recon'
  | 'infiltrator'
  | 'demolitions'
  | 'sniper'
  | 'tech'
  | 'support'
  | 'medic'

export interface OperativeDef {
  id: string
  name: string
  codename: string
  role: AgentRole
  maxHp: number
  speed: number
  weapon: WeaponId
  sidearm: WeaponId
  accent: string
  status: 'READY' | 'INJURED' | 'ON MISSION'
  bio: string
}

export type UnitKind = 'agent' | 'enemy' | 'civilian'
export type UnitStance = 'idle' | 'moving' | 'attacking' | 'fleeing' | 'dead'

export interface Unit {
  id: string
  kind: UnitKind
  name: string
  pos: Vec2
  heading: number
  hp: number
  maxHp: number
  speed: number
  weapon: WeaponDef | null
  stance: UnitStance
  path: Vec2[]
  targetId: string | null
  cooldown: number
  magazine: number
  reloading: number
  alerted: boolean
  patrol?: Vec2[]
  patrolIndex?: number
  agentSlot?: number
  operative?: OperativeDef
  tag?: string
  deathT?: number
}

export interface Tracer {
  from: Vec2
  to: Vec2
  y0: number
  y1: number
  t: number
  color: string
}

export interface Boom {
  pos: Vec2
  t: number
  r: number
  color: string
}

export type ObjectiveKind = 'reach-zone' | 'eliminate-tag' | 'extract'

export interface ObjectiveDef {
  id: string
  label: string
  kind: ObjectiveKind
  tag?: string
  zone?: { x: number; z: number; r: number }
}

export interface MissionDef {
  id: string
  codename: string
  city: string
  district: string
  sector: string
  type: string
  client: string
  threat: 'MODERATE' | 'HIGH' | 'SEVERE'
  reward: number
  seed: number
  briefing: string[]
  notes: string[]
  objectives: ObjectiveDef[]
  locked: boolean
  mapPos: { x: number; y: number }
}

export interface BuildingData {
  x: number
  z: number
  w: number
  d: number
  h: number
  kind: 'tower' | 'block' | 'industrial' | 'slab'
  tint: number
  neon?: { side: 0 | 1 | 2 | 3; color: string; h: number }
}

export interface PropData {
  x: number
  z: number
  kind: 'crate' | 'barrier' | 'car' | 'dumpster' | 'vent' | 'pillar'
  rot: number
  blocking: boolean
}

export interface LightData {
  x: number
  z: number
  kind: 'street' | 'neon'
  color: string
}

export interface EnemySpawn {
  pos: Vec2
  patrol: Vec2[]
  weapon: WeaponId
  tag?: string
  hp?: number
  name?: string
}

export interface CityData {
  size: number
  walk: Uint8Array
  buildings: BuildingData[]
  props: PropData[]
  lights: LightData[]
  roadsH: number[]
  roadsV: number[]
  spawnAgents: Vec2[]
  enemies: EnemySpawn[]
  civilians: Vec2[]
  extraction: { x: number; z: number; r: number }
  checkpoint: { x: number; z: number; r: number }
}

export interface CommEntry {
  t: string
  who: string
  msg: string
  cls?: 'sys' | 'alert' | 'ok'
}

// Ground plane footprint of the camera frustum, world XZ, wound clockwise from
// the top left screen corner. The scene rig owns the points and rewrites them
// every frame, so readers use them at once and never keep the reference.
export type CameraFootprint = readonly [Vec2, Vec2, Vec2, Vec2]

// Live simulation surface shared between the scene renderer, the HUD and input.
export interface WorldApi {
  city: CityData
  mission: MissionDef
  units: Unit[]
  tracers: Tracer[]
  booms: Boom[]
  time: number
  tick(dt: number): void
  orderMove(agentIds: string[], dest: Vec2): void
  orderAttack(agentIds: string[], targetId: string): void
  unit(id: string): Unit | undefined
}

export const CITY_SIZE = 96

// Fixed camera yaw. The scene rig orbits at this angle and the HUD minimap
// turns by it, so up on the map is up on screen.
export const CAMERA_YAW = Math.PI / 4

export function cellIndex(size: number, x: number, z: number): number {
  const cx = Math.floor(x)
  const cz = Math.floor(z)
  if (cx < 0 || cz < 0 || cx >= size || cz >= size) return -1
  return cz * size + cx
}

export function isWalkable(city: CityData, x: number, z: number): boolean {
  const i = cellIndex(city.size, x, z)
  return i >= 0 && city.walk[i] === 1
}
