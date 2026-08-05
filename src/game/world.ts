// Gameplay simulation: units, movement, combat, enemy FSM, civilians,
// objectives and low rate store sync. Pure TypeScript, no rendering.
// Note: MissionScreen resets the mission store right after createWorld, so
// every store write is deferred to the first tick (startup()).
import type {
  AgentRole,
  Boom,
  DistrictSpec,
  MissionDef,
  ObjectiveDef,
  OperativeDef,
  Tracer,
  Unit,
  Vec2,
  WeaponDef,
  WorldApi,
  Zone,
} from './types'
import { ENEMY_VISION, NOTICE_RADIUS, VISION_HALF_ANGLE, isWalkable } from './types'
import { ENEMY_ARCHETYPES, OFFICER_RADIO_DELAY, OFFICER_RADIO_R, WEAPONS, weaponNoise } from './data'
import { MEDIC_REGEN_CAP, ROLE_ABILITIES, SUPPRESS_LINGER } from './abilities'
import { missionMods } from './missionParams'
import type { MissionMods } from './missionParams'
import { crewBonus, squadWeapon } from './research'
import { loadoutPools, massTier, squadMassKg, tierSpeedDelta } from './mass'
import type { SquadLoadout } from './mass'
import { generateCity } from '../world/citygen'
import { mulberry32 } from './rng'
import { findPath, hasLos, nearestWalkable } from './pathfind'
import { missionSfx as sfx } from './audioBridge'
import { fireTutorialHint, noteTutorial } from '../state/tutorialStore'
import type { MissionTelemetry } from '../state/telemetry'
import { useMissionStore } from '../state/missionStore'
import type {
  AbilityAvailability,
  MissionAbilities,
  MissionInventory,
  ObjectiveUi,
  SquadMemberUi,
} from '../state/missionStore'
import { useAppStore } from '../state/appStore'
import { useResearchStore } from '../state/researchStore'

const MAX_DT = 0.05
const MAX_CATCHUP = 5
const SYNC_INTERVAL = 0.2
const TRACER_LIFE = 0.09
const BOOM_LIFE = 0.4
const SEPARATION_R = 0.7
// Body radius a missed round has to cross to catch whoever is standing there.
const STRAY_R = 0.5
const NOTICE2 = NOTICE_RADIUS * NOTICE_RADIUS
const VISION_COS = Math.cos(VISION_HALF_ANGLE)
// Seconds of unbroken sight before a guard is certain, at arm's length and at
// the far edge of the cone. Anything shorter is a half sighting the squad can
// still break off from.
const SIGHT_NEAR_T = 0.45
const SIGHT_FAR_T = 1.7
// Certainty bled off per second with nothing seen or heard.
const AWARE_DECAY = 0.22
// Shortest look a guard commits to once something puts it on alert, so the
// briefest glimpse still buys a walk to the spot rather than a shrug. Held
// apart from certainty: this keeps a guard investigating, it never brings the
// moment it opens fire any closer.
const INVESTIGATE_T = 2.7
// Sound alone never reaches certainty, so a guard investigates a shot rather
// than opening fire on the noise.
const HEARD_MAX = 0.85
const NOISE_LIFE = 0.3
const INVESTIGATE_R = 1.2
const SCAN_GAP = 1.1
const SUSPECT_LOG_GAP = 10
const PROPAGATE_R = 9
const DISENGAGE_T = 6
const ENEMY_ACC = 0.45
const ENEMY_CD_MUL = 1.75
const ENEMY_DMG_MUL = 0.7
const ENEMY_REPATH = 0.8
const AGENT_REPATH = 0.5
const ACQUIRE_INTERVAL = 0.12
const SENSE_INTERVAL = 0.15
const CIV_FLEE_R = 10
const CIV_FLEE_T = 5
const OUTCOME_DELAY = 2.5
const MOVE_CHATTER_GAP = 4
const FLAVOR_GAP = 6
const CLOCK_BASE = 22 * 3600 + 14 * 60 + 8
// Seconds after a weapon swap before the drawn weapon can fire.
const SWAP_DELAY = 0.5
const MED_KIT_HEAL = 50
// A role ability sitting ready this long unused fires the one-shot hint.
const ABILITY_IDLE_HINT_SEC = 60
// Health fraction under which the med-kit hint fires while stock remains.
const LOW_HP_HINT_FRAC = 0.35
const GRENADE_COOLDOWN = 4
const GRENADE_RANGE = 18
const GRENADE_RADIUS = 3.5
const GRENADE_DAMAGE_CENTER = 70
const GRENADE_DAMAGE_EDGE = 35
const GRENADE_NOISE_RADIUS = 24
const FRAG_NOISE_RADIUS = 24
// A click may land just inside a wall or prop proxy. Snap it to adjacent
// pavement, but reject a click buried deep inside inaccessible geometry.
const GRENADE_TARGET_SNAP = 2.5
// Vip behavior: picks up escort inside the acquire radius, then trails the
// nearest living agent, stopping short so it never crowds the shooter.
const VIP_ACQUIRE_R = 3
const VIP_FOLLOW_STOP = 2.2
const VIP_REPATH = 0.8
// How far a marksman backpedals when a target closes inside its minimum range.
const MARKSMAN_BACKOFF = 6

const MOVE_LINES = ['Moving up.', 'Copy that.', 'On my way.', 'Repositioning.', 'Advancing.']
// No 'Weapons free.' here: an ordered shot fires through hold fire, so that
// line would contradict a card still reading TIGHT.
const ATTACK_LINES = ['Engaging.', 'Target acquired.', 'Taking the shot.']
const STOP_LINES = ['All stop.', 'Standing by.', 'Cutting the move.', 'Waiting on you.']
const HIT_LINES = ['Taking fire!', 'Under fire, holding.', 'They have us marked.']

// Role ability acknowledgements. The medic pushes a per-target line instead of
// a table entry; roles whose effect announces its own end carry no expiry line.
const ABILITY_USE_LINES: Partial<Record<AgentRole, string>> = {
  assault: 'Overdrive engaged.',
  recon: 'Pulse scan out.',
  infiltrator: 'Ghost veil up.',
  demolitions: 'Charge out. Heads down.',
  sniper: 'Deadeye armed.',
  tech: 'EM burst away.',
  support: 'Suppression sweep running.',
}
const ABILITY_EXPIRE_LINES: Partial<Record<AgentRole, string>> = {
  assault: 'Overdrive spent.',
  recon: 'Scan feed lost.',
  infiltrator: 'Veil down.',
  sniper: 'Deadeye window closed.',
  tech: 'EM effect faded.',
  support: 'Sweep complete.',
}

type Cls = 'sys' | 'alert' | 'ok'

// One gunshot, heard by anything inside r. Ids run up so a guard can process
// each event exactly once whatever order the units are stepped in.
interface Noise {
  id: number
  pos: Vec2
  r: number
  t: number
}

interface SimUnit extends Unit {
  // Internal simulation fields; the renderer only reads the Unit surface.
  senseT?: number
  senseAt?: number
  repathT?: number
  lastSeenT?: number
  lastSeenPos?: Vec2
  // How sure the guard is that there is an intruder, 0 to 1. 1 opens fire.
  awareness?: number
  investigateUntil?: number
  heardId?: number
  scanT?: number
  scanYaw?: number
  // Officer radio call: armed when the officer enters combat, cleared if it
  // calms down or dies first, done exactly once.
  radioAt?: number
  radioDone?: boolean
  acquireT?: number
  explicitTarget?: boolean
  // The cooldown length the last activation was charged, tech passive
  // applied, so the HUD fill runs against the real total.
  abilityCdTotal?: number
  // Waypoints parked by hold ground, restored when the hold lifts.
  suspended?: Vec2[]
  wanderT?: number
  fleeUntil?: number
  fleeFrom?: Vec2
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

// Deployment inputs computed outside the sim (MissionScreen), so world.ts
// never reads worldStore. Both default for tests and headless construction.
export interface DeployParams {
  mods?: MissionMods
  district?: DistrictSpec
  // Per-operative extra item slots (game/mass.ts): they raise the mission's
  // med/cell pools and count toward the deployment-mass speed tier.
  loadout?: SquadLoadout
}

export function createWorld(
  mission: MissionDef,
  operatives: OperativeDef[],
  deploy?: DeployParams,
): WorldApi {
  const rng = mulberry32(mission.seed)
  const mods = deploy?.mods ?? missionMods(mission)
  const city = generateCity(mission, deploy?.district, {
    enemyExtra: mods.enemyExtra,
    civilianCount: mods.civilianCount,
    officerCount: mods.officerCount,
    heavyCount: mods.heavyCount,
  })
  // Weather scales guard sight and shot carry for this whole mission.
  const vision = ENEMY_VISION * mods.visionMul
  const vision2 = vision * vision

  const units: SimUnit[] = []
  const byId = new Map<string, SimUnit>()
  const tracers: Tracer[] = []
  const booms: Boom[] = []
  const noises: Noise[] = []
  let noiseSeq = 0

  let started = false
  let kills = 0
  let casualties = 0
  const deadIds: string[] = []
  let civiliansHit = 0
  // Ids of the bystanders already on the bill. Hit points cannot stand in for
  // this: CorpSec wounds civilians too, and the crew is charged for its own
  // first round whether or not somebody else got there first.
  const billed = new Set<string>()
  let result: 'none' | 'won' | 'lost' = 'none'
  let resultAt = 0
  let outcomeSent = false
  // Telemetry counters: plain numeric fields on preallocated tables, bumped
  // in place so the per-frame path allocates nothing. They leave the sim once,
  // inside the outcome maybeOutcome() already pushes.
  let firstContactT = -1
  let damageDealt = 0
  let damageTaken = 0
  let civHitsSquad = 0
  let civHitsCorpsec = 0
  let medUsed = 0
  let cellUsed = 0
  const shotsByWeapon: Record<string, number> = {
    assault: 0, smg: 0, pistol: 0, longrifle: 0, shotgun: 0,
  }
  const damageByWeapon: Record<string, number> = {
    assault: 0, smg: 0, pistol: 0, longrifle: 0, shotgun: 0,
  }
  const abilityUsesByRole: Record<AgentRole, number> = {
    assault: 0, recon: 0, infiltrator: 0, demolitions: 0,
    sniper: 0, tech: 0, support: 0, medic: 0,
  }
  let syncT = 0
  let alertLevel = 0
  let firstContact = false
  let lastOrderChatterT = -MOVE_CHATTER_GAP
  let lastFlavorT = -FLAVOR_GAP
  let lastSuspectLogT = -SUSPECT_LOG_GAP

  // Objective engine. Required objectives run in strict sequence through
  // reqPtr; an optional objective activates together with the required
  // objective it precedes in the list, never blocks the sequence, and pays
  // bonusReward on completion.
  type ObjState = 'pending' | 'active' | 'done' | 'failed'
  const objectives = mission.objectives
  const objState: ObjState[] = objectives.map(() => 'pending')
  const requiredOrder: number[] = []
  objectives.forEach((d, i) => {
    if (!d.optional) requiredOrder.push(i)
  })
  let reqPtr = 0
  let bonusEarned = 0
  // Interact channels accrued and defend countdowns remaining, per objective.
  const interactT: number[] = objectives.map(() => 0)
  const interactStarted: boolean[] = objectives.map(() => false)
  const defendLeft: number[] = objectives.map((d) => d.durationSec ?? 0)
  // Time-limit countdowns remaining, per objective; only ticks while active.
  const failLeft: number[] = objectives.map((d) => d.failSec ?? 0)
  // Completion time of each objective, -1 while unfinished (telemetry).
  const objDoneT: number[] = objectives.map(() => -1)
  // Tags whose device died to non-squad fire: an optional destroy over such a
  // tag is failed, not completed.
  const deviceLostTags = new Set<string>()
  let waveSeq = 0
  const inventory: MissionInventory = { med: 2, cell: 1 }
  for (const op of operatives) {
    if (op.role === 'medic') inventory.med += 2
    else if (op.role === 'support') inventory.med += 1
    else if (op.role === 'tech') inventory.cell += 1
  }
  const extraItems = loadoutPools(operatives, deploy?.loadout)
  inventory.med += extraItems.med
  inventory.cell += extraItems.cell
  let grenadeReadyAt = 0

  // Contextual hint tracking. The hints themselves are once per campaign
  // (tutorialStore gates on the persisted seen set); these local flags only
  // keep the sim from re-calling the store every step.
  let abilityIdleT = 0
  let abilityUsed = false
  let abilityIdleHinted = false
  let lowHpHinted = false

  // Thrown frag charges waiting on their fuse.
  interface Charge {
    pos: Vec2
    at: number
    by: SimUnit
  }
  const charges: Charge[] = []

  function addUnit(u: SimUnit): void {
    units.push(u)
    byId.set(u.id, u)
  }

  function snap(p: Vec2): Vec2 {
    if (isWalkable(city, p.x, p.z)) return { x: p.x, z: p.z }
    return nearestWalkable(city, p) ?? { x: p.x, z: p.z }
  }

  // Completed research is read once, at deployment. The world clock is stopped
  // during a mission, so nothing can finish while this one runs.
  const researched = useResearchStore.getState().done
  const bonus = crewBonus(researched)

  // Deployment-mass tier: one shared speed adjustment for the whole squad,
  // from the same model the assembly screen displays (game/mass.ts).
  const massDelta = tierSpeedDelta(
    massTier(squadMassKg(operatives, bonus.maxHp, deploy?.loadout)),
  )

  // Stat passives land on the weapon copies at deployment, after research:
  // assault damage and sniper range reach both slots the same way research
  // does, so the HUD and the sim read one number.
  function roleTuneWeapon(w: WeaponDef, role: AgentRole): WeaponDef {
    const p = ROLE_ABILITIES[role].passive
    if (role === 'assault') return { ...w, damage: w.damage * p.magnitude }
    if (role === 'sniper') return { ...w, range: w.range * p.magnitude }
    return w
  }

  operatives.forEach((op, i) => {
    // Research applies to both slots the same way: each is built through
    // squadWeapon, so a sidearm carries every completed weapon project.
    const w = roleTuneWeapon(squadWeapon(op.weapon, researched), op.role)
    const sw = roleTuneWeapon(squadWeapon(op.sidearm, researched), op.role)
    const hp = op.maxHp + bonus.maxHp
    addUnit({
      id: 'a' + (i + 1),
      kind: 'agent',
      name: op.name,
      pos: snap(city.spawnAgents[i] ?? { x: city.size / 2, z: city.size - 6 }),
      heading: Math.PI,
      hp,
      maxHp: hp,
      speed: op.speed + bonus.speed + massDelta,
      weapon: w,
      stance: 'idle',
      path: [],
      targetId: null,
      cooldown: 0,
      magazine: w.magazine,
      reloading: 0,
      alerted: false,
      holdGround: false,
      holdFire: false,
      agentSlot: i + 1,
      operative: op,
      activeSlot: 'primary',
      stowedWeapon: sw,
      stowedMagazine: sw.magazine,
      swapReadyAt: 0,
      abilityReadyAt: 0,
      abilityUntil: 0,
    })
  })

  city.enemies.forEach((sp, i) => {
    const arch = ENEMY_ARCHETYPES[sp.archetype ?? 'trooper']
    const w = WEAPONS[sp.weapon]
    const hp = Math.round((sp.hp ?? arch.hp) * mods.enemyHpMul)
    addUnit({
      id: 'e' + (i + 1),
      kind: 'enemy',
      name: sp.name ?? 'CORPSEC-' + pad2(i + 1),
      pos: snap(sp.pos),
      heading: rng() * Math.PI * 2,
      hp,
      maxHp: hp,
      speed: arch.speed,
      archetype: sp.archetype ?? 'trooper',
      weapon: w,
      stance: 'idle',
      path: [],
      targetId: null,
      cooldown: rng() * 0.4,
      magazine: w.magazine,
      reloading: 0,
      alerted: false,
      holdGround: false,
      holdFire: false,
      patrol: sp.patrol.map((p) => ({ x: p.x, z: p.z })),
      patrolIndex: 0,
      tag: sp.tag,
      aiState: 'patrol',
      senseT: rng() * SENSE_INTERVAL,
      senseAt: 0,
      repathT: 0,
      lastSeenT: -100,
      awareness: 0,
      heardId: 0,
    })
  })

  city.civilians.forEach((p, i) => {
    addUnit({
      id: 'c' + (i + 1),
      kind: 'civilian',
      name: 'CIVILIAN',
      pos: snap(p),
      heading: rng() * Math.PI * 2,
      hp: 30,
      maxHp: 30,
      speed: 2.2,
      weapon: null,
      stance: 'idle',
      path: [],
      targetId: null,
      cooldown: 0,
      magazine: 0,
      reloading: 0,
      alerted: false,
      holdGround: false,
      holdFire: false,
      wanderT: rng() * 3,
    })
  })

  // Vips: unarmed, fragile, idle until the squad reaches them. `alerted`
  // doubles as the following flag; guards only treat a following vip as a
  // target, so a captive standing in its cell trips no alarms.
  city.vips.forEach((p, i) => {
    addUnit({
      id: 'v' + (i + 1),
      kind: 'vip',
      name: 'ASSET',
      pos: snap(p),
      heading: Math.PI,
      hp: 60,
      maxHp: 60,
      speed: 4.0,
      weapon: null,
      stance: 'idle',
      path: [],
      targetId: null,
      cooldown: 0,
      magazine: 0,
      reloading: 0,
      alerted: false,
      holdGround: false,
      holdFire: false,
      repathT: 0,
    })
  })

  // Devices: stationary tagged demolition targets. No weapon, no AI; they die
  // through the ordinary damage path.
  city.devices.forEach((d, i) => {
    addUnit({
      id: 'd' + (i + 1),
      kind: 'device',
      name: d.tag.toUpperCase() + '-' + pad2(i + 1),
      pos: snap(d.pos),
      heading: 0,
      hp: 120,
      maxHp: 120,
      speed: 0,
      weapon: null,
      stance: 'idle',
      path: [],
      targetId: null,
      cooldown: 0,
      magazine: 0,
      reloading: 0,
      alerted: false,
      holdGround: true,
      holdFire: false,
      tag: d.tag,
    })
  })

  function dist(a: Vec2, b: Vec2): number {
    const dx = b.x - a.x
    const dz = b.z - a.z
    return Math.sqrt(dx * dx + dz * dz)
  }

  function clockStr(): string {
    const total = (CLOCK_BASE + Math.floor(world.time)) % 86400
    const h = Math.floor(total / 3600)
    const m = Math.floor((total % 3600) / 60)
    return pad2(h) + ':' + pad2(m) + ':' + pad2(total % 60)
  }

  function pushLog(who: string, msg: string, cls?: Cls): void {
    useMissionStore.getState().addLog({ t: clockStr(), who, msg, cls })
  }

  function pick(lines: string[]): string {
    return lines[Math.floor(rng() * lines.length)] ?? lines[0]
  }

  function livingAgents(): SimUnit[] {
    return units.filter((u) => u.kind === 'agent' && u.stance !== 'dead')
  }

  function turnToward(u: SimUnit, target: number, dt: number): void {
    let diff = target - u.heading
    while (diff > Math.PI) diff -= Math.PI * 2
    while (diff < -Math.PI) diff += Math.PI * 2
    u.heading += diff * Math.min(1, dt * 10)
  }

  function faceToward(u: SimUnit, p: Vec2, dt: number): void {
    turnToward(u, Math.atan2(p.x - u.pos.x, p.z - u.pos.z), dt)
  }

  function effSpeed(u: SimUnit): number {
    let s = u.speed
    if (u.kind === 'enemy') {
      if (u.aiState === 'suspicious') s *= 0.85
      else if (u.aiState !== 'combat') s *= 0.6
      // A suppression sweep pins whoever it marked to half pace.
      if ((u.suppressedUntil ?? 0) > world.time) s *= ROLE_ABILITIES.support.active.magnitude
    } else if (u.kind === 'civilian' && (u.fleeUntil ?? 0) > world.time) {
      s *= 1.5
    }
    return s
  }

  // True while the agent's timed role effect is running and it holds `role`.
  function roleActive(u: SimUnit, role: AgentRole): boolean {
    return u.kind === 'agent' && u.operative?.role === role && (u.abilityUntil ?? 0) > world.time
  }

  // Tech passive: the whole squad's cooldowns run faster while a tech lives.
  function techAlive(): boolean {
    return units.some(
      (u) => u.kind === 'agent' && u.stance !== 'dead' && u.operative?.role === 'tech',
    )
  }

  // Support passive: any living support operative within its aura radius.
  function supportNear(u: SimUnit): boolean {
    const p = ROLE_ABILITIES.support.passive
    for (const a of units) {
      if (a.kind !== 'agent' || a.stance === 'dead' || a.operative?.role !== 'support') continue
      if (dist(a.pos, u.pos) <= p.radius) return true
    }
    return false
  }

  // Applies a movement step; on a blocked cell, slides along one axis so
  // separation nudges near corners never push units inside geometry.
  function moveTo(u: SimUnit, nx: number, nz: number): void {
    if (isWalkable(city, nx, nz)) {
      u.pos.x = nx
      u.pos.z = nz
      return
    }
    if (isWalkable(city, nx, u.pos.z)) {
      u.pos.x = nx
      return
    }
    if (isWalkable(city, u.pos.x, nz)) {
      u.pos.z = nz
      return
    }
    u.path.length = 0
  }

  function stepMove(u: SimUnit, dt: number): void {
    let remaining = effSpeed(u) * dt
    while (remaining > 1e-5 && u.path.length > 0) {
      const wp = u.path[0]
      const dx = wp.x - u.pos.x
      const dz = wp.z - u.pos.z
      const d = Math.sqrt(dx * dx + dz * dz)
      if (d <= remaining) {
        moveTo(u, wp.x, wp.z)
        u.path.shift()
        remaining -= d
      } else {
        const inv = remaining / d
        moveTo(u, u.pos.x + dx * inv, u.pos.z + dz * inv)
        turnToward(u, Math.atan2(dx, dz), dt)
        remaining = 0
      }
    }
    if (u.path.length === 0 && u.stance === 'moving') u.stance = 'idle'
  }

  function tryNudge(u: SimUnit, mx: number, mz: number): void {
    const nx = u.pos.x + mx
    const nz = u.pos.z + mz
    if (isWalkable(city, nx, nz)) {
      u.pos.x = nx
      u.pos.z = nz
    }
  }

  function separate(dt: number): void {
    const n = units.length
    const r2 = SEPARATION_R * SEPARATION_R
    for (let i = 0; i < n; i++) {
      const a = units[i]
      if (a.stance === 'dead' || a.kind === 'device') continue
      for (let j = i + 1; j < n; j++) {
        const b = units[j]
        if (b.stance === 'dead' || b.kind === 'device') continue
        let dx = b.pos.x - a.pos.x
        let dz = b.pos.z - a.pos.z
        const d2 = dx * dx + dz * dz
        if (d2 >= r2) continue
        let d = Math.sqrt(d2)
        if (d < 1e-4) {
          const ang = rng() * Math.PI * 2
          dx = Math.sin(ang)
          dz = Math.cos(ang)
          d = 1
        } else {
          dx /= d
          dz /= d
        }
        const push = (SEPARATION_R - Math.min(d, SEPARATION_R)) * Math.min(1, dt * 4) * 0.5
        // A held agent is immovable: the crowd flows around it instead of
        // walking it out of the doorway it was posted in.
        if (!a.holdGround) tryNudge(a, -dx * push, -dz * push)
        if (!b.holdGround) tryNudge(b, dx * push, dz * push)
      }
    }
  }

  function tickWeapon(u: SimUnit, dt: number): void {
    if (u.cooldown > 0) u.cooldown -= dt
    if (u.reloading > 0) {
      u.reloading -= dt
      if (u.reloading <= 0) {
        u.reloading = 0
        u.magazine = u.weapon ? u.weapon.magazine : 0
      }
    }
  }

  function startReload(u: SimUnit): void {
    if (!u.weapon || u.reloading > 0) return
    const mul =
      u.kind === 'agent' && supportNear(u) ? ROLE_ABILITIES.support.passive.magnitude : 1
    u.reloading = u.weapon.reload * mul
    if (u.kind === 'agent') sfx.reload()
  }

  function killUnit(t: SimUnit, by: SimUnit): void {
    t.hp = 0
    t.stance = 'dead'
    t.deathT = world.time
    t.path.length = 0
    t.suspended = undefined
    t.targetId = null
    t.alerted = false
    // A flatlined agent takes no orders, so it must not keep advertising them.
    t.holdGround = false
    t.holdFire = false
    // A running role effect dies with its operative, without an expiry line.
    t.abilityUntil = 0
    if (t.kind === 'device') {
      // A device goes up, not down: blast boom and a noise event, no thud.
      booms.push({ pos: { x: t.pos.x, z: t.pos.z }, t: world.time, r: 2.4, color: '#ff9b52' })
      noiseSeq += 1
      noises.push({ id: noiseSeq, pos: { x: t.pos.x, z: t.pos.z }, r: 20, t: world.time })
      sfx.blast()
      if (by.kind !== 'agent' && t.tag) deviceLostTags.add(t.tag)
      pushLog('SYS', 'DEVICE DESTROYED: ' + t.name + '.', by.kind === 'agent' ? 'ok' : 'alert')
      return
    }
    booms.push({ pos: { x: t.pos.x, z: t.pos.z }, t: world.time, r: 0.55, color: '#ff8352' })
    sfx.deathThud()
    if (t.kind === 'enemy') {
      if (by.kind === 'agent') kills += 1
      pushLog('SYS', 'Hostile neutralized.')
      if (t.archetype === 'officer' && t.radioAt !== undefined && !t.radioDone) {
        t.radioAt = undefined
        pushLog('SYS', 'OFFICER DOWN. THE CALL NEVER WENT OUT.', 'ok')
      }
    } else if (t.kind === 'agent') {
      casualties += 1
      if (t.operative) deadIds.push(t.operative.id)
      pushLog('SYS', 'AGENT DOWN. ' + t.name + ' flatlined.', 'alert')
    } else if (t.kind === 'vip') {
      pushLog('SYS', 'ASSET DOWN. THE CLIENT IS WATCHING.', 'alert')
      onVipDead()
    } else {
      pushLog('SYS', 'CIVILIAN DOWN. KILLED BY STRAY FIRE.', 'alert')
    }
  }

  function applyDamage(t: SimUnit, dmg: number, by: SimUnit): void {
    if (t.stance === 'dead') return
    // Collateral is counted per bystander struck, not per body: the client
    // charges for the wounded too, and one round rarely drops anyone. Only the
    // crew's own fire is billed, and each bystander only once.
    if (t.kind === 'civilian' && by.kind === 'agent' && !billed.has(t.id)) {
      billed.add(t.id)
      civiliansHit += 1
      pushLog('SYS', 'CIVILIAN HIT. COLLATERAL COUNT ' + civiliansHit + '.', 'alert')
    }
    if (t.kind === 'civilian') {
      if (by.kind === 'agent') civHitsSquad += 1
      else if (by.kind === 'enemy') civHitsCorpsec += 1
    }
    let dealt = by.kind === 'enemy' ? dmg * ENEMY_DMG_MUL : dmg
    // Demolitions passive: the hardened frame shrugs part of every hit off.
    if (t.kind === 'agent' && t.operative?.role === 'demolitions') {
      dealt *= ROLE_ABILITIES.demolitions.passive.magnitude
    }
    // Archetype armor: heavies shrug part of every hit off.
    if (t.kind === 'enemy') dealt *= ENEMY_ARCHETYPES[t.archetype ?? 'trooper'].dmgTakenMul
    if (by.kind === 'agent' && (t.kind === 'enemy' || t.kind === 'device')) damageDealt += dealt
    if (t.kind === 'agent') damageTaken += dealt
    t.hp -= dealt
    if (t.hp > 0) {
      // Impact feedback on a surviving body: a small flash, the flinch stamp
      // the renderer reads, and a thump when it is one of ours. The push is
      // bounded by fire rate and decays with BOOM_LIFE, like tracers.
      t.lastHitT = world.time
      booms.push({
        pos: { x: t.pos.x, z: t.pos.z },
        t: world.time,
        r: 0.3,
        color: t.kind === 'agent' ? '#ff6a55' : '#ffd9a0',
      })
      if (t.kind === 'agent') sfx.agentHit()
    }
    if (t.kind === 'enemy') {
      t.lastSeenT = world.time
      markLastSeen(t, by.pos)
      if (t.aiState !== 'combat') enterCombat(t)
    } else if (t.kind === 'civilian') {
      // Being hit overrides the gunfire timer: run from whoever fired.
      t.fleeFrom = { x: by.pos.x, z: by.pos.z }
      t.fleeUntil = world.time + CIV_FLEE_T
      t.path.length = 0
    }
    if (t.hp <= 0) {
      killUnit(t, by)
    } else if (t.kind === 'agent' && world.time - lastFlavorT >= FLAVOR_GAP) {
      lastFlavorT = world.time
      pushLog(t.name, pick(HIT_LINES), 'alert')
    }
  }

  // A missed round keeps travelling. Returns the first living body the segment
  // crosses, skipping the shooter and the unit aimed at, since the shot has
  // already missed that one.
  function strayVictim(from: Vec2, tx: number, tz: number, shooter: SimUnit, aimed: SimUnit): SimUnit | null {
    const dx = tx - from.x
    const dz = tz - from.z
    const len2 = dx * dx + dz * dz
    if (len2 < 1e-6) return null
    let best: SimUnit | null = null
    let bestEntry = Infinity
    for (const o of units) {
      if (o === shooter || o === aimed || o.stance === 'dead') continue
      const ox = o.pos.x - from.x
      const oz = o.pos.z - from.z
      const k = (ox * dx + oz * dz) / len2
      if (k <= 0 || k >= 1) continue
      const px = ox - dx * k
      const pz = oz - dz * k
      const perp2 = px * px + pz * pz
      if (perp2 > STRAY_R * STRAY_R) continue
      // Rank by where the round enters the body, not by where the centre sits
      // on the lane: an offset body can be crossed first yet project later.
      const entry = k - Math.sqrt((STRAY_R * STRAY_R - perp2) / len2)
      if (entry >= bestEntry) continue
      best = o
      bestEntry = entry
    }
    // Nearest on the line is also the first thing cover can hide, so a blocked
    // sight line means the round struck the wall rather than the body.
    if (best && !hasLos(city, from, best.pos)) return null
    return best
  }

  function tryFire(u: SimUnit, t: SimUnit, accMul: number): void {
    const w = u.weapon
    if (!w || u.reloading > 0 || u.cooldown > 0) return
    // A freshly drawn weapon is not on target yet. Enemies never swap.
    if (world.time < (u.swapReadyAt ?? 0)) return
    // An EM burst locks the trigger without touching the magazine or reload.
    if (u.kind === 'enemy' && (u.jammedUntil ?? 0) > world.time) return
    if (u.magazine <= 0) {
      startReload(u)
      return
    }
    let cd = w.cooldown * (u.kind === 'enemy' ? ENEMY_CD_MUL : 1)
    if (roleActive(u, 'assault')) cd *= ROLE_ABILITIES.assault.active.magnitude
    u.cooldown = cd
    u.magazine -= 1
    u.lastFireT = world.time
    if (u.kind === 'agent') shotsByWeapon[w.id] += 1
    // Deadeye: the armed window is spent on this shot, which cannot miss and
    // carries the damage multiplier.
    const deadeye = roleActive(u, 'sniper')
    if (deadeye) u.abilityUntil = 0
    const dmg = deadeye ? w.damage * ROLE_ABILITIES.sniper.active.magnitude : w.damage
    const d = dist(u.pos, t.pos)
    const chance = Math.min(0.95, Math.max(0.05, (0.78 - (d / w.range) * 0.28 + (rng() - 0.5) * 0.1) * accMul))
    const hit = deadeye || rng() < chance
    const len = Math.max(d, 0.001)
    const nx = (t.pos.x - u.pos.x) / len
    const nz = (t.pos.z - u.pos.z) / len
    let tx = t.pos.x
    let tz = t.pos.z
    if (hit) {
      if (u.kind === 'agent') damageByWeapon[w.id] += dmg
      applyDamage(t, dmg, u)
    } else {
      const over = 1 + rng() * 1.8
      const side = (rng() - 0.5) * (0.7 + w.spread * 8) * (0.5 + d * 0.08)
      tx = t.pos.x + nx * over - nz * side
      tz = t.pos.z + nz * over + nx * side
      // The round does not stop where the aim landed. It carries on down the
      // same lane to the weapon's reach, and whoever stands in that lane wears
      // it: the tracer then ends on the body rather than on empty street.
      const mx = tx - u.pos.x
      const mz = tz - u.pos.z
      const ml = Math.max(Math.sqrt(mx * mx + mz * mz), 0.001)
      const reach = w.range
      const stray = strayVictim(u.pos, u.pos.x + (mx / ml) * reach, u.pos.z + (mz / ml) * reach, u, t)
      if (stray) {
        tx = stray.pos.x
        tz = stray.pos.z
        if (u.kind === 'agent') damageByWeapon[w.id] += dmg
        applyDamage(stray, dmg, u)
      }
    }
    tracers.push({
      from: { x: u.pos.x, z: u.pos.z },
      to: { x: tx, z: tz },
      y0: 1.35,
      y1: 1.1,
      t: world.time,
      color: w.tracer,
    })
    booms.push({
      pos: { x: u.pos.x + nx * 0.35, z: u.pos.z + nz * 0.35 },
      t: world.time,
      r: 0.22,
      color: w.tracer,
    })
    noiseSeq += 1
    noises.push({
      id: noiseSeq,
      pos: { x: u.pos.x, z: u.pos.z },
      r: weaponNoise(w) * mods.noiseMul,
      t: world.time,
    })
    sfx.gunshot(w.id)
    if (u.magazine <= 0) startReload(u)
  }

  function nearestVisibleEnemy(u: SimUnit, range: number): SimUnit | null {
    let best: SimUnit | null = null
    let bestD = range
    for (const e of units) {
      if (e.kind !== 'enemy' || e.stance === 'dead') continue
      const d = dist(u.pos, e.pos)
      if (d <= bestD && hasLos(city, u.pos, e.pos)) {
        best = e
        bestD = d
      }
    }
    return best
  }

  // Free fire agents take up whatever walks into range, on a slow cadence.
  // Hold fire agents never pick a target up on their own, so only an explicit
  // attack order gives them one.
  function refreshAutoTarget(u: SimUnit): void {
    if (u.holdFire) {
      u.targetId = null
      return
    }
    if (world.time < (u.acquireT ?? 0)) return
    u.acquireT = world.time + ACQUIRE_INTERVAL
    const w = u.weapon
    const t = w ? nearestVisibleEnemy(u, w.range) : null
    u.targetId = t ? t.id : null
  }

  function updateAgents(dt: number): void {
    for (const u of units) {
      if (u.kind !== 'agent' || u.stance === 'dead') continue
      tickWeapon(u, dt)
      // An ordered shot outranks hold fire, so this branch never checks it.
      if (u.explicitTarget && u.targetId !== null) {
        const t = byId.get(u.targetId)
        if (!t || t.stance === 'dead') {
          u.targetId = null
          u.explicitTarget = false
          u.path.length = 0
          u.stance = 'idle'
        } else {
          const w = u.weapon
          if (w && dist(u.pos, t.pos) <= w.range && hasLos(city, u.pos, t.pos)) {
            u.path.length = 0
            u.stance = 'attacking'
            faceToward(u, t.pos, dt)
            tryFire(u, t, 1)
          } else if (u.holdGround) {
            // Holding ground keeps the order pending instead of chasing, but
            // the agent still takes whatever else walks into the lane, so a
            // target behind cover cannot pin it into permanent pacifism.
            u.path.length = 0
            const other = w && !u.holdFire ? nearestVisibleEnemy(u, w.range) : null
            if (other) {
              u.stance = 'attacking'
              faceToward(u, other.pos, dt)
              tryFire(u, other, 1)
            } else {
              u.stance = 'idle'
              faceToward(u, t.pos, dt)
            }
          } else {
            u.stance = 'moving'
            if (world.time >= (u.repathT ?? 0)) {
              u.repathT = world.time + AGENT_REPATH
              u.path = findPath(city, u.pos, t.pos)
            }
          }
          continue
        }
      }
      // Attack-move: agents hold mid-path to engage anything in range and
      // resume the route once the lane is clear. Walking and standing share
      // this block; only the fallback stance differs.
      refreshAutoTarget(u)
      const t = u.targetId !== null ? byId.get(u.targetId) : undefined
      const w = u.weapon
      if (t && w && t.stance !== 'dead' && dist(u.pos, t.pos) <= w.range && hasLos(city, u.pos, t.pos)) {
        u.stance = 'attacking'
        faceToward(u, t.pos, dt)
        tryFire(u, t, 1)
      } else {
        u.targetId = null
        u.stance = u.path.length > 0 ? 'moving' : 'idle'
      }
    }
  }

  function markLastSeen(e: SimUnit, p: Vec2): void {
    if (e.lastSeenPos) {
      e.lastSeenPos.x = p.x
      e.lastSeenPos.z = p.z
    } else {
      e.lastSeenPos = { x: p.x, z: p.z }
    }
  }

  function enterCombat(e: SimUnit): void {
    if (e.stance === 'dead') return
    e.aiState = 'combat'
    e.alerted = true
    e.awareness = 1
    e.lastSeenT = world.time
    e.repathT = 0
    if (e.archetype === 'officer' && !e.radioDone && e.radioAt === undefined) {
      e.radioAt = world.time + OFFICER_RADIO_DELAY
      pushLog('SYS', 'OFFICER ON COMMS. CUT THE LINK.', 'alert')
    }
    if (!firstContact) {
      firstContact = true
      firstContactT = world.time
      pushLog('SYS', 'Threat level elevated.', 'alert')
      sfx.alertSting()
      fireTutorialHint('hint-alert')
    }
  }

  function enterSuspicious(e: SimUnit): void {
    if (e.stance === 'dead' || e.aiState === 'suspicious') return
    // An officer calmed down before the delay ran out never makes the call;
    // this is the EM burst counterplay.
    if (e.radioAt !== undefined && !e.radioDone) e.radioAt = undefined
    const fromPatrol = e.aiState === 'patrol'
    e.aiState = 'suspicious'
    e.alerted = false
    e.investigateUntil = world.time + INVESTIGATE_T
    e.targetId = null
    e.path.length = 0
    e.repathT = 0
    e.scanT = 0
    e.senseAt = world.time
    if (fromPatrol && world.time - lastSuspectLogT >= SUSPECT_LOG_GAP) {
      lastSuspectLogT = world.time
      pushLog('SYS', 'Hostile patrol investigating.', 'alert')
    }
  }

  function leaveSuspicious(e: SimUnit): void {
    e.aiState = 'patrol'
    e.awareness = 0
    e.path.length = 0
    e.repathT = 0
    e.stance = 'idle'
  }

  // Whether a guard treats this body as an intruder: any living agent, and a
  // vip that has broken escort (following). A captive vip alarms nobody.
  // A veiled infiltrator is invisible to guard eyes everywhere sight is
  // resolved: awareness, targeting and combat scans all come through here.
  // Hearing runs through heard(), which this never touches.
  function hostileToGuards(a: SimUnit): boolean {
    if (a.stance === 'dead') return false
    if (a.kind === 'agent') return !roleActive(a, 'infiltrator')
    return a.kind === 'vip' && a.alerted
  }

  // Nearest intruder this guard can make out: inside the facing cone out to
  // the mission vision range, or anywhere inside NOTICE_RADIUS, and never
  // through a wall.
  function seen(e: SimUnit): SimUnit | null {
    let best: SimUnit | null = null
    let bestD2 = Infinity
    const fx = Math.sin(e.heading)
    const fz = Math.cos(e.heading)
    for (const a of units) {
      if (!hostileToGuards(a)) continue
      const dx = a.pos.x - e.pos.x
      const dz = a.pos.z - e.pos.z
      const d2 = dx * dx + dz * dz
      if (d2 > vision2 || d2 >= bestD2) continue
      if (d2 > NOTICE2 && (fx * dx + fz * dz) / Math.sqrt(d2) < VISION_COS) continue
      if (!hasLos(city, e.pos, a.pos)) continue
      best = a
      bestD2 = d2
    }
    return best
  }

  // Loudest unprocessed gunshot within earshot, taken as the nearest one.
  // Sound carries through walls; it gives a bearing, never a target.
  function heard(e: SimUnit): Noise | null {
    let best: Noise | null = null
    let bestD2 = Infinity
    for (const n of noises) {
      if (n.id <= (e.heardId ?? 0)) continue
      const dx = n.pos.x - e.pos.x
      const dz = n.pos.z - e.pos.z
      const d2 = dx * dx + dz * dz
      if (d2 > n.r * n.r || d2 >= bestD2) continue
      best = n
      bestD2 = d2
    }
    return best
  }

  // Alert spreads by sight of a guard already fighting, not through walls.
  function allyInCombat(e: SimUnit): SimUnit | null {
    const p2 = PROPAGATE_R * PROPAGATE_R
    for (const o of units) {
      if (o.kind !== 'enemy' || o === e || o.stance === 'dead' || o.aiState !== 'combat') continue
      const dx = o.pos.x - e.pos.x
      const dz = o.pos.z - e.pos.z
      if (dx * dx + dz * dz <= p2 && hasLos(city, e.pos, o.pos)) return o
    }
    return null
  }

  // Certainty gained per second of clear sight; a close agent registers in a
  // fraction of the time one at the edge of the cone does.
  function sightGain(d: number): number {
    const k = Math.min(1, d / vision)
    return 1 / (SIGHT_NEAR_T + (SIGHT_FAR_T - SIGHT_NEAR_T) * k)
  }

  function sense(e: SimUnit, elapsed: number): void {
    let aware = e.awareness ?? 0
    const target = seen(e)
    if (target) {
      let gain = elapsed * sightGain(dist(e.pos, target.pos))
      // Infiltrator passive: certainty builds slower against this operative.
      if (target.kind === 'agent' && target.operative?.role === 'infiltrator') {
        gain *= ROLE_ABILITIES.infiltrator.passive.magnitude
      }
      aware += gain
      e.lastSeenT = world.time
      markLastSeen(e, target.pos)
    }
    const noise = heard(e)
    e.heardId = noiseSeq
    if (noise) {
      const d = dist(e.pos, noise.pos)
      const gain = 0.3 + 0.4 * (1 - Math.min(1, d / noise.r))
      if (aware < HEARD_MAX) aware = Math.min(HEARD_MAX, aware + gain)
      if (!target) markLastSeen(e, noise.pos)
    }
    // Fresh evidence restarts the look, whether or not it moves certainty.
    if (target || noise) e.investigateUntil = world.time + INVESTIGATE_T
    else aware -= elapsed * AWARE_DECAY
    if (aware < 1) {
      const ally = allyInCombat(e)
      if (ally) {
        aware = 1
        markLastSeen(e, ally.lastSeenPos ?? ally.pos)
      }
    }
    e.awareness = Math.max(0, Math.min(1, aware))
    if (e.awareness >= 1) enterCombat(e)
    else if (e.awareness > 0) enterSuspicious(e)
    else if (e.aiState === 'suspicious' && world.time >= (e.investigateUntil ?? 0)) leaveSuspicious(e)
  }

  function patrolStep(e: SimUnit): void {
    const pts = e.patrol
    if (!pts || pts.length === 0) {
      if (e.path.length === 0) e.stance = 'idle'
      return
    }
    if (e.path.length > 0) return
    const idx = (e.patrolIndex ?? 0) % pts.length
    const wp = pts[idx]
    if (dist(e.pos, wp) < 0.6) {
      e.patrolIndex = (idx + 1) % pts.length
      e.stance = 'idle'
    } else if (world.time >= (e.repathT ?? 0)) {
      e.repathT = world.time + ENEMY_REPATH
      e.path = findPath(city, e.pos, wp)
      e.stance = e.path.length > 0 ? 'moving' : 'idle'
    }
  }

  // Walks to whatever was seen or heard, then sweeps the spot. Certainty bleeds
  // off in sense(), which drops the guard back to its patrol once it runs out.
  function suspiciousStep(e: SimUnit, dt: number): void {
    const at = e.lastSeenPos
    if (at && dist(e.pos, at) > INVESTIGATE_R) {
      if (world.time >= (e.repathT ?? 0)) {
        e.repathT = world.time + ENEMY_REPATH
        e.path = findPath(city, e.pos, at)
      }
      e.stance = e.path.length > 0 ? 'moving' : 'idle'
      return
    }
    e.path.length = 0
    e.stance = 'idle'
    if (world.time >= (e.scanT ?? 0)) {
      e.scanT = world.time + SCAN_GAP
      e.scanYaw = e.heading + (rng() < 0.5 ? -1 : 1) * (0.6 + rng() * 1.2)
    }
    if (e.scanYaw !== undefined) turnToward(e, e.scanYaw, dt)
  }

  function combatStep(e: SimUnit, dt: number): void {
    const w = e.weapon
    const seeR = Math.max(vision, w ? w.range : 0)
    let tgt: SimUnit | null = null
    let bestD = seeR
    for (const a of units) {
      if (!hostileToGuards(a)) continue
      const d = dist(e.pos, a.pos)
      if (d <= bestD && hasLos(city, e.pos, a.pos)) {
        tgt = a
        bestD = d
      }
    }
    const minR = ENEMY_ARCHETYPES[e.archetype ?? 'trooper'].minRange ?? 0
    if (tgt && w) {
      e.lastSeenT = world.time
      markLastSeen(e, tgt.pos)
      e.targetId = tgt.id
      if (minR > 0 && bestD < minR) {
        // Marksman keeps range: backpedal away from the target before firing
        // again, rather than trading at arm's length.
        e.stance = 'moving'
        if (world.time >= (e.repathT ?? 0)) {
          e.repathT = world.time + ENEMY_REPATH
          const len = Math.max(bestD, 0.001)
          const back = {
            x: e.pos.x + ((e.pos.x - tgt.pos.x) / len) * MARKSMAN_BACKOFF,
            z: e.pos.z + ((e.pos.z - tgt.pos.z) / len) * MARKSMAN_BACKOFF,
          }
          const dest = nearestWalkable(city, back)
          if (dest) e.path = findPath(city, e.pos, dest)
        }
      } else if (bestD <= Math.max(1.5, w.range - 1)) {
        e.path.length = 0
        e.stance = 'attacking'
        faceToward(e, tgt.pos, dt)
        tryFire(e, tgt, ENEMY_ACC)
      } else {
        e.stance = 'moving'
        if (world.time >= (e.repathT ?? 0)) {
          e.repathT = world.time + ENEMY_REPATH
          e.path = findPath(city, e.pos, tgt.pos)
        }
      }
      return
    }
    e.targetId = null
    if (world.time - (e.lastSeenT ?? -100) > DISENGAGE_T) {
      // Gives up the chase but stays on edge, sweeping where the squad was.
      e.awareness = HEARD_MAX
      enterSuspicious(e)
      return
    }
    // Lost sight recently: push to the last place the squad was actually seen,
    // rather than tracking a target the guard can no longer make out.
    const at = e.lastSeenPos
    if (at && dist(e.pos, at) > INVESTIGATE_R && world.time >= (e.repathT ?? 0)) {
      e.repathT = world.time + ENEMY_REPATH
      e.path = findPath(city, e.pos, at)
    }
    e.stance = e.path.length > 0 ? 'moving' : 'idle'
  }

  // The radio call lands on every guard in range not already fighting:
  // certainty capped below the firing threshold, so they converge on the
  // squad's last seen position and sweep rather than shooting blind.
  function officerRadio(officer: SimUnit): void {
    const at = officer.lastSeenPos ?? officer.pos
    for (const e of units) {
      if (e.kind !== 'enemy' || e.stance === 'dead' || e === officer) continue
      if (e.aiState === 'combat') continue
      if (dist(officer.pos, e.pos) > OFFICER_RADIO_R) continue
      e.awareness = Math.max(e.awareness ?? 0, HEARD_MAX)
      markLastSeen(e, at)
      enterSuspicious(e)
      e.investigateUntil = world.time + INVESTIGATE_T
    }
    sfx.alertSting()
    pushLog('SYS', 'REINFORCEMENT CALL OUT. GUARDS CONVERGING.', 'alert')
  }

  function updateEnemies(dt: number): void {
    for (const e of units) {
      if (e.kind !== 'enemy' || e.stance === 'dead') continue
      tickWeapon(e, dt)
      if (e.radioAt !== undefined && !e.radioDone && world.time >= e.radioAt) {
        e.radioDone = true
        e.radioAt = undefined
        officerRadio(e)
      }
      if (e.aiState !== 'combat' && world.time >= (e.senseT ?? 0)) {
        // Clamped because sense() is skipped while fighting, so the gap since
        // the last look can be far longer than the interval.
        const elapsed = Math.min(SENSE_INTERVAL * 2, world.time - (e.senseAt ?? world.time))
        e.senseAt = world.time
        e.senseT = world.time + SENSE_INTERVAL
        sense(e, elapsed)
      }
      if (e.aiState === 'combat') combatStep(e, dt)
      else if (e.aiState === 'suspicious') suspiciousStep(e, dt)
      else patrolStep(e)
    }
  }

  // Idle vips wait for the squad; a following vip trails the nearest living
  // agent on a repath cadence and stops short of stepping on its heels.
  function updateVips(dt: number): void {
    for (const v of units) {
      if (v.kind !== 'vip' || v.stance === 'dead') continue
      let nearest: SimUnit | null = null
      let nd = Infinity
      for (const a of units) {
        if (a.kind !== 'agent' || a.stance === 'dead') continue
        const d = dist(v.pos, a.pos)
        if (d < nd) {
          nd = d
          nearest = a
        }
      }
      if (!v.alerted) {
        if (!nearest || nd > VIP_ACQUIRE_R) continue
        v.alerted = true
        pushLog('SYS', 'ASSET SECURED. Keep the escort alive.', 'ok')
      }
      if (!nearest) {
        v.path.length = 0
        v.stance = 'idle'
        continue
      }
      if (nd > VIP_FOLLOW_STOP) {
        if (world.time >= (v.repathT ?? 0)) {
          v.repathT = world.time + VIP_REPATH
          v.path = findPath(city, v.pos, nearest.pos)
        }
        v.stance = v.path.length > 0 ? 'moving' : 'idle'
      } else {
        v.path.length = 0
        v.stance = 'idle'
        faceToward(v, nearest.pos, dt)
      }
    }
  }

  function updateCivilians(): void {
    const flee2 = CIV_FLEE_R * CIV_FLEE_R
    for (const c of units) {
      if (c.kind !== 'civilian' || c.stance === 'dead') continue
      for (const n of noises) {
        const dx = n.pos.x - c.pos.x
        const dz = n.pos.z - c.pos.z
        if (dx * dx + dz * dz <= flee2) {
          if ((c.fleeUntil ?? 0) <= world.time) {
            c.fleeFrom = { x: n.pos.x, z: n.pos.z }
            c.path.length = 0
          }
          c.fleeUntil = world.time + CIV_FLEE_T
          break
        }
      }
      const fleeing = (c.fleeUntil ?? 0) > world.time
      if (fleeing) {
        c.stance = 'fleeing'
        if (c.path.length === 0) {
          const from = c.fleeFrom ?? c.pos
          let dx = c.pos.x - from.x
          let dz = c.pos.z - from.z
          const d = Math.sqrt(dx * dx + dz * dz)
          if (d < 0.01) {
            const ang = rng() * Math.PI * 2
            dx = Math.sin(ang)
            dz = Math.cos(ang)
          } else {
            dx /= d
            dz /= d
          }
          const run = 6 + rng() * 4
          const jitter = (rng() - 0.5) * 0.8
          const dest = {
            x: c.pos.x + dx * run - dz * jitter,
            z: c.pos.z + dz * run + dx * jitter,
          }
          c.path = findPath(city, c.pos, dest)
        }
      } else {
        if (c.stance === 'fleeing') c.stance = 'idle'
        if (c.path.length === 0 && world.time >= (c.wanderT ?? 0)) {
          c.wanderT = world.time + 2 + rng() * 5
          const ang = rng() * Math.PI * 2
          const r = 2 + rng() * 6
          const dest = { x: c.pos.x + Math.sin(ang) * r, z: c.pos.z + Math.cos(ang) * r }
          c.path = findPath(city, c.pos, dest)
          if (c.path.length > 0) c.stance = 'moving'
        }
      }
    }
  }

  function decayFx(): void {
    let w = 0
    for (let i = 0; i < tracers.length; i++) {
      if (world.time - tracers[i].t < TRACER_LIFE) tracers[w++] = tracers[i]
    }
    tracers.length = w
    w = 0
    for (let i = 0; i < booms.length; i++) {
      if (world.time - booms[i].t < BOOM_LIFE) booms[w++] = booms[i]
    }
    booms.length = w
    // Held a little longer than the sense interval so every guard gets one
    // look at each shot, whatever order the units are stepped in.
    w = 0
    for (let i = 0; i < noises.length; i++) {
      if (world.time - noises[i].t < NOISE_LIFE) noises[w++] = noises[i]
    }
    noises.length = w
  }

  function detonateCharge(ch: Charge): void {
    const spec = ROLE_ABILITIES.demolitions.active
    booms.push({ pos: { x: ch.pos.x, z: ch.pos.z }, t: world.time, r: spec.radius, color: '#ff9b52' })
    noiseSeq += 1
    noises.push({
      id: noiseSeq,
      pos: { x: ch.pos.x, z: ch.pos.z },
      r: FRAG_NOISE_RADIUS,
      t: world.time,
    })
    for (const t of units) {
      if (t.stance === 'dead') continue
      if (dist(ch.pos, t.pos) > spec.radius || !hasLos(city, ch.pos, t.pos)) continue
      applyDamage(t, spec.magnitude, ch.by)
    }
    sfx.blast()
    pushLog('SYS', 'FRAG CHARGE DETONATED.', 'ok')
  }

  // Role ability upkeep: fuse timers, effect expiry, the suppression sweep
  // marking pass and the medic regeneration aura.
  function updateAbilities(dt: number): void {
    let w = 0
    for (const ch of charges) {
      if (world.time < ch.at) charges[w++] = ch
      else detonateCharge(ch)
    }
    charges.length = w
    for (const u of units) {
      if (u.kind !== 'agent') continue
      // Expiry fires once: the timer is zeroed with the comm line. A consumed
      // deadeye and a dead operative both zero it first, so neither logs.
      if ((u.abilityUntil ?? 0) > 0 && (u.abilityUntil ?? 0) <= world.time) {
        u.abilityUntil = 0
        const line = u.operative ? ABILITY_EXPIRE_LINES[u.operative.role] : undefined
        if (line && u.stance !== 'dead') pushLog(u.name, line)
      }
      if (u.stance === 'dead') continue
      const role = u.operative?.role
      if (role === 'support' && roleActive(u, 'support')) {
        const spec = ROLE_ABILITIES.support.active
        for (const e of units) {
          if (e.kind !== 'enemy' || e.stance === 'dead') continue
          if (dist(u.pos, e.pos) > spec.radius || !hasLos(city, u.pos, e.pos)) continue
          e.suppressedUntil = world.time + SUPPRESS_LINGER
        }
      } else if (role === 'medic') {
        const p = ROLE_ABILITIES.medic.passive
        for (const a of units) {
          if (a.kind !== 'agent' || a.stance === 'dead') continue
          if (dist(u.pos, a.pos) > p.radius) continue
          const cap = a.maxHp * MEDIC_REGEN_CAP
          if (a.hp < cap) a.hp = Math.min(cap, a.hp + p.magnitude * dt)
        }
      }
    }
  }

  function zoneFor(def: ObjectiveDef): Zone {
    if (def.zone) return def.zone
    if (def.landmark && city.landmarks[def.landmark]) return city.landmarks[def.landmark]
    return city.checkpoint
  }

  function inZone(p: Vec2, zone: Zone): boolean {
    const dx = p.x - zone.x
    const dz = p.z - zone.z
    return dx * dx + dz * dz <= zone.r * zone.r
  }

  function agentInZone(zone: Zone): boolean {
    return units.some((u) => u.kind === 'agent' && u.stance !== 'dead' && inZone(u.pos, zone))
  }

  function livingDevices(tag: string | undefined): boolean {
    return units.some((u) => u.kind === 'device' && u.tag === tag && u.stance !== 'dead')
  }

  // Wave spawn for a defend objective: enemies enter already fighting, headed
  // for the zone, from the generator's guaranteed-connected entry landmarks.
  function spawnWave(def: ObjectiveDef): void {
    const wave = def.wave
    if (!wave || wave.count <= 0) return
    const zone = zoneFor(def)
    const entries = wave.entry
      .map((k) => city.landmarks[k])
      .filter((z): z is Zone => z !== undefined)
    for (let i = 0; i < wave.count; i++) {
      const at = entries.length > 0 ? entries[i % entries.length] : zone
      const w = WEAPONS[wave.weapons[i % wave.weapons.length] ?? 'smg']
      waveSeq += 1
      addUnit({
        id: 'w' + waveSeq,
        kind: 'enemy',
        name: 'CORPSEC-W' + pad2(waveSeq),
        pos: snap({ x: at.x + (rng() - 0.5) * 2, z: at.z + (rng() - 0.5) * 2 }),
        heading: Math.atan2(zone.x - at.x, zone.z - at.z),
        hp: Math.round(ENEMY_ARCHETYPES.trooper.hp * mods.enemyHpMul),
        maxHp: Math.round(ENEMY_ARCHETYPES.trooper.hp * mods.enemyHpMul),
        speed: ENEMY_ARCHETYPES.trooper.speed,
        archetype: 'trooper',
        weapon: w,
        stance: 'idle',
        path: [],
        targetId: null,
        cooldown: rng() * 0.4,
        magazine: w.magazine,
        reloading: 0,
        alerted: true,
        holdGround: false,
        holdFire: false,
        patrol: [],
        patrolIndex: 0,
        aiState: 'combat',
        senseT: 0,
        senseAt: world.time,
        repathT: 0,
        lastSeenT: world.time,
        lastSeenPos: { x: zone.x, z: zone.z },
        awareness: 1,
        heardId: noiseSeq,
      })
    }
    sfx.alertSting()
    pushLog('SYS', 'CORPSEC WAVE INBOUND. HOLD THE ZONE.', 'alert')
  }

  function activateIndex(i: number): void {
    if (objState[i] !== 'pending') return
    objState[i] = 'active'
    if (objectives[i].kind === 'defend') spawnWave(objectives[i])
  }

  // Brings a required objective live along with every optional that precedes
  // it in the list back to the previous required entry.
  function activateRequired(ri: number): void {
    const idx = requiredOrder[ri]
    if (idx === undefined) return
    activateIndex(idx)
    objectives.forEach((d, j) => {
      if (!d.optional) return
      const companion = requiredOrder.find((r) => r > j)
      if (companion === idx) activateIndex(j)
    })
  }

  function objectiveMet(def: ObjectiveDef, i: number): boolean {
    switch (def.kind) {
      case 'reach-zone':
        return agentInZone(zoneFor(def))
      case 'eliminate-tag':
        return !units.some((u) => u.kind === 'enemy' && u.tag === def.tag && u.stance !== 'dead')
      case 'interact':
        return interactT[i] >= (def.durationSec ?? 0)
      case 'escort': {
        const crowd = units.filter((u) => u.kind === 'vip')
        if (crowd.length === 0) return false
        const zone = zoneFor(def)
        return crowd.every((v) => v.stance !== 'dead' && inZone(v.pos, zone))
      }
      case 'destroy':
        return !livingDevices(def.tag)
      case 'defend':
        return defendLeft[i] <= 0
      case 'extract': {
        const alive = livingAgents()
        if (alive.length === 0) return false
        const zone = city.extraction
        return alive.every((u) => inZone(u.pos, zone))
      }
    }
  }

  function mmssLeft(sec: number): string {
    const s = Math.max(0, Math.ceil(sec))
    return Math.floor(s / 60) + ':' + pad2(s % 60)
  }

  function syncObjectives(): void {
    const rows: ObjectiveUi[] = objectives.map((d, i) => {
      const st = objState[i]
      const row: ObjectiveUi = {
        id: d.id,
        label: d.label,
        done: st === 'done',
        active: st === 'active',
        optional: d.optional === true,
        failed: st === 'failed',
      }
      if (st === 'active' && d.durationSec) {
        if (d.kind === 'interact') row.progress = Math.min(1, interactT[i] / d.durationSec)
        else if (d.kind === 'defend') {
          row.progress = Math.min(1, 1 - defendLeft[i] / d.durationSec)
          row.timer = mmssLeft(defendLeft[i])
        }
      }
      if (st === 'active' && d.failSec && row.timer === undefined) {
        row.timer = mmssLeft(failLeft[i])
      }
      return row
    })
    useMissionStore.getState().setObjectives(rows)
  }

  // True while an active objective pushes continuous progress the HUD shows.
  function objectivesTicking(): boolean {
    return objectives.some(
      (d, i) =>
        objState[i] === 'active' &&
        (d.kind === 'interact' || d.kind === 'defend' || d.failSec !== undefined),
    )
  }

  function failObjective(i: number): void {
    if (objState[i] === 'done' || objState[i] === 'failed') return
    objState[i] = 'failed'
    pushLog('SYS', 'OBJECTIVE FAILED: ' + objectives[i].label, 'alert')
    syncObjectives()
  }

  // A dead vip voids every unfinished escort: optional ones fail and are
  // skipped, a required one loses the mission on the spot.
  function onVipDead(): void {
    objectives.forEach((d, i) => {
      if (d.kind !== 'escort' || objState[i] === 'done') return
      if (d.optional) {
        failObjective(i)
      } else if (result === 'none') {
        setResultNow('lost')
        pushLog('SYS', 'CONTRACT BREACHED. THE ASSET IS DEAD.', 'alert')
      }
    })
  }

  function completeObjective(i: number): void {
    const def = objectives[i]
    objState[i] = 'done'
    objDoneT[i] = world.time
    sfx.objectiveChime()
    noteTutorial('objective')
    pushLog('SYS', 'OBJECTIVE COMPLETE: ' + def.label, 'ok')
    if (def.optional) {
      if (def.bonusReward) {
        bonusEarned += def.bonusReward
        pushLog('SYS', 'BONUS SECURED: +' + def.bonusReward + ' CR.', 'ok')
      }
    } else {
      reqPtr += 1
      const nextIdx = requiredOrder[reqPtr]
      if (nextIdx !== undefined) {
        activateRequired(reqPtr)
        const next = objectives[nextIdx]
        if (next.kind === 'extract') {
          pushLog('SYS', 'Extraction window open. Return to the insertion zone.', 'ok')
        } else {
          pushLog('SYS', 'OBJECTIVE: ' + next.label)
        }
      }
    }
    syncObjectives()
  }

  function updateObjectives(dt: number): void {
    for (let i = 0; i < objectives.length; i++) {
      if (objState[i] !== 'active') continue
      const def = objectives[i]
      if (def.failSec) {
        failLeft[i] -= dt
        if (failLeft[i] <= 0) {
          failObjective(i)
          if (!def.optional) {
            setResultNow('lost')
            pushLog('SYS', 'CONTRACT BREACHED. THE WINDOW CLOSED.', 'alert')
            return
          }
          continue
        }
      }
      if (def.kind === 'interact') {
        // Progress accrues while any living agent holds the zone; an empty
        // zone pauses the channel where it stands, never resets it.
        if (agentInZone(zoneFor(def))) {
          if (!interactStarted[i]) {
            interactStarted[i] = true
            pushLog('SYS', 'UPLINK OPEN: ' + def.label, 'ok')
          }
          const before = Math.floor(interactT[i])
          interactT[i] += dt
          if (Math.floor(interactT[i]) > before) sfx.interactTick()
        }
      } else if (def.kind === 'defend') {
        // The countdown mirrors interact: it only burns while the squad
        // actually holds the zone.
        if (agentInZone(zoneFor(def))) defendLeft[i] = Math.max(0, defendLeft[i] - dt)
      } else if (
        def.kind === 'destroy' &&
        def.optional &&
        def.tag &&
        deviceLostTags.has(def.tag) &&
        !livingDevices(def.tag)
      ) {
        failObjective(i)
        continue
      }
      if (objectiveMet(def, i)) completeObjective(i)
    }
  }

  function setResultNow(r: 'won' | 'lost'): void {
    result = r
    resultAt = world.time
    useMissionStore.getState().setResult(r)
    sfx.threatLevel(0)
  }

  function checkEnd(): void {
    if (livingAgents().length === 0) {
      setResultNow('lost')
      pushLog('SYS', 'SQUAD ELIMINATED. UPLINK LOST.', 'alert')
      return
    }
    if (requiredOrder.length > 0 && reqPtr >= requiredOrder.length) {
      setResultNow('won')
      noteTutorial('extract')
      pushLog('SYS', 'MISSION COMPLETE. EXTRACTION CONFIRMED.', 'ok')
    }
  }

  function maybeOutcome(): void {
    if (result === 'none' || outcomeSent || world.time - resultAt < OUTCOME_DELAY) return
    outcomeSent = true
    // End-of-mission health fractions for the debrief injury grading.
    const survivorHp: Record<string, number> = {}
    for (const u of units) {
      if (u.kind !== 'agent' || u.stance === 'dead' || !u.operative) continue
      survivorHp[u.operative.id] = Math.max(0, Math.min(1, u.hp / u.maxHp))
    }
    // The counters leave the sim exactly once, here, on the outcome the app
    // store already carries; recording them is the debrief boundary's call.
    const telemetry: MissionTelemetry = {
      seed: mission.seed,
      firstContactSec: firstContactT >= 0 ? firstContactT : null,
      objectiveTimes: objectives
        .map((d, i) => ({ id: d.id, atSec: objDoneT[i] }))
        .filter((o) => o.atSec >= 0),
      shotsByWeapon: { ...shotsByWeapon },
      damageByWeapon: { ...damageByWeapon },
      damageDealt,
      damageTaken,
      civilianHitsBySquad: civHitsSquad,
      civilianHitsByCorpsec: civHitsCorpsec,
      medUsed,
      cellUsed,
      abilityUsesByRole: { ...abilityUsesByRole },
      squadRoles: operatives.map((op) => op.role),
    }
    useAppStore.getState().setOutcome({
      won: result === 'won',
      kills,
      casualties,
      timeSec: world.time,
      civiliansHit,
      reward: result === 'won' ? mission.reward : 0,
      bonus: result === 'won' ? bonusEarned : 0,
      deadIds: deadIds.slice(),
      survivorHp,
      telemetry,
    })
  }

  function updateAlert(): void {
    let count = 0
    for (const u of units) {
      if (u.kind === 'enemy' && u.stance !== 'dead' && u.alerted) count += 1
    }
    const lvl = count === 0 ? 0 : Math.min(3, 1 + Math.floor(count / 3))
    if (lvl !== alertLevel) {
      alertLevel = lvl
      useMissionStore.getState().setAlert(lvl)
      // Tension drone tracks the alert level; a decided mission has already
      // silenced it and stays silent.
      if (result === 'none') sfx.threatLevel(lvl)
    }
  }

  function syncSquad(): void {
    const rows: SquadMemberUi[] = []
    for (const u of units) {
      if (u.kind !== 'agent') continue
      const op = u.operative
      if (!op) continue
      const kit = ROLE_ABILITIES[op.role]
      rows.push({
        unitId: u.id,
        slot: u.agentSlot ?? 0,
        name: op.name,
        codename: op.codename,
        accent: op.accent,
        hp: Math.max(0, Math.ceil(u.hp)),
        maxHp: u.maxHp,
        magazine: u.magazine,
        magazineSize: u.weapon ? u.weapon.magazine : 0,
        reloading: u.reloading > 0,
        swapping: world.time < (u.swapReadyAt ?? 0),
        weaponName: u.weapon ? u.weapon.name : '-',
        activeSlot: u.activeSlot ?? 'primary',
        stowedName: u.stowedWeapon ? u.stowedWeapon.name : '-',
        stowedMagazine: u.stowedMagazine ?? 0,
        stowedMagazineSize: u.stowedWeapon ? u.stowedWeapon.magazine : 0,
        holdGround: u.holdGround,
        holdFire: u.holdFire,
        abilityName: kit.active.name,
        abilityCooldownRemaining: Math.max(0, (u.abilityReadyAt ?? 0) - world.time),
        abilityCooldownDuration: u.abilityCdTotal ?? kit.active.cooldown,
        abilityActiveRemaining: Math.max(0, (u.abilityUntil ?? 0) - world.time),
        abilityActiveDuration: kit.active.duration,
        dead: u.stance === 'dead',
      })
    }
    useMissionStore.getState().setSquad(rows)
  }

  function availability(stock: number, readyAt: number): AbilityAvailability {
    if (stock <= 0) return 'out-of-stock'
    if (world.time < readyAt) return 'cooldown'
    return 'usable'
  }

  function syncMissionResources(): void {
    const abilities: MissionAbilities = {
      grenade: {
        availability: availability(inventory.cell, grenadeReadyAt),
        cooldownRemaining: Math.max(0, grenadeReadyAt - world.time),
        cooldownDuration: GRENADE_COOLDOWN,
      },
    }
    const ms = useMissionStore.getState()
    ms.setInventory({ med: inventory.med, cell: inventory.cell })
    ms.setAbilities(abilities)
  }

  function startup(): void {
    pushLog('SYS', 'SQUAD LINK ESTABLISHED. ' + livingAgents().length + ' ONLINE.')
    if (massDelta < 0) fireTutorialHint('hint-overweight')
    activateRequired(0)
    const firstIdx = requiredOrder[0]
    const first = firstIdx !== undefined ? objectives[firstIdx] : undefined
    if (first) {
      if (first.kind === 'extract') {
        pushLog('SYS', 'Extraction window open. Return to the insertion zone.', 'ok')
      } else {
        pushLog('SYS', 'OBJECTIVE: ' + first.label)
      }
    }
    syncSquad()
    syncObjectives()
    syncMissionResources()
    useMissionStore.getState().setClock(clockStr())
  }

  // Consumes the full frame delta in MAX_DT substeps so mission time tracks
  // wall time even when frames arrive sparsely (throttled or occluded tabs,
  // capture-driven previews). Clamping to one MAX_DT per frame instead would
  // silently discard the rest of the delta and freeze the mission clock.
  // MAX_CATCHUP bounds the work after long frame gaps.
  function tick(rawDt: number): void {
    if (!Number.isFinite(rawDt)) return
    let remaining = Math.min(Math.max(rawDt, 0), MAX_CATCHUP)
    if (remaining <= 0) return
    if (!started) {
      started = true
      startup()
    }
    // Warm-up frames arrive seconds apart while pipelines compile; advance one
    // step per frame until the mission is underway so the opening moments are
    // not simulated off screen.
    if (world.time < 1) remaining = Math.min(remaining, MAX_DT)
    while (remaining > 0) {
      const stepDt = Math.min(remaining, MAX_DT)
      remaining -= stepDt
      step(stepDt)
    }
  }

  function step(dt: number): void {
    world.time += dt
    updateAbilities(dt)
    updateAgents(dt)
    updateEnemies(dt)
    updateVips(dt)
    updateCivilians()
    for (const u of units) {
      // holdGround is enforced here as well as at every path writer, so a
      // route added later cannot walk a posted agent off its cell.
      if (u.stance !== 'dead' && u.stance !== 'attacking' && !u.holdGround && u.path.length > 0)
        stepMove(u, dt)
    }
    separate(dt)
    decayFx()
    if (result === 'none') {
      updateObjectives(dt)
      checkEnd()
    }
    updateAlert()
    maybeOutcome()
    syncT += dt
    if (syncT >= SYNC_INTERVAL) {
      syncT -= SYNC_INTERVAL
      syncSquad()
      syncMissionResources()
      // Channels and countdowns move every step; push their bars at sync rate.
      if (objectivesTicking()) syncObjectives()
      useMissionStore.getState().setClock(clockStr())
      if (result === 'none') checkHints()
    }
  }

  // Contextual one-shots, checked at sync rate: a wounded operative while med
  // kits remain, and a role ability sitting ready unused. Sync-rate precision
  // is plenty for a sixty second idle threshold.
  function checkHints(): void {
    if (!lowHpHinted && inventory.med > 0) {
      for (const u of units) {
        if (u.kind !== 'agent' || u.stance === 'dead') continue
        if (u.hp < u.maxHp * LOW_HP_HINT_FRAC) {
          lowHpHinted = true
          fireTutorialHint('hint-lowhp')
          break
        }
      }
    }
    if (!abilityUsed && !abilityIdleHinted) {
      let ready = false
      for (const u of units) {
        if (u.kind !== 'agent' || u.stance === 'dead') continue
        if ((u.abilityReadyAt ?? 0) <= world.time) {
          ready = true
          break
        }
      }
      if (ready) {
        abilityIdleT += SYNC_INTERVAL
        if (abilityIdleT >= ABILITY_IDLE_HINT_SEC) {
          abilityIdleHinted = true
          fireTutorialHint('hint-ability-idle')
        }
      }
    }
  }

  // Compact ring spread so grouped agents do not stack on one point.
  function spreadOffset(i: number): Vec2 {
    if (i === 0) return { x: 0, z: 0 }
    const ring = i <= 6 ? 1 : 2
    const idx = ring === 1 ? i - 1 : i - 7
    const slots = ring === 1 ? 6 : 12
    const ang = (idx / slots) * Math.PI * 2 + ring * 0.5
    const r = ring * 0.9
    return { x: Math.sin(ang) * r, z: Math.cos(ang) * r }
  }

  // Order recipients: the living agents among the ids the player selected.
  function ordered(agentIds: string[]): SimUnit[] {
    const out: SimUnit[] = []
    for (const id of agentIds) {
      const u = byId.get(id)
      if (u && u.kind === 'agent' && u.stance !== 'dead') out.push(u)
    }
    return out
  }

  // One acknowledgement per order burst, so a flurry of clicks stays readable.
  function orderChatter(crew: SimUnit[], lines: string[]): void {
    if (world.time - lastOrderChatterT < MOVE_CHATTER_GAP) return
    lastOrderChatterT = world.time
    const u = crew[Math.floor(rng() * crew.length)]
    pushLog(u.name, pick(lines))
  }

  // Stance acknowledgement: silent unless a flag actually moved, and share the
  // chatter gap so setting a stance per slot cannot flush the comm log.
  function stanceAck(changed: boolean, line: string): void {
    if (!changed) return
    sfx.confirmBlip()
    if (world.time - lastOrderChatterT < MOVE_CHATTER_GAP) return
    lastOrderChatterT = world.time
    pushLog('SYS', line)
  }

  function orderMove(agentIds: string[], dest: Vec2): void {
    const movers = ordered(agentIds)
    if (movers.length === 0) return
    noteTutorial('move')
    const base = isWalkable(city, dest.x, dest.z)
      ? { x: dest.x, z: dest.z }
      : nearestWalkable(city, dest)
    if (!base) return
    movers.forEach((u, i) => {
      const off = spreadOffset(i)
      const target = { x: base.x + off.x, z: base.z + off.z }
      u.path = findPath(city, u.pos, target)
      u.suspended = undefined
      u.targetId = null
      u.explicitTarget = false
      // A move outranks hold ground, the way an attack outranks hold fire.
      u.holdGround = false
      u.stance = u.path.length > 0 ? 'moving' : 'idle'
    })
    sfx.confirmBlip()
    orderChatter(movers, MOVE_LINES)
  }

  function orderAttack(agentIds: string[], targetId: string): void {
    const t = byId.get(targetId)
    // Devices are legal attack targets: gunfire is the slow demolition tool.
    if (!t || (t.kind !== 'enemy' && t.kind !== 'device') || t.stance === 'dead') return
    const shooters = ordered(agentIds)
    if (shooters.length === 0) return
    noteTutorial('attack')
    for (const u of shooters) {
      u.targetId = targetId
      u.explicitTarget = true
      u.suspended = undefined
      u.repathT = 0
    }
    sfx.confirmBlip()
    orderChatter(shooters, ATTACK_LINES)
  }

  function orderStop(agentIds: string[]): void {
    const crew = ordered(agentIds)
    if (crew.length === 0) return
    for (const u of crew) {
      u.path.length = 0
      u.suspended = undefined
      u.targetId = null
      u.explicitTarget = false
      u.stance = 'idle'
    }
    sfx.confirmBlip()
    orderChatter(crew, STOP_LINES)
  }

  function orderHold(agentIds: string[], hold: boolean): void {
    const crew = ordered(agentIds)
    if (crew.length === 0) return
    noteTutorial('hold')
    let changed = false
    for (const u of crew) {
      if (u.holdGround !== hold) changed = true
      u.holdGround = hold
      if (hold) {
        // Pin to the current cell and park the route rather than destroy it,
        // keeping the target so the agent still shoots what comes to it.
        if (u.path.length > 0) u.suspended = u.path.slice()
        u.path.length = 0
        if (u.stance === 'moving') u.stance = 'idle'
      } else if (u.suspended && u.suspended.length > 0) {
        // Resume the parked walk from wherever the agent now stands.
        const dest = u.suspended[u.suspended.length - 1]
        u.suspended = undefined
        u.path = findPath(city, u.pos, dest)
        if (u.path.length > 0) u.stance = 'moving'
      }
    }
    syncSquad()
    stanceAck(changed, hold ? 'Holding position.' : 'Free to move.')
  }

  // Swaps each agent to its other slot. The stowed weapon keeps the magazine
  // it went away with; a reload in progress dies with the stow, so the round
  // count resumes as-is when the weapon comes back out. The drawn weapon
  // holds fire until SWAP_DELAY passes.
  function orderSwapWeapon(agentIds: string[]): void {
    const crew = ordered(agentIds)
    if (crew.length === 0) return
    noteTutorial('swap')
    let changed = false
    let toSidearm = false
    for (const u of crew) {
      if (!u.weapon || !u.stowedWeapon) continue
      const w = u.weapon
      const m = u.magazine
      u.weapon = u.stowedWeapon
      u.magazine = u.stowedMagazine ?? u.weapon.magazine
      u.stowedWeapon = w
      u.stowedMagazine = m
      u.activeSlot = u.activeSlot === 'primary' ? 'sidearm' : 'primary'
      u.reloading = 0
      u.cooldown = 0
      u.swapReadyAt = world.time + SWAP_DELAY
      changed = true
      if (u.activeSlot === 'sidearm') toSidearm = true
    }
    syncSquad()
    stanceAck(changed, toSidearm ? 'Sidearms out.' : 'Back on primaries.')
  }

  function orderHoldFire(agentIds: string[], hold: boolean): void {
    const crew = ordered(agentIds)
    if (crew.length === 0) return
    noteTutorial('hold')
    let changed = false
    for (const u of crew) {
      if (u.holdFire !== hold) changed = true
      u.holdFire = hold
      if (!hold) continue
      // Dropping the target stops the shooting this tick rather than one
      // acquire interval later. A standing order goes with it, otherwise the
      // card would read TIGHT while the agent kept firing; an attack ordered
      // after the flag is set still fires through.
      u.targetId = null
      u.explicitTarget = false
      if (u.stance === 'attacking') u.stance = 'idle'
    }
    syncSquad()
    stanceAck(changed, hold ? 'Weapons tight.' : 'Weapons free.')
  }

  // Nearest living enemy within `range` of the operative, walls ignored: the
  // charge is thrown over cover, the blast itself respects line of sight.
  function nearestEnemyTo(u: SimUnit, range: number): SimUnit | null {
    let best: SimUnit | null = null
    let bestD = range
    for (const e of units) {
      if (e.kind !== 'enemy' || e.stance === 'dead') continue
      const d = dist(u.pos, e.pos)
      if (d <= bestD) {
        best = e
        bestD = d
      }
    }
    return best
  }

  // One agent's role active. Cooldown and an already-running effect skip
  // silently; a targeted ability with no target pushes a fail line and keeps
  // its cooldown, so the retry costs nothing.
  function fireAbility(u: SimUnit): void {
    const role = u.operative?.role
    if (!role) return
    const spec = ROLE_ABILITIES[role].active
    if (world.time < (u.abilityReadyAt ?? 0) || (u.abilityUntil ?? 0) > world.time) return
    switch (role) {
      case 'demolitions': {
        const target = nearestEnemyTo(u, spec.range)
        if (!target) {
          pushLog(u.name, 'No target for the charge.', 'alert')
          return
        }
        charges.push({
          pos: { x: target.pos.x, z: target.pos.z },
          at: world.time + spec.duration,
          by: u,
        })
        break
      }
      case 'medic': {
        let best: SimUnit | null = null
        let worst = 1
        for (const a of units) {
          if (a.kind !== 'agent' || a.stance === 'dead') continue
          if (a.hp >= a.maxHp || dist(u.pos, a.pos) > spec.range) continue
          const frac = a.hp / a.maxHp
          if (frac < worst) {
            worst = frac
            best = a
          }
        }
        if (!best) {
          pushLog(u.name, 'Nobody needs the stim.', 'alert')
          return
        }
        const healed = Math.min(spec.magnitude, best.maxHp - best.hp)
        best.hp += healed
        pushLog(
          u.name,
          'Stim on ' + (best.operative?.codename ?? best.name) + '. +' + Math.ceil(healed) + ' HP.',
          'ok',
        )
        break
      }
      case 'tech': {
        for (const e of units) {
          if (e.kind !== 'enemy' || e.stance === 'dead') continue
          if (dist(u.pos, e.pos) > spec.radius) continue
          e.jammedUntil = world.time + spec.duration
          if (e.aiState === 'combat') {
            // Down to suspicious: certainty capped below the firing threshold,
            // the burst itself is what they walk toward.
            e.awareness = HEARD_MAX
            markLastSeen(e, u.pos)
            enterSuspicious(e)
          } else {
            if ((e.awareness ?? 0) > HEARD_MAX) e.awareness = HEARD_MAX
            e.targetId = null
          }
        }
        break
      }
      case 'recon':
        world.scanUntil = Math.max(world.scanUntil, world.time + spec.duration)
        break
      default:
        // assault, infiltrator, sniper, support: the timer below is the effect.
        break
    }
    if (spec.duration > 0) u.abilityUntil = world.time + spec.duration
    abilityUsesByRole[role] += 1
    u.abilityCdTotal = spec.cooldown * (techAlive() ? ROLE_ABILITIES.tech.passive.magnitude : 1)
    u.abilityReadyAt = world.time + u.abilityCdTotal
    const line = ABILITY_USE_LINES[role]
    if (line) pushLog(u.name, line)
    sfx.abilityCue()
  }

  function orderAbility(agentIds: string[]): void {
    const ms = useMissionStore.getState()
    if (!ms.live || ms.paused || ms.result !== 'none' || result !== 'none') return
    const crew = ordered(agentIds)
    if (crew.length > 0) {
      abilityUsed = true
      noteTutorial('ability')
    }
    for (const u of crew) fireAbility(u)
    syncSquad()
  }

  function canUseAbility(agentId: string): SimUnit | null {
    const ms = useMissionStore.getState()
    if (!ms.live || ms.paused || ms.result !== 'none' || result !== 'none') return null
    const u = byId.get(agentId)
    if (!u || u.kind !== 'agent' || u.stance === 'dead' || u.hp <= 0) return null
    return u
  }

  function itemsUsable(): boolean {
    const ms = useMissionStore.getState()
    return ms.live && !ms.paused && ms.result === 'none' && result === 'none'
  }

  // The count reaches the HUD through the normal SYNC_INTERVAL push, so the
  // orders never write the store directly.
  function orderUseMed(agentIds: string[]): boolean {
    if (!itemsUsable() || inventory.med <= 0) return false
    let best: SimUnit | null = null
    let worst = 1
    for (const u of ordered(agentIds)) {
      if (u.hp >= u.maxHp) continue
      const frac = u.hp / u.maxHp
      if (frac < worst) {
        worst = frac
        best = u
      }
    }
    if (!best) {
      pushLog('SYS', 'MED KIT: NO WOUNDED OPERATIVE SELECTED.', 'alert')
      return false
    }
    const healed = Math.min(MED_KIT_HEAL, best.maxHp - best.hp)
    best.hp += healed
    inventory.med -= 1
    medUsed += 1
    noteTutorial('item')
    sfx.confirmBlip()
    pushLog('SYS', 'MED KIT APPLIED TO ' + (best.operative?.codename ?? best.name) + '. +' + Math.ceil(healed) + ' HP.', 'ok')
    return true
  }

  function orderUseCell(agentIds: string[]): boolean {
    if (!itemsUsable() || inventory.cell <= 0) return false
    let target: SimUnit | null = null
    for (const u of ordered(agentIds)) {
      if ((u.abilityReadyAt ?? 0) > world.time) {
        target = u
        break
      }
    }
    if (!target) {
      pushLog('SYS', 'POWER CELL: NO ABILITY COOLDOWN RUNNING.', 'alert')
      return false
    }
    target.abilityReadyAt = world.time
    inventory.cell -= 1
    cellUsed += 1
    noteTutorial('item')
    sfx.confirmBlip()
    pushLog('SYS', 'POWER CELL SPENT. ' + (target.operative?.codename ?? target.name) + ' ABILITY CHARGED.', 'ok')
    return true
  }

  function orderGrenade(agentId: string, target: Vec2): boolean {
    const u = canUseAbility(agentId)
    if (!u || inventory.cell <= 0 || world.time < grenadeReadyAt) return false
    if (!Number.isFinite(target.x) || !Number.isFinite(target.z)) return false
    if (target.x < 0 || target.z < 0 || target.x >= city.size || target.z >= city.size) return false
    const resolved = isWalkable(city, target.x, target.z)
      ? { x: target.x, z: target.z }
      : nearestWalkable(city, target)
    if (!resolved || dist(target, resolved) > GRENADE_TARGET_SNAP) return false
    if (dist(u.pos, resolved) > GRENADE_RANGE) return false

    inventory.cell -= 1
    cellUsed += 1
    grenadeReadyAt = world.time + GRENADE_COOLDOWN
    noiseSeq += 1
    noises.push({
      id: noiseSeq,
      pos: { x: resolved.x, z: resolved.z },
      r: GRENADE_NOISE_RADIUS,
      t: world.time,
    })
    booms.push({
      pos: { x: resolved.x, z: resolved.z },
      t: world.time,
      r: GRENADE_RADIUS,
      color: '#ff9b52',
    })

    for (const t of units) {
      if (t.stance === 'dead') continue
      const d = dist(resolved, t.pos)
      if (d > GRENADE_RADIUS || !hasLos(city, resolved, t.pos)) continue
      const k = Math.min(1, d / GRENADE_RADIUS)
      const damage = GRENADE_DAMAGE_CENTER + (GRENADE_DAMAGE_EDGE - GRENADE_DAMAGE_CENTER) * k
      applyDamage(t, damage, u)
    }
    sfx.blast()
    sfx.confirmBlip()
    pushLog('SYS', 'GRENADE DETONATED. CELL EXPENDED.', 'ok')
    return true
  }

  const world: WorldApi = {
    city,
    mission,
    units,
    tracers,
    booms,
    time: 0,
    vision,
    scanUntil: 0,
    tick,
    orderMove,
    orderAttack,
    orderStop,
    orderHold,
    orderHoldFire,
    orderSwapWeapon,
    orderAbility,
    orderUseMed,
    orderUseCell,
    orderGrenade,
    unit: (id: string) => byId.get(id),
  }

  return world
}
