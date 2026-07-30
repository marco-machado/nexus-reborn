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

export type UnitKind = 'agent' | 'enemy' | 'civilian' | 'vip' | 'device'
export type UnitStance = 'idle' | 'moving' | 'attacking' | 'fleeing' | 'dead'

// Enemy awareness. Patrol has seen nothing, suspicious is walking to something
// it half saw or heard, combat is engaging. Enemies only.
export type EnemyAiState = 'patrol' | 'suspicious' | 'combat'

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
  // Agent order state, false for enemies and civilians. holdGround pins the
  // unit to its cell: the movement step and separation both skip it, and any
  // route it holds is parked until the hold lifts. holdFire withholds
  // auto-engagement so only an explicit attack order fires.
  holdGround: boolean
  holdFire: boolean
  aiState?: EnemyAiState
  patrol?: Vec2[]
  patrolIndex?: number
  agentSlot?: number
  operative?: OperativeDef
  // Agent weapon slots. `weapon` and `magazine` always describe the drawn
  // weapon; the stowed slot keeps its own magazine and comes back exactly as
  // it was left. `swapReadyAt` is the world time the drawn weapon may fire
  // from, so a fresh draw cannot shoot instantly. Enemies never set these.
  activeSlot?: 'primary' | 'sidearm'
  stowedWeapon?: WeaponDef
  stowedMagazine?: number
  swapReadyAt?: number
  tag?: string
  deathT?: number
  lastFireT?: number
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

export type ObjectiveKind =
  | 'reach-zone'
  | 'eliminate-tag'
  | 'extract'
  | 'interact' // channel at a point for a duration
  | 'escort' // bring the vip to a zone alive
  | 'destroy' // reduce tagged device units to zero
  | 'defend' // hold a zone for a duration against a spawned wave

export interface Zone {
  x: number
  z: number
  r: number
}

// Defend wave: entry names resolve through CityData.landmarks, so authored
// data never carries coordinates the generator owns.
export interface WaveSpec {
  count: number
  weapons: WeaponId[]
  entry: string[]
}

export interface ObjectiveDef {
  id: string
  label: string
  kind: ObjectiveKind
  tag?: string
  zone?: Zone
  // Resolves the zone from CityData.landmarks when zone is not given.
  landmark?: string
  durationSec?: number
  // An optional objective activates with the required objective it precedes
  // in the list, never blocks the sequence, and pays bonusReward when done.
  optional?: boolean
  bonusReward?: number
  wave?: WaveSpec
}

// Continental sector of the world map. Ids index the atlas.
export type SectorId = 'na' | 'sa' | 'eu' | 'af' | 'as' | 'oc' | 'an'

// Tactical layout family the generator builds for a mission.
export type DistrictArchetype = 'checkpoint' | 'compound' | 'industrial'

export interface DistrictSpec {
  archetype: DistrictArchetype
  seed: number
}

export type Weather = 'heavy' | 'light' | 'none'

export interface MissionDef {
  id: string
  codename: string
  city: string
  district: string
  sector: SectorId
  type: string
  client: string
  threat: 'MODERATE' | 'HIGH' | 'SEVERE'
  reward: number
  // Time to the extraction window; the debrief advances the world clock by it.
  // Success chance is derived (game/missionParams.ts), never authored.
  etaDays: number
  weather: Weather
  // Authored layouts; the first entry is the default, a replay after a won
  // contract rotates to the next.
  variants: DistrictSpec[]
  seed: number
  briefing: string[]
  notes: string[]
  objectives: ObjectiveDef[]
  intelReq: number
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

// Half open cell span of one paved road band, [x0, x1) by [z0, z1).
export interface RoadRect {
  x0: number
  z0: number
  x1: number
  z1: number
}

export interface CityData {
  size: number
  archetype: DistrictArchetype
  walk: Uint8Array
  buildings: BuildingData[]
  props: PropData[]
  lights: LightData[]
  // Full paved spans, for the ground texture and the minimap.
  roadRects: RoadRect[]
  // Centerline rows and columns, for crossing lights.
  roadsH: number[]
  roadsV: number[]
  spawnAgents: Vec2[]
  enemies: EnemySpawn[]
  civilians: Vec2[]
  vips: Vec2[]
  devices: Array<{ pos: Vec2; tag: string }>
  // Named zones: insertion, extraction, target, plus archetype extras
  // (gate, console, server, yard-a, yard-b, waveEntry-*).
  landmarks: Record<string, Zone>
  // Mirrors of landmarks.extraction and landmarks.target for older read sites.
  extraction: Zone
  checkpoint: Zone
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
  // Effective guard sight range for this mission: ENEMY_VISION scaled by the
  // weather modifier. The minimap cones must draw from this, not the const.
  vision: number
  tick(dt: number): void
  orderMove(agentIds: string[], dest: Vec2): void
  orderAttack(agentIds: string[], targetId: string): void
  // Cancels the route and the target. Leaves holdGround and holdFire alone, so
  // a free fire agent may pick a new target up on its own; the cease-fire is
  // orderHoldFire.
  orderStop(agentIds: string[]): void
  orderHold(agentIds: string[], hold: boolean): void
  orderHoldFire(agentIds: string[], hold: boolean): void
  // Swaps every selected agent to its other weapon slot. The drawn weapon
  // cannot fire for a short readiness delay; an in-progress reload of the
  // stowed weapon is cancelled and its magazine persists as-is.
  orderSwapWeapon(agentIds: string[]): void
  orderMedStim(agentId: string): boolean
  orderGrenade(agentId: string, target: Vec2): boolean
  unit(id: string): Unit | undefined
}

export const CITY_SIZE = 96

// Fixed camera yaw. The scene rig orbits at this angle and the HUD minimap
// turns by it, so up on the map is up on screen.
export const CAMERA_YAW = Math.PI / 4

// Enemy sight. An agent is seen inside the facing cone out to ENEMY_VISION, or
// from any direction inside NOTICE_RADIUS. The minimap draws the same cone, so
// both the simulation and the panel read these.
export const ENEMY_VISION = 14
export const VISION_HALF_ANGLE = (55 * Math.PI) / 180
export const NOTICE_RADIUS = 4.5

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
