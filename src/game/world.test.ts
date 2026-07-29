// Tests for the mission simulation. Everything is deterministic: mission.seed
// drives both the city generator and the in-world rng, and the tests drive
// tick() by hand, so no timers or real clocks are involved.
import { beforeEach, describe, expect, it } from 'vitest'
import type { MissionDef, OperativeDef, Vec2, WorldApi } from './types'
import { createWorld } from './world'
import { DEFAULT_SQUAD, MISSIONS, ROSTER, WEAPONS, operativeById } from './data'
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
      medStim: { availability: 'out-of-stock', cooldownRemaining: 0, cooldownDuration: 2 },
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
  it.each(MISSIONS.slice(1))(
    'builds a connected, completable placeholder objective route for $codename',
    (mission) => {
      const w = createWorld(mission, ops(DEFAULT_SQUAD))
      deployReset()
      w.tick(STEP)
      expect(w.city.walk.length).toBe(w.city.size * w.city.size)
      expect(w.units.some((unit) => unit.kind === 'enemy' && unit.tag === 'garrison')).toBe(true)

      const a1 = w.unit('a1')
      expect(a1).toBeDefined()
      if (!a1) return
      a1.pos.x = w.city.checkpoint.x
      a1.pos.z = w.city.checkpoint.z
      a1.path.length = 0
      w.tick(STEP)
      for (const unit of w.units) if (unit.kind === 'enemy') unit.stance = 'dead'
      w.tick(STEP)
      for (const unit of w.units) {
        if (unit.kind === 'agent' && unit.stance !== 'dead') {
          unit.pos.x = w.city.extraction.x
          unit.pos.z = w.city.extraction.z
          unit.path.length = 0
        }
      }
      w.tick(STEP)
      expect(useMissionStore.getState().result).toBe('won')
      expect(useMissionStore.getState().objectives.every((objective) => objective.done)).toBe(true)
    },
  )

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
      expect(a.speed).toBe(op.speed)
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
    expect(s.abilities.medStim.availability).toBe('usable')
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
    expect(a1?.speed).toBeCloseTo(base.speed + 0.2, 10)
    expect(a1?.weapon?.damage).toBeCloseTo(WEAPONS.assault.damage * 1.12, 10)

    // Research completed after deployment never reaches a running mission.
    useResearchStore.setState({ done: [] })
    warm(w, 0.5)
    expect(a1?.maxHp).toBe(base.maxHp + 14)
    expect(a1?.weapon?.damage).toBeCloseTo(WEAPONS.assault.damage * 1.12, 10)
  })

  it('reads the research store fresh for each new world', () => {
    useResearchStore.setState({ done: ['c-pain'] })
    const base = operativeById('op1')
    const boosted = createWorld(BARE_MISSION, [base])
    expect(boosted.unit('a1')?.maxHp).toBe(base.maxHp + 14)

    useResearchStore.setState({ done: [] })
    const plain = createWorld(BARE_MISSION, [base])
    expect(plain.unit('a1')?.maxHp).toBe(base.maxHp)
    expect(plain.unit('a1')?.weapon?.damage).toBe(WEAPONS.assault.damage)
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

  it('heals a wounded agent with a med stim, once per cooldown, while stock lasts', () => {
    const w = createWorld(BARE_MISSION, ops(['op1']))
    deployReset()
    w.tick(STEP)
    const a1 = w.unit('a1')
    expect(a1).toBeDefined()
    if (!a1) return

    // Full health: refused, nothing spent.
    expect(w.orderMedStim('a1')).toBe(false)

    a1.hp -= 60
    expect(w.orderMedStim('a1')).toBe(true)
    expect(a1.hp).toBeCloseTo(a1.maxHp - 15, 10)

    // Cooldown: a second stim inside MED_STIM_COOLDOWN is refused.
    a1.hp -= 20
    expect(w.orderMedStim('a1')).toBe(false)
    warm(w, 2.1)

    // The heal caps at the missing health.
    expect(w.orderMedStim('a1')).toBe(true)
    expect(a1.hp).toBeCloseTo(a1.maxHp, 10)

    // Base stock is 2 med: the third stim is out of stock.
    a1.hp -= 10
    expect(w.orderMedStim('a1')).toBe(false)
    warm(w, 2.1)
    expect(w.orderMedStim('a1')).toBe(false)
    expect(useMissionStore.getState().inventory.med).toBe(0)
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
