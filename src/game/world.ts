// Gameplay simulation: units, movement, combat, enemy FSM, civilians,
// objectives and low rate store sync. Pure TypeScript, no rendering.
// Note: MissionScreen resets the mission store right after createWorld, so
// every store write is deferred to the first tick (startup()).
import type {
  Boom,
  MissionDef,
  ObjectiveDef,
  OperativeDef,
  Tracer,
  Unit,
  Vec2,
  WorldApi,
} from './types'
import { isWalkable } from './types'
import { WEAPONS } from './data'
import { crewBonus, squadWeapon } from './research'
import { generateCity } from '../world/citygen'
import { mulberry32 } from './rng'
import { findPath, hasLos, nearestWalkable } from './pathfind'
import { sfx } from './audio'
import { useMissionStore } from '../state/missionStore'
import type { ObjectiveUi, SquadMemberUi } from '../state/missionStore'
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
const ENEMY_VISION = 14
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

const MOVE_LINES = ['Moving up.', 'Copy that.', 'On my way.', 'Repositioning.', 'Advancing.']
// No 'Weapons free.' here: an ordered shot fires through hold fire, so that
// line would contradict a card still reading TIGHT.
const ATTACK_LINES = ['Engaging.', 'Target acquired.', 'Taking the shot.']
const STOP_LINES = ['All stop.', 'Standing by.', 'Cutting the move.', 'Waiting on you.']
const HIT_LINES = ['Taking fire!', 'Under fire, holding.', 'They have us marked.']

type Cls = 'sys' | 'alert' | 'ok'

interface SimUnit extends Unit {
  // Internal simulation fields; the renderer only reads the Unit surface.
  aiState?: 'patrol' | 'combat'
  senseT?: number
  repathT?: number
  lastSeenT?: number
  acquireT?: number
  explicitTarget?: boolean
  // Waypoints parked by hold ground, restored when the hold lifts.
  suspended?: Vec2[]
  wanderT?: number
  fleeUntil?: number
  fleeFrom?: Vec2
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function createWorld(mission: MissionDef, operatives: OperativeDef[]): WorldApi {
  const rng = mulberry32(mission.seed)
  const city = generateCity(mission)

  const units: SimUnit[] = []
  const byId = new Map<string, SimUnit>()
  const tracers: Tracer[] = []
  const booms: Boom[] = []
  const shots: Vec2[] = []

  let started = false
  let kills = 0
  let casualties = 0
  let civiliansHit = 0
  let result: 'none' | 'won' | 'lost' = 'none'
  let resultAt = 0
  let outcomeSent = false
  let syncT = 0
  let alertLevel = 0
  let firstContact = false
  let lastOrderChatterT = -MOVE_CHATTER_GAP
  let lastFlavorT = -FLAVOR_GAP
  let activeObjective = 0
  const objectivesDone: boolean[] = mission.objectives.map(() => false)

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

  operatives.forEach((op, i) => {
    const w = squadWeapon(op.weapon, researched)
    const hp = op.maxHp + bonus.maxHp
    addUnit({
      id: 'a' + (i + 1),
      kind: 'agent',
      name: op.name,
      pos: snap(city.spawnAgents[i] ?? { x: city.size / 2, z: city.size - 6 }),
      heading: Math.PI,
      hp,
      maxHp: hp,
      speed: op.speed + bonus.speed,
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
    })
  })

  city.enemies.forEach((sp, i) => {
    const w = WEAPONS[sp.weapon]
    const hp = sp.hp ?? 60
    addUnit({
      id: 'e' + (i + 1),
      kind: 'enemy',
      name: sp.name ?? 'CORPSEC-' + pad2(i + 1),
      pos: snap(sp.pos),
      heading: rng() * Math.PI * 2,
      hp,
      maxHp: hp,
      speed: 4.2,
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
      repathT: 0,
      lastSeenT: -100,
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
    if (u.kind === 'enemy' && u.aiState !== 'combat') return u.speed * 0.6
    if (u.kind === 'civilian' && (u.fleeUntil ?? 0) > world.time) return u.speed * 1.5
    return u.speed
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
      if (a.stance === 'dead') continue
      for (let j = i + 1; j < n; j++) {
        const b = units[j]
        if (b.stance === 'dead') continue
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
    u.reloading = u.weapon.reload
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
    booms.push({ pos: { x: t.pos.x, z: t.pos.z }, t: world.time, r: 0.55, color: '#ff8352' })
    sfx.deathThud()
    if (t.kind === 'enemy') {
      if (by.kind === 'agent') kills += 1
      pushLog('SYS', 'Hostile neutralized.')
    } else if (t.kind === 'agent') {
      casualties += 1
      pushLog('SYS', 'AGENT DOWN. ' + t.name + ' flatlined.', 'alert')
    } else {
      pushLog('SYS', 'CIVILIAN DOWN. KILLED BY STRAY FIRE.', 'alert')
    }
  }

  function applyDamage(t: SimUnit, dmg: number, by: SimUnit): void {
    if (t.stance === 'dead') return
    // Collateral is counted per bystander struck, not per body: the client
    // charges for the wounded too, and one round rarely drops anyone. Full hp
    // marks the first round to reach them, so nobody is billed for twice.
    if (t.kind === 'civilian' && t.hp >= t.maxHp) {
      civiliansHit += 1
      pushLog('SYS', 'CIVILIAN HIT. COLLATERAL COUNT ' + civiliansHit + '.', 'alert')
    }
    t.hp -= by.kind === 'enemy' ? dmg * ENEMY_DMG_MUL : dmg
    if (t.kind === 'enemy') {
      t.lastSeenT = world.time
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
    let bestK = Infinity
    for (const o of units) {
      if (o === shooter || o === aimed || o.stance === 'dead') continue
      const ox = o.pos.x - from.x
      const oz = o.pos.z - from.z
      const k = (ox * dx + oz * dz) / len2
      if (k <= 0 || k >= 1 || k >= bestK) continue
      const px = ox - dx * k
      const pz = oz - dz * k
      if (px * px + pz * pz > STRAY_R * STRAY_R) continue
      best = o
      bestK = k
    }
    // Nearest on the line is also the first thing cover can hide, so a blocked
    // sight line means the round struck the wall rather than the body.
    if (best && !hasLos(city, from, best.pos)) return null
    return best
  }

  function tryFire(u: SimUnit, t: SimUnit, accMul: number): void {
    const w = u.weapon
    if (!w || u.reloading > 0 || u.cooldown > 0) return
    if (u.magazine <= 0) {
      startReload(u)
      return
    }
    u.cooldown = w.cooldown * (u.kind === 'enemy' ? ENEMY_CD_MUL : 1)
    u.magazine -= 1
    const d = dist(u.pos, t.pos)
    const chance = Math.min(0.95, Math.max(0.05, (0.78 - (d / w.range) * 0.28 + (rng() - 0.5) * 0.1) * accMul))
    const hit = rng() < chance
    const len = Math.max(d, 0.001)
    const nx = (t.pos.x - u.pos.x) / len
    const nz = (t.pos.z - u.pos.z) / len
    let tx = t.pos.x
    let tz = t.pos.z
    if (hit) {
      applyDamage(t, w.damage, u)
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
      const reach = Math.max(w.range, ml)
      const stray = strayVictim(u.pos, u.pos.x + (mx / ml) * reach, u.pos.z + (mz / ml) * reach, u, t)
      if (stray) {
        tx = stray.pos.x
        tz = stray.pos.z
        applyDamage(stray, w.damage, u)
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
    shots.push({ x: u.pos.x, z: u.pos.z })
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

  function enterCombat(e: SimUnit): void {
    if (e.stance === 'dead') return
    e.aiState = 'combat'
    e.alerted = true
    e.lastSeenT = world.time
    e.repathT = 0
    if (!firstContact) {
      firstContact = true
      pushLog('SYS', 'Threat level elevated.', 'alert')
      sfx.alertSting()
    }
  }

  function perceive(e: SimUnit): boolean {
    const v2 = ENEMY_VISION * ENEMY_VISION
    for (const a of units) {
      if (a.kind !== 'agent' || a.stance === 'dead') continue
      const dx = a.pos.x - e.pos.x
      const dz = a.pos.z - e.pos.z
      if (dx * dx + dz * dz <= v2 && hasLos(city, e.pos, a.pos)) return true
    }
    const p2 = PROPAGATE_R * PROPAGATE_R
    for (const o of units) {
      if (o.kind !== 'enemy' || o === e || o.stance === 'dead' || !o.alerted) continue
      const dx = o.pos.x - e.pos.x
      const dz = o.pos.z - e.pos.z
      if (dx * dx + dz * dz <= p2) return true
    }
    return false
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

  function combatStep(e: SimUnit, dt: number): void {
    const w = e.weapon
    const seeR = Math.max(ENEMY_VISION, w ? w.range : 0)
    let tgt: SimUnit | null = null
    let bestD = seeR
    for (const a of units) {
      if (a.kind !== 'agent' || a.stance === 'dead') continue
      const d = dist(e.pos, a.pos)
      if (d <= bestD && hasLos(city, e.pos, a.pos)) {
        tgt = a
        bestD = d
      }
    }
    if (tgt && w) {
      e.lastSeenT = world.time
      e.targetId = tgt.id
      if (bestD <= Math.max(1.5, w.range - 1)) {
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
      e.aiState = 'patrol'
      e.alerted = false
      e.path.length = 0
      e.stance = 'idle'
      e.repathT = 0
      return
    }
    // Lost sight recently: hunt toward the nearest living agent's position.
    let near: SimUnit | null = null
    let nd = Infinity
    for (const a of units) {
      if (a.kind !== 'agent' || a.stance === 'dead') continue
      const d = dist(e.pos, a.pos)
      if (d < nd) {
        nd = d
        near = a
      }
    }
    if (near && world.time >= (e.repathT ?? 0)) {
      e.repathT = world.time + ENEMY_REPATH
      e.path = findPath(city, e.pos, near.pos)
    }
    e.stance = e.path.length > 0 ? 'moving' : 'idle'
  }

  function updateEnemies(dt: number): void {
    for (const e of units) {
      if (e.kind !== 'enemy' || e.stance === 'dead') continue
      tickWeapon(e, dt)
      if (e.aiState !== 'combat') {
        let engaged = false
        if (world.time >= (e.senseT ?? 0)) {
          e.senseT = world.time + SENSE_INTERVAL
          if (perceive(e)) {
            enterCombat(e)
            engaged = true
          }
        }
        if (engaged) combatStep(e, dt)
        else patrolStep(e)
      } else {
        combatStep(e, dt)
      }
    }
  }

  function updateCivilians(): void {
    const flee2 = CIV_FLEE_R * CIV_FLEE_R
    for (const c of units) {
      if (c.kind !== 'civilian' || c.stance === 'dead') continue
      if (shots.length > 0) {
        for (const s of shots) {
          const dx = s.x - c.pos.x
          const dz = s.z - c.pos.z
          if (dx * dx + dz * dz <= flee2) {
            if ((c.fleeUntil ?? 0) <= world.time) {
              c.fleeFrom = { x: s.x, z: s.z }
              c.path.length = 0
            }
            c.fleeUntil = world.time + CIV_FLEE_T
            break
          }
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
  }

  function zoneFor(def: ObjectiveDef): { x: number; z: number; r: number } {
    return def.zone ?? city.checkpoint
  }

  function objectiveMet(def: ObjectiveDef): boolean {
    switch (def.kind) {
      case 'reach-zone': {
        const zone = zoneFor(def)
        const r2 = zone.r * zone.r
        return units.some((u) => {
          if (u.kind !== 'agent' || u.stance === 'dead') return false
          const dx = u.pos.x - zone.x
          const dz = u.pos.z - zone.z
          return dx * dx + dz * dz <= r2
        })
      }
      case 'eliminate-tag':
        return !units.some((u) => u.kind === 'enemy' && u.tag === def.tag && u.stance !== 'dead')
      case 'extract': {
        const alive = livingAgents()
        if (alive.length === 0) return false
        const zone = city.extraction
        const r2 = zone.r * zone.r
        return alive.every((u) => {
          const dx = u.pos.x - zone.x
          const dz = u.pos.z - zone.z
          return dx * dx + dz * dz <= r2
        })
      }
    }
  }

  function syncObjectives(): void {
    const rows: ObjectiveUi[] = mission.objectives.map((d, i) => ({
      id: d.id,
      label: d.label,
      done: objectivesDone[i] === true,
      active: i === activeObjective && objectivesDone[i] !== true,
    }))
    useMissionStore.getState().setObjectives(rows)
  }

  function updateObjectives(): void {
    if (activeObjective >= mission.objectives.length) return
    const def = mission.objectives[activeObjective]
    if (!objectiveMet(def)) return
    objectivesDone[activeObjective] = true
    activeObjective += 1
    sfx.objectiveChime()
    pushLog('SYS', 'OBJECTIVE COMPLETE: ' + def.label, 'ok')
    const next = mission.objectives[activeObjective]
    if (next) {
      if (next.kind === 'extract') {
        pushLog('SYS', 'Extraction window open. Return to the insertion zone.', 'ok')
      } else {
        pushLog('SYS', 'OBJECTIVE: ' + next.label)
      }
    }
    syncObjectives()
  }

  function setResultNow(r: 'won' | 'lost'): void {
    result = r
    resultAt = world.time
    useMissionStore.getState().setResult(r)
  }

  function checkEnd(): void {
    if (livingAgents().length === 0) {
      setResultNow('lost')
      pushLog('SYS', 'SQUAD ELIMINATED. UPLINK LOST.', 'alert')
      return
    }
    if (mission.objectives.length > 0 && activeObjective >= mission.objectives.length) {
      setResultNow('won')
      pushLog('SYS', 'MISSION COMPLETE. EXTRACTION CONFIRMED.', 'ok')
    }
  }

  function maybeOutcome(): void {
    if (result === 'none' || outcomeSent || world.time - resultAt < OUTCOME_DELAY) return
    outcomeSent = true
    useAppStore.getState().setOutcome({
      won: result === 'won',
      kills,
      casualties,
      timeSec: world.time,
      civiliansHit,
      reward: result === 'won' ? mission.reward : 0,
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
    }
  }

  function syncSquad(): void {
    const rows: SquadMemberUi[] = []
    for (const u of units) {
      if (u.kind !== 'agent') continue
      const op = u.operative
      if (!op) continue
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
        weaponName: u.weapon ? u.weapon.name : '-',
        sidearmName: WEAPONS[op.sidearm].name,
        holdGround: u.holdGround,
        holdFire: u.holdFire,
        dead: u.stance === 'dead',
      })
    }
    useMissionStore.getState().setSquad(rows)
  }

  function startup(): void {
    pushLog('SYS', 'SQUAD LINK ESTABLISHED. ' + livingAgents().length + ' ONLINE.')
    const first = mission.objectives[0]
    if (first) {
      if (first.kind === 'extract') {
        pushLog('SYS', 'Extraction window open. Return to the insertion zone.', 'ok')
      } else {
        pushLog('SYS', 'OBJECTIVE: ' + first.label)
      }
    }
    syncSquad()
    syncObjectives()
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
    shots.length = 0
    updateAgents(dt)
    updateEnemies(dt)
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
      updateObjectives()
      checkEnd()
    }
    updateAlert()
    maybeOutcome()
    syncT += dt
    if (syncT >= SYNC_INTERVAL) {
      syncT -= SYNC_INTERVAL
      syncSquad()
      useMissionStore.getState().setClock(clockStr())
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
    if (!t || t.kind !== 'enemy' || t.stance === 'dead') return
    const shooters = ordered(agentIds)
    if (shooters.length === 0) return
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

  function orderHoldFire(agentIds: string[], hold: boolean): void {
    const crew = ordered(agentIds)
    if (crew.length === 0) return
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

  const world: WorldApi = {
    city,
    mission,
    units,
    tracers,
    booms,
    time: 0,
    tick,
    orderMove,
    orderAttack,
    orderStop,
    orderHold,
    orderHoldFire,
    unit: (id: string) => byId.get(id),
  }

  return world
}
