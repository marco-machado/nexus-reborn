// Tests for the mission simulation. Everything is deterministic: mission.seed
// drives both the city generator and the in-world rng, and the tests drive
// tick() by hand, so no timers or real clocks are involved.
import { beforeEach, describe, expect, it } from 'vitest'
import type { MissionDef, OperativeDef, Vec2, WorldApi } from './types'
import { createWorld } from './world'
import { DEFAULT_SQUAD, MISSIONS, ROSTER, WEAPONS, operativeById } from './data'
import { MEDIC_REGEN_CAP, ROLE_ABILITIES } from './abilities'
import { useMissionStore } from '../state/missionStore'
import { useAppStore } from '../state/appStore'
import { useResearchStore } from '../state/researchStore'

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

function dist(a: Vec2, b: Vec2): number {
  const dx = b.x - a.x
  const dz = b.z - a.z
  return Math.sqrt(dx * dx + dz * dz)
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
    outcomeSerial: 0,
  })
  useResearchStore.setState({
    done: [],
    labs: { ballistics: null, cybernetics: null, control: null },
  })
})

describe('createWorld', () => {
  it('returns a working WorldApi with one agent per operative def', () => {
    const squadOps = ops(DEFAULT_SQUAD)
    const w = createWorld(MISSION, squadOps)

    expect(w.time).toBe(0)
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
    const w = createWorld(MISSION, ops(['op2', 'op5']))
    const agents = w.units.filter((u) => u.kind === 'agent')
    expect(agents.map((a) => a.name)).toEqual(['L. FERNANDEZ', 'A. OKAFOR'])
    expect(w.unit('a2')).toBeDefined()
    expect(w.unit('a3')).toBeUndefined()
  })

  it('spawns the enemies and civilians the city defines, all on patrol', () => {
    const w = createWorld(MISSION, ops(['op1']))
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
    const w = createWorld(BARE_MISSION, ops(['op1']))
    w.tick(2)
    expect(w.time).toBeCloseTo(0.05, 10)
    w.tick(3)
    expect(w.time).toBeCloseTo(0.1, 10)
    w.tick(0.016)
    expect(w.time).toBeCloseTo(0.116, 10)
  })

  it('clamps a huge delta to MAX_CATCHUP once the mission is underway', () => {
    const w = createWorld(BARE_MISSION, ops(['op1']))
    warm(w, 1.2)
    const t0 = w.time
    w.tick(60)
    expect(w.time - t0).toBeCloseTo(5, 9)
  })

  it('consumes the whole delta in MAX_DT steps instead of dropping the remainder', () => {
    const w = createWorld(BARE_MISSION, ops(['op1']))
    warm(w, 1.2)
    let t0 = w.time
    w.tick(0.07)
    expect(w.time - t0).toBeCloseTo(0.07, 9)
    t0 = w.time
    w.tick(0.13)
    expect(w.time - t0).toBeCloseTo(0.13, 9)
  })

  it('ignores non-finite and non-positive deltas without touching the store', () => {
    const w = createWorld(BARE_MISSION, ops(['op1']))
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

describe('store sync', () => {
  it('defers every store write to the first tick, which populates the HUD', () => {
    const squadOps = ops(DEFAULT_SQUAD)
    const w = createWorld(MISSION, squadOps)
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
    const w = createWorld(BARE_MISSION, ops(['op1']))
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
    const w = createWorld(BARE_MISSION, ops(['op1']))
    deployReset()
    for (let i = 0; i < 30; i++) w.tick(STEP)
    // 1.5s of world time on top of the 22:14:08 base.
    expect(useMissionStore.getState().clock).toBe('22:14:09')
  })

  it('reports role-based inventory bonuses after the first tick', () => {
    // medic +2 med, support +1 med, tech +1 cell on top of the base 2/1.
    const w = createWorld(BARE_MISSION, ops(['op8', 'op7', 'op6']))
    deployReset()
    w.tick(STEP)
    expect(useMissionStore.getState().inventory).toEqual({ med: 5, cell: 2 })
  })

  it('adds loadout items from deployed operatives to the mission pools', () => {
    const w = createWorld(BARE_MISSION, ops(['op8', 'op7', 'op6']), {
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
    const w = createWorld(BARE_MISSION, squadOps, {
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
    // +36 max HP of research plating adds 9 kg per operative: 286.1 + 64
    // of items + 36 = 386.1 kg, over HEAVY_MASS_KG.
    useResearchStore.setState({ done: ['c-pain', 'c-weave'] })
    const squadOps = ops(DEFAULT_SQUAD)
    const w = createWorld(BARE_MISSION, squadOps, {
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
    useResearchStore.setState({ done: ['c-pain', 'c-synaptic', 'b-propellants'] })
    const base = operativeById('op1')
    const w = createWorld(BARE_MISSION, [base])
    const a1 = w.unit('a1')
    expect(a1).toBeDefined()
    expect(a1?.maxHp).toBe(base.maxHp + 14)
    expect(a1?.hp).toBe(base.maxHp + 14)
    // Research speed plus the light-load mass bonus for a lone operative.
    expect(a1?.speed).toBeCloseTo(base.speed + 0.2 + 0.15, 10)
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
    const boosted = createWorld(BARE_MISSION, [base])
    expect(boosted.unit('a1')?.maxHp).toBe(base.maxHp + 14)

    useResearchStore.setState({ done: [] })
    const plain = createWorld(BARE_MISSION, [base])
    expect(plain.unit('a1')?.maxHp).toBe(base.maxHp)
    // No research leaves only the assault role passive on the weapon.
    expect(plain.unit('a1')?.weapon?.damage).toBeCloseTo(WEAPONS.assault.damage * 1.1, 10)
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

    const a = createWorld(MISSION, ops(DEFAULT_SQUAD))
    script(a)
    const b = createWorld(MISSION, ops(DEFAULT_SQUAD))
    script(b)

    expect(b.time).toBe(a.time)
    expect(snapshot(b)).toEqual(snapshot(a))
  })
})

describe('orders', () => {
  it('routes a unit toward an ordered move target over ticks', () => {
    const w = createWorld(BARE_MISSION, ops(['op1']))
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
    const w = createWorld(BARE_MISSION, ops(['op1']))
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
    const w = createWorld(BARE_MISSION, ops(['op1']))
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
    const w = createWorld(BARE_MISSION, ops(['op1', 'op2']))
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
    const w = createWorld(BARE_MISSION, ops(['op1']))
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
    const w = createWorld(BARE_MISSION, ops(['op1']))
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

  it('hold fire clears the standing attack order and shows on the squad card', () => {
    const w = createWorld(MISSION, ops(['op1']))
    deployReset()
    w.tick(STEP)
    const a1 = w.unit('a1')
    const enemy = w.units.find((u) => u.kind === 'enemy' && u.stance !== 'dead')
    expect(a1).toBeDefined()
    expect(enemy).toBeDefined()
    if (!a1 || !enemy) return

    w.orderAttack(['a1'], enemy.id)
    expect(a1.targetId).toBe(enemy.id)

    w.orderHoldFire(['a1'], true)
    expect(a1.holdFire).toBe(true)
    expect(a1.targetId).toBeNull()
    expect(useMissionStore.getState().squad.find((r) => r.unitId === 'a1')?.holdFire).toBe(true)

    w.orderHoldFire(['a1'], false)
    expect(a1.holdFire).toBe(false)
  })

  it('ignores orders naming unknown units or invalid targets', () => {
    const w = createWorld(BARE_MISSION, ops(['op1']))
    deployReset()
    w.tick(STEP)
    expect(() => w.orderMove(['zz'], { x: 48, z: 80 })).not.toThrow()
    expect(() => w.orderAttack(['a1'], 'zz')).not.toThrow()
    expect(w.unit('a1')?.targetId).toBeNull()
    expect(w.unit('zz')).toBeUndefined()
  })
})

describe('weapon swap', () => {
  it('deploys with the sidearm stowed, its own full magazine ready', () => {
    const op = operativeById('op1')
    const w = createWorld(BARE_MISSION, [op])
    const a1 = w.unit('a1')
    expect(a1).toBeDefined()
    if (!a1) return
    expect(a1.activeSlot).toBe('primary')
    expect(a1.weapon?.id).toBe(op.weapon)
    expect(a1.stowedWeapon?.id).toBe(op.sidearm)
    expect(a1.stowedMagazine).toBe(WEAPONS[op.sidearm].magazine)
  })

  it('swaps to the sidearm and holds fire until the readiness delay passes', () => {
    const w = createWorld(BARE_MISSION, ops(['op1']))
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
    const w = createWorld(BARE_MISSION, ops(['op1']))
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
    const w = createWorld(BARE_MISSION, ops(['op1']))
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
    const w = createWorld(BARE_MISSION, ops(['op1', 'op5']))
    expect(w.unit('a1')?.weapon?.damage).toBeCloseTo(WEAPONS.assault.damage * 1.1, 10)
    expect(w.unit('a1')?.stowedWeapon?.damage).toBeCloseTo(WEAPONS.pistol.damage * 1.1, 10)
    expect(w.unit('a2')?.weapon?.range).toBeCloseTo(WEAPONS.longrifle.range * 1.15, 10)
    expect(w.unit('a2')?.stowedWeapon?.range).toBeCloseTo(WEAPONS.pistol.range * 1.15, 10)
  })

  it('overdrive halves the fire delay and expires after its duration', () => {
    const w = createWorld(BARE_MISSION, ops(['op1']))
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
    const w = createWorld(BARE_MISSION, ops(['op4']))
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
  })

  it('frag charge with no target in range fails with a comm line and keeps no cooldown', () => {
    const w = createWorld(BARE_MISSION, ops(['op4']))
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
    const w = createWorld(BARE_MISSION, ops(['op8', 'op1']))
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
    const w = createWorld(BARE_MISSION, ops(['op8']))
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
    const w = createWorld(BARE_MISSION, ops(['op6']))
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
    const w = createWorld(BARE_MISSION, ops(['op5']))
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

  it('suppression sweep marks enemies in range and line of sight as slowed', () => {
    const w = createWorld(BARE_MISSION, ops(['op7']))
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
    const w = createWorld(BARE_MISSION, ops(['op3']))
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
    const w = createWorld(BARE_MISSION, ops(['op2']))
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
    const w = createWorld(BARE_MISSION, ops(['op8', 'op1']))
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
    const w = createWorld(BARE_MISSION, ops(['op4', 'op1']))
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
    const w = createWorld(BARE_MISSION, ops(['op1']))
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
    const w = createWorld(BARE_MISSION, ops(['op1', 'op6']))
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
    const w2 = createWorld(BARE_MISSION, ops(['op1']))
    deployReset()
    w2.tick(STEP)
    killEnemies(w2)
    const b1 = w2.unit('a1')!
    w2.orderAbility(['a1'])
    expect(b1.abilityReadyAt).toBeCloseTo(w2.time + ROLE_ABILITIES.assault.active.cooldown, 5)
  })

  it('pushes ability state into the squad rows', () => {
    const w = createWorld(BARE_MISSION, ops(['op1']))
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
    const w = createWorld(HOLLOW_CROWN, ops(DEFAULT_SQUAD))
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
    expect(app.credits).toBe(128450 + HOLLOW_CROWN.reward + 9000)
  })

  it('loses Hollow Crown on the spot when the vip dies', () => {
    const w = createWorld(HOLLOW_CROWN, ops(DEFAULT_SQUAD))
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
    const w = createWorld(RUST_HAVEN, ops(DEFAULT_SQUAD))
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
    expect(app.credits).toBe(128450 + RUST_HAVEN.reward)
  })

  it('builds distinct, connected layouts for both authored variants of each mission', () => {
    for (const mission of MISSIONS) {
      const a = createWorld(mission, ops(['op1']), { district: mission.variants[0] })
      const b = createWorld(mission, ops(['op1']), { district: mission.variants[1] })
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

describe('objectives and outcome', () => {
  it('runs the m01 objective chain to a won debrief with the net payout', () => {
    const w = createWorld(MISSION, ops(DEFAULT_SQUAD))
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
    expect(app.credits).toBe(128450 + MISSION.reward)
  })

  it('reports a loss and pays nothing when the squad is wiped', () => {
    const w = createWorld(MISSION, ops(DEFAULT_SQUAD))
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
    expect(app.outcome?.reward).toBe(0)
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
