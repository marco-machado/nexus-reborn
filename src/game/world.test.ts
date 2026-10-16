// Tests for the mission simulation. Everything is deterministic: mission.seed
// drives both the city generator and the in-world rng, and the tests drive
// tick() by hand, so no timers or real clocks are involved.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { MissionDef, ObjectiveDef, OperativeDef, Unit, Vec2, WorldApi, Zone } from './types'
import { ENEMY_VISION, isWalkable } from './types'
import { createWorld, hitChance } from './world'
import { clickSelection, openingSelection, selectAll, selectSlot } from './selection'
import { tickIfLive } from './frameTick'
import { headlessDeploy } from './deploy'
import type { DeployInputs } from './deploy'
import { DEFAULT_SQUAD, MISSIONS, OFFICER_RADIO_DELAY, ROSTER, WEAPONS, operativeById } from './data'
import { MEDIC_REGEN_CAP, ROLE_ABILITIES } from './abilities'
import { contractMission } from './contracts'
import type { ContractType, GeneratedContract } from './contracts'
import { DIFFICULTY_FX, missionMods, missionPeriod, weatherMul } from './missionParams'
import { findPath, hasLos, nearestWalkable } from './pathfind'
import { useMissionStore } from '../state/missionStore'
import { netPayout, settleOutcome, useAppStore } from '../state/appStore'
import { useResearchStore } from '../state/researchStore'
import { initialCampaignData, useCampaignStore } from '../state/campaignStore'
import { useWorldStore } from '../state/worldStore'
import { XP_HP_PER, XP_SPEED_PER } from './experience'
import { freezeDeploy } from '../state/deployFreeze'
import { nodeById } from './research'
import worldSrc from './world.ts?raw'

// Mirrors MAX_DT in world.ts.
const STEP = 0.05
const MISSION = MISSIONS[0]
// Same city and seed, but nothing to complete: ticking never ends the mission.
const BARE_MISSION: MissionDef = { ...MISSION, objectives: [] }

function ops(ids: string[]): OperativeDef[] {
  return ids.map(operativeById)
}

// Mirrors MissionScreen: the mission store is reset right after createWorld,
// then the mission goes live.
function deployReset(): void {
  const ms = useMissionStore.getState()
  ms.reset()
  ms.setLive(true)
}

// Advances roughly `seconds` of world time in whole MAX_DT frames.
function warm(w: WorldApi, seconds: number): void {
  const until = w.time + seconds
  while (w.time < until) w.tick(STEP)
}

// One render frame through the same gate WorldTicker uses (scene/GameCanvas.tsx).
function frame(w: WorldApi, dt: number): void {
  tickIfLive(w, useMissionStore.getState(), dt)
}

function dist(a: Vec2, b: Vec2): number {
  const dx = b.x - a.x
  const dz = b.z - a.z
  return Math.sqrt(dx * dx + dz * dz)
}

// Drives the sim until `cond` holds or `maxSec` of world time is spent.
// `drive` re-issues orders on a cadence, the way a player would keep clicking.
function runUntil(
  w: WorldApi,
  cond: () => boolean,
  maxSec: number,
  drive?: () => void,
  driveEvery = 1,
): boolean {
  const until = w.time + maxSec
  let nextDrive = -Infinity
  while (w.time < until) {
    if (cond()) return true
    if (drive && w.time >= nextDrive) {
      drive()
      nextDrive = w.time + driveEvery
    }
    w.tick(STEP)
  }
  return cond()
}

// The test is the composer here: it reads the stores the test arranged and
// hands createWorld an explicit freeze, as MissionScreen does at deploy.
function spawn(m: MissionDef, o: OperativeDef[], over: Partial<DeployInputs> = {}) {
  return createWorld(
    m,
    o,
    headlessDeploy(m, o, {
      done: useResearchStore.getState().done,
      roster: useCampaignStore.getState().roster,
      ...over,
    }),
  )
}

beforeEach(() => {
  useMissionStore.setState({
    live: false,
    paused: false,
    selected: [],
    squad: [],
    objectives: [],
    log: [],
    alert: 0,
    civiliansHit: 0,
    result: 'none',
    clock: '22:00:00',
    inventory: { med: 0, cell: 0 },
    abilities: {
      grenade: { availability: 'out-of-stock', cooldownRemaining: 0, cooldownDuration: 4 },
    },
    grenadeTargeting: false,
  })
  useAppStore.setState({
    phase: 'menu',
    missionId: null,
    squad: [...DEFAULT_SQUAD],
    credits: 128450,
    outcome: null,
    deploySerial: 0,
    lastAppliedKey: 0,
  })
  useResearchStore.setState({
    done: [],
    labs: { ballistics: null, cybernetics: null, control: null },
  })
  useCampaignStore.setState(initialCampaignData())
})

describe('createWorld', () => {
  it('returns a working WorldApi with one agent per operative def', () => {
    const squadOps = ops(DEFAULT_SQUAD)
    const w = spawn(MISSION, squadOps)

    expect(w.time).toBe(0)
    expect(w.weather).toBe('heavy')
    expect(w.mission).toBe(MISSION)
    expect(w.city.size).toBeGreaterThan(0)
    expect(w.tracers).toEqual([])
    expect(w.booms).toEqual([])

    const agents = w.units.filter((u) => u.kind === 'agent')
    expect(agents.map((a) => a.id)).toEqual(['a1', 'a2', 'a3', 'a4'])
    agents.forEach((a, i) => {
      const op = squadOps[i]
      expect(a.name).toBe(op.name)
      expect(a.agentSlot).toBe(i + 1)
      expect(a.operative).toBe(op)
      expect(a.hp).toBe(op.maxHp)
      expect(a.maxHp).toBe(op.maxHp)
      // The default squad sits under LIGHT_MASS_KG, so every operative gets
      // the light-load speed bonus.
      expect(a.speed).toBeCloseTo(op.speed + 0.15, 10)
      expect(a.weapon?.id).toBe(op.weapon)
      expect(a.magazine).toBe(WEAPONS[op.weapon].magazine)
      expect(a.pos).toEqual(w.city.spawnAgents[i])
      expect(a.stance).toBe('idle')
      expect(a.holdGround).toBe(false)
      expect(a.holdFire).toBe(false)
      expect(w.unit(a.id)).toBe(a)
    })
  })

  it('spawns only the operatives passed in', () => {
    const w = spawn(MISSION, ops(['op2', 'op5']))
    const agents = w.units.filter((u) => u.kind === 'agent')
    expect(agents.map((a) => a.name)).toEqual(['L. FERNANDEZ', 'A. OKAFOR'])
    expect(w.unit('a2')).toBeDefined()
    expect(w.unit('a3')).toBeUndefined()
  })

  it('spawns the enemies and civilians the city defines, all on patrol', () => {
    const w = spawn(MISSION, ops(['op1']))
    const enemies = w.units.filter((u) => u.kind === 'enemy')
    const civilians = w.units.filter((u) => u.kind === 'civilian')
    expect(w.city.enemies.length).toBeGreaterThan(0)
    expect(w.city.civilians.length).toBeGreaterThan(0)
    expect(enemies).toHaveLength(w.city.enemies.length)
    expect(civilians).toHaveLength(w.city.civilians.length)
    for (const e of enemies) {
      expect(e.aiState).toBe('patrol')
      expect(e.alerted).toBe(false)
    }
  })
})

describe('tick', () => {
  it('advances at most one MAX_DT step per frame during the first world second', () => {
    const w = spawn(BARE_MISSION, ops(['op1']))
    w.tick(2)
    expect(w.time).toBeCloseTo(0.05, 10)
    w.tick(3)
    expect(w.time).toBeCloseTo(0.1, 10)
    w.tick(0.016)
    expect(w.time).toBeCloseTo(0.116, 10)
  })

  it('clamps a huge delta to MAX_CATCHUP once the mission is underway', () => {
    const w = spawn(BARE_MISSION, ops(['op1']))
    warm(w, 1.2)
    const t0 = w.time
    w.tick(60)
    expect(w.time - t0).toBeCloseTo(5, 9)
  })

  it('consumes the whole delta in MAX_DT steps instead of dropping the remainder', () => {
    const w = spawn(BARE_MISSION, ops(['op1']))
    warm(w, 1.2)
    let t0 = w.time
    w.tick(0.07)
    expect(w.time - t0).toBeCloseTo(0.07, 9)
    t0 = w.time
    w.tick(0.13)
    expect(w.time - t0).toBeCloseTo(0.13, 9)
  })

  it('ignores non-finite and non-positive deltas without touching the store', () => {
    const w = spawn(BARE_MISSION, ops(['op1']))
    deployReset()
    w.tick(Number.NaN)
    w.tick(Infinity)
    w.tick(-3)
    w.tick(0)
    expect(w.time).toBe(0)
    expect(useMissionStore.getState().log).toHaveLength(0)
    expect(useMissionStore.getState().squad).toHaveLength(0)
    w.tick(STEP)
    expect(w.time).toBeCloseTo(STEP, 10)
    expect(useMissionStore.getState().squad).toHaveLength(1)
  })
})

describe('weather front', () => {
  it('retunes sight and logs when the scripted front hits', () => {
    const w = spawn(MISSION, ops(['op1']))
    deployReset()
    const opening = w.vision
    expect(w.weather).toBe('heavy')
    warm(w, 149.9)
    expect(w.weather).toBe('heavy')
    expect(w.vision).toBe(opening)
    warm(w, 0.2)
    expect(w.weather).toBe('light')
    expect(w.vision).toBeGreaterThan(opening)
    expect(useMissionStore.getState().weather).toBe('light')
    expect(useMissionStore.getState().log.some((e) => e.msg.includes('WEATHER FRONT'))).toBe(true)
  })
})

describe('store sync', () => {
  it('defers every store write to the first tick, which populates the HUD', () => {
    const squadOps = ops(DEFAULT_SQUAD)
    const w = spawn(MISSION, squadOps)
    deployReset()

    const before = useMissionStore.getState()
    expect(before.squad).toEqual([])
    expect(before.objectives).toEqual([])
    expect(before.log).toEqual([])
    expect(before.clock).toBe('22:00:00')

    w.tick(0.016)

    const s = useMissionStore.getState()
    expect(s.squad.map((r) => r.unitId)).toEqual(['a1', 'a2', 'a3', 'a4'])
    expect(s.squad.map((r) => r.name)).toEqual(squadOps.map((o) => o.name))
    expect(s.squad[0].hp).toBe(squadOps[0].maxHp)
    expect(s.squad[0].codename).toBe(squadOps[0].codename)
    expect(s.objectives.map((o) => o.id)).toEqual(MISSION.objectives.map((o) => o.id))
    expect(s.objectives[0].active).toBe(true)
    expect(s.objectives.every((o) => !o.done)).toBe(true)
    expect(s.log[0].msg).toBe('SQUAD LINK ESTABLISHED. 4 ONLINE.')
    expect(s.log[0].t).toBe('22:14:08')
    expect(s.log[1].msg).toBe('OBJECTIVE: ' + MISSION.objectives[0].label)
    expect(s.clock).toBe('22:14:08')
    expect(s.inventory).toEqual({ med: 2, cell: 1 })
    expect(s.abilities.grenade.availability).toBe('usable')
  })

  it('pushes fresh squad rows only every SYNC_INTERVAL of world time', () => {
    const w = spawn(BARE_MISSION, ops(['op1']))
    deployReset()
    w.tick(STEP)
    const ref = useMissionStore.getState().squad
    expect(ref).toHaveLength(1)
    w.tick(STEP)
    w.tick(STEP)
    // 0.15s since the startup sync: under SYNC_INTERVAL, same rows object.
    expect(useMissionStore.getState().squad).toBe(ref)
    w.tick(STEP)
    w.tick(STEP)
    // 0.25s: the interval elapsed, the sim pushed a fresh array.
    expect(useMissionStore.getState().squad).not.toBe(ref)
  })

  it('advances the HUD clock with mission time', () => {
    const w = spawn(BARE_MISSION, ops(['op1']))
    deployReset()
    for (let i = 0; i < 30; i++) w.tick(STEP)
    // 1.5s of world time on top of the 22:14:08 base.
    expect(useMissionStore.getState().clock).toBe('22:14:09')
  })

  it('opens the HUD clock at the mission Opening hour', () => {
    const dusk = { ...BARE_MISSION, openingHour: 18 * 3600 + 14 * 60 + 8 }
    const w = spawn(dusk, ops(['op1']))
    deployReset()
    w.tick(STEP)
    expect(useMissionStore.getState().clock).toBe('18:14:08')
    expect(useMissionStore.getState().log[0].t).toBe('18:14:08')
  })

  it('reports role-based inventory bonuses after the first tick', () => {
    // medic +2 med, support +1 med, tech +1 cell on top of the base 2/1.
    const w = spawn(BARE_MISSION, ops(['op8', 'op7', 'op6']))
    deployReset()
    w.tick(STEP)
    expect(useMissionStore.getState().inventory).toEqual({ med: 5, cell: 2 })
  })

  it('adds loadout items from deployed operatives to the mission pools', () => {
    const w = spawn(BARE_MISSION, ops(['op8', 'op7', 'op6']), {
      loadout: {
        op8: ['med', 'med'],
        op6: ['cell', null],
        // Not deployed: contributes nothing.
        op1: ['med', 'cell'],
      },
    })
    deployReset()
    w.tick(STEP)
    expect(useMissionStore.getState().inventory).toEqual({ med: 7, cell: 3 })
  })

  it('drops the light-load speed bonus once loadout mass crosses the tier line', () => {
    // The default squad weighs 286.1 kg; eight med kits push it to 350.1,
    // over LIGHT_MASS_KG and under HEAVY_MASS_KG: the standard tier.
    const squadOps = ops(DEFAULT_SQUAD)
    const w = spawn(BARE_MISSION, squadOps, {
      loadout: {
        op1: ['med', 'med'],
        op2: ['med', 'med'],
        op3: ['med', 'med'],
        op4: ['med', 'med'],
      },
    })
    const a1 = w.unit('a1')
    expect(a1?.speed).toBeCloseTo(squadOps[0].speed, 10)
  })

  it('slows the squad when research armor and full loadouts go heavy', () => {
    // Worn chest weave (+22) and leg hardening (+16) add 9.5 kg per operative:
    // 286.1 + 64 of items + 38 = 388.1 kg, over HEAVY_MASS_KG.
    useResearchStore.setState({ done: ['c-weave', 'k-hardening'] })
    const squadOps = ops(DEFAULT_SQUAD)
    const w = spawn(BARE_MISSION, squadOps, {
      loadout: {
        op1: ['med', 'med'],
        op2: ['med', 'med'],
        op3: ['med', 'med'],
        op4: ['med', 'med'],
      },
    })
    const a1 = w.unit('a1')
    expect(a1?.speed).toBeCloseTo(squadOps[0].speed - 0.15, 10)
  })
})

describe('research', () => {
  it('applies completed research at deployment and ignores later changes', () => {
    useResearchStore.setState({ done: ['c-pain', 'c-accelerator', 'b-propellants'] })
    const base = operativeById('op1')
    const w = spawn(BARE_MISSION, [base])
    const a1 = w.unit('a1')
    expect(a1).toBeDefined()
    expect(a1?.maxHp).toBe(base.maxHp + 14)
    expect(a1?.hp).toBe(base.maxHp + 14)
    // Worn neural speed plus the light-load mass bonus for a lone operative.
    expect(a1?.speed).toBeCloseTo(base.speed + 0.15 + 0.15, 10)
    // Research first, then the assault role passive (x1.1) on top.
    expect(a1?.weapon?.damage).toBeCloseTo(WEAPONS.assault.damage * 1.12 * 1.1, 10)

    // Research completed after deployment never reaches a running mission.
    useResearchStore.setState({ done: [] })
    warm(w, 0.5)
    expect(a1?.maxHp).toBe(base.maxHp + 14)
    expect(a1?.weapon?.damage).toBeCloseTo(WEAPONS.assault.damage * 1.12 * 1.1, 10)
  })

  it('reads the research store fresh for each new world', () => {
    useResearchStore.setState({ done: ['c-pain'] })
    const base = operativeById('op1')
    const boosted = spawn(BARE_MISSION, [base])
    expect(boosted.unit('a1')?.maxHp).toBe(base.maxHp + 14)

    useResearchStore.setState({ done: [] })
    const plain = spawn(BARE_MISSION, [base])
    expect(plain.unit('a1')?.maxHp).toBe(base.maxHp)
    // No research leaves only the assault role passive on the weapon.
    expect(plain.unit('a1')?.weapon?.damage).toBeCloseTo(WEAPONS.assault.damage * 1.1, 10)
  })

  it('applies survivor experience at the next deployment snapshot', () => {
    useCampaignStore.getState().reportMission(
      MISSION.id,
      settleOutcome({
        applyKey: 1,
        won: true,
        kills: 1,
        casualties: 0,
        timeSec: 10,
        civiliansHit: 0,
        reward: 85000,
        bonus: 0,
        deadIds: [],
        survivorHp: { op1: 1 },
        quietReplay: false,
      }),
      0,
    )
    expect(useCampaignStore.getState().roster.op1.xp).toBe(1)
    const base = operativeById('op1')
    const w = spawn(BARE_MISSION, [base])
    const a1 = w.unit('a1')
    expect(a1?.maxHp).toBe(base.maxHp + XP_HP_PER)
    expect(a1?.speed).toBeCloseTo(base.speed + 0.15 + XP_SPEED_PER, 10)
  })
})

describe('determinism', () => {
  it('two worlds from the same seed and order script agree exactly', () => {
    const script = (w: WorldApi): void => {
      for (let i = 0; i < 24; i++) w.tick(STEP)
      w.orderMove(['a1', 'a2', 'a3', 'a4'], { x: 44.5, z: 74.5 })
      for (let i = 0; i < 66; i++) w.tick(STEP)
    }
    const snapshot = (w: WorldApi) =>
      w.units.map((u) => ({
        id: u.id,
        x: u.pos.x,
        z: u.pos.z,
        heading: u.heading,
        hp: u.hp,
        stance: u.stance,
      }))

    const a = spawn(MISSION, ops(DEFAULT_SQUAD))
    script(a)
    const b = spawn(MISSION, ops(DEFAULT_SQUAD))
    script(b)

    expect(b.time).toBe(a.time)
    expect(snapshot(b)).toEqual(snapshot(a))
  })
})

describe('determinism with a body on the fire lane', () => {
  it('two runs from the same seed hit the same bodies the same way', () => {
    const run = () => {
      const w = spawn(BARE_MISSION, ops(['op1']))
      deployReset()
      warm(w, 1.2)
      const a1 = w.unit('a1')!
      const enemy = w.units.find((u) => u.kind === 'enemy')!
      for (const u of w.units) if (u.kind === 'enemy' && u !== enemy) u.stance = 'dead'
      enemy.pos.x = a1.pos.x
      enemy.pos.z = a1.pos.z - 4
      enemy.path.length = 0
      enemy.patrol!.length = 0
      enemy.holdGround = true
      enemy.reloading = 999
      enemy.hp = 100000
      enemy.maxHp = 100000
      const civ = w.units.find((u) => u.kind === 'civilian')!
      civ.pos.x = a1.pos.x
      civ.pos.z = a1.pos.z - 2
      civ.path.length = 0
      civ.holdGround = true
      civ.hp = 100000
      civ.maxHp = 100000
      // Ordinary rolled shots, no Deadeye: hits and misses both draw rng().
      w.orderAttack(['a1'], enemy.id)
      warm(w, 6)
      return {
        time: w.time,
        civHp: civ.hp,
        enemyHp: enemy.hp,
        hit: useMissionStore.getState().civiliansHit,
        units: w.units.map((u) => ({ id: u.id, x: u.pos.x, z: u.pos.z, hp: u.hp, stance: u.stance })),
      }
    }

    const a = run()
    const b = run()
    // The lane was exercised: the civilian took rounds meant for the target.
    expect(a.civHp).toBeLessThan(100000)
    expect(b).toEqual(a)
  })
})

describe('orders', () => {
  it('routes a unit toward an ordered move target over ticks', () => {
    const w = spawn(BARE_MISSION, ops(['op1']))
    deployReset()
    w.tick(STEP)
    const a1 = w.unit('a1')
    expect(a1).toBeDefined()
    if (!a1) return
    const dest = { x: a1.pos.x, z: a1.pos.z - 4 }
    const d0 = dist(a1.pos, dest)
    expect(d0).toBeCloseTo(4, 10)

    w.orderMove(['a1'], dest)
    expect(a1.stance).toBe('moving')
    expect(a1.path.length).toBeGreaterThan(0)

    warm(w, 0.5)
    const dMid = dist(a1.pos, dest)
    expect(dMid).toBeLessThan(d0)

    warm(w, 2.5)
    expect(dist(a1.pos, dest)).toBeLessThan(0.5)
  })

  it('stop cancels the route and the unit stays put', () => {
    const w = spawn(BARE_MISSION, ops(['op1']))
    deployReset()
    w.tick(STEP)
    const a1 = w.unit('a1')
    expect(a1).toBeDefined()
    if (!a1) return
    w.orderMove(['a1'], { x: a1.pos.x, z: a1.pos.z - 6 })
    warm(w, 0.5)
    expect(a1.stance).toBe('moving')

    w.orderStop(['a1'])
    expect(a1.path).toHaveLength(0)
    expect(a1.stance).toBe('idle')
    const held = { x: a1.pos.x, z: a1.pos.z }
    warm(w, 1)
    // Crowd separation may nudge the agent, but with no route it stays near
    // the stop point instead of covering the ~4.6m a second of walking would.
    expect(a1.path).toHaveLength(0)
    expect(dist(a1.pos, held)).toBeLessThan(0.5)
  })

  it('gates the grenade on the live flag, range and stock', () => {
    const w = spawn(BARE_MISSION, ops(['op1']))
    deployReset()
    w.tick(STEP)
    const a1 = w.unit('a1')
    expect(a1).toBeDefined()
    if (!a1) return
    const here = { x: a1.pos.x, z: a1.pos.z }

    // Not live: no ability fires.
    useMissionStore.getState().setLive(false)
    expect(w.orderGrenade('a1', here)).toBe(false)
    useMissionStore.getState().setLive(true)

    // Beyond GRENADE_RANGE: rejected without spending the cell.
    expect(w.orderGrenade('a1', { x: here.x, z: here.z - 30 })).toBe(false)
    expect(a1.hp).toBe(a1.maxHp)

    // On target: spends the cell and hurts whoever stands at the blast centre.
    expect(w.orderGrenade('a1', here)).toBe(true)
    expect(a1.hp).toBeCloseTo(a1.maxHp - 70, 10)

    // Stock is gone (and the cooldown running): the next throw is refused.
    expect(w.orderGrenade('a1', here)).toBe(false)

    warm(w, 0.25)
    expect(useMissionStore.getState().inventory.cell).toBe(0)
  })

  it('heals the most wounded selected operative with a med kit while stock lasts', () => {
    const w = spawn(BARE_MISSION, ops(['op1', 'op2']))
    deployReset()
    w.tick(STEP)
    const a1 = w.unit('a1')
    const a2 = w.unit('a2')
    expect(a1).toBeDefined()
    expect(a2).toBeDefined()
    if (!a1 || !a2) return

    // Nobody wounded: refused with a comm fail line, nothing spent.
    expect(w.orderUseMed(['a1', 'a2'])).toBe(false)
    const log = useMissionStore.getState().log
    expect(log[log.length - 1].msg).toBe('MED KIT: NO WOUNDED OPERATIVE SELECTED.')

    // The kit lands on the worse-off of the two, +50 HP.
    a1.hp -= 20
    a2.hp -= 60
    expect(w.orderUseMed(['a1', 'a2'])).toBe(true)
    expect(a2.hp).toBeCloseTo(a2.maxHp - 10, 10)
    expect(a1.hp).toBeCloseTo(a1.maxHp - 20, 10)

    // The heal caps at the missing health.
    expect(w.orderUseMed(['a2'])).toBe(true)
    expect(a2.hp).toBeCloseTo(a2.maxHp, 10)

    // Base stock is 2 med: the third kit is out of stock, refused silently.
    a1.hp -= 10
    const lines = useMissionStore.getState().log.length
    expect(w.orderUseMed(['a1'])).toBe(false)
    expect(useMissionStore.getState().log).toHaveLength(lines)
    warm(w, 0.25)
    expect(useMissionStore.getState().inventory.med).toBe(0)
  })

  it('finishes a running ability cooldown with a power cell', () => {
    const w = spawn(BARE_MISSION, ops(['op1']))
    deployReset()
    w.tick(STEP)
    const a1 = w.unit('a1')
    expect(a1).toBeDefined()
    if (!a1) return

    // No cooldown running: refused with a comm fail line, nothing spent.
    expect(w.orderUseCell(['a1'])).toBe(false)
    const log = useMissionStore.getState().log
    expect(log[log.length - 1].msg).toBe('POWER CELL: NO ABILITY COOLDOWN RUNNING.')

    // Overdrive charges its cooldown; the cell wipes it at once.
    w.orderAbility(['a1'])
    expect(a1.abilityReadyAt ?? 0).toBeGreaterThan(w.time)
    expect(w.orderUseCell(['a1'])).toBe(true)
    expect(a1.abilityReadyAt).toBe(w.time)

    // Base stock is 1 cell: the second cell is out of stock, refused silently.
    warm(w, ROLE_ABILITIES.assault.active.duration + 0.2)
    w.orderAbility(['a1'])
    expect(a1.abilityReadyAt ?? 0).toBeGreaterThan(w.time)
    expect(w.orderUseCell(['a1'])).toBe(false)
    expect(a1.abilityReadyAt ?? 0).toBeGreaterThan(w.time)
    warm(w, 0.25)
    expect(useMissionStore.getState().inventory.cell).toBe(0)
  })

  it('hold ground parks the route on the spot and resumes it on release', () => {
    const w = spawn(BARE_MISSION, ops(['op1']))
    deployReset()
    w.tick(STEP)
    const a1 = w.unit('a1')
    expect(a1).toBeDefined()
    if (!a1) return
    const dest = { x: a1.pos.x, z: a1.pos.z - 8 }
    w.orderMove(['a1'], dest)
    warm(w, 0.5)
    expect(a1.stance).toBe('moving')

    w.orderHold(['a1'], true)
    expect(a1.holdGround).toBe(true)
    expect(a1.path).toHaveLength(0)
    const held = { x: a1.pos.x, z: a1.pos.z }
    warm(w, 1)
    // A held agent is immovable: neither routing nor separation shifts it.
    expect(a1.pos.x).toBe(held.x)
    expect(a1.pos.z).toBe(held.z)
    expect(useMissionStore.getState().squad.find((r) => r.unitId === 'a1')?.holdGround).toBe(true)

    w.orderHold(['a1'], false)
    expect(a1.holdGround).toBe(false)
    expect(a1.path.length).toBeGreaterThan(0)
    warm(w, 3)
    expect(dist(a1.pos, dest)).toBeLessThan(0.5)
  })

  it('ignores orders naming unknown units or invalid targets', () => {
    const w = spawn(BARE_MISSION, ops(['op1']))
    deployReset()
    w.tick(STEP)
    expect(() => w.orderMove(['zz'], { x: 48, z: 80 })).not.toThrow()
    expect(() => w.orderAttack(['a1'], 'zz')).not.toThrow()
    expect(w.unit('a1')?.targetId).toBeNull()
    expect(w.unit('zz')).toBeUndefined()
  })

  // TM-002: dead ids, empty selection, and Attack on a Device are no-ops.
  // `kill` marks a known operative dead in place, so the id still resolves.
  function kill(w: WorldApi, id: string): void {
    const u = w.unit(id)!
    u.hp = 0
    u.stance = 'dead'
  }

  function orderState(w: WorldApi) {
    return w.units.map((u) => ({
      id: u.id,
      stance: u.stance,
      path: u.path.map((p) => ({ x: p.x, z: p.z })),
      targetId: u.targetId,
      holdGround: u.holdGround,
      abilityReadyAt: u.abilityReadyAt,
      abilityUntil: u.abilityUntil,
    }))
  }

  it('a Move or Attack naming a dead operative changes nothing on it (AC 1c)', () => {
    const w = spawn(BARE_MISSION, ops(DEFAULT_SQUAD))
    deployReset()
    w.tick(STEP)
    const enemy = w.units.find((u) => u.kind === 'enemy' && u.stance !== 'dead')!
    kill(w, 'a1')
    const a1 = w.unit('a1')!
    const before = orderState(w).find((s) => s.id === 'a1')

    w.orderMove(['a1'], { x: 48, z: 80 })
    w.orderAttack(['a1'], enemy.id)
    w.orderAbility(['a1'])

    expect(a1.stance).toBe('dead')
    expect(a1.path).toHaveLength(0)
    expect(a1.targetId).toBeNull()
    expect(orderState(w).find((s) => s.id === 'a1')).toEqual(before)
  })

  it('a Move naming one dead and one living id moves only the living one (AC 1c)', () => {
    const w = spawn(BARE_MISSION, ops(DEFAULT_SQUAD))
    deployReset()
    w.tick(STEP)
    kill(w, 'a1')

    w.orderMove(['a1', 'a2'], { x: 48, z: 80 })

    expect(w.unit('a1')!.path).toHaveLength(0)
    expect(w.unit('a1')!.stance).toBe('dead')
    expect(w.unit('a2')!.path.length).toBeGreaterThan(0)
    expect(w.unit('a2')!.stance).toBe('moving')
  })

  it('Move, Attack and Q with an empty selection change no unit (AC 1e)', () => {
    const w = spawn(BARE_MISSION, ops(DEFAULT_SQUAD))
    deployReset()
    w.tick(STEP)
    const enemy = w.units.find((u) => u.kind === 'enemy' && u.stance !== 'dead')!
    const before = orderState(w)

    w.orderMove([], { x: 48, z: 80 })
    w.orderAttack([], enemy.id)
    w.orderAbility([])

    expect(orderState(w)).toEqual(before)
    for (const u of w.units) if (u.kind === 'agent') expect(u.targetId).toBeNull()
  })

  it('a grenade with no living thrower spends no cell (AC 1e edge case)', () => {
    const w = spawn(BARE_MISSION, ops(DEFAULT_SQUAD))
    deployReset()
    w.tick(STEP)
    kill(w, 'a1')
    const a2 = w.unit('a2')!
    const at = { x: a2.pos.x, z: a2.pos.z }

    expect(w.orderGrenade('', at)).toBe(false)
    expect(w.orderGrenade('a1', at)).toBe(false)
    // The cell is still there: a living thrower can spend it.
    expect(w.orderGrenade('a2', at)).toBe(true)
  })

  it('Attack on a Device sets no Explicit target (AC 5d)', () => {
    const w = spawn(MISSIONS[2], ops(DEFAULT_SQUAD))
    deployReset()
    w.tick(STEP)
    const device = w.units.find((u) => u.kind === 'device' && u.stance !== 'dead')
    const a1 = w.unit('a1')!
    expect(device).toBeDefined()
    if (!device) return

    w.orderAttack(['a1'], device.id)

    expect(a1.targetId).toBeNull()
  })
})

describe('weapon swap', () => {
  it('deploys with the sidearm stowed, its own full magazine ready', () => {
    const op = operativeById('op1')
    const w = spawn(BARE_MISSION, [op])
    const a1 = w.unit('a1')
    expect(a1).toBeDefined()
    if (!a1) return
    expect(a1.activeSlot).toBe('primary')
    expect(a1.weapon?.id).toBe(op.weapon)
    expect(a1.stowedWeapon?.id).toBe(op.sidearm)
    expect(a1.stowedMagazine).toBe(WEAPONS[op.sidearm].magazine)
  })

  it('swaps to the sidearm and holds fire until the readiness delay passes', () => {
    const w = spawn(BARE_MISSION, ops(['op1']))
    deployReset()
    warm(w, 1.2)
    const a1 = w.unit('a1')
    const enemy = w.units.find((u) => u.kind === 'enemy')
    expect(a1).toBeDefined()
    expect(enemy).toBeDefined()
    if (!a1 || !enemy) return

    w.orderSwapWeapon(['a1'])
    expect(a1.activeSlot).toBe('sidearm')
    expect(a1.weapon?.id).toBe('pistol')
    expect(a1.magazine).toBe(WEAPONS.pistol.magazine)
    expect(useMissionStore.getState().squad[0].activeSlot).toBe('sidearm')
    expect(useMissionStore.getState().squad[0].weaponName).toBe(WEAPONS.pistol.name)

    // Park a muzzled enemy in pistol range with clear sight.
    enemy.pos.x = a1.pos.x
    enemy.pos.z = a1.pos.z - 2
    enemy.path.length = 0
    enemy.reloading = 999
    w.orderAttack(['a1'], enemy.id)

    // Inside SWAP_DELAY: the drawn pistol has not come up, no shot lands.
    warm(w, 0.3)
    expect(a1.magazine).toBe(WEAPONS.pistol.magazine)
    expect(enemy.hp).toBe(enemy.maxHp)

    // Past the delay the pistol fires on the standing order.
    warm(w, 1.5)
    expect(a1.magazine).toBeLessThan(WEAPONS.pistol.magazine)
  })

  it('keeps per-slot magazines across swaps and cancels the stowed reload', () => {
    const w = spawn(BARE_MISSION, ops(['op1']))
    deployReset()
    w.tick(STEP)
    const a1 = w.unit('a1')
    expect(a1).toBeDefined()
    if (!a1) return

    // A part-spent primary mid-reload goes away as-is: the reload dies, the
    // round count survives.
    a1.magazine = 7
    a1.reloading = 1.0
    w.orderSwapWeapon(['a1'])
    expect(a1.weapon?.id).toBe('pistol')
    expect(a1.reloading).toBe(0)
    expect(a1.magazine).toBe(WEAPONS.pistol.magazine)
    expect(a1.stowedMagazine).toBe(7)

    // Spend the sidearm, swap back: the primary returns with its 7 rounds and
    // no reload running, the sidearm parks at 3.
    a1.magazine = 3
    w.orderSwapWeapon(['a1'])
    expect(a1.weapon?.id).toBe('assault')
    expect(a1.magazine).toBe(7)
    expect(a1.reloading).toBe(0)
    expect(a1.stowedMagazine).toBe(3)

    w.orderSwapWeapon(['a1'])
    expect(a1.weapon?.id).toBe('pistol')
    expect(a1.magazine).toBe(3)
  })

  it('applies completed weapon research to the sidearm exactly as to the primary', () => {
    // b-caseless: all weapons reload x0.88. b-sabot: all weapons damage x1.15.
    useResearchStore.setState({ done: ['b-caseless', 'b-sabot'] })
    const w = spawn(BARE_MISSION, ops(['op1']))
    deployReset()
    w.tick(STEP)
    const a1 = w.unit('a1')
    expect(a1).toBeDefined()
    if (!a1) return
    // op1 is assault, so the role passive (x1.1 damage) rides on both slots.
    expect(a1.stowedWeapon?.reload).toBeCloseTo(WEAPONS.pistol.reload * 0.88, 10)
    expect(a1.stowedWeapon?.damage).toBeCloseTo(WEAPONS.pistol.damage * 1.15 * 1.1, 10)
    w.orderSwapWeapon(['a1'])
    expect(a1.weapon?.reload).toBeCloseTo(WEAPONS.pistol.reload * 0.88, 10)
    expect(a1.weapon?.damage).toBeCloseTo(WEAPONS.pistol.damage * 1.15 * 1.1, 10)
    expect(a1.stowedWeapon?.damage).toBeCloseTo(WEAPONS.assault.damage * 1.15 * 1.1, 10)
  })
})

describe('role abilities', () => {
  function killEnemies(w: WorldApi): void {
    for (const u of w.units) if (u.kind === 'enemy') u.stance = 'dead'
  }

  // Parks one live enemy near the first agent with the rest of the garrison
  // dead: pinned in place, patrol cleared, unable to fire while `muzzled`.
  function isolateEnemy(w: WorldApi, at: Vec2, muzzled: boolean) {
    const enemy = w.units.find((u) => u.kind === 'enemy')!
    for (const u of w.units) if (u.kind === 'enemy' && u !== enemy) u.stance = 'dead'
    enemy.pos.x = at.x
    enemy.pos.z = at.z
    enemy.path.length = 0
    enemy.patrol!.length = 0
    enemy.holdGround = true
    if (muzzled) enemy.reloading = 999
    return enemy
  }

  it('applies the assault and sniper weapon passives to both slots at deployment', () => {
    const w = spawn(BARE_MISSION, ops(['op1', 'op5']))
    expect(w.unit('a1')?.weapon?.damage).toBeCloseTo(WEAPONS.assault.damage * 1.1, 10)
    expect(w.unit('a1')?.stowedWeapon?.damage).toBeCloseTo(WEAPONS.pistol.damage * 1.1, 10)
    expect(w.unit('a2')?.weapon?.range).toBeCloseTo(WEAPONS.longrifle.range * 1.15, 10)
    expect(w.unit('a2')?.stowedWeapon?.range).toBeCloseTo(WEAPONS.pistol.range * 1.15, 10)
  })

  it('overdrive halves the fire delay and expires after its duration', () => {
    const w = spawn(BARE_MISSION, ops(['op1']))
    deployReset()
    warm(w, 1.2)
    const a1 = w.unit('a1')!
    const enemy = isolateEnemy(w, { x: a1.pos.x, z: a1.pos.z - 2 }, true)
    enemy.hp = 100000
    enemy.maxHp = 100000

    w.orderAbility(['a1'])
    expect(a1.abilityUntil ?? 0).toBeGreaterThan(w.time)
    expect(a1.abilityReadyAt).toBeCloseTo(w.time + ROLE_ABILITIES.assault.active.cooldown, 5)

    w.orderAttack(['a1'], enemy.id)
    const before = a1.magazine
    let guard = 0
    while (a1.magazine === before && guard++ < 100) w.tick(STEP)
    // The shot just fired charged half the stock delay.
    expect(a1.cooldown).toBeCloseTo(WEAPONS.assault.cooldown * 0.5, 5)

    // Past the duration the effect is gone and the delay is back to stock.
    warm(w, 6.5)
    expect(a1.abilityUntil).toBe(0)
    const tAfter = w.time
    guard = 0
    while ((a1.lastFireT ?? 0) <= tAfter && guard++ < 400) w.tick(STEP)
    expect(a1.cooldown).toBeCloseTo(WEAPONS.assault.cooldown, 5)
  })

  it('frag charge blasts the cluster after its fuse: enemy and civilian both pay', () => {
    const w = spawn(BARE_MISSION, ops(['op4']))
    deployReset()
    w.tick(STEP)
    const a1 = w.unit('a1')!
    w.orderHoldFire(['a1'], true)
    const enemy = isolateEnemy(w, { x: a1.pos.x, z: a1.pos.z - 6 }, true)
    enemy.hp = 200
    enemy.maxHp = 200
    const civ = w.units.find((u) => u.kind === 'civilian')!
    civ.pos.x = enemy.pos.x
    civ.pos.z = enemy.pos.z
    civ.path.length = 0
    civ.holdGround = true

    w.orderAbility(['a1'])
    expect(a1.abilityReadyAt ?? 0).toBeGreaterThan(w.time)
    // The fuse is still burning: nothing hurt yet.
    w.tick(STEP)
    expect(enemy.hp).toBe(200)

    warm(w, 1.2)
    expect(enemy.hp).toBeCloseTo(200 - ROLE_ABILITIES.demolitions.active.magnitude, 5)
    expect(civ.stance).toBe('dead')
    const log = useMissionStore.getState().log
    expect(log.some((e) => e.msg.includes('FRAG CHARGE DETONATED'))).toBe(true)
    expect(log.some((e) => e.msg.includes('CIVILIAN'))).toBe(true)
    expect(useMissionStore.getState().civiliansHit).toBe(1)
  })

  it('frag charge with no target in range fails with a comm line and keeps no cooldown', () => {
    const w = spawn(BARE_MISSION, ops(['op4']))
    deployReset()
    w.tick(STEP)
    killEnemies(w)
    w.orderAbility(['a1'])
    expect(w.unit('a1')?.abilityReadyAt ?? 0).toBe(0)
    expect(
      useMissionStore.getState().log.some((e) => e.msg.includes('No target for the charge')),
    ).toBe(true)
  })

  it('field stim heals the most wounded operative in range and respects max', () => {
    const w = spawn(BARE_MISSION, ops(['op8', 'op1']))
    deployReset()
    w.tick(STEP)
    killEnemies(w)
    const medic = w.unit('a1')!
    const mara = w.unit('a2')!
    mara.pos.x = medic.pos.x + 1
    mara.pos.z = medic.pos.z
    mara.path.length = 0
    medic.hp = medic.maxHp - 10
    mara.hp = mara.maxHp - 60

    // The stim lands on the proportionally worse-off target, not the medic.
    w.orderAbility(['a1'])
    expect(mara.hp).toBeCloseTo(mara.maxHp - 20, 5)
    expect(medic.hp).toBeCloseTo(medic.maxHp - 10, 5)

    // Past the cooldown, the heal caps at the missing health.
    warm(w, ROLE_ABILITIES.medic.active.cooldown + 0.2)
    mara.hp = mara.maxHp - 15
    w.orderAbility(['a1'])
    expect(mara.hp).toBeCloseTo(mara.maxHp, 5)
  })

  it('field stim with nobody wounded in range fails with a comm line', () => {
    const w = spawn(BARE_MISSION, ops(['op8']))
    deployReset()
    w.tick(STEP)
    killEnemies(w)
    w.orderAbility(['a1'])
    expect(w.unit('a1')?.abilityReadyAt ?? 0).toBe(0)
    expect(useMissionStore.getState().log.some((e) => e.msg.includes('Nobody needs the stim'))).toBe(
      true,
    )
  })

  it('em burst drops nearby guards to suspicious and silences their fire for the duration', () => {
    const w = spawn(BARE_MISSION, ops(['op6']))
    deployReset()
    w.tick(STEP)
    const a1 = w.unit('a1')!
    w.orderHoldFire(['a1'], true)
    const enemy = isolateEnemy(w, { x: a1.pos.x, z: a1.pos.z - 2 }, false)
    enemy.aiState = 'combat'
    enemy.alerted = true
    enemy.targetId = a1.id

    w.orderAbility(['a1'])
    expect(enemy.aiState).toBe('suspicious')
    expect(enemy.targetId).toBeNull()
    expect(enemy.jammedUntil).toBeCloseTo(w.time + ROLE_ABILITIES.tech.active.duration, 5)

    // Jammed: the guard reacquires but cannot fire, so no round lands.
    const hp0 = a1.hp
    warm(w, 3.5)
    expect(a1.hp).toBe(hp0)

    // The jam lifts and fire lands again.
    warm(w, 6)
    expect(a1.hp).toBeLessThan(hp0)
  })

  it('deadeye guarantees the next shot at double damage and is spent by it', () => {
    const w = spawn(BARE_MISSION, ops(['op5']))
    deployReset()
    warm(w, 1.2)
    const a1 = w.unit('a1')!
    const enemy = isolateEnemy(w, { x: a1.pos.x, z: a1.pos.z - 2 }, true)
    enemy.hp = 100000
    enemy.maxHp = 100000

    w.orderAbility(['a1'])
    w.orderAttack(['a1'], enemy.id)
    const hp0 = enemy.hp
    let guard = 0
    while (enemy.hp === hp0 && guard++ < 100) w.tick(STEP)
    expect(enemy.hp).toBeCloseTo(hp0 - WEAPONS.longrifle.damage * 2, 5)
    expect(a1.abilityUntil).toBe(0)
  })

  // A body standing still on the shooter→target lane, stance pinned.
  function standOnLane(u: WorldApi["units"][number], at: Vec2) {
    u.pos.x = at.x
    u.pos.z = at.z
    u.path.length = 0
    u.holdGround = true
    return u
  }

  it('a hit strikes the civilian standing on the fire lane and bills it', () => {
    const w = spawn(BARE_MISSION, ops(['op5']))
    deployReset()
    warm(w, 1.2)
    const a1 = w.unit('a1')!
    const enemy = isolateEnemy(w, { x: a1.pos.x, z: a1.pos.z - 4 }, true)
    enemy.hp = 100000
    enemy.maxHp = 100000
    const civ = standOnLane(w.units.find((u) => u.kind === 'civilian')!, { x: a1.pos.x, z: a1.pos.z - 2 })
    civ.hp = 100000
    civ.maxHp = 100000

    // Deadeye makes the shot a guaranteed hit, so the lane is the only variable.
    w.orderAbility(['a1'])
    w.orderAttack(['a1'], enemy.id)
    let guard = 0
    while (civ.hp === 100000 && enemy.hp === 100000 && guard++ < 100) w.tick(STEP)
    expect(enemy.hp).toBe(100000)
    expect(civ.hp).toBeLessThan(100000)
    expect(useMissionStore.getState().civiliansHit).toBe(1)
    // The tracer ends on the civilian, not on the target behind them.
    expect(dist(w.tracers[w.tracers.length - 1].to, civ.pos)).toBeLessThan(0.01)
  })

  it('a hit on a clear lane still lands on the target', () => {
    const w = spawn(BARE_MISSION, ops(['op5']))
    deployReset()
    warm(w, 1.2)
    const a1 = w.unit('a1')!
    const enemy = isolateEnemy(w, { x: a1.pos.x, z: a1.pos.z - 4 }, true)
    enemy.hp = 100000
    enemy.maxHp = 100000
    // Put the civilian beside the lane, well outside the body radius.
    standOnLane(w.units.find((u) => u.kind === 'civilian')!, { x: a1.pos.x + 3, z: a1.pos.z - 2 })

    w.orderAbility(['a1'])
    w.orderAttack(['a1'], enemy.id)
    let guard = 0
    while (enemy.hp === 100000 && guard++ < 100) w.tick(STEP)
    expect(enemy.hp).toBeCloseTo(100000 - WEAPONS.longrifle.damage * 2, 5)
    expect(useMissionStore.getState().civiliansHit).toBe(0)
  })

  it('with two bodies on the lane the one the round enters first is struck', () => {
    const w = spawn(BARE_MISSION, ops(['op5']))
    deployReset()
    warm(w, 1.2)
    const a1 = w.unit('a1')!
    const enemy = isolateEnemy(w, { x: a1.pos.x, z: a1.pos.z - 5 }, true)
    enemy.hp = 100000
    enemy.maxHp = 100000
    // The offset body's centre projects onto the lane first (k 0.30 vs 0.32),
    // but the round enters the body standing square on the lane first
    // (entry 0.22 vs 0.26). Ranking by centre would pick the wrong one.
    const [onLane, offset] = w.units.filter((u) => u.kind === 'civilian')
    standOnLane(onLane, { x: a1.pos.x, z: a1.pos.z - 1.6 })
    standOnLane(offset, { x: a1.pos.x + 0.45, z: a1.pos.z - 1.5 })
    for (const c of [onLane, offset]) {
      c.hp = 100000
      c.maxHp = 100000
    }

    w.orderAbility(['a1'])
    w.orderAttack(['a1'], enemy.id)
    let guard = 0
    while (onLane.hp === 100000 && offset.hp === 100000 && guard++ < 100) w.tick(STEP)
    expect(onLane.hp).toBeLessThan(100000)
    expect(offset.hp).toBe(100000)
    expect(enemy.hp).toBe(100000)
    expect(useMissionStore.getState().civiliansHit).toBe(1)
  })

  it('a hit does not strike a squadmate standing on the lane', () => {
    const w = spawn(BARE_MISSION, ops(['op5', 'op1']))
    deployReset()
    warm(w, 1.2)
    const a1 = w.unit('a1')!
    const a2 = w.unit('a2')!
    w.orderHoldFire(['a2'], true)
    const enemy = isolateEnemy(w, { x: a1.pos.x, z: a1.pos.z - 4 }, true)
    enemy.hp = 100000
    enemy.maxHp = 100000
    standOnLane(a2, { x: a1.pos.x, z: a1.pos.z - 2 })
    a2.hp = 100000
    a2.maxHp = 100000

    w.orderAbility(['a1'])
    w.orderAttack(['a1'], enemy.id)
    let guard = 0
    while (enemy.hp === 100000 && guard++ < 100) w.tick(STEP)
    expect(enemy.hp).toBeLessThan(100000)
    expect(a2.hp).toBe(100000)
  })

  it('a body behind cover on the lane stops the round: nobody is hurt', () => {
    const w = spawn(BARE_MISSION, ops(['op5']))
    deployReset()
    warm(w, 1.2)
    const a1 = w.unit('a1')!
    // Hug the left edge of a column so a body 0.3 m to the left is inside the
    // lane radius yet in the neighbouring cell. Closing that cell cuts the
    // sight line to the body and leaves the line to the target open.
    a1.pos.x = Math.floor(a1.pos.x) + 0.02
    const enemy = isolateEnemy(w, { x: a1.pos.x, z: a1.pos.z - 4 }, true)
    enemy.hp = 100000
    enemy.maxHp = 100000
    const civ = standOnLane(w.units.find((u) => u.kind === 'civilian')!, { x: a1.pos.x - 0.3, z: a1.pos.z - 2 })
    civ.hp = 100000
    civ.maxHp = 100000
    const { size, walk } = w.city
    walk[Math.floor(civ.pos.z) * size + Math.floor(civ.pos.x)] = 0

    const shots = a1.magazine
    w.orderAbility(['a1'])
    w.orderAttack(['a1'], enemy.id)
    let guard = 0
    while (a1.magazine === shots && guard++ < 100) w.tick(STEP)
    expect(a1.magazine).toBeLessThan(shots)
    expect(civ.hp).toBe(100000)
    expect(enemy.hp).toBe(100000)
    expect(useMissionStore.getState().civiliansHit).toBe(0)
  })

  it('a CorpSec hit through a civilian hurts them but bills nothing', () => {
    const w = spawn(BARE_MISSION, ops(['op1']))
    deployReset()
    warm(w, 1.2)
    const a1 = w.unit('a1')!
    a1.hp = 100000
    a1.maxHp = 100000
    w.orderHoldFire(['a1'], true)
    const enemy = isolateEnemy(w, { x: a1.pos.x, z: a1.pos.z - 4 }, false)
    const civ = standOnLane(w.units.find((u) => u.kind === 'civilian')!, { x: a1.pos.x, z: a1.pos.z - 2 })
    civ.hp = 100000
    civ.maxHp = 100000
    enemy.reloading = 0

    let guard = 0
    while (civ.hp === 100000 && guard++ < 600) w.tick(STEP)
    expect(civ.hp).toBeLessThan(100000)
    expect(useMissionStore.getState().civiliansHit).toBe(0)
  })

  it('suppression sweep marks enemies in range and line of sight as slowed', () => {
    const w = spawn(BARE_MISSION, ops(['op7']))
    deployReset()
    w.tick(STEP)
    const a1 = w.unit('a1')!
    w.orderHoldFire(['a1'], true)
    const enemy = isolateEnemy(w, { x: a1.pos.x, z: a1.pos.z - 5 }, true)

    w.orderAbility(['a1'])
    w.tick(STEP)
    expect(enemy.suppressedUntil ?? 0).toBeGreaterThan(w.time)

    // After the sweep ends the mark stops being refreshed.
    warm(w, 7)
    expect(enemy.suppressedUntil ?? 0).toBeLessThan(w.time)
  })

  it('ghost veil hides the infiltrator from guard vision until it expires', () => {
    const w = spawn(BARE_MISSION, ops(['op3']))
    deployReset()
    w.tick(STEP)
    const a1 = w.unit('a1')!
    w.orderHoldFire(['a1'], true)
    const enemy = isolateEnemy(w, { x: a1.pos.x, z: a1.pos.z - 3 }, true)

    // Three meters is inside NOTICE_RADIUS: without the veil this guard is
    // certain in about a second. Veiled, it stays on patrol.
    w.orderAbility(['a1'])
    warm(w, 2)
    expect(enemy.aiState).toBe('patrol')

    // Veil down at 6 s: the guard wakes up fast.
    warm(w, 5)
    expect(enemy.aiState).not.toBe('patrol')
  })

  it('pulse scan opens the minimap reveal window on the world', () => {
    const w = spawn(BARE_MISSION, ops(['op2']))
    deployReset()
    w.tick(STEP)
    killEnemies(w)
    expect(w.scanUntil).toBe(0)
    w.orderAbility(['a1'])
    expect(w.scanUntil).toBeCloseTo(w.time + ROLE_ABILITIES.recon.active.duration, 5)
    warm(w, 9)
    expect(w.scanUntil).toBeLessThan(w.time)
  })

  it('medic aura regenerates nearby operatives at 1 hp per second up to half max', () => {
    const w = spawn(BARE_MISSION, ops(['op8', 'op1']))
    deployReset()
    w.tick(STEP)
    killEnemies(w)
    const medic = w.unit('a1')!
    const mara = w.unit('a2')!
    mara.pos.x = medic.pos.x + 1
    mara.pos.z = medic.pos.z
    mara.path.length = 0
    mara.hp = 20

    warm(w, 10)
    expect(mara.hp).toBeCloseTo(30, 0)
    warm(w, 50)
    expect(mara.hp).toBeCloseTo(mara.maxHp * MEDIC_REGEN_CAP, 5)

    // Out of the aura the regeneration stops.
    mara.pos.x = medic.pos.x + 15
    mara.hp = 20
    warm(w, 3)
    expect(mara.hp).toBeCloseTo(20, 5)
  })

  it('demolitions passive shaves incoming damage', () => {
    const w = spawn(BARE_MISSION, ops(['op4', 'op1']))
    deployReset()
    w.tick(STEP)
    killEnemies(w)
    const torq = w.unit('a1')!
    const mara = w.unit('a2')!
    mara.pos.x = torq.pos.x
    mara.pos.z = torq.pos.z
    mara.path.length = 0
    // One grenade at both their feet: same 70-damage center hit, and only the
    // demolitions frame takes 15% less.
    expect(w.orderGrenade('a1', { x: torq.pos.x, z: torq.pos.z })).toBe(true)
    expect(torq.hp).toBeCloseTo(torq.maxHp - 70 * 0.85, 5)
    expect(mara.hp).toBeCloseTo(mara.maxHp - 70, 5)
  })

  it('gates a retrigger on the cooldown', () => {
    const w = spawn(BARE_MISSION, ops(['op1']))
    deployReset()
    w.tick(STEP)
    killEnemies(w)
    const a1 = w.unit('a1')!

    w.orderAbility(['a1'])
    const readyAt = a1.abilityReadyAt ?? 0
    expect(readyAt).toBeCloseTo(w.time + ROLE_ABILITIES.assault.active.cooldown, 5)
    expect(a1.abilityUntil ?? 0).toBeGreaterThan(w.time)

    // Mid-effect and mid-cooldown: both refuse a retrigger.
    w.orderAbility(['a1'])
    expect(a1.abilityReadyAt).toBe(readyAt)
    warm(w, 8)
    expect(a1.abilityUntil).toBe(0)
    w.orderAbility(['a1'])
    expect(a1.abilityReadyAt).toBe(readyAt)
    expect(a1.abilityUntil).toBe(0)

    // Past the cooldown the ability fires again.
    warm(w, 23)
    w.orderAbility(['a1'])
    expect(a1.abilityUntil ?? 0).toBeGreaterThan(w.time)
  })

  it('tech passive shortens squad ability cooldowns while the tech lives', () => {
    const w = spawn(BARE_MISSION, ops(['op1', 'op6']))
    deployReset()
    w.tick(STEP)
    killEnemies(w)
    const a1 = w.unit('a1')!
    w.orderAbility(['a1'])
    expect(a1.abilityReadyAt).toBeCloseTo(
      w.time + ROLE_ABILITIES.assault.active.cooldown * ROLE_ABILITIES.tech.passive.magnitude,
      5,
    )

    // Without a living tech the same activation charges the full cooldown.
    const w2 = spawn(BARE_MISSION, ops(['op1']))
    deployReset()
    w2.tick(STEP)
    killEnemies(w2)
    const b1 = w2.unit('a1')!
    w2.orderAbility(['a1'])
    expect(b1.abilityReadyAt).toBeCloseTo(w2.time + ROLE_ABILITIES.assault.active.cooldown, 5)
  })

  it('pushes ability state into the squad rows', () => {
    const w = spawn(BARE_MISSION, ops(['op1']))
    deployReset()
    w.tick(STEP)
    killEnemies(w)
    let row = useMissionStore.getState().squad[0]
    expect(row.abilityName).toBe(ROLE_ABILITIES.assault.active.name)
    expect(row.abilityCooldownRemaining).toBe(0)
    expect(row.abilityActiveRemaining).toBe(0)

    // orderAbility syncs at once; the row carries the fresh cooldown.
    w.orderAbility(['a1'])
    row = useMissionStore.getState().squad[0]
    expect(row.abilityCooldownRemaining).toBeGreaterThan(29)
    expect(row.abilityActiveRemaining).toBeGreaterThan(0)

    // And the regular sync keeps it counting down.
    const before = row.abilityCooldownRemaining
    warm(w, 1)
    expect(useMissionStore.getState().squad[0].abilityCooldownRemaining).toBeLessThan(before)
  })
})

describe('milestone 2 missions', () => {
  const HOLLOW_CROWN = MISSIONS[1]
  const RUST_HAVEN = MISSIONS[2]

  function put(u: { pos: Vec2; path: Vec2[] }, at: Vec2): void {
    u.pos.x = at.x
    u.pos.z = at.z
    u.path.length = 0
  }

  function row(id: string) {
    const r = useMissionStore.getState().objectives.find((o) => o.id === id)
    expect(r).toBeDefined()
    return r!
  }

  it('runs Hollow Crown end to end: gate, locks, optional server, escort, extract', () => {
    const w = spawn(HOLLOW_CROWN, ops(DEFAULT_SQUAD))
    deployReset()
    w.tick(STEP)
    expect(w.city.archetype).toBe('compound')
    const vip = w.units.find((u) => u.kind === 'vip')
    expect(vip).toBeDefined()
    if (!vip) return
    // Keep the run free of fire so hp and collateral stay put.
    for (const u of w.units) if (u.kind === 'enemy') u.stance = 'dead'

    const a1 = w.unit('a1')
    expect(a1).toBeDefined()
    if (!a1) return

    // 1: reach the compound gate, resolved through the landmark record.
    put(a1, w.city.landmarks.gate)
    w.tick(STEP)
    expect(row('hc1').done).toBe(true)
    expect(row('hc2').active).toBe(true)
    // The optional server pull activates together with objective 2.
    expect(row('hc-opt').active).toBe(true)
    expect(row('hc-opt').optional).toBe(true)

    // 2: channel at the console. Progress pauses while the zone is empty and
    // resumes where it left off.
    put(a1, w.city.landmarks.console)
    warm(w, 2)
    const partial = row('hc2').progress ?? 0
    expect(partial).toBeGreaterThan(0.2)
    expect(row('hc2').done).toBe(false)
    put(a1, { x: w.city.landmarks.console.x, z: w.city.landmarks.console.z + 10 })
    warm(w, 2)
    const paused = row('hc2').progress ?? 0
    expect(paused).toBeCloseTo(partial, 1)
    put(a1, w.city.landmarks.console)
    warm(w, 3.5)
    expect(row('hc2').done).toBe(true)
    // The vip spawned beside the console and picked up the escort.
    expect(vip.alerted).toBe(true)

    // Optional: pull the detention server for the bonus.
    put(a1, w.city.landmarks.server)
    warm(w, 4.5)
    expect(row('hc-opt').done).toBe(true)

    // 3 and 4: walk everyone, vip included, onto the extraction pad.
    for (const u of w.units) {
      if (u.kind === 'agent' && u.stance !== 'dead') put(u, w.city.extraction)
    }
    put(vip, w.city.extraction)
    w.tick(STEP)
    expect(useMissionStore.getState().result).toBe('won')

    warm(w, 3)
    const app = useAppStore.getState()
    expect(app.outcome?.bonus).toBe(9000)
    // Priced on the outcome; Credits move only at the Debrief apply.
    expect(app.outcome ? netPayout(app.outcome) : -1).toBe(HOLLOW_CROWN.reward + 9000)
    expect(app.credits).toBe(128450)
  })

  it('loses Hollow Crown on the spot when the vip dies', () => {
    const w = spawn(HOLLOW_CROWN, ops(DEFAULT_SQUAD))
    deployReset()
    w.tick(STEP)
    const vip = w.units.find((u) => u.kind === 'vip')
    const a1 = w.unit('a1')
    expect(vip).toBeDefined()
    expect(a1).toBeDefined()
    if (!vip || !a1) return
    // A grenade on the cell block: 70 damage at the centre beats 60 vip hp.
    put(a1, { x: vip.pos.x + 5, z: vip.pos.z })
    expect(w.orderGrenade('a1', { x: vip.pos.x, z: vip.pos.z })).toBe(true)
    expect(vip.stance).toBe('dead')
    expect(useMissionStore.getState().result).toBe('lost')
  })

  it('runs Rust Haven: destroy, paused defend countdown, no bonus when skipped', () => {
    const w = spawn(RUST_HAVEN, ops(DEFAULT_SQUAD))
    deployReset()
    w.tick(STEP)
    expect(w.city.archetype).toBe('industrial')
    const relays = w.units.filter((u) => u.kind === 'device' && u.tag === 'relay')
    const transformer = w.units.find((u) => u.kind === 'device' && u.tag === 'transformer')
    expect(relays).toHaveLength(3)
    expect(transformer).toBeDefined()
    for (const u of w.units) if (u.kind === 'enemy') u.stance = 'dead'

    const a1 = w.unit('a1')
    expect(a1).toBeDefined()
    if (!a1) return

    // 1: reach yard-a.
    put(a1, w.city.landmarks['yard-a'])
    w.tick(STEP)
    expect(row('rh1').done).toBe(true)
    expect(row('rh-opt').active).toBe(true)

    // Park the squad clear of the hold zone before the burn starts.
    put(a1, w.city.extraction)

    // 2: drop the three relays. The wave then enters in combat.
    const before = w.units.length
    for (const d of relays) d.stance = 'dead'
    w.tick(STEP)
    expect(row('rh2').done).toBe(true)
    expect(row('rh3').active).toBe(true)
    const wave = w.units.slice(before)
    expect(wave).toHaveLength(5)
    expect(wave.every((u) => u.kind === 'enemy' && u.aiState === 'combat')).toBe(true)

    // 3: the countdown burns only while an agent holds the zone.
    for (const u of wave) u.stance = 'dead'
    warm(w, 2)
    expect(row('rh3').progress ?? 0).toBe(0)
    put(a1, w.city.landmarks.target)
    warm(w, 2)
    expect(row('rh3').progress ?? 0).toBeGreaterThan(0)
    warm(w, 44)
    expect(row('rh3').done).toBe(true)

    // 4: extract. The skipped transformer pays nothing.
    for (const u of w.units) {
      if (u.kind === 'agent' && u.stance !== 'dead') put(u, w.city.extraction)
    }
    w.tick(STEP)
    expect(useMissionStore.getState().result).toBe('won')
    warm(w, 3)
    const app = useAppStore.getState()
    expect(app.outcome?.bonus).toBe(0)
    // Priced on the outcome; Credits move only at the Debrief apply.
    expect(app.outcome ? netPayout(app.outcome) : -1).toBe(RUST_HAVEN.reward)
    expect(app.credits).toBe(128450)
  })

  it('builds distinct, connected layouts for both authored variants of each mission', () => {
    for (const mission of MISSIONS) {
      const a = spawn(mission, ops(['op1']), { district: mission.variants[0] })
      const b = spawn(mission, ops(['op1']), { district: mission.variants[1] })
      expect(a.city.walk.length).toBe(a.city.size * a.city.size)
      let differs = false
      for (let i = 0; i < a.city.walk.length; i++) {
        if (a.city.walk[i] !== b.city.walk[i]) {
          differs = true
          break
        }
      }
      expect(differs).toBe(true)
      for (const key of ['insertion', 'extraction', 'target']) {
        expect(a.city.landmarks[key]).toBeDefined()
        expect(b.city.landmarks[key]).toBeDefined()
      }
    }
  })
})

describe('enemy archetypes', () => {
  function put(w: WorldApi, u: { pos: Vec2; path: Vec2[] }, at: Vec2): void {
    const spot = nearestWalkable(w.city, at) ?? at
    u.pos.x = spot.x
    u.pos.z = spot.z
    u.path.length = 0
  }

  it('derives elite counts from threat through the mission modifiers', () => {
    expect(missionMods(MISSIONS[0]).officerCount).toBe(1) // SEVERE
    expect(missionMods(MISSIONS[0]).heavyCount).toBe(1)
    expect(missionMods(MISSIONS[1]).officerCount).toBe(0) // HIGH
    expect(missionMods(MISSIONS[1]).heavyCount).toBe(1)
    expect(missionMods(MISSIONS[2]).officerCount).toBe(0) // MODERATE
    expect(missionMods(MISSIONS[2]).heavyCount).toBe(0)
  })

  it('spawns the SEVERE checkpoint with officer, heavies and the marksman', () => {
    const w = spawn(MISSION, ops(['op1']))
    const enemies = w.units.filter((u) => u.kind === 'enemy')

    const officer = enemies.filter((u) => u.archetype === 'officer')
    expect(officer).toHaveLength(1)
    expect(officer[0].name).toBe('CORPSEC-OF01')
    expect(officer[0].weapon?.id).toBe('smg')
    expect(officer[0].hp).toBe(Math.round(70 * 1.2))
    expect(officer[0].speed).toBe(4.4)

    const heavies = enemies.filter((u) => u.archetype === 'heavy')
    expect(heavies).toHaveLength(1)
    for (const h of heavies) {
      expect(h.weapon?.id).toBe('shotgun')
      expect(h.hp).toBe(Math.round(100 * 1.2))
      expect(h.speed).toBe(3.2)
    }

    const marksman = enemies.filter((u) => u.archetype === 'marksman')
    expect(marksman).toHaveLength(1)
    expect(marksman[0].weapon?.id).toBe('longrifle')
    // The authored 80 hp override outranks the archetype base.
    expect(marksman[0].hp).toBe(Math.round(80 * 1.2))

    // Everything not upgraded stays a trooper at trooper stats.
    const troopers = enemies.filter((u) => u.archetype === 'trooper')
    expect(troopers.length).toBe(enemies.length - 3)
    for (const t of troopers) expect(t.speed).toBe(4.2)
  })

  it('officer radios the garrison onto the squad after the delay', () => {
    const w = spawn(MISSION, ops(DEFAULT_SQUAD))
    deployReset()
    w.tick(STEP)
    const officer = w.units.find((u) => u.archetype === 'officer')
    const a1 = w.unit('a1')
    expect(officer).toBeDefined()
    expect(a1).toBeDefined()
    if (!officer || !a1) return

    put(w, a1, { x: officer.pos.x + 4, z: officer.pos.z })
    const tripped = runUntil(
      w,
      () => officer.aiState === 'combat',
      20,
      () => w.orderAttack(['a1'], officer.id),
      0.5,
    )
    expect(tripped).toBe(true)
    // Break contact so both sides live through the delay: the officer stays
    // in combat for DISENGAGE_T (6s) after losing sight, past the 4s fuse,
    // and a1 stops soaking the whole garrison's fire.
    w.orderStop(['a1'])
    w.orderHoldFire(['a1'], true)
    put(w, a1, { x: 46.5, z: 85.5 })
    warm(w, OFFICER_RADIO_DELAY - 1)
    // Park a street patroller inside radio range (22) but outside the
    // firefight and PROPAGATE_R (9) of the fighting garrison: a call nobody
    // answers stays quiet, and the garrison around the officer is already in
    // combat by now.
    const patroller = w.units.find(
      (u) =>
        u.kind === 'enemy' && u.stance !== 'dead' && u.tag !== 'garrison' && u.aiState !== 'combat',
    )
    expect(patroller).toBeDefined()
    if (!patroller) return
    put(w, patroller, { x: officer.pos.x - 17, z: officer.pos.z })
    // Catch the call the moment it lands: the answering guard then converges
    // on the plaza, where sight of the fighting garrison would upgrade its
    // investigation to combat.
    const called = runUntil(
      w,
      () => useMissionStore.getState().log.some((e) => e.msg.includes('REINFORCEMENT CALL OUT')),
      3,
    )
    expect(called).toBe(true)
    const log = useMissionStore.getState().log
    expect(log.some((e) => e.msg.includes('OFFICER ON COMMS'))).toBe(true)
    // The call put the guard outside the firefight onto an investigation.
    expect(patroller.aiState).toBe('suspicious')
  })

  it('killing the officer before the delay cancels the call', () => {
    const w = spawn(MISSION, ops(DEFAULT_SQUAD))
    deployReset()
    w.tick(STEP)
    const officer = w.units.find((u) => u.archetype === 'officer')
    expect(officer).toBeDefined()
    if (!officer) return

    // The whole squad at arm's length: combat trips on the first landed hit
    // and four guns drop the officer well inside the radio delay.
    const ids = ['a1', 'a2', 'a3', 'a4']
    ids.forEach((id, i) => {
      const u = w.unit(id)
      if (u) put(w, u, { x: officer.pos.x + 2 + i, z: officer.pos.z })
    })
    const dead = runUntil(
      w,
      () => officer.stance === 'dead',
      10,
      () => w.orderAttack(ids, officer.id),
      0.25,
    )
    expect(dead).toBe(true)
    warm(w, 4)

    const log = useMissionStore.getState().log
    expect(log.some((e) => e.msg.includes('THE CALL NEVER WENT OUT'))).toBe(true)
    expect(log.some((e) => e.msg.includes('REINFORCEMENT CALL OUT'))).toBe(false)
  })
})

describe('timed objectives', () => {
  it('loses the mission when a required time limit expires', () => {
    const timed: MissionDef = {
      ...MISSION,
      objectives: [
        { id: 't1', label: 'REACH THE DROP', kind: 'reach-zone', zone: { x: 5, z: 5, r: 1 }, failSec: 2 },
      ],
    }
    const w = spawn(timed, ops(['op1']))
    deployReset()
    w.tick(STEP)
    expect(useMissionStore.getState().result).toBe('none')
    warm(w, 2.5)
    const s = useMissionStore.getState()
    expect(s.result).toBe('lost')
    expect(s.objectives[0].failed).toBe(true)
    expect(s.log.some((e) => e.msg.includes('THE WINDOW CLOSED'))).toBe(true)
  })

  it('fails only the optional objective when its window closes', () => {
    const timed: MissionDef = {
      ...MISSION,
      objectives: [
        {
          id: 'opt1',
          label: 'PULL THE SERVER',
          kind: 'interact',
          zone: { x: 5, z: 5, r: 1 },
          durationSec: 5,
          optional: true,
          bonusReward: 1000,
          failSec: 1.5,
        },
        { id: 'req1', label: 'REACH THE DROP', kind: 'reach-zone', zone: { x: 5, z: 5, r: 1 } },
      ],
    }
    const w = spawn(timed, ops(['op1']))
    deployReset()
    w.tick(STEP)
    warm(w, 0.5)
    // The countdown reaches the HUD rows while the window is open.
    expect(useMissionStore.getState().objectives[0].timer).toBeDefined()
    warm(w, 1.5)
    const s = useMissionStore.getState()
    expect(s.objectives[0].failed).toBe(true)
    expect(s.result).toBe('none')
    expect(s.objectives[1].active).toBe(true)
  })
})

describe('hardened difficulty', () => {
  it('adds one metre of CorpSec vision and keeps it through a weather front', () => {
    const add = DIFFICULTY_FX.hardened.visionAdd
    const std = spawn(MISSION, ops(['op1']), { mods: missionMods(MISSION) })
    const hard = spawn(MISSION, ops(['op1']), {
      mods: missionMods(MISSION, undefined, 'hardened'),
    })
    expect(hard.vision).toBeCloseTo(std.vision + add, 10)
    deployReset()
    const opening = hard.vision
    warm(hard, 150.1)
    expect(hard.weather).toBe('light')
    expect(hard.vision).toBeCloseTo(ENEMY_VISION * weatherMul('light').visionMul + add, 10)
    expect(hard.vision).toBeGreaterThan(opening)
  })

  it('tightens an optional failSec window', () => {
    const timed: MissionDef = {
      ...MISSION,
      weatherFront: undefined,
      objectives: [
        {
          id: 'opt1',
          label: 'PULL THE SERVER',
          kind: 'interact',
          zone: { x: 5, z: 5, r: 1 },
          durationSec: 30,
          optional: true,
          bonusReward: 1000,
          failSec: 10,
        },
        { id: 'req1', label: 'REACH THE DROP', kind: 'reach-zone', zone: { x: 5, z: 5, r: 1 } },
      ],
    }
    const hard = spawn(timed, ops(['op1']), {
      mods: missionMods(timed, undefined, 'hardened'),
    })
    deployReset()
    hard.tick(STEP)
    // Authored 10 s * 0.85 = 8.5 s. Past that the optional fails; the contract holds.
    warm(hard, 8.6)
    expect(useMissionStore.getState().objectives[0].failed).toBe(true)
    expect(useMissionStore.getState().result).toBe('none')

    const std = spawn(timed, ops(['op1']), { mods: missionMods(timed) })
    deployReset()
    std.tick(STEP)
    warm(std, 8.6)
    expect(useMissionStore.getState().objectives[0].failed).toBe(false)
    warm(std, 1.6)
    expect(useMissionStore.getState().objectives[0].failed).toBe(true)
    expect(useMissionStore.getState().result).toBe('none')
  })
})

describe('scripted playthrough', () => {
  const ALL = ['a1', 'a2', 'a3', 'a4']

  function objectiveDone(index: number): boolean {
    return useMissionStore.getState().objectives[index]?.done === true
  }

  function livingIds(w: WorldApi): string[] {
    return w.units
      .filter((u) => u.kind === 'agent' && u.stance !== 'dead')
      .map((u) => u.id)
  }

  it('wins Glass Veil on orders alone: advance, clear the garrison, extract', () => {
    const w = spawn(MISSION, ops(DEFAULT_SQUAD))
    deployReset()
    w.tick(STEP)

    // Phase 1: drive move orders at the checkpoint gate until an operative
    // reaches the zone. Attack-move engages whatever steps into the lane.
    const gate = w.city.checkpoint
    const reached = runUntil(
      w,
      () => objectiveDone(0),
      180,
      () => w.orderMove(livingIds(w), { x: gate.x, z: gate.z }),
      2,
    )
    expect(reached).toBe(true)

    // Phase 2: focus fire on the garrison, nearest tagged guard first. The
    // elimination runs through real weapon fire, not state mutation.
    const nextGarrison = () =>
      w.units.find((u) => u.kind === 'enemy' && u.tag === 'garrison' && u.stance !== 'dead')
    const cleared = runUntil(
      w,
      () => objectiveDone(1),
      420,
      () => {
        const target = nextGarrison()
        if (target) w.orderAttack(livingIds(w), target.id)
      },
      0.5,
    )
    expect(cleared).toBe(true)

    // Phase 3: walk every survivor back onto the insertion pad.
    const pad = w.city.extraction
    const won = runUntil(
      w,
      () => useMissionStore.getState().result === 'won',
      240,
      () => w.orderMove(livingIds(w), { x: pad.x, z: pad.z }),
      2,
    )
    expect(won).toBe(true)

    // The outcome lands after the debrief delay. No Credits move yet: the
    // payout is deposited by the Debrief apply transaction (ADR-0021).
    warm(w, 3)
    const app = useAppStore.getState()
    expect(app.phase).toBe('debrief')
    expect(app.outcome?.won).toBe(true)
    expect(app.outcome?.kills).toBeGreaterThanOrEqual(7)
    expect(app.credits).toBe(128450)

    // The outcome carries the mission counters for the local telemetry log.
    const t = app.outcome?.telemetry
    expect(t).toBeDefined()
    if (!t) return
    expect(t.seed).toBe(MISSION.seed)
    expect(t.firstContactSec).not.toBeNull()
    expect(t.firstContactSec ?? 0).toBeGreaterThan(0)
    expect(Object.values(t.shotsByWeapon).reduce((a, b) => a + b, 0)).toBeGreaterThan(0)
    expect(Object.values(t.damageByWeapon).reduce((a, b) => a + b, 0)).toBeGreaterThan(0)
    expect(t.damageDealt).toBeGreaterThan(0)
    expect(t.objectiveTimes.map((o) => o.id)).toEqual(['ob1', 'ob2', 'ob3'])
    const times = t.objectiveTimes.map((o) => o.atSec)
    expect([...times].sort((a, b) => a - b)).toEqual(times)
    expect(t.squadRoles).toEqual(['assault', 'recon', 'infiltrator', 'demolitions'])
  })

  it('loses to CorpSec fire: a wipe driven by enemy rounds, not state edits', () => {
    const w = spawn(MISSION, ops(DEFAULT_SQUAD))
    deployReset()
    w.tick(STEP)

    // Park the wounded squad in the garrison plaza, weapons tight, holding
    // ground: the guards must see them, close in, and shoot them down.
    const gate = w.city.checkpoint
    const spots: Vec2[] = [
      { x: gate.x, z: gate.z },
      { x: gate.x + 1, z: gate.z },
      { x: gate.x, z: gate.z + 1 },
      { x: gate.x + 1, z: gate.z + 1 },
    ]
    ALL.forEach((id, i) => {
      const u = w.unit(id)
      expect(u).toBeDefined()
      if (!u) return
      const at = nearestWalkable(w.city, spots[i]) ?? spots[i]
      u.pos.x = at.x
      u.pos.z = at.z
      u.path.length = 0
      u.hp = 1
    })
    w.orderHoldFire(ALL, true)
    w.orderHold(ALL, true)

    const lost = runUntil(w, () => useMissionStore.getState().result === 'lost', 90)
    expect(lost).toBe(true)
    expect(useMissionStore.getState().log.some((e) => e.msg.includes('SQUAD ELIMINATED'))).toBe(
      true,
    )

    warm(w, 3)
    const app = useAppStore.getState()
    expect(app.phase).toBe('debrief')
    expect(app.outcome?.won).toBe(false)
    expect(app.outcome?.casualties).toBe(4)
    expect(app.outcome?.deadIds?.slice().sort()).toEqual([...DEFAULT_SQUAD].sort())
    expect(app.credits).toBe(128450)
    // The wipe reads in the counters: every point of squad damage was taken.
    expect(app.outcome?.telemetry?.damageTaken).toBeGreaterThan(0)
    expect(app.outcome?.telemetry?.firstContactSec).not.toBeNull()
  })

  it('carries item, ability, and collateral counters through the outcome telemetry', () => {
    const w = spawn(MISSION, ops(DEFAULT_SQUAD))
    deployReset()
    w.tick(STEP)
    for (const u of w.units) if (u.kind === 'enemy') u.stance = 'dead'
    const a1 = w.unit('a1')
    expect(a1).toBeDefined()
    if (!a1) return

    // One med kit, one role ability, one grenade dropped beside a bystander.
    a1.hp -= 30
    expect(w.orderUseMed(['a1'])).toBe(true)
    w.orderAbility(['a1'])
    const civ = w.units.find((u) => u.kind === 'civilian')
    expect(civ).toBeDefined()
    if (!civ) return
    civ.pos.x = a1.pos.x
    civ.pos.z = a1.pos.z - 2
    civ.path.length = 0
    expect(w.orderGrenade('a1', { x: civ.pos.x, z: civ.pos.z })).toBe(true)

    // Teleport-complete the mission so the counters reach the outcome.
    a1.pos.x = w.city.checkpoint.x
    a1.pos.z = w.city.checkpoint.z
    a1.path.length = 0
    w.tick(STEP)
    for (const u of w.units) {
      if (u.kind === 'agent' && u.stance !== 'dead') {
        u.pos.x = w.city.extraction.x
        u.pos.z = w.city.extraction.z
        u.path.length = 0
      }
    }
    w.tick(STEP)
    expect(useMissionStore.getState().result).toBe('won')
    warm(w, 3)

    const t = useAppStore.getState().outcome?.telemetry
    expect(t).toBeDefined()
    if (!t) return
    expect(t.medUsed).toBe(1)
    expect(t.cellUsed).toBe(1)
    expect(t.abilityUsesByRole.assault).toBe(1)
    expect(t.civilianHitsBySquad).toBeGreaterThanOrEqual(1)
    expect(t.damageTaken).toBeGreaterThan(0)
    // No shots were fired and no guard ever woke up.
    expect(Object.values(t.shotsByWeapon).reduce((a, b) => a + b, 0)).toBe(0)
    expect(t.firstContactSec).toBeNull()
  })
})

describe('objective completability', () => {
  // One record per generated-contract type, on a fixed seed, so the four
  // procedural archetype pipelines are checked beside the authored three.
  function record(type: ContractType): GeneratedContract {
    return {
      id: 'gc-test-' + type.toLowerCase(),
      createdT: 0,
      expiresAtT: 86400,
      sector: 'eu',
      cityId: 'ln',
      district: 7,
      type,
      client: 'omni',
      threat: 'HIGH',
      reward: 50000,
      seed: 12345,
      priority: type === 'SUPPRESSION',
      expedited: false,
    }
  }

  const GENERATED_TYPES: ContractType[] = ['SEIZURE', 'SUPPRESSION', 'EXTRACTION', 'SABOTAGE']
  const CASES: Array<[string, MissionDef]> = [
    ...MISSIONS.map((m): [string, MissionDef] => [m.id + ' ' + m.codename, m]),
    ...GENERATED_TYPES.map((t): [string, MissionDef] => [
      'generated ' + t,
      contractMission(record(t)),
    ]),
  ]

  // Mirrors world.ts zoneFor: explicit zone, then landmark, then checkpoint.
  function zoneOf(w: WorldApi, def: ObjectiveDef): Zone {
    if (def.zone) return def.zone
    if (def.landmark && w.city.landmarks[def.landmark]) return w.city.landmarks[def.landmark]
    return w.city.checkpoint
  }

  function walkableInZone(w: WorldApi, zone: Zone): boolean {
    for (let cx = Math.floor(zone.x - zone.r); cx <= Math.floor(zone.x + zone.r); cx++) {
      for (let cz = Math.floor(zone.z - zone.r); cz <= Math.floor(zone.z + zone.r); cz++) {
        const p = { x: cx + 0.5, z: cz + 0.5 }
        if (dist(p, zone) <= zone.r && isWalkable(w.city, p.x, p.z)) return true
      }
    }
    return false
  }

  function reachable(w: WorldApi, zone: Zone): boolean {
    const start = w.city.spawnAgents[0]
    const goal = isWalkable(w.city, zone.x, zone.z)
      ? { x: zone.x, z: zone.z }
      : nearestWalkable(w.city, zone)
    if (!goal) return false
    if (dist(start, goal) < 1) return true
    return findPath(w.city, start, goal).length > 0
  }

  it.each(CASES)('%s builds a chain completable in principle', (_name, mission) => {
    const w = spawn(mission, ops(['op1']))
    const required = mission.objectives.filter((d) => !d.optional)
    expect(required.length).toBeGreaterThan(0)
    // The chain always closes on extraction, never strands the squad.
    expect(required[required.length - 1].kind).toBe('extract')
    expect(required.slice(0, -1).every((d) => d.kind !== 'extract')).toBe(true)

    for (const def of mission.objectives) {
      switch (def.kind) {
        case 'reach-zone':
        case 'interact':
        case 'escort':
        case 'defend': {
          const zone = zoneOf(w, def)
          expect(walkableInZone(w, zone), def.id + ' zone has no walkable cell').toBe(true)
          expect(reachable(w, zone), def.id + ' zone unreachable from insertion').toBe(true)
          if (def.kind === 'escort') {
            expect(w.units.some((u) => u.kind === 'vip')).toBe(true)
          }
          break
        }
        case 'eliminate-tag':
          expect(
            w.units.filter((u) => u.kind === 'enemy' && u.tag === def.tag).length,
            def.id + ' tagged set empty',
          ).toBeGreaterThan(0)
          break
        case 'destroy':
          expect(
            w.units.filter((u) => u.kind === 'device' && u.tag === def.tag).length,
            def.id + ' device set empty',
          ).toBeGreaterThan(0)
          break
        case 'extract':
          expect(walkableInZone(w, w.city.extraction)).toBe(true)
          expect(reachable(w, w.city.extraction)).toBe(true)
          break
      }
    }
  })
})

describe('objectives and outcome', () => {
  it('runs the m01 objective chain to a won debrief with the net payout', () => {
    const w = spawn(MISSION, ops(DEFAULT_SQUAD))
    deployReset()
    w.tick(STEP)

    // 1: reach the checkpoint gate. The zone defaults to the city checkpoint.
    const a1 = w.unit('a1')
    expect(a1).toBeDefined()
    if (!a1) return
    a1.pos.x = w.city.checkpoint.x
    a1.pos.z = w.city.checkpoint.z
    a1.path.length = 0
    w.tick(STEP)
    let rows = useMissionStore.getState().objectives
    expect(rows[0].done).toBe(true)
    expect(rows[1].active).toBe(true)

    // 2: eliminate the tagged garrison. Dropping every enemy keeps the rest of
    // the run free of fire, so the collateral and casualty counts stay put.
    for (const u of w.units) if (u.kind === 'enemy') u.stance = 'dead'
    w.tick(STEP)
    rows = useMissionStore.getState().objectives
    expect(rows[1].done).toBe(true)
    expect(rows[2].active).toBe(true)

    // 3: extract every living agent.
    for (const u of w.units) {
      if (u.kind === 'agent' && u.stance !== 'dead') {
        u.pos.x = w.city.extraction.x
        u.pos.z = w.city.extraction.z
        u.path.length = 0
      }
    }
    w.tick(STEP)
    expect(useMissionStore.getState().result).toBe('won')
    expect(useMissionStore.getState().objectives.every((o) => o.done)).toBe(true)

    // The outcome reaches the app store only after the debrief delay.
    expect(useAppStore.getState().outcome).toBeNull()
    warm(w, 3)
    const app = useAppStore.getState()
    expect(app.phase).toBe('debrief')
    expect(app.outcome).toMatchObject({
      won: true,
      reward: MISSION.reward,
      casualties: 0,
      civiliansHit: 0,
    })
    // Every survivor reports an end-of-mission health fraction for the
    // debrief injury grading.
    const survivorHp = app.outcome?.survivorHp ?? {}
    expect(Object.keys(survivorHp).sort()).toEqual([...DEFAULT_SQUAD].sort())
    for (const frac of Object.values(survivorHp)) {
      expect(frac).toBeGreaterThan(0)
      expect(frac).toBeLessThanOrEqual(1)
    }
    // Priced on the outcome; Credits move only at the Debrief apply.
    expect(app.outcome ? netPayout(app.outcome) : -1).toBe(MISSION.reward)
    expect(app.credits).toBe(128450)
  })

  // GDD roster-and-assembly (survivorHp lists survivors only; a dead operative
  // is KIA, never an injury at f = 0), RA-013 AC 20.
  it('a win with one death reports the dead id in deadIds and omits it from survivorHp', () => {
    const w = spawn(MISSION, ops(DEFAULT_SQUAD))
    deployReset()
    w.tick(STEP)
    for (const u of w.units) if (u.kind === 'enemy') u.stance = 'dead'
    w.tick(STEP)

    // A real grenade kill on a1's squadmate (not a stance flip), fired from a1.
    const thrower = w.unit('a1')!
    const victim = w.unit('a2')!
    const deadOpId = victim.operative!.id
    victim.pos.x = thrower.pos.x + 4
    victim.pos.z = thrower.pos.z
    victim.path.length = 0
    victim.hp = 10
    expect(w.orderGrenade('a1', { x: victim.pos.x, z: victim.pos.z })).toBe(true)
    expect(victim.stance).toBe('dead')

    // Objectives: gate, garrison (already down), then extract every living agent.
    thrower.pos.x = w.city.checkpoint.x
    thrower.pos.z = w.city.checkpoint.z
    thrower.path.length = 0
    w.tick(STEP)
    for (const u of w.units) {
      if (u.kind === 'agent' && u.stance !== 'dead') {
        u.pos.x = w.city.extraction.x
        u.pos.z = w.city.extraction.z
        u.path.length = 0
      }
    }
    w.tick(STEP)
    expect(useMissionStore.getState().result).toBe('won')
    warm(w, 3)

    const outcome = useAppStore.getState().outcome!
    expect(outcome.won).toBe(true)
    expect(outcome.deadIds).toEqual([deadOpId])
    expect(deadOpId).toBe('op2')
    expect(Object.keys(outcome.survivorHp)).not.toContain(deadOpId)
    expect(Object.keys(outcome.survivorHp).sort()).toEqual(['op1', 'op3', 'op4'])
    // Every listed survivor is strictly alive: the sim never reports f = 0.
    for (const frac of Object.values(outcome.survivorHp)) expect(frac).toBeGreaterThan(0)
  })

  it('reports a loss and pays nothing when the squad is wiped', () => {
    const w = spawn(MISSION, ops(DEFAULT_SQUAD))
    deployReset()
    for (const u of w.units) if (u.kind === 'agent') u.stance = 'dead'
    w.tick(STEP)
    const ms = useMissionStore.getState()
    expect(ms.result).toBe('lost')
    expect(ms.log.some((e) => e.msg.includes('SQUAD ELIMINATED'))).toBe(true)

    warm(w, 3)
    const app = useAppStore.getState()
    expect(app.phase).toBe('debrief')
    expect(app.outcome?.won).toBe(false)
    expect(app.outcome?.reward).toBe(MISSION.reward)
    expect(app.outcome?.bonus).toBe(0)
    expect(app.outcome ? netPayout(app.outcome) : -1).toBe(0)
    expect(app.credits).toBe(128450)
  })
})

// Keep ROSTER import honest: the ids used above must exist in the roster.
it('uses only real roster ids in these tests', () => {
  const ids = new Set(ROSTER.map((o) => o.id))
  for (const id of ['op1', 'op2', 'op5', 'op6', 'op7', 'op8', ...DEFAULT_SQUAD]) {
    expect(ids.has(id)).toBe(true)
  }
})

// Story WN-004 / ADR-0009: the running mission reads only the deploy freeze.
describe('deploy freeze: createWorld reads no strategy store', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  // Ends the mission by a squad wipe so maybeOutcome runs too.
  function wipe(w: WorldApi): void {
    for (const u of w.units) if (u.kind === 'agent') {
      u.hp = 0
      u.stance = 'dead'
    }
    warm(w, 3)
  }

  it('reads none of worldStore, campaignStore or researchStore from create through the outcome', () => {
    const squad = ops(DEFAULT_SQUAD)
    const deploy = headlessDeploy(MISSION, squad)
    const reads = [
      vi.spyOn(useWorldStore, 'getState'),
      vi.spyOn(useCampaignStore, 'getState'),
      vi.spyOn(useResearchStore, 'getState'),
    ]
    const w = createWorld(MISSION, squad, deploy)
    deployReset()
    warm(w, 2)
    wipe(w)
    expect(useAppStore.getState().outcome).not.toBeNull()
    for (const read of reads) expect(read).not.toHaveBeenCalled()
  })

  it('echoes the Economy slice apply key on the outcome unchanged', () => {
    const squad = ops(['op1'])
    const w = createWorld(MISSION, squad, headlessDeploy(MISSION, squad, { applyKey: 7 }))
    deployReset()
    w.tick(STEP)
    wipe(w)
    expect(useAppStore.getState().outcome?.applyKey).toBe(7)
    expect(useAppStore.getState().deploySerial).toBe(0)
    expect(useAppStore.getState().lastAppliedKey).toBe(0)
  })

  it('stamps quietReplay from the Economy slice, not live contractsWon', () => {
    useCampaignStore.setState({ contractsWon: [] })
    const squad = ops(['op1'])
    const deploy = headlessDeploy(MISSION, squad, { quietReplay: true })
    const w = createWorld(MISSION, squad, deploy)
    deployReset()
    w.tick(STEP)
    wipe(w)
    expect(useAppStore.getState().outcome?.quietReplay).toBe(true)

    useCampaignStore.setState({ contractsWon: [MISSION.id] })
    useAppStore.setState({ outcome: null })
    const w2 = createWorld(MISSION, squad, headlessDeploy(MISSION, squad, { quietReplay: false }))
    deployReset()
    w2.tick(STEP)
    wipe(w2)
    expect(useAppStore.getState().outcome?.quietReplay).toBe(false)
  })

  it('builds the squad from the Roster slice, ignoring live research and roster', () => {
    useResearchStore.setState({ done: ['b-caseless', 'b-sabot', 'c-weave'] })
    const squad = ops(['op1'])
    const deploy = headlessDeploy(MISSION, squad)
    const w = createWorld(BARE_MISSION, squad, {
      ...deploy,
      roster: { ...deploy.roster, maxHp: { op1: 777 }, speed: { op1: 3.25 } },
    })
    const a1 = w.unit('a1')
    expect(a1?.maxHp).toBe(777)
    expect(a1?.speed).toBe(3.25)
    // Nothing applied on the slice: the live completed set does not reach the weapon.
    expect(a1?.weapon?.damage).toBeCloseTo(
      ROLE_ABILITIES[squad[0].role].passive.magnitude * WEAPONS[squad[0].weapon].damage,
      10,
    )
  })
})

// Story IF-009 AC15 (ADR-0002): the result shows while still in Mission and
// Debrief opens on the outcome after Tactical's 2.5 s of elapsed sim time.
// The delay is world.time, so there is no UI timer to fake.
describe('result display and debrief entry delay (IF-009 AC15)', () => {
  function startAndLose(): WorldApi {
    const w = spawn(MISSION, ops(DEFAULT_SQUAD))
    deployReset()
    useAppStore.setState({ phase: 'mission', outcome: null })
    warm(w, 1)
    for (const u of w.units) if (u.kind === 'agent') u.stance = 'dead'
    return w
  }

  it('shows the result in Mission, then enters Debrief once 2.5 s of time has passed', () => {
    const w = startAndLose()
    const t0 = w.time
    w.tick(STEP)
    expect(useMissionStore.getState().result).toBe('lost')
    expect(useAppStore.getState().phase).toBe('mission')
    expect(useAppStore.getState().outcome).toBeNull()

    while (w.time - t0 < 2.3) w.tick(STEP)
    expect(useAppStore.getState().phase).toBe('mission')
    expect(useAppStore.getState().outcome).toBeNull()

    while (w.time - t0 < 2.7) w.tick(STEP)
    expect(useAppStore.getState().phase).toBe('debrief')
    expect(useAppStore.getState().outcome?.won).toBe(false)
  })

  it('does not progress the delay while paused, and resumes from where it stopped', () => {
    const w = startAndLose()
    const t0 = w.time
    w.tick(STEP)
    expect(useMissionStore.getState().result).toBe('lost')
    warm(w, 1)
    expect(useAppStore.getState().phase).toBe('mission')

    useMissionStore.getState().setPaused(true)
    const frozen = w.time
    for (let i = 0; i < 400; i++) frame(w, STEP) // 20 s of wall time
    expect(w.time).toBe(frozen)
    expect(useAppStore.getState().phase).toBe('mission')
    expect(useAppStore.getState().outcome).toBeNull()

    useMissionStore.getState().setPaused(false)
    // Same bracket as the unpaused case: the pause added nothing to the delay.
    while (w.time - t0 < 2.4) frame(w, STEP)
    expect(useAppStore.getState().phase).toBe('mission')
    while (w.time - t0 < 2.65) frame(w, STEP)
    expect(useAppStore.getState().phase).toBe('debrief')
  })

  it('a single catch-up frame crossing both notifications lands in Debrief, result set first', () => {
    const w = startAndLose()
    const order: string[] = []
    const unsubMission = useMissionStore.subscribe((s, prev) => {
      if (s.result !== prev.result && s.result !== 'none') order.push('result')
    })
    const unsubApp = useAppStore.subscribe((s, prev) => {
      if (s.phase !== prev.phase) order.push(s.phase)
    })
    try {
      w.tick(4) // one frame, under MAX_CATCHUP, spans result and the 2.5 s delay
    } finally {
      unsubMission()
      unsubApp()
    }
    expect(order).toEqual(['result', 'debrief'])
    expect(useMissionStore.getState().result).toBe('lost')
    expect(useAppStore.getState().outcome?.won).toBe(false)
  })

  it('emits the outcome exactly once', () => {
    const w = startAndLose()
    let outcomes = 0
    const unsub = useAppStore.subscribe((s, prev) => {
      if (s.outcome !== prev.outcome && s.outcome) outcomes++
    })
    try {
      warm(w, 8)
    } finally {
      unsub()
    }
    expect(outcomes).toBe(1)
  })
})

// Story RS-016 (ADR-0009, TR-research-002/004): the deploy composer samples
// the live stores once. The Research slice keeps completed unslotted ids only;
// slotted projects reach the mission as resolved wear on the Roster slice.
describe('deploy sampling: Research slice is unslotted ids only (RS-016)', () => {
  function pin(id: string, pins: Record<string, string>): void {
    const roster = useCampaignStore.getState().roster
    useCampaignStore.setState({ roster: { ...roster, [id]: { ...roster[id], pins } } })
  }

  it('applies Advanced Propellants to both assigned operatives', () => {
    useResearchStore.setState({ done: ['b-propellants'] })
    const squad = ops(['op1', 'op2'])
    const deploy = freezeDeploy(MISSION, squad, 1)
    expect(deploy.roster.appliedIds.op1).toContain('b-propellants')
    expect(deploy.roster.appliedIds.op2).toContain('b-propellants')
    expect(deploy.research).toEqual(['b-propellants'])
  })

  it('has two Neural-unpinned operatives wear the same Neural Interface I', () => {
    useResearchStore.setState({ done: ['c-interface'] })
    const squad = ops(['op1', 'op2'])
    const deploy = freezeDeploy(MISSION, squad, 1)
    expect(deploy.roster.wear.op1.NEURAL).toBe('c-interface')
    expect(deploy.roster.wear.op2.NEURAL).toBe('c-interface')
    expect(deploy.roster.appliedIds.op1).toContain('c-interface')
    expect(deploy.roster.appliedIds.op2).toContain('c-interface')
    // Slotted, so it is worn, not on the Research slice.
    expect(deploy.research).toEqual([])
  })

  it('keeps unslotted ids only on the Research slice and worn Interface I on the Roster slice', () => {
    useResearchStore.setState({ done: ['b-propellants', 'c-interface'] })
    pin('op1', { CHEST: 'STOCK' })
    const squad = ops(['op1'])
    const deploy = freezeDeploy(MISSION, squad, 1)
    expect(deploy.research).toEqual(['b-propellants'])
    expect(Array.isArray(deploy.research)).toBe(true)
    expect(deploy.research).not.toHaveProperty('pins')
    expect(deploy.research).not.toContain('c-interface')
    expect(deploy.roster.wear.op1).toEqual({ NEURAL: 'c-interface' })
    expect(deploy.roster.appliedIds.op1).toEqual(['b-propellants', 'c-interface'])
    // A plain clone: no live `done` reference survives on the slice.
    expect(deploy.research).not.toBe(useResearchStore.getState().done)
    // createWorld takes the slices as handed; the run uses the frozen totals.
    const w = createWorld(BARE_MISSION, squad, deploy)
    expect(w.unit('a1')?.maxHp).toBe(deploy.roster.maxHp.op1)
  })

  it('createWorld never reads researchStore or re-derives appliedIds (control manifest)', () => {
    expect(worldSrc).not.toMatch(/researchStore/)
    expect(worldSrc).not.toMatch(/\bappliedNodeIds\b/)
    expect(worldSrc).not.toMatch(/\bmissionMods\b/)
  })
})

// Story RS-017 (ADR-0009, TR-research-006): completions and pin changes after a
// mission's create reach the next deploy only. The test drives the real lab
// flow (start, then sync past endT) so "active at create" means a running lab.
describe('completions after the deploy freeze apply next deploy only (RS-017)', () => {
  // Starts each project on its lab at t = 0; they stay active until finish().
  function startLabs(...ids: string[]): void {
    for (const id of ids) expect(useResearchStore.getState().start(nodeById(id), 0)).toBe(true)
  }

  // Syncs past every running lab's endT, so each active project completes.
  function finish(): void {
    useResearchStore.getState().sync(1e9)
  }

  function pin(id: string, pins: Record<string, string>): void {
    const roster = useCampaignStore.getState().roster
    useCampaignStore.setState({ roster: { ...roster, [id]: { ...roster[id], pins } } })
  }

  function weaponStats(w: WorldApi, id: string) {
    const wp = w.unit(id)?.weapon
    return wp && { damage: wp.damage, spread: wp.spread, cooldown: wp.cooldown, reload: wp.reload, range: wp.range }
  }

  it("leaves a created mission's weapons, crew bonus and Research slice unchanged by a later completion or pin change", () => {
    // Propellants (unslotted, assault damage) and Synaptic (CHEST, crew speed) apply at create.
    useResearchStore.setState({ done: ['b-propellants', 'c-synaptic'] })
    startLabs('b-coating', 'c-interface')
    const squad = ops(['op1'])
    const deploy = freezeDeploy(MISSION, squad, 1)
    const research = deploy.research.slice()
    const wear = structuredClone(deploy.roster.wear)
    const applied = structuredClone(deploy.roster.appliedIds)
    const w = createWorld(BARE_MISSION, squad, deploy)
    deployReset()
    const weapon = weaponStats(w, 'a1')
    const maxHp = w.unit('a1')?.maxHp
    const speed = w.unit('a1')?.speed

    // Mid-mission: two completions land, then op1's CHEST bay is pinned to stock.
    finish()
    pin('op1', { CHEST: 'STOCK' })
    expect(useResearchStore.getState().done).toEqual(['b-propellants', 'c-synaptic', 'b-coating', 'c-interface'])
    warm(w, 1)

    expect(weaponStats(w, 'a1')).toEqual(weapon)
    expect(w.unit('a1')?.maxHp).toBe(maxHp)
    expect(w.unit('a1')?.speed).toBe(speed)
    expect(deploy.research).toEqual(research)
    expect(deploy.roster.wear).toEqual(wear)
    expect(deploy.roster.appliedIds).toEqual(applied)

    // The changes are real: the next deploy samples them.
    const next = freezeDeploy(MISSION, squad, 2)
    expect(next.research).toEqual(['b-propellants', 'b-coating'])
    expect(next.roster.wear.op1).toEqual({ NEURAL: 'c-interface' })
    expect(next.roster.speed.op1).not.toBe(deploy.roster.speed.op1)
  })

  it('keeps Neural Interface I off the frozen Roster wear and appliedIds when it completes mid-mission', () => {
    startLabs('c-interface')
    const squad = ops(['op1'])
    const deploy = freezeDeploy(MISSION, squad, 1)
    expect(deploy.roster.wear.op1.NEURAL).toBeUndefined()
    expect(deploy.roster.appliedIds.op1).not.toContain('c-interface')
    const w = createWorld(BARE_MISSION, squad, deploy)
    deployReset()
    const cooldown = w.unit('a1')?.weapon?.cooldown

    finish()
    expect(useResearchStore.getState().done).toEqual(['c-interface'])
    warm(w, 1)

    // Proof is on the Roster slice: a slotted project is never on the Research slice.
    expect(deploy.roster.wear.op1.NEURAL).toBeUndefined()
    expect(deploy.roster.appliedIds.op1).not.toContain('c-interface')
    expect(w.unit('a1')?.weapon?.cooldown).toBe(cooldown)
  })

  it("puts completions after mission A's create in mission B's snapshot while A's slices still omit them", () => {
    startLabs('b-propellants', 'c-interface')
    const squad = ops(['op1'])
    const a = freezeDeploy(MISSION, squad, 1)
    const wa = createWorld(BARE_MISSION, squad, a)
    deployReset()

    finish()
    warm(wa, 1)
    // op1 carries no NEURAL pin, so it wears the current issue.
    expect(useCampaignStore.getState().roster.op1.pins.NEURAL).toBeUndefined()
    const b = freezeDeploy(MISSION, squad, 2)

    expect(b.research).toContain('b-propellants')
    expect(b.roster.wear.op1.NEURAL).toBe('c-interface')
    expect(b.roster.appliedIds.op1).toContain('c-interface')
    expect(b.roster.appliedIds.op1).toContain('b-propellants')

    expect(a.research).not.toContain('b-propellants')
    // Not proof: c-interface is slotted (NEURAL), so it is never on the Research slice.
    // The Roster wear and appliedIds assertions below carry the proof (AC2 note).
    expect(a.research).not.toContain('c-interface')
    expect(a.roster.wear.op1.NEURAL).toBeUndefined()
    expect(a.roster.appliedIds.op1).not.toContain('b-propellants')
    expect(a.roster.appliedIds.op1).not.toContain('c-interface')
    expect(wa.unit('a1')?.weapon?.damage).toBeCloseTo(
      ROLE_ABILITIES.assault.passive.magnitude * WEAPONS.assault.damage,
      10,
    )
  })
})

// TM-001 (Sprint 8, story 001): the opening selection, Select-all and the slot
// keys all resolve to the living set. A dead row stands in for a KIA slot.
describe('selection is the living set (TM-001, AC 1a / 1b / 1d)', () => {
  function kill(w: WorldApi, id: string): void {
    const u = w.unit(id)!
    u.hp = 0
    u.stance = 'dead'
  }

  it('opens a mission with one dead operative selecting exactly the living ids (AC 1a)', () => {
    const w = spawn(BARE_MISSION, ops(DEFAULT_SQUAD))
    kill(w, 'a2')
    expect(openingSelection(w)).toEqual(['a1', 'a3', 'a4'])
  })

  it('opens a mission with all four living selecting all four', () => {
    const w = spawn(BARE_MISSION, ops(DEFAULT_SQUAD))
    expect(openingSelection(w)).toEqual(['a1', 'a2', 'a3', 'a4'])
  })

  it('Select-all (0 / backtick) picks exactly the living ids (AC 1b)', () => {
    const w = spawn(BARE_MISSION, ops(DEFAULT_SQUAD))
    kill(w, 'a4')
    expect(selectAll(w)).toEqual(['a1', 'a2', 'a3'])
  })

  it('Select-all with only one living operative picks only that one', () => {
    const w = spawn(BARE_MISSION, ops(DEFAULT_SQUAD))
    kill(w, 'a1')
    kill(w, 'a2')
    kill(w, 'a4')
    expect(selectAll(w)).toEqual(['a3'])
  })

  it('Select-all after a death mid-mission drops the fallen operative', () => {
    const w = spawn(BARE_MISSION, ops(DEFAULT_SQUAD))
    warm(w, 1)
    expect(selectAll(w)).toEqual(['a1', 'a2', 'a3', 'a4'])
    kill(w, 'a3')
    warm(w, 0.5)
    expect(selectAll(w)).toEqual(['a1', 'a2', 'a4'])
  })

  it('a slot key on a dead slot leaves the selection unchanged (AC 1d)', () => {
    const w = spawn(BARE_MISSION, ops(DEFAULT_SQUAD))
    kill(w, 'a2')
    const current = ['a1', 'a3']
    expect(selectSlot(w, 2, current)).toBe(current)
    expect(selectSlot(w, 2, current)).toEqual(['a1', 'a3'])
  })

  it('a slot key on a living slot selects exactly that slot (AC 1d)', () => {
    const w = spawn(BARE_MISSION, ops(DEFAULT_SQUAD))
    kill(w, 'a2')
    expect(selectSlot(w, 3, ['a1', 'a4'])).toEqual(['a3'])
    expect(selectSlot(w, 1, [])).toEqual(['a1'])
  })

  it('clicking a hostile does not clear the selection (GDD edge case)', () => {
    const current = ['a1', 'a2']
    expect(clickSelection(current, { id: 'e1', agent: false }, false)).toEqual(['a1', 'a2'])
    expect(clickSelection(current, null, false)).toEqual([])
  })
})

// TM-003 (Sprint 8, story 003): Move clears the Explicit target and Hold
// Ground, and a walking operative stops to engage unless Hold Fire is on.
describe('Move clears target and Hold Ground; stop-to-engage (TM-003, AC 2 / 2b / 2c)', () => {
  // One operative, one muzzled hostile parked just off the route.
  function stage() {
    const w = spawn(BARE_MISSION, ops(['op1']))
    deployReset()
    w.tick(STEP)
    const a1 = w.unit('a1')!
    const enemy = w.units.find((u) => u.kind === 'enemy' && u.stance !== 'dead')!
    const start = { x: a1.pos.x, z: a1.pos.z }
    const post = { x: start.x + 2, z: start.z - 4 }
    const dest = { x: start.x, z: start.z - 12 }
    const dealt = { hp: 0 }
    const pin = () => {
      if (enemy.stance === 'dead') return
      dealt.hp = enemy.maxHp - enemy.hp
      enemy.pos.x = post.x
      enemy.pos.z = post.z
      enemy.path.length = 0
      enemy.reloading = 999
    }
    pin()
    return { w, a1, enemy, start, dest, pin, dealt }
  }

  it('Move clears an Explicit target and releases Hold Ground (AC 2)', () => {
    const { w, a1, enemy, dest } = stage()
    w.orderAttack(['a1'], enemy.id)
    w.orderHold(['a1'], true)
    expect(a1.targetId).toBe(enemy.id)
    expect(a1.holdGround).toBe(true)

    w.orderMove(['a1'], dest)

    expect(a1.targetId).toBeNull()
    expect(a1.holdGround).toBe(false)
    expect(a1.stance).toBe('moving')
  })

  it('a Move to a blocked tile snaps to walkable ground and still clears both (AC 2 edge)', () => {
    const { w, a1, enemy } = stage()
    w.orderAttack(['a1'], enemy.id)
    w.orderHold(['a1'], true)
    let wall: Vec2 | null = null
    for (let x = 1; x < 96 && !wall; x++)
      for (let z = 1; z < 96 && !wall; z++)
        if (!isWalkable(w.city, x + 0.5, z + 0.5)) wall = { x: x + 0.5, z: z + 0.5 }
    expect(wall).not.toBeNull()

    w.orderMove(['a1'], wall!)

    expect(a1.holdGround).toBe(false)
    expect(a1.targetId).toBeNull()
    expect(a1.path.length).toBeGreaterThan(0)
  })

  it('stops to engage a visible in-range hostile, fires, then resumes the path (AC 2b)', () => {
    const { w, a1, enemy, dest, pin, dealt } = stage()
    w.orderMove(['a1'], dest)
    const magazine0 = a1.magazine
    let stopped = false
    let stoppedAt: Vec2 | null = null
    const until = w.time + 12
    while (w.time < until) {
      pin()
      w.tick(STEP)
      if (a1.stance === 'attacking' && !stopped) {
        stopped = true
        stoppedAt = { x: a1.pos.x, z: a1.pos.z }
      }
    }
    expect(stopped).toBe(true)
    expect(a1.magazine).toBeLessThan(magazine0)
    expect(dealt.hp).toBeGreaterThan(0)
    expect(enemy.stance).toBe('dead')
    // The route resumed after the engagement and reached the destination.
    expect(dist(a1.pos, dest)).toBeLessThan(dist(stoppedAt!, dest))
    expect(dist(a1.pos, dest)).toBeLessThan(1)
  })

  it('does not stop or fire with Hold Fire on; the path continues (AC 2c)', () => {
    const { w, a1, dest, pin } = stage()
    w.orderHoldFire(['a1'], true)
    w.orderMove(['a1'], dest)
    const magazine0 = a1.magazine
    const until = w.time + 12
    let everAttacking = false
    while (w.time < until) {
      pin()
      w.tick(STEP)
      if (a1.stance === 'attacking') everAttacking = true
    }
    expect(everAttacking).toBe(false)
    expect(a1.magazine).toBe(magazine0)
    expect(dist(a1.pos, dest)).toBeLessThan(1)
  })

  it('a weapon that is not free does not stop the walk (weapons-free edge)', () => {
    for (const spoil of ['reloading', 'empty', 'drawing'] as const) {
      const { w, a1, dest, pin } = stage()
      if (spoil === 'reloading') a1.reloading = 999
      if (spoil === 'empty') a1.magazine = 0
      if (spoil === 'drawing') a1.swapReadyAt = 999
      w.orderMove(['a1'], dest)
      const until = w.time + 12
      let everAttacking = false
      while (w.time < until && dist(a1.pos, dest) >= 1) {
        pin()
        w.tick(STEP)
        if (a1.stance === 'attacking') everAttacking = true
      }
      expect(everAttacking, spoil).toBe(false)
      expect(dist(a1.pos, dest), spoil).toBeLessThan(1)
    }
  })
})

// TM-004 (Sprint 8, story 004): an idle operative acquires on its own when
// Hold Fire is off, and Attack under Hold Ground and Hold Fire keeps the
// Explicit target without chasing it.
describe('Idle auto-acquire and Attack under Hold Ground and Hold Fire (TM-004, AC 2d / 3)', () => {
  // Pinned literal: op1's opening weapon range in the authored weapon table
  // (src/game/data.ts, GDD §10). Stages below are placed against this number.
  const RANGE = 16
  // One standing operative and one muzzled hostile pinned to a post the
  // test can move. Its post starts north on the open road.
  function stage(dz: number) {
    const w = spawn(BARE_MISSION, ops(['op1']))
    deployReset()
    w.tick(STEP)
    const a1 = w.unit('a1')!
    const enemy = w.units.find((u) => u.kind === 'enemy' && u.stance !== 'dead')!
    const start = { x: a1.pos.x, z: a1.pos.z }
    const post = { x: start.x, z: start.z - dz }
    const dealt = { hp: 0 }
    const pin = () => {
      if (enemy.stance === 'dead') return
      dealt.hp = enemy.maxHp - enemy.hp
      enemy.pos.x = post.x
      enemy.pos.z = post.z
      enemy.path.length = 0
      enemy.reloading = 999
    }
    pin()
    const run = (seconds: number, each?: () => void) => {
      const until = w.time + seconds
      while (w.time < until) {
        pin()
        w.tick(STEP)
        each?.()
      }
    }
    return { w, a1, enemy, start, post, pin, dealt, run }
  }

  it('the staged weapon range matches the spec literal', () => {
    const { a1 } = stage(10)
    expect(a1.weapon?.range).toBe(RANGE)
  })

  it('an idle operative acquires and fires with no order: idle, Hold Ground, Stopped (AC 2d)', () => {
    for (const mode of ['idle', 'holdGround', 'stopped'] as const) {
      const { w, a1, enemy, start, dealt, run } = stage(10)
      if (mode === 'holdGround') w.orderHold(['a1'], true)
      if (mode === 'stopped') w.orderStop(['a1'])
      expect(a1.path.length, mode).toBe(0)
      expect(a1.holdFire, mode).toBe(false)
      const magazine0 = a1.magazine
      let acquired = false
      run(3, () => {
        if (a1.targetId === enemy.id) acquired = true
      })
      expect(acquired, mode).toBe(true)
      expect(a1.magazine, mode).toBeLessThan(magazine0)
      expect(dealt.hp, mode).toBeGreaterThan(0)
      // Auto-acquire never walks the operative anywhere.
      expect(dist(a1.pos, start), mode).toBeLessThan(0.5)
    }
  })

  it('Attack out of range under Hold Fire and Hold Ground keeps the target, no chase, fires once in range (AC 3)', () => {
    const { w, a1, enemy, start, post, dealt, run } = stage(RANGE + 8)
    w.orderHoldFire(['a1'], true)
    w.orderHold(['a1'], true)
    w.orderAttack(['a1'], enemy.id)
    expect(a1.targetId).toBe(enemy.id)
    expect(a1.holdFire).toBe(true)

    const magazine0 = a1.magazine
    run(4)
    // Out of range: the target is kept, Hold Fire stays on, no chase, no shot.
    expect(a1.targetId).toBe(enemy.id)
    expect(a1.holdFire).toBe(true)
    expect(a1.holdGround).toBe(true)
    expect(a1.path.length).toBe(0)
    expect(dist(a1.pos, start)).toBeLessThan(0.5)
    expect(a1.magazine).toBe(magazine0)
    expect(dealt.hp).toBe(0)

    // The hostile walks into range and LOS: the explicit shot fires.
    post.z = start.z - 10
    run(3)
    expect(a1.magazine).toBeLessThan(magazine0)
    expect(dealt.hp).toBeGreaterThan(0)
    expect(a1.holdFire).toBe(true)
    expect(dist(a1.pos, start)).toBeLessThan(0.5)
  })

  it('the Explicit target dies before it enters range: no shot, no chase, Hold Fire stays on (EC-1)', () => {
    const { w, a1, enemy, start, run } = stage(RANGE + 8)
    w.orderHoldFire(['a1'], true)
    w.orderHold(['a1'], true)
    w.orderAttack(['a1'], enemy.id)
    run(1)
    enemy.hp = 0
    enemy.stance = 'dead'
    const magazine0 = a1.magazine
    let everAttacking = false
    run(3, () => {
      if (a1.stance === 'attacking') everAttacking = true
    })
    expect(everAttacking).toBe(false)
    expect(a1.magazine).toBe(magazine0)
    expect(a1.targetId).toBeNull()
    expect(a1.holdFire).toBe(true)
    expect(a1.path.length).toBe(0)
    expect(dist(a1.pos, start)).toBeLessThan(0.5)
  })

  it('the Explicit target is in range but out of LOS: no shot, no chase, Hold Fire stays on (EC-1)', () => {
    const { w, a1, enemy, start, post, run } = stage(10)
    // A walkable cell inside weapon range that a wall hides from the operative.
    let hidden: Vec2 | null = null
    for (let dx = -12; dx <= 12 && !hidden; dx++)
      for (let dz = -12; dz <= 12 && !hidden; dz++) {
        const p = { x: start.x + dx, z: start.z + dz }
        if (Math.hypot(dx, dz) < RANGE - 2 && isWalkable(w.city, p.x, p.z) && !hasLos(w.city, start, p))
          hidden = p
      }
    expect(hidden).not.toBeNull()
    post.x = hidden!.x
    post.z = hidden!.z
    w.orderHoldFire(['a1'], true)
    w.orderHold(['a1'], true)
    w.orderAttack(['a1'], enemy.id)
    const magazine0 = a1.magazine
    let everAttacking = false
    run(4, () => {
      if (a1.stance === 'attacking') everAttacking = true
    })
    expect(everAttacking).toBe(false)
    expect(a1.magazine).toBe(magazine0)
    expect(a1.targetId).toBe(enemy.id)
    expect(a1.holdFire).toBe(true)
    expect(a1.path.length).toBe(0)
    expect(dist(a1.pos, start)).toBeLessThan(0.5)
  })
})

// TM-005 (Sprint 8, story 005): Hold Fire clears automatic targets only. A
// standing Explicit target survives it (ADR-0016 resolves GDD OQ2), and a
// later Attack fires through without clearing the bit.
describe('Hold Fire clears automatic targets but keeps a standing Explicit (TM-005, AC 5 / 5b / 5c)', () => {
  // One operative and one muzzled hostile pinned 10 m north on the open road,
  // inside op1's opening range (16 m, pinned in the TM-004 block above).
  function stage() {
    const w = spawn(BARE_MISSION, ops(['op1']))
    deployReset()
    w.tick(STEP)
    const a1 = w.unit('a1')!
    const enemy = w.units.find((u) => u.kind === 'enemy' && u.stance !== 'dead')!
    const post = { x: a1.pos.x, z: a1.pos.z - 10 }
    const dealt = { hp: 0 }
    const pin = () => {
      if (enemy.stance === 'dead') return
      dealt.hp = enemy.maxHp - enemy.hp
      enemy.pos.x = post.x
      enemy.pos.z = post.z
      enemy.path.length = 0
      enemy.reloading = 999
    }
    pin()
    const run = (seconds: number, each?: () => void) => {
      const until = w.time + seconds
      while (w.time < until) {
        pin()
        w.tick(STEP)
        each?.()
      }
    }
    // Run until a1 auto-acquires the hostile (no order given).
    const acquire = () => {
      const until = w.time + 3
      while (w.time < until && a1.targetId !== enemy.id) {
        pin()
        w.tick(STEP)
      }
    }
    return { w, a1, enemy, dealt, run, acquire }
  }

  it('clears an automatic target, does not re-acquire, and shows on the squad card (AC 5)', () => {
    const { w, a1, enemy, dealt, run, acquire } = stage()
    acquire()
    expect(a1.targetId).toBe(enemy.id)

    w.orderHoldFire(['a1'], true)
    expect(a1.holdFire).toBe(true)
    expect(a1.targetId).toBeNull()
    expect(useMissionStore.getState().squad.find((r) => r.unitId === 'a1')?.holdFire).toBe(true)

    // Many acquire intervals (0.12 s each): nothing is picked up, nothing fires.
    const magazine0 = a1.magazine
    const hp0 = dealt.hp
    let reacquired = false
    run(2, () => {
      if (a1.targetId !== null) reacquired = true
    })
    expect(reacquired).toBe(false)
    expect(a1.magazine).toBe(magazine0)
    expect(dealt.hp).toBe(hp0)
    expect(useMissionStore.getState().squad.find((r) => r.unitId === 'a1')?.holdFire).toBe(true)
  })

  it('Hold Fire off again: auto-acquire resumes (edge case)', () => {
    const { w, a1, enemy, run } = stage()
    w.orderHoldFire(['a1'], true)
    run(1)
    expect(a1.targetId).toBeNull()
    w.orderHoldFire(['a1'], false)
    expect(a1.holdFire).toBe(false)
    let acquired = false
    run(2, () => {
      if (a1.targetId === enemy.id) acquired = true
    })
    expect(acquired).toBe(true)
  })

  it('a later Attack fires through Hold Fire and the bit stays on (AC 5b)', () => {
    const { w, a1, enemy, dealt, run } = stage()
    w.orderHoldFire(['a1'], true)
    run(0.5)
    const magazine0 = a1.magazine
    w.orderAttack(['a1'], enemy.id)
    expect(a1.targetId).toBe(enemy.id)
    run(3)
    expect(a1.magazine).toBeLessThan(magazine0)
    expect(dealt.hp).toBeGreaterThan(0)
    expect(a1.holdFire).toBe(true)
  })

  it('a standing Explicit target is not nulled when Hold Fire is turned on (AC 5c)', () => {
    const { w, a1, enemy, dealt, run } = stage()
    w.orderAttack(['a1'], enemy.id)
    expect(a1.targetId).toBe(enemy.id)

    w.orderHoldFire(['a1'], true)
    expect(a1.holdFire).toBe(true)
    expect(a1.targetId).toBe(enemy.id)

    // The standing order keeps firing under Hold Fire.
    const magazine0 = a1.magazine
    run(3)
    expect(a1.magazine).toBeLessThan(magazine0)
    expect(dealt.hp).toBeGreaterThan(0)
    expect(a1.holdFire).toBe(true)
  })
})

// TM-006 (Sprint 8, story 006): Hold Ground pins the operative on its tile and
// parks the path (restored on release); separation never shoves a held
// operative. Stop clears pathing (the parked path too), chase and targeting,
// and leaves the Hold Ground and Hold Fire stance bits on (GDD OQ8).
describe('Hold Ground pins and parks; Stop clears pathing and keeps stance bits (TM-006, AC 4 / 6)', () => {
  // The parked path is internal sim state, not on the public Unit type.
  const parked = (u: object) => (u as { suspended?: Vec2[] }).suspended

  function walking(ids: string[]) {
    const w = spawn(BARE_MISSION, ops(ids))
    deployReset()
    w.tick(STEP)
    const a1 = w.unit('a1')!
    const dest = { x: a1.pos.x, z: a1.pos.z - 8 }
    w.orderMove(['a1'], dest)
    warm(w, 0.5)
    expect(a1.stance).toBe('moving')
    expect(a1.path.length).toBeGreaterThan(0)
    return { w, a1, dest }
  }

  it('pins the walking operative on its tile and parks the path, restored on release (AC 4)', () => {
    const { w, a1, dest } = walking(['op1'])
    const route = a1.path.map((p) => ({ x: p.x, z: p.z }))

    w.orderHold(['a1'], true)
    expect(a1.holdGround).toBe(true)
    expect(a1.path).toHaveLength(0)
    expect(parked(a1)).toEqual(route)
    expect(a1.stance).toBe('idle')

    const held = { x: a1.pos.x, z: a1.pos.z }
    for (let i = 0; i < 40; i++) {
      w.tick(STEP)
      expect(a1.pos.x).toBe(held.x)
      expect(a1.pos.z).toBe(held.z)
    }

    w.orderHold(['a1'], false)
    expect(a1.holdGround).toBe(false)
    expect(parked(a1)).toBeUndefined()
    expect(a1.path.length).toBeGreaterThan(0)
    expect(a1.path[a1.path.length - 1]).toEqual(route[route.length - 1])
    expect(a1.stance).toBe('moving')
    warm(w, 3)
    expect(dist(a1.pos, dest)).toBeLessThan(0.5)
  })

  it('a squadmate pressing into the held tile does not shove the held operative (AC 4, separation)', () => {
    const w = spawn(BARE_MISSION, ops(['op1', 'op2']))
    deployReset()
    w.tick(STEP)
    const a1 = w.unit('a1')!
    const a2 = w.unit('a2')!
    w.orderHold(['a1'], true)
    const held = { x: a1.pos.x, z: a1.pos.z }
    // Pin a2 almost on top of a1 every tick (well inside the 0.7 m separation
    // radius) so separation pushes against the held operative throughout.
    const press = { x: held.x + 0.1, z: held.z }
    let pushedA2 = false
    for (let i = 0; i < 40; i++) {
      a2.pos.x = press.x
      a2.pos.z = press.z
      a2.path.length = 0
      w.tick(STEP)
      if (a2.pos.x !== press.x || a2.pos.z !== press.z) pushedA2 = true
      expect(a1.pos.x).toBe(held.x)
      expect(a1.pos.z).toBe(held.z)
    }
    // Separation did run: the free squadmate was the one moved.
    expect(pushedA2).toBe(true)
  })

  it('Stop clears path, parked path, chase and target; Hold Ground and Hold Fire stay on (AC 6)', () => {
    const { w, a1 } = walking(['op1'])
    const enemy = w.units.find((u) => u.kind === 'enemy' && u.stance !== 'dead')!
    w.orderAttack(['a1'], enemy.id)
    w.orderHold(['a1'], true)
    w.orderHoldFire(['a1'], true)
    expect(a1.targetId).toBe(enemy.id)
    expect(parked(a1)?.length ?? 0).toBeGreaterThan(0)
    expect(a1.holdGround).toBe(true)
    expect(a1.holdFire).toBe(true)

    w.orderStop(['a1'])
    expect(a1.path).toHaveLength(0)
    expect(parked(a1)).toBeUndefined()
    expect(a1.targetId).toBeNull()
    expect(a1.stance).toBe('idle')
    expect(a1.holdGround).toBe(true)
    expect(a1.holdFire).toBe(true)

    // No chase: the operative stays put on later ticks.
    const at = { x: a1.pos.x, z: a1.pos.z }
    warm(w, 1)
    expect(a1.pos.x).toBe(at.x)
    expect(a1.pos.z).toBe(at.z)
    expect(a1.path).toHaveLength(0)
  })

  it('releasing Hold Ground after Stop does not resume the walk (edge case, GDD OQ8)', () => {
    const { w, a1 } = walking(['op1'])
    w.orderHold(['a1'], true)
    expect(parked(a1)?.length ?? 0).toBeGreaterThan(0)
    w.orderStop(['a1'])
    w.orderHold(['a1'], false)
    expect(a1.holdGround).toBe(false)
    expect(a1.path).toHaveLength(0)
    expect(parked(a1)).toBeUndefined()
    expect(a1.stance).toBe('idle')
    const at = { x: a1.pos.x, z: a1.pos.z }
    warm(w, 1)
    expect(dist(a1.pos, at)).toBeLessThan(0.05)
  })
})

// TM-008 (Sprint 8, story 008): weather retunes CorpSec sight and weapon
// noise, and nothing else. Noise is read through behaviour (the farthest
// spot a guard still hears a shot), never through the code-owned noiseMul.
describe('Weather retunes CorpSec sight and weapon noise only (TM-008, AC 9a / 9b / 9c)', () => {
  // Pinned literals from the GDD (tactical-mission §9, AC 9a / 9b).
  const SIGHT = { none: 14, light: 12.6, heavy: 11.2 } as const
  const NOTICE = 4.5
  // Scripted front time for the test missions, fixed at create.
  const FRONT_AT = 5
  const WEATHERS = ['none', 'light', 'heavy'] as const

  function still(weather: MissionDef['weather']): MissionDef {
    return { ...BARE_MISSION, weather, weatherFront: undefined }
  }
  function front(from: MissionDef['weather'], to: MissionDef['weather']): MissionDef {
    return { ...BARE_MISSION, weather: from, weatherFront: { to, atSec: FRONT_AT } }
  }

  // One operative and `keep` trooper guards, the rest of the garrison
  // dead. Kept guards are parked where they stand until a probe places them.
  function stage(m: MissionDef, keep: number) {
    const w = spawn(m, ops(['op1']))
    deployReset()
    w.tick(STEP)
    const a1 = w.unit('a1')!
    const guards = w.units
      .filter((u) => u.kind === 'enemy' && (u.archetype ?? 'trooper') === 'trooper')
      .slice(0, keep)
    for (const u of w.units) if (u.kind === 'enemy' && !guards.includes(u)) u.stance = 'dead'
    for (const g of guards) {
      g.path.length = 0
      g.patrol!.length = 0
      g.holdGround = true
    }
    return { w, a1, guards }
  }

  // Direction (unit axis) from a1 toward the map centre along x.
  function inward(w: WorldApi, a1: Unit): number {
    return a1.pos.x < w.city.size / 2 ? 1 : -1
  }

  // Does a guard `d` metres from a1 hear a1's rifle? The shot target is a
  // muzzled guard 2 m away; the listener is past any sight range (d > 14).
  function hears(m: MissionDef, d: number, after = 0): boolean {
    const { w, a1, guards } = stage(m, 2)
    const [target, listener] = guards
    warm(w, after)
    target.pos.x = a1.pos.x
    target.pos.z = a1.pos.z - 2
    target.reloading = 999
    listener.pos.x = a1.pos.x + inward(w, a1) * d
    listener.pos.z = a1.pos.z
    expect(listener.aiState).toBe('patrol')
    w.orderAttack(['a1'], target.id)
    expect(runUntil(w, () => w.tracers.length > 0, 3)).toBe(true)
    warm(w, 0.4)
    return listener.aiState !== 'patrol'
  }

  // Farthest distance (to ~3 cm) at which the shot is still heard.
  function earshot(m: MissionDef, after = 0): number {
    let lo = 15
    let hi = 30
    expect(hears(m, lo, after)).toBe(true)
    expect(hears(m, hi, after)).toBe(false)
    for (let i = 0; i < 9; i++) {
      const mid = (lo + hi) / 2
      if (hears(m, mid, after)) lo = mid
      else hi = mid
    }
    return lo
  }

  // Does a guard `d` metres from a1 notice it within `window` seconds of
  // `after`? It faces straight away from a1 (omni notice only) unless
  // `toward`, when a1 sits dead centre of its cone (live sight range).
  function notices(m: MissionDef, d: number, after = 0, toward = false, window = 0.6): boolean {
    const { w, a1, guards } = stage(m, 1)
    const g = guards[0]
    warm(w, after)
    w.orderHoldFire(['a1'], true)
    const dirs: Vec2[] = [
      { x: 1, z: 0 },
      { x: -1, z: 0 },
      { x: 0, z: 1 },
      { x: 0, z: -1 },
    ]
    const dir = dirs.find((v) => {
      const p = { x: a1.pos.x + v.x * d, z: a1.pos.z + v.z * d }
      return isWalkable(w.city, p.x, p.z) && hasLos(w.city, p, a1.pos)
    })
    expect(dir).toBeDefined()
    g.pos.x = a1.pos.x + dir!.x * d
    g.pos.z = a1.pos.z + dir!.z * d
    const away = Math.atan2(dir!.x, dir!.z)
    const heading = toward ? Math.atan2(-dir!.x, -dir!.z) : away
    expect(g.aiState).toBe('patrol')
    const until = w.time + window
    while (w.time < until) {
      g.heading = heading
      g.path.length = 0
      w.tick(STEP)
    }
    return g.aiState !== 'patrol'
  }

  // Damage a trooper already in combat deals to a1 at 2 m in 8 s, and damage
  // a1 deals to a muzzled guard at 2 m in 0.6 s.
  function duel(m: MissionDef, after = 0): { taken: number; dealt: number } {
    const a = stage(m, 1)
    warm(a.w, after)
    a.w.orderHoldFire(['a1'], true)
    const shooter = a.guards[0]
    shooter.pos.x = a.a1.pos.x
    shooter.pos.z = a.a1.pos.z - 2
    shooter.aiState = 'combat'
    shooter.alerted = true
    shooter.targetId = a.a1.id
    // Sim-internal certainty: already sure, so sight gain cannot gate fire.
    ;(shooter as Unit & { awareness?: number }).awareness = 1
    warm(a.w, 8)
    const taken = a.a1.maxHp - a.a1.hp

    const b = stage(m, 1)
    warm(b.w, after)
    const target = b.guards[0]
    target.pos.x = b.a1.pos.x
    target.pos.z = b.a1.pos.z - 2
    target.reloading = 999
    b.w.orderAttack(['a1'], target.id)
    warm(b.w, 0.6)
    return { taken, dealt: target.maxHp - target.hp }
  }

  // Where a1 is after walking 1.5 s toward a fixed spot.
  function walk(m: MissionDef, after = 0): { pos: Vec2; speeds: number[] } {
    const { w, a1 } = stage(m, 0)
    for (const u of w.units) if (u.kind === 'enemy') u.stance = 'dead'
    warm(w, after)
    w.orderMove(['a1'], { x: a1.pos.x + inward(w, a1) * 8, z: a1.pos.z })
    warm(w, 1.5)
    return {
      pos: { x: a1.pos.x, z: a1.pos.z },
      speeds: w.units.filter((u) => u.kind === 'enemy').map((u) => u.speed),
    }
  }

  it('Standard cone range is 14 / 12.6 / 11.2 m for none / light / heavy (AC 9a)', () => {
    for (const weather of WEATHERS) {
      const w = spawn(still(weather), ops(['op1']), { mods: missionMods(still(weather)) })
      expect(w.weather).toBe(weather)
      expect(w.vision).toBeCloseTo(SIGHT[weather], 10)
    }
  })

  it('Hardened light rain reads 13.6 m: the +1 m lands after the weather scale (AC 9a edge)', () => {
    const m = still('light')
    const w = spawn(m, ops(['op1']), { mods: missionMods(m, undefined, 'hardened') })
    expect(w.vision).toBeCloseTo(13.6, 10)
  })

  it('accuracy and movement match clear weather; omni notice is 4.5 m in every weather (AC 9b)', () => {
    const clearDuel = duel(still('none'))
    const clearWalk = walk(still('none'))
    expect(clearDuel.taken).toBeGreaterThan(0)
    expect(clearDuel.dealt).toBeGreaterThan(0)
    for (const weather of WEATHERS) {
      expect(duel(still(weather)), weather).toEqual(clearDuel)
      expect(walk(still(weather)), weather).toEqual(clearWalk)
      expect(notices(still(weather), NOTICE - 0.1), weather).toBe(true)
      expect(notices(still(weather), NOTICE + 0.1), weather).toBe(false)
    }
  })

  it('weapon-noise radius strictly decreases as rain intensity increases (AC 9b / 9c)', () => {
    const none = earshot(still('none'))
    const light = earshot(still('light'))
    const heavy = earshot(still('heavy'))
    expect(none).toBeGreaterThan(light)
    expect(light).toBeGreaterThan(heavy)
  })

  it('a front into heavier rain shortens sight and noise at its fixed time, logs, and leaves the rest alone (AC 9c)', () => {
    const m = front('light', 'heavy')
    const w = spawn(m, ops(['op1']), { mods: missionMods(m) })
    deployReset()
    warm(w, FRONT_AT - 0.1)
    expect(w.weather).toBe('light')
    expect(w.vision).toBeCloseTo(SIGHT.light, 10)
    expect(useMissionStore.getState().log.some((e) => e.msg.includes('WEATHER FRONT'))).toBe(false)
    warm(w, 0.2)
    expect(w.weather).toBe('heavy')
    expect(w.vision).toBeCloseTo(SIGHT.heavy, 10)
    expect(useMissionStore.getState().weather).toBe('heavy')
    expect(useMissionStore.getState().log.filter((e) => e.msg.includes('WEATHER FRONT'))).toHaveLength(1)

    const after = FRONT_AT + 0.1
    expect(earshot(m, after)).toBeLessThan(earshot(m))
    expect(earshot(m, after)).toBeCloseTo(earshot(still('heavy')), 1)
    // The front changes nothing else: same fight and walk as with no front.
    const noFront = still('light')
    expect(duel(m, after)).toEqual(duel(noFront, after))
    expect(walk(m, after)).toEqual(walk(noFront, after))
    expect(notices(m, NOTICE - 0.1, after)).toBe(true)
    expect(notices(m, NOTICE + 0.1, after)).toBe(false)
  })

  it('guards see by the live range: a1 at 11.9 m is seen before a light-to-heavy front, not after (AC 9c)', () => {
    // 11.9 m sits between the heavy (11.2) and light (12.6) cones, so this
    // reads the range the guards actually use, not only the exported field.
    const m = front('light', 'heavy')
    const D = (SIGHT.light + SIGHT.heavy) / 2
    // Window ends at FRONT_AT - 0.1: still light rain throughout.
    expect(notices(m, D, FRONT_AT - 0.7, true)).toBe(true)
    // Window starts at FRONT_AT + 0.1: heavy rain throughout.
    expect(notices(m, D, FRONT_AT + 0.1, true)).toBe(false)
    // Controls: the same spot without a front.
    expect(notices(still('light'), D, FRONT_AT + 0.1, true)).toBe(true)
    expect(notices(still('heavy'), D, FRONT_AT - 0.7, true)).toBe(false)
  })

  it('a front from heavy to light raises sight and carries shots farther (AC 9c edge)', () => {
    const m = front('heavy', 'light')
    const w = spawn(m, ops(['op1']), { mods: missionMods(m) })
    deployReset()
    expect(w.vision).toBeCloseTo(SIGHT.heavy, 10)
    warm(w, FRONT_AT + 0.1)
    expect(w.vision).toBeCloseTo(SIGHT.light, 10)
    expect(useMissionStore.getState().log.some((e) => e.msg.includes('RAIN LIFTS'))).toBe(true)
    expect(earshot(m, FRONT_AT + 0.1)).toBeGreaterThan(earshot(m))
  })
})

// TM-009 (Sprint 8, story 009; TR-tactical-004, ADR-0007): Opening hour is
// presentation only. Two deployments that differ only by Opening hour (dusk
// vs night) under one weather script see, hear and fight the same; only the
// HUD clock reads a different hour.
describe('Opening hour changes no sight or noise (TM-009, AC 10)', () => {
  const DUSK = 18 * 3600 + 30 * 60
  const NIGHT = 23 * 3600 + 5 * 60
  // Scripted front: light rain until 4 s, heavy after.
  const FRONT_AT = 4

  function at(hour: number, front = true): MissionDef {
    return {
      ...MISSION,
      openingHour: hour,
      weather: 'light',
      weatherFront: front ? { to: 'heavy', atSec: FRONT_AT } : undefined,
    }
  }

  it('the two test hours are one dusk and one night opening', () => {
    expect(missionPeriod(DUSK)).toBe('dusk')
    expect(missionPeriod(NIGHT)).toBe('night')
  })

  it('CorpSec sight range is equal at dusk and night, before and after the scripted front', () => {
    const dusk = spawn(at(DUSK), ops(['op1']), { mods: missionMods(at(DUSK)) })
    const night = spawn(at(NIGHT), ops(['op1']), { mods: missionMods(at(NIGHT)) })
    // Pinned GDD literals: light 12.6 m, heavy 11.2 m.
    expect(dusk.vision).toBeCloseTo(12.6, 10)
    expect(night.vision).toBe(dusk.vision)
    deployReset()
    warm(dusk, FRONT_AT + 0.2)
    warm(night, FRONT_AT + 0.2)
    expect(dusk.weather).toBe('heavy')
    expect(night.weather).toBe('heavy')
    expect(dusk.vision).toBeCloseTo(11.2, 10)
    expect(night.vision).toBe(dusk.vision)
  })

  // Does a trooper `d` metres from a1 hear a1's rifle? Same probe shape as
  // TM-008: muzzled target 2 m away, listener past any sight range.
  function hears(m: MissionDef, d: number): boolean {
    const w = spawn(m, ops(['op1']))
    deployReset()
    w.tick(STEP)
    const a1 = w.unit('a1')!
    const guards = w.units
      .filter((u) => u.kind === 'enemy' && (u.archetype ?? 'trooper') === 'trooper')
      .slice(0, 2)
    for (const u of w.units) if (u.kind === 'enemy' && !guards.includes(u)) u.stance = 'dead'
    for (const g of guards) {
      g.path.length = 0
      g.patrol!.length = 0
      g.holdGround = true
    }
    const [target, listener] = guards
    const inward = a1.pos.x < w.city.size / 2 ? 1 : -1
    target.pos.x = a1.pos.x
    target.pos.z = a1.pos.z - 2
    target.reloading = 999
    listener.pos.x = a1.pos.x + inward * d
    listener.pos.z = a1.pos.z
    w.orderAttack(['a1'], target.id)
    expect(runUntil(w, () => w.tracers.length > 0, 3)).toBe(true)
    warm(w, 0.4)
    return listener.aiState !== 'patrol'
  }

  it('weapon noise carries the same distance at dusk and night', () => {
    const heard: boolean[] = []
    for (let d = 15; d <= 30; d += 1) {
      const dusk = hears(at(DUSK, false), d)
      expect(hears(at(NIGHT, false), d), d + ' m').toBe(dusk)
      heard.push(dusk)
    }
    // The sweep crosses the earshot edge, so it can tell two radii apart.
    expect(heard).toContain(true)
    expect(heard).toContain(false)
  })

  // Every unit's state after a scripted 20 s fight through the front.
  function fight(hour: number) {
    const m = at(hour)
    const w = spawn(m, ops(['op1', 'op2', 'op3']), { mods: missionMods(m) })
    deployReset()
    w.tick(STEP)
    const centre = { x: w.city.size / 2, z: w.city.size / 2 }
    w.orderMove(['a1', 'a2', 'a3'], centre)
    warm(w, 20)
    const store = useMissionStore.getState()
    return {
      units: w.units.map((u) => ({
        id: u.id,
        x: u.pos.x,
        z: u.pos.z,
        hp: u.hp,
        stance: u.stance,
        aiState: u.aiState,
        alerted: u.alerted,
      })),
      vision: w.vision,
      weather: w.weather,
      alert: store.alert,
      log: store.log.map((e) => e.who + '|' + e.msg),
      clock: store.clock,
    }
  }

  it('a dusk and a night deployment play out identically; only the HUD clock differs', () => {
    const dusk = fight(DUSK)
    const night = fight(NIGHT)
    const { clock: duskClock, ...duskRest } = dusk
    const { clock: nightClock, ...nightRest } = night
    expect(nightRest).toEqual(duskRest)
    // The run is a real contact through the front, not an empty walk.
    expect(dusk.log.some((l) => l.includes('WEATHER FRONT'))).toBe(true)
    expect(dusk.log.some((l) => l.includes('Hostile neutralized'))).toBe(true)
    // The clock ticks from each Opening hour; ~20 s have passed.
    expect(duskClock.startsWith('18:30:2')).toBe(true)
    expect(nightClock.startsWith('23:05:2')).toBe(true)
  })
})

// TM-010 (Sprint 8, story 010; TR-tactical-006, ADR-0016): civiliansHit
// counts N, the bystanders the squad's own fire struck at least once. A
// first hit counts, not a death; a repeat on the same body never stacks;
// CorpSec rounds are recorded in telemetry only.
describe('civiliansHit counts unique squad-caused civilian first-hits (TM-010, AC 11 / 12 / 13)', () => {
  const TOUGH = 100000

  // One live enemy, pinned where it stands, the rest of the garrison dead.
  function isolate(w: WorldApi, at: Vec2, muzzled: boolean) {
    const enemy = w.units.find((u) => u.kind === 'enemy')!
    for (const u of w.units) if (u.kind === 'enemy' && u !== enemy) u.stance = 'dead'
    enemy.pos.x = at.x
    enemy.pos.z = at.z
    enemy.path.length = 0
    enemy.patrol!.length = 0
    enemy.holdGround = true
    enemy.hp = TOUGH
    enemy.maxHp = TOUGH
    if (muzzled) enemy.reloading = 999
    return enemy
  }

  // Keeps the first `n` civilians, pinned and too tough to drop; every other
  // bystander is removed so nobody wanders onto the lane mid-test.
  function bystanders(w: WorldApi, spots: Vec2[]) {
    const civs = w.units.filter((u) => u.kind === 'civilian')
    expect(civs.length).toBeGreaterThanOrEqual(spots.length)
    civs.slice(spots.length).forEach((c) => (c.stance = 'dead'))
    return spots.map((at, i) => {
      const c = civs[i]
      c.pos.x = at.x
      c.pos.z = at.z
      c.path.length = 0
      c.holdGround = true
      c.hp = TOUGH
      c.maxHp = TOUGH
      return c
    })
  }

  const billedLines = () =>
    useMissionStore.getState().log.filter((e) => e.msg.startsWith('CIVILIAN HIT. COLLATERAL COUNT'))

  // Ticks until `u` has been struck `n` more times (hp drops counted).
  function untilStruck(w: WorldApi, u: Unit, n: number, maxSec: number): number {
    let last = u.hp
    let strikes = 0
    runUntil(
      w,
      () => {
        if (u.hp < last) {
          strikes += 1
          last = u.hp
        }
        return strikes >= n
      },
      maxSec,
    )
    return strikes
  }

  it('a squad miss carried past the target into a civilian counts 1 on the first hit, not a death (AC 11)', () => {
    const w = spawn(BARE_MISSION, ops(['op1']))
    deployReset()
    warm(w, 1.2)
    const a1 = w.unit('a1')!
    const enemy = isolate(w, { x: a1.pos.x, z: a1.pos.z - 4 }, true)
    // Behind the target: a hit stops on the target, so only a missed round
    // that keeps travelling down the lane can reach this body.
    const [civ] = bystanders(w, [{ x: a1.pos.x, z: a1.pos.z - 6 }])
    expect(hasLos(w.city, a1.pos, civ.pos)).toBe(true)

    w.orderAttack(['a1'], enemy.id)
    expect(untilStruck(w, civ, 1, 30)).toBe(1)
    expect(civ.stance).not.toBe('dead')
    expect(civ.hp).toBeGreaterThan(0)
    expect(useMissionStore.getState().civiliansHit).toBe(1)
    expect(billedLines().map((e) => e.msg)).toEqual(['CIVILIAN HIT. COLLATERAL COUNT 1.'])
  })

  it('the squad striking the same civilian again does not raise the count (AC 12)', () => {
    const w = spawn(BARE_MISSION, ops(['op1']))
    deployReset()
    warm(w, 1.2)
    const a1 = w.unit('a1')!
    const enemy = isolate(w, { x: a1.pos.x, z: a1.pos.z - 4 }, true)
    // Square on the lane short of the target: hits and misses both wear it.
    const [civ] = bystanders(w, [{ x: a1.pos.x, z: a1.pos.z - 2 }])

    w.orderAttack(['a1'], enemy.id)
    expect(untilStruck(w, civ, 1, 30)).toBe(1)
    expect(useMissionStore.getState().civiliansHit).toBe(1)
    expect(untilStruck(w, civ, 3, 30)).toBe(3)
    expect(useMissionStore.getState().civiliansHit).toBe(1)
    expect(billedLines()).toHaveLength(1)
  })

  it('CorpSec-only civilian harm leaves the count at 0, in the store and the outcome (AC 13)', () => {
    const w = spawn(BARE_MISSION, ops(['op1']))
    deployReset()
    warm(w, 1.2)
    const a1 = w.unit('a1')!
    a1.hp = TOUGH
    a1.maxHp = TOUGH
    w.orderHoldFire(['a1'], true)
    w.orderHold(['a1'], true)
    const enemy = isolate(w, { x: a1.pos.x, z: a1.pos.z - 4 }, false)
    enemy.reloading = 0
    const [civ] = bystanders(w, [{ x: a1.pos.x, z: a1.pos.z - 2 }])

    expect(untilStruck(w, civ, 2, 60)).toBe(2)
    expect(useMissionStore.getState().civiliansHit).toBe(0)
    expect(billedLines()).toHaveLength(0)

    // Step the bystander off the lane and let CorpSec finish the operative:
    // the Loss outcome still carries N = 0, and telemetry keeps the CorpSec
    // hits on their own counter.
    civ.pos.x = a1.pos.x + 6
    a1.hp = 1
    a1.maxHp = 100
    expect(runUntil(w, () => useMissionStore.getState().result === 'lost', 60)).toBe(true)
    warm(w, 3)
    const out = useAppStore.getState().outcome
    expect(out?.won).toBe(false)
    expect(out?.civiliansHit).toBe(0)
    expect(out?.telemetry?.civilianHitsBySquad).toBe(0)
    expect(out?.telemetry?.civilianHitsByCorpsec ?? 0).toBeGreaterThanOrEqual(2)
  })

  it('one squad grenade on two civilians counts 2, once each; a second blast adds nothing (edge cases)', () => {
    // The tech role carries a second power cell, so two grenades are in stock.
    const w = spawn(BARE_MISSION, ops(['op1', 'op6']))
    deployReset()
    w.tick(STEP)
    for (const u of w.units) if (u.kind === 'enemy') u.stance = 'dead'
    const a1 = w.unit('a1')!
    const at = { x: a1.pos.x, z: a1.pos.z - 3 }
    const [c1, c2] = bystanders(w, [at, { x: at.x, z: at.z - 0.5 }])

    expect(w.orderGrenade('a1', at)).toBe(true)
    expect(c1.hp).toBeLessThan(TOUGH)
    expect(c2.hp).toBeLessThan(TOUGH)
    expect(useMissionStore.getState().civiliansHit).toBe(2)

    // Past the cooldown, the same two bystanders take a second blast.
    const hp1 = c1.hp
    const hp2 = c2.hp
    warm(w, 5)
    expect(w.orderGrenade('a1', at)).toBe(true)
    expect(c1.hp).toBeLessThan(hp1)
    expect(c2.hp).toBeLessThan(hp2)
    expect(useMissionStore.getState().civiliansHit).toBe(2)
    expect(billedLines()).toHaveLength(2)
  })

  it('a Loss still emits N on the outcome (edge case)', () => {
    const w = spawn(BARE_MISSION, ops(['op1']))
    deployReset()
    w.tick(STEP)
    for (const u of w.units) if (u.kind === 'enemy') u.stance = 'dead'
    const a1 = w.unit('a1')!
    // The operative's own grenade at their feet wipes the squad and strikes
    // the bystander beside them in the same blast.
    bystanders(w, [{ x: a1.pos.x, z: a1.pos.z - 1 }])
    a1.hp = 1
    expect(w.orderGrenade('a1', { x: a1.pos.x, z: a1.pos.z })).toBe(true)
    expect(a1.stance).toBe('dead')
    w.tick(STEP)
    expect(useMissionStore.getState().result).toBe('lost')
    warm(w, 3)
    const out = useAppStore.getState().outcome
    expect(out?.won).toBe(false)
    expect(out?.civiliansHit).toBe(1)
  })
})

// TM-011 (Sprint 8, story 011; TR-tactical-006, ADR-0016): a missed round
// keeps travelling down the fire lane, and cover between the shooter and a
// body on that lane takes the round instead (AC 14). The hit roll is
// `clamp((0.78 - 0.28 * d/r + (u - 0.5) * 0.1) * a, 0.05, 0.95)` (AC 25).
describe('cover interrupts the fire lane; hit chance formula (TM-011, AC 14 / 25)', () => {
  const TOUGH = 100000

  // One squad shooter facing one pinned, muzzled enemy 4 m north, with one
  // pinned bystander 6 m north: behind the target, so only a miss reaches it.
  function missLane(covered: boolean) {
    const w = spawn(BARE_MISSION, ops(['op1']))
    deployReset()
    warm(w, 1.2)
    const a1 = w.unit('a1')!
    const enemy = w.units.find((u) => u.kind === 'enemy')!
    for (const u of w.units) if (u.kind === 'enemy' && u !== enemy) u.stance = 'dead'
    Object.assign(enemy.pos, { x: a1.pos.x, z: a1.pos.z - 4 })
    enemy.path.length = 0
    enemy.patrol!.length = 0
    enemy.holdGround = true
    enemy.reloading = 999
    enemy.hp = TOUGH
    enemy.maxHp = TOUGH
    const civs = w.units.filter((u) => u.kind === 'civilian')
    civs.slice(1).forEach((c) => (c.stance = 'dead'))
    const civ = civs[0]
    Object.assign(civ.pos, { x: a1.pos.x, z: a1.pos.z - 6 })
    civ.path.length = 0
    civ.holdGround = true
    civ.hp = TOUGH
    civ.maxHp = TOUGH
    if (covered) {
      // Close the bystander's own cell: the sight line to the target stays
      // open, the one to the body behind it does not.
      w.city.walk[Math.floor(civ.pos.z) * w.city.size + Math.floor(civ.pos.x)] = 0
    }
    expect(hasLos(w.city, a1.pos, enemy.pos)).toBe(true)
    expect(hasLos(w.city, a1.pos, civ.pos)).toBe(!covered)
    return { w, a1, enemy, civ }
  }

  // Ticks `seconds` with a1 attacking; counts shots fired and the enemy's hits.
  function fireFor(w: WorldApi, a1: Unit, enemy: Unit, seconds: number) {
    w.orderAttack(['a1'], enemy.id)
    let shots = 0
    let hits = 0
    let mag = a1.magazine
    let hp = enemy.hp
    const until = w.time + seconds
    while (w.time < until) {
      w.tick(STEP)
      if (a1.magazine < mag) shots += mag - a1.magazine
      mag = a1.magazine
      if (enemy.hp < hp) hits += 1
      hp = enemy.hp
    }
    return { shots, hits }
  }

  it('with no cover, a miss carried past the target strikes the body behind it (AC 14 control)', () => {
    const { w, a1, enemy, civ } = missLane(false)
    const { shots, hits } = fireFor(w, a1, enemy, 30)
    expect(hits).toBeLessThan(shots)
    expect(civ.hp).toBeLessThan(TOUGH)
  })

  it('cover between the shooter and a body on the lane stops a miss: that body is not hit (AC 14)', () => {
    const { w, a1, enemy, civ } = missLane(true)
    const { shots, hits } = fireFor(w, a1, enemy, 30)
    // Rounds did miss and carry on down the lane, yet none reached the body.
    expect(shots).toBeGreaterThan(0)
    expect(hits).toBeLessThan(shots)
    expect(civ.hp).toBe(TOUGH)
    expect(civ.stance).not.toBe('dead')
    expect(useMissionStore.getState().civiliansHit).toBe(0)
  })

  it('at half range with zero jitter: 64% for an operative, 28.8% for Standard CorpSec (AC 25)', () => {
    expect(hitChance(0.5, 0.5, 1.0)).toBeCloseTo(0.64, 10)
    expect(hitChance(0.5, 0.5, 0.45)).toBeCloseTo(0.288, 10)
  })

  it('at half range with zero jitter: 31.68% for Hardened CorpSec, a = 0.495 (AC R5-a)', () => {
    expect(0.45 * DIFFICULTY_FX.hardened.enemyAccMul).toBeCloseTo(0.495, 10)
    expect(hitChance(0.5, 0.5, 0.495)).toBeCloseTo(0.3168, 10)
    expect(hitChance(0.5, 0.5, 0.45 * DIFFICULTY_FX.hardened.enemyAccMul)).toBeCloseTo(0.3168, 10)
  })

  it('jitter moves the chance by at most ±5 points before the accuracy multiplier (AC 25)', () => {
    expect(hitChance(0.5, 0, 1)).toBeCloseTo(0.59, 10)
    expect(hitChance(0.5, 1, 1)).toBeCloseTo(0.69, 10)
    expect(hitChance(0, 0.5, 1)).toBeCloseTo(0.78, 10)
    expect(hitChance(1, 0.5, 1)).toBeCloseTo(0.5, 10)
  })

  it('clamps to a 5% floor and a 95% ceiling (edge cases)', () => {
    // d = r, lowest jitter, a tiny multiplier: 0.45 * 0.05 = 0.0225 → 0.05.
    expect(hitChance(1, 0, 0.05)).toBe(0.05)
    // Point blank, highest jitter, a large multiplier: 0.83 * 1.5 → 0.95.
    expect(hitChance(0, 1, 1.5)).toBe(0.95)
  })

  it('every shot rolls against this chance, drawing the jitter from the mission rng (seam)', () => {
    // One call site, with the jitter drawn in place, keeps the rng call count
    // and order the determinism tests pin. Deadeye skips only the roll.
    const calls = worldSrc.match(/hitChance\(/g) ?? []
    expect(calls).toHaveLength(2) // the definition and the one shot
    expect(worldSrc).toContain('const chance = hitChance(d / w.range, rng(), accMul)')
    expect(worldSrc).toContain('const hit = deadeye || rng() < chance')
    expect(worldSrc).toContain('tryFire(e, tgt, ENEMY_ACC * mods.enemyAccMul)')
    expect(worldSrc).toMatch(/const ENEMY_ACC = 0\.45\b/)
  })
})

// TM-012 (Sprint 8, story 012; TR-tactical-010, ADR-0016): an eliminate-tag
// objective counts only the Units carrying its tag, so untagged street patrols
// never gate it (AC 15, R5-a); optionals never gate the win (AC 16).
describe('eliminate counts tagged Units only; optionals never gate the win (TM-012, AC 15 / 16 / R5-a)', () => {
  // Keeps an enemy alive but harmless, so it cannot end the run on its own.
  function muzzle(u: Unit): void {
    u.holdFire = true
    u.reloading = 999
    u.alerted = false
    u.path.length = 0
    u.patrol!.length = 0
  }

  function reachGate(w: WorldApi): void {
    const a1 = w.unit('a1')!
    a1.pos.x = w.city.checkpoint.x
    a1.pos.z = w.city.checkpoint.z
    a1.path.length = 0
    w.tick(STEP)
  }

  function extractAll(w: WorldApi): void {
    for (const u of w.units) {
      if (u.kind === 'agent' && u.stance !== 'dead') {
        u.pos.x = w.city.extraction.x
        u.pos.z = w.city.extraction.z
        u.path.length = 0
      }
    }
    w.tick(STEP)
  }

  function enemies(w: WorldApi) {
    const all = w.units.filter((u) => u.kind === 'enemy')
    return {
      garrison: all.filter((u) => u.tag === 'garrison'),
      untagged: all.filter((u) => u.tag === undefined),
    }
  }

  it('every garrison Unit dead with an untagged street patrol alive completes eliminate and the win (AC 15)', () => {
    expect(MISSION.objectives[1]).toMatchObject({ kind: 'eliminate-tag', tag: 'garrison' })
    const w = spawn(MISSION, ops(DEFAULT_SQUAD))
    deployReset()
    w.tick(STEP)
    const { garrison, untagged } = enemies(w)
    expect(garrison.length).toBeGreaterThan(0)
    expect(untagged.length).toBeGreaterThan(0)

    reachGate(w)
    expect(useMissionStore.getState().objectives[1].active).toBe(true)

    for (const u of garrison) u.stance = 'dead'
    const patrol = untagged[0]
    muzzle(patrol)
    w.tick(STEP)
    expect(patrol.stance).not.toBe('dead')
    let rows = useMissionStore.getState().objectives
    expect(rows[1].done).toBe(true)
    expect(rows[2].active).toBe(true)

    extractAll(w)
    rows = useMissionStore.getState().objectives
    expect(rows.every((o) => o.done)).toBe(true)
    expect(useMissionStore.getState().result).toBe('won')
    expect(patrol.stance).not.toBe('dead')
  })

  it('every untagged patrol dead with one garrison Unit alive leaves eliminate open and no win (AC R5-a)', () => {
    const w = spawn(MISSION, ops(DEFAULT_SQUAD))
    deployReset()
    w.tick(STEP)
    const { garrison, untagged } = enemies(w)
    expect(garrison.length).toBeGreaterThan(1)
    expect(untagged.length).toBeGreaterThan(0)

    reachGate(w)
    for (const u of untagged) u.stance = 'dead'
    for (const u of garrison.slice(1)) u.stance = 'dead'
    const holdout = garrison[0]
    muzzle(holdout)
    w.tick(STEP)
    expect(holdout.stance).not.toBe('dead')
    let rows = useMissionStore.getState().objectives
    expect(rows[1].done).toBe(false)
    expect(rows[1].active).toBe(true)
    expect(rows[2].active).toBe(false)

    // Standing on the pad does not skip the open eliminate step.
    extractAll(w)
    warm(w, 1)
    rows = useMissionStore.getState().objectives
    expect(rows[1].done).toBe(false)
    expect(rows[2].done).toBe(false)
    expect(useMissionStore.getState().result).toBe('none')
  })

  it('every required objective done with one optional ignored and one failed is a Win at bonus 0 (AC 16)', () => {
    // Both optionals precede the first required step, so they go live at
    // insertion; their zones sit in a far corner no agent walks to.
    const far: Zone = { x: 2, z: 2, r: 1 }
    const ignored: ObjectiveDef = {
      id: 'opt-ignored',
      label: 'IGNORED SIDE JOB',
      kind: 'interact',
      zone: far,
      durationSec: 5,
      optional: true,
      bonusReward: 9000,
    }
    const failed: ObjectiveDef = {
      id: 'opt-failed',
      label: 'FAILED SIDE JOB',
      kind: 'interact',
      zone: far,
      durationSec: 5,
      optional: true,
      bonusReward: 6000,
      failSec: 1,
    }
    const m: MissionDef = { ...MISSION, objectives: [ignored, failed, ...MISSION.objectives] }
    const w = spawn(m, ops(DEFAULT_SQUAD))
    deployReset()
    w.tick(STEP)
    for (const u of w.units) if (u.kind === 'enemy') u.stance = 'dead'

    // Let the optional's fail window close: it fails, the mission does not.
    warm(w, 1.5)
    let rows = useMissionStore.getState().objectives
    expect(rows[1]).toMatchObject({ id: 'opt-failed', failed: true, done: false })
    expect(useMissionStore.getState().result).toBe('none')

    reachGate(w)
    w.tick(STEP)
    extractAll(w)
    rows = useMissionStore.getState().objectives
    expect(rows[0]).toMatchObject({ id: 'opt-ignored', done: false, failed: false })
    expect(rows[1]).toMatchObject({ id: 'opt-failed', done: false, failed: true })
    expect(rows.filter((o) => !o.optional).every((o) => o.done)).toBe(true)
    expect(useMissionStore.getState().result).toBe('won')

    warm(w, 3)
    const out = useAppStore.getState().outcome
    expect(out?.won).toBe(true)
    // No optional completed, so the outcome prices no bonus.
    expect(useMissionStore.getState().log.some((e) => e.msg.includes('BONUS SECURED'))).toBe(false)
    expect(out?.bonus).toBe(0)
    expect(out ? netPayout(out) : -1).toBe(MISSION.reward)
  })
})

// TM-013 (Sprint 8, story 013; TR-tactical-010, ADR-0002, ADR-0021): Loss on a
// wipe, a required VIP death or a required timer (AC 17); the same-step
// tiebreak (R5-a); a Loss still emits its counters (R5-b); an optional timer
// fails only itself (R5-c). Abort (AC 18) is covered in src/state/appStore.test.ts.
describe('loss conditions and the same-step tiebreak (TM-013, AC 17 / R5-a / R5-b / R5-c)', () => {
  const HOLLOW_CROWN = MISSIONS[1]
  const TOUGH = 100000
  const ELIMINATE: ObjectiveDef = {
    id: 'clear',
    label: 'CLEAR THE GARRISON',
    kind: 'eliminate-tag',
    tag: 'garrison',
  }

  function put(u: { pos: Vec2; path: Vec2[] }, at: Vec2): void {
    u.pos.x = at.x
    u.pos.z = at.z
    u.path.length = 0
  }

  // Keeps a Unit alive, pinned and harmless.
  function pin(u: Unit, hp: number): void {
    u.holdFire = true
    u.holdGround = true
    u.reloading = 999
    u.alerted = false
    u.path.length = 0
    if (u.patrol) u.patrol.length = 0
    u.hp = hp
    u.maxHp = Math.max(hp, 1)
  }

  // Every enemy dead except one garrison holdout, which is returned.
  function lastGarrison(w: WorldApi): Unit {
    const garrison = w.units.filter((u) => u.kind === 'enemy' && u.tag === 'garrison')
    expect(garrison.length).toBeGreaterThan(0)
    const holdout = garrison[0]
    for (const u of w.units) if (u.kind === 'enemy' && u !== holdout) u.stance = 'dead'
    return holdout
  }

  // Where operative a1 inserts on `m`'s city (deterministic from the seed).
  function insertion(m: MissionDef): Vec2 {
    const probe = spawn({ ...m, objectives: [] }, ops(['op1']))
    const a1 = probe.unit('a1')!
    return { x: a1.pos.x, z: a1.pos.z }
  }

  const logHas = (s: string) => useMissionStore.getState().log.some((e) => e.msg.includes(s))

  it('AC 17a: no living operative left is a Loss, and the outcome reads won === false', () => {
    const w = spawn(MISSION, ops(DEFAULT_SQUAD))
    deployReset()
    w.tick(STEP)
    for (const u of w.units) if (u.kind === 'agent') u.stance = 'dead'
    w.tick(STEP)
    expect(useMissionStore.getState().result).toBe('lost')
    expect(logHas('SQUAD ELIMINATED')).toBe(true)
    warm(w, 3)
    expect(useAppStore.getState().outcome?.won).toBe(false)
  })

  it('AC 17b: the required escort VIP dying is a Loss with a living squad, and the outcome reads won === false', () => {
    expect(HOLLOW_CROWN.objectives.some((d) => d.kind === 'escort' && !d.optional)).toBe(true)
    const w = spawn(HOLLOW_CROWN, ops(DEFAULT_SQUAD))
    deployReset()
    w.tick(STEP)
    const vip = w.units.find((u) => u.kind === 'vip')!
    const a1 = w.unit('a1')!
    put(a1, { x: vip.pos.x + 5, z: vip.pos.z })
    expect(w.orderGrenade('a1', { x: vip.pos.x, z: vip.pos.z })).toBe(true)
    expect(vip.stance).toBe('dead')
    expect(w.units.some((u) => u.kind === 'agent' && u.stance !== 'dead')).toBe(true)
    expect(useMissionStore.getState().result).toBe('lost')
    expect(logHas('THE ASSET IS DEAD')).toBe(true)
    warm(w, 3)
    expect(useAppStore.getState().outcome?.won).toBe(false)
  })

  it('AC 17c: a required time limit expiring is a Loss, and the outcome reads won === false', () => {
    const m: MissionDef = {
      ...MISSION,
      objectives: [{ id: 'drop', label: 'REACH THE DROP', kind: 'reach-zone', zone: { x: 2, z: 2, r: 1 }, failSec: 2 }],
    }
    const w = spawn(m, ops(DEFAULT_SQUAD))
    deployReset()
    w.tick(STEP)
    for (const u of w.units) if (u.kind === 'enemy') u.stance = 'dead'
    warm(w, 1.5)
    expect(useMissionStore.getState().result).toBe('none')
    warm(w, 1)
    expect(useMissionStore.getState().result).toBe('lost')
    expect(useMissionStore.getState().objectives[0].failed).toBe(true)
    expect(w.units.some((u) => u.kind === 'agent' && u.stance !== 'dead')).toBe(true)
    warm(w, 3)
    expect(useAppStore.getState().outcome?.won).toBe(false)
  })

  it('R5-a: the last operative dying in the step the last required objective completes is a Win; the dead grade KIA', () => {
    const m: MissionDef = { ...MISSION, objectives: [ELIMINATE] }
    const w = spawn(m, ops(['op1']))
    deployReset()
    w.tick(STEP)
    const a1 = w.unit('a1')!
    const holdout = lastGarrison(w)
    // One squad grenade at the operative's feet drops both the last garrison
    // Unit (the last required objective) and the last operative.
    put(holdout, a1.pos)
    pin(holdout, 1)
    a1.hp = 1
    expect(w.orderGrenade('a1', { x: a1.pos.x, z: a1.pos.z })).toBe(true)
    expect(a1.stance).toBe('dead')
    expect(holdout.stance).toBe('dead')
    expect(useMissionStore.getState().result).toBe('none')

    w.tick(STEP)
    expect(useMissionStore.getState().result).toBe('won')
    expect(logHas('SQUAD ELIMINATED')).toBe(false)
    warm(w, 3)
    const out = useAppStore.getState().outcome
    expect(out?.won).toBe(true)
    expect(out?.deadIds).toEqual(['op1'])
    expect(out?.casualties).toBe(1)
    expect(out?.survivorHp).toEqual({})
  })

  it('R5-a control: the same blast with the garrison holdout surviving is a Loss', () => {
    const m: MissionDef = { ...MISSION, objectives: [ELIMINATE] }
    const w = spawn(m, ops(['op1']))
    deployReset()
    w.tick(STEP)
    const a1 = w.unit('a1')!
    const holdout = lastGarrison(w)
    put(holdout, a1.pos)
    pin(holdout, TOUGH)
    a1.hp = 1
    expect(w.orderGrenade('a1', { x: a1.pos.x, z: a1.pos.z })).toBe(true)
    expect(a1.stance).toBe('dead')
    expect(holdout.stance).not.toBe('dead')
    w.tick(STEP)
    expect(useMissionStore.getState().result).toBe('lost')
  })

  it('R5-a: a required VIP death in the same blast that wipes the squad and drops the last garrison Unit is a Loss', () => {
    const m: MissionDef = {
      ...HOLLOW_CROWN,
      objectives: [ELIMINATE, ...HOLLOW_CROWN.objectives.filter((d) => d.kind === 'escort' && !d.optional)],
    }
    expect(m.objectives).toHaveLength(2)
    const w = spawn(m, ops(['op1']))
    deployReset()
    w.tick(STEP)
    const a1 = w.unit('a1')!
    const vip = w.units.find((u) => u.kind === 'vip')!
    const holdout = lastGarrison(w)
    put(holdout, a1.pos)
    pin(holdout, 1)
    put(vip, a1.pos)
    vip.hp = 1
    a1.hp = 1
    expect(w.orderGrenade('a1', { x: a1.pos.x, z: a1.pos.z })).toBe(true)
    expect([a1.stance, holdout.stance, vip.stance]).toEqual(['dead', 'dead', 'dead'])
    // The VIP death decides the step: the Loss lands before the eliminate
    // completion can be counted.
    expect(useMissionStore.getState().result).toBe('lost')
    w.tick(STEP)
    expect(useMissionStore.getState().result).toBe('lost')
    expect(logHas('THE ASSET IS DEAD')).toBe(true)
    warm(w, 3)
    expect(useAppStore.getState().outcome?.won).toBe(false)
  })

  it('R5-a: a required time limit expiring in the step its objective would complete is a Loss', () => {
    const at = insertion(MISSION)
    const zone: Zone = { x: at.x, z: at.z, r: 2 }
    const drop: ObjectiveDef = { id: 'drop', label: 'REACH THE DROP', kind: 'reach-zone', zone }

    // Control: with no time limit the operative stands in the zone and wins on step 1.
    const open = spawn({ ...MISSION, objectives: [drop] }, ops(['op1']))
    deployReset()
    open.tick(STEP)
    expect(useMissionStore.getState().result).toBe('won')

    // A window shorter than one step closes in that same step: Loss.
    const w = spawn({ ...MISSION, objectives: [{ ...drop, failSec: 0.01 }] }, ops(['op1']))
    deployReset()
    w.tick(STEP)
    const s = useMissionStore.getState()
    expect(s.result).toBe('lost')
    expect(s.objectives[0]).toMatchObject({ done: false, failed: true })
    expect(logHas('THE WINDOW CLOSED')).toBe(true)
  })

  it('R5-b: a Loss emits the outcome DTO with won=false, civiliansHit and the completed optional ids', () => {
    const at = insertion(MISSION)
    const near: ObjectiveDef = {
      id: 'opt-near',
      label: 'TAG THE DROP',
      kind: 'reach-zone',
      zone: { x: at.x, z: at.z, r: 2 },
      optional: true,
      bonusReward: 4000,
    }
    const far: ObjectiveDef = {
      id: 'opt-far',
      label: 'FAR SIDE JOB',
      kind: 'interact',
      zone: { x: 2, z: 2, r: 1 },
      durationSec: 5,
      optional: true,
      bonusReward: 7000,
    }
    const m: MissionDef = { ...MISSION, objectives: [near, far, ELIMINATE] }
    const w = spawn(m, ops(['op1']))
    deployReset()
    w.tick(STEP)
    expect(useMissionStore.getState().objectives[0].done).toBe(true)
    const a1 = w.unit('a1')!
    const holdout = lastGarrison(w)
    pin(holdout, TOUGH)
    // One bystander beside the operative takes the squad's own blast.
    const civs = w.units.filter((u) => u.kind === 'civilian')
    expect(civs.length).toBeGreaterThan(0)
    civs.slice(1).forEach((c) => (c.stance = 'dead'))
    put(civs[0], { x: a1.pos.x, z: a1.pos.z })
    civs[0].hp = TOUGH
    civs[0].maxHp = TOUGH
    a1.hp = 1
    expect(w.orderGrenade('a1', { x: a1.pos.x, z: a1.pos.z })).toBe(true)
    w.tick(STEP)
    expect(useMissionStore.getState().result).toBe('lost')

    warm(w, 3)
    const out = useAppStore.getState().outcome
    expect(out).not.toBeNull()
    expect(out?.won).toBe(false)
    expect(out?.civiliansHit).toBe(1)
    // The stored outcome is the Economy-priced DTO: the emitted completed
    // optional ids survive as the bonus priced from exactly those ids (4000
    // for opt-near; opt-far's 7000 absent), stored on a loss and paid as 0.
    expect(out?.bonus).toBe(4000)
    expect(out ? netPayout(out) : -1).toBe(0)
    expect(out?.telemetry?.objectiveTimes.map((o) => o.id)).toEqual(['opt-near'])
  })

  it('R5-c: an optional time limit expiring fails only that optional, is not a Loss, and does not gate the required sequence', () => {
    const timedOpt: ObjectiveDef = {
      id: 'opt-timed',
      label: 'PULL THE SERVER',
      kind: 'interact',
      zone: { x: 2, z: 2, r: 1 },
      durationSec: 5,
      optional: true,
      failSec: 1,
    }
    const m: MissionDef = { ...MISSION, objectives: [timedOpt, ELIMINATE] }
    const w = spawn(m, ops(['op1']))
    deployReset()
    w.tick(STEP)
    const holdout = lastGarrison(w)
    pin(holdout, TOUGH)

    expect(runUntil(w, () => useMissionStore.getState().objectives[0].failed === true, 10)).toBe(true)
    let s = useMissionStore.getState()
    expect(s.result).toBe('none')
    expect(s.objectives[1]).toMatchObject({ id: 'clear', active: true, done: false, failed: false })
    expect(logHas('THE WINDOW CLOSED')).toBe(false)

    // The required step still completes, and the mission is a Win.
    holdout.stance = 'dead'
    w.tick(STEP)
    s = useMissionStore.getState()
    expect(s.objectives[1].done).toBe(true)
    expect(s.result).toBe('won')
    warm(w, 3)
    expect(useAppStore.getState().outcome?.won).toBe(true)
  })
})

// TM-014 (Sprint 8, story 014; ADR-0009, TR-tactical-011 / TR-tactical-001):
// a quiet replay is still a real mission, and the deploy freeze holds against
// mid-mission research, pin and Experience changes and a weather front.
describe('deploy freeze: quiet replay outcome and the frozen slices (TM-014, AC 19 / 20a / 20b)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  // Starts each project on its lab at t = 0; they stay active until finish().
  function startLabs(...ids: string[]): void {
    for (const id of ids) expect(useResearchStore.getState().start(nodeById(id), 0)).toBe(true)
  }

  // Syncs past every running lab's endT, so each active project completes.
  function finish(): void {
    useResearchStore.getState().sync(1e9)
  }

  function setRoster(id: string, patch: { xp?: number; pins?: Record<string, string> }): void {
    const roster = useCampaignStore.getState().roster
    useCampaignStore.setState({ roster: { ...roster, [id]: { ...roster[id], ...patch } } })
  }

  function weaponStats(w: WorldApi, id: string) {
    const wp = w.unit(id)?.weapon
    return wp && { damage: wp.damage, spread: wp.spread, cooldown: wp.cooldown, reload: wp.reload, range: wp.range }
  }

  it('AC 19: an already-won authored contract replayed to a Win enters Debrief with one outcome stamped quietReplay true', () => {
    useCampaignStore.setState({ contractsWon: [MISSION.id] })
    const squad = ops(['op1'])
    const deploy = freezeDeploy(MISSION, squad, 1)
    expect(deploy.economy.quietReplay).toBe(true)

    // Same authored mission id and seed, with one reach-zone objective on the
    // insertion point, so the replay can be finished in a few ticks.
    const probe = createWorld(BARE_MISSION, squad, deploy)
    const at = probe.unit('a1')!.pos
    const m: MissionDef = {
      ...MISSION,
      objectives: [{ id: 'drop', label: 'REACH THE DROP', kind: 'reach-zone', zone: { x: at.x, z: at.z, r: 3 } }],
    }
    const w = createWorld(m, squad, deploy)
    deployReset()
    useAppStore.setState({ phase: 'mission', outcome: null })
    let outcomes = 0
    const unsub = useAppStore.subscribe((s, prev) => {
      if (s.outcome !== prev.outcome && s.outcome) outcomes++
    })
    try {
      w.tick(STEP)
      // Live contractsWon changes mid-mission; the frozen boolean must not follow it.
      useCampaignStore.setState({ contractsWon: [] })
      expect(runUntil(w, () => useMissionStore.getState().result !== 'none', 5)).toBe(true)
      expect(useMissionStore.getState().result).toBe('won')
      warm(w, 3)
    } finally {
      unsub()
    }
    expect(useAppStore.getState().phase).toBe('debrief')
    expect(outcomes).toBe(1)
    const outcome = useAppStore.getState().outcome
    expect(outcome?.won).toBe(true)
    expect(outcome?.quietReplay).toBe(true)
    expect(outcome?.applyKey).toBe(1)
  })

  it('AC 20a: research completion, a pin change and new Experience after create leave weapons, HP, speed and the Research slice at the freeze', () => {
    useResearchStore.setState({ done: ['b-propellants', 'c-synaptic'] })
    startLabs('b-coating', 'c-interface')
    setRoster('op1', { xp: 2 })
    const squad = ops(['op1'])
    const deploy = freezeDeploy(MISSION, squad, 1)
    const research = deploy.research.slice()
    const w = createWorld(BARE_MISSION, squad, deploy)
    deployReset()
    const a1 = w.unit('a1')!
    const weapon = weaponStats(w, 'a1')
    const maxHp = a1.maxHp
    const hp = a1.hp
    const speed = a1.speed
    expect(maxHp).toBe(deploy.roster.maxHp.op1)

    finish()
    setRoster('op1', { xp: 5, pins: { CHEST: 'STOCK' } })
    expect(useResearchStore.getState().done).toEqual(['b-propellants', 'c-synaptic', 'b-coating', 'c-interface'])
    warm(w, 1)

    expect(weaponStats(w, 'a1')).toEqual(weapon)
    expect(a1.maxHp).toBe(maxHp)
    expect(a1.hp).toBe(hp)
    expect(a1.speed).toBe(speed)
    expect(deploy.research).toEqual(research)

    // The changes are real: the next freeze samples three more Experience points.
    const next = freezeDeploy(MISSION, squad, 2)
    expect(next.roster.maxHp.op1).not.toBe(deploy.roster.maxHp.op1)
    expect(next.research).toEqual(['b-propellants', 'b-coating'])
  })

  it('AC 20b: a weather front retunes sight and does not re-sample Research', () => {
    const FRONT_AT = 5
    const m: MissionDef = { ...BARE_MISSION, weather: 'light', weatherFront: { to: 'heavy', atSec: FRONT_AT } }
    useResearchStore.setState({ done: [] })
    startLabs('b-propellants')
    const squad = ops(['op1'])
    const deploy = freezeDeploy(m, squad, 1)
    const w = createWorld(m, squad, deploy)
    deployReset()
    const weapon = weaponStats(w, 'a1')
    const research = deploy.research.slice()
    // Pinned GDD sight literals (tactical-mission §9): light 12.6 m, heavy 11.2 m.
    expect(w.vision).toBeCloseTo(12.6, 10)

    // Research lands before the front; only then does the store read get watched.
    finish()
    expect(useResearchStore.getState().done).toEqual(['b-propellants'])
    const read = vi.spyOn(useResearchStore, 'getState')
    warm(w, FRONT_AT + 0.5)

    expect(w.weather).toBe('heavy')
    expect(w.vision).toBeCloseTo(11.2, 10)
    expect(useMissionStore.getState().log.filter((e) => e.msg.includes('WEATHER FRONT'))).toHaveLength(1)
    expect(read).not.toHaveBeenCalled()
    expect(weaponStats(w, 'a1')).toEqual(weapon)
    expect(deploy.research).toEqual(research)
    expect(deploy.research).not.toContain('b-propellants')
  })
})
