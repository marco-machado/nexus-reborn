// AU-002 / audio GDD: which mission events request the warning sting and the
// alert-tension drone. The mission bridge is replaced with spies so the test
// reads the requests the sim makes, independent of Web Audio. Everything is
// deterministic: mission.seed drives the city and the in-world rng, and the
// test ticks the world by hand.
import { beforeEach, describe, expect, it, vi } from 'vitest'

const bridge = vi.hoisted(() => ({
  gunshot: vi.fn(),
  reload: vi.fn(),
  confirmBlip: vi.fn(),
  alertSting: vi.fn(),
  objectiveChime: vi.fn(),
  deathThud: vi.fn(),
  blast: vi.fn(),
  interactTick: vi.fn(),
  abilityCue: vi.fn(),
  agentHit: vi.fn(),
  threatLevel: vi.fn(),
  weatherBed: vi.fn(),
}))
vi.mock('./audioBridge', () => ({ missionSfx: bridge }))

import type { MissionDef, OperativeDef, Vec2, WorldApi } from './types'
import { createWorld } from './world'
import { headlessDeploy } from './deploy'
import { DEFAULT_SQUAD, MISSIONS, OFFICER_RADIO_DELAY, operativeById } from './data'
import { nearestWalkable } from './pathfind'
import { useMissionStore } from '../state/missionStore'

const STEP = 0.05
const CHECKPOINT = MISSIONS[0] // SEVERE: carries the officer.
const RUST_HAVEN = MISSIONS[2] // Ends in a defend wave.
const BARE: MissionDef = { ...CHECKPOINT, objectives: [] }

function ops(ids: string[]): OperativeDef[] {
  return ids.map(operativeById)
}

function spawn(m: MissionDef, o: OperativeDef[]): WorldApi {
  const w = createWorld(m, o, headlessDeploy(m, o))
  const ms = useMissionStore.getState()
  ms.reset()
  ms.setLive(true)
  w.tick(STEP)
  return w
}

function put(w: WorldApi, u: { pos: Vec2; path: Vec2[] }, at: Vec2): void {
  const spot = nearestWalkable(w.city, at) ?? at
  u.pos.x = spot.x
  u.pos.z = spot.z
  u.path.length = 0
}

function warm(w: WorldApi, seconds: number): void {
  const until = w.time + seconds
  while (w.time < until) w.tick(STEP)
}

function runUntil(w: WorldApi, cond: () => boolean, maxSec: number, drive?: () => void, every = 1): boolean {
  const until = w.time + maxSec
  let next = -Infinity
  while (w.time < until) {
    if (cond()) return true
    if (drive && w.time >= next) {
      drive()
      next = w.time + every
    }
    w.tick(STEP)
  }
  return cond()
}

const logged = (text: string): boolean => useMissionStore.getState().log.some((e) => e.msg.includes(text))
const droneRaised = (): boolean => bridge.threatLevel.mock.calls.some(([lvl]) => lvl > 0)

beforeEach(() => {
  for (const fn of Object.values(bridge)) fn.mockClear()
})

describe('warning-sting requests (AU-002)', () => {
  it('first combat contact requests one sting and raises the drone; later contact requests no second sting', () => {
    const w = spawn(BARE, ops(['op1']))
    const a1 = w.unit('a1')!
    const enemies = w.units.filter((u) => u.kind === 'enemy')
    const [first, second] = enemies
    for (const u of enemies) if (u !== first && u !== second) u.stance = 'dead'
    for (const u of [first, second]) {
      u.patrol!.length = 0
      u.holdGround = true
    }
    put(w, second, { x: 2, z: 2 })
    put(w, first, { x: a1.pos.x, z: a1.pos.z - 3 })
    expect(bridge.alertSting).not.toHaveBeenCalled()

    const contact = runUntil(w, () => first.aiState === 'combat', 10, () => w.orderAttack(['a1'], first.id), 0.5)
    expect(contact).toBe(true)
    expect(logged('Threat level elevated.')).toBe(true)
    expect(bridge.alertSting).toHaveBeenCalledTimes(1)
    warm(w, 0.5)
    expect(droneRaised()).toBe(true)

    // A second guard entering combat is not a new warning event.
    first.stance = 'dead'
    put(w, second, { x: a1.pos.x + 3, z: a1.pos.z })
    const again = runUntil(w, () => second.aiState === 'combat', 10, () => w.orderAttack(['a1'], second.id), 0.5)
    expect(again).toBe(true)
    expect(bridge.alertSting).toHaveBeenCalledTimes(1)
  })

  it('an answered officer call requests its own sting', () => {
    const w = spawn(CHECKPOINT, ops(DEFAULT_SQUAD))
    const officer = w.units.find((u) => u.archetype === 'officer')!
    const a1 = w.unit('a1')!
    put(w, a1, { x: officer.pos.x + 4, z: officer.pos.z })
    const tripped = runUntil(w, () => officer.aiState === 'combat', 20, () => w.orderAttack(['a1'], officer.id), 0.5)
    expect(tripped).toBe(true)
    const stingsAtContact = bridge.alertSting.mock.calls.length
    expect(stingsAtContact).toBe(1) // first contact

    // Same staging as the world test: break contact, then park a patroller
    // inside radio range but outside the firefight so the call is answered.
    w.orderStop(['a1'])
    w.orderHoldFire(['a1'], true)
    put(w, a1, { x: 46.5, z: 85.5 })
    warm(w, OFFICER_RADIO_DELAY - 1)
    const patroller = w.units.find(
      (u) => u.kind === 'enemy' && u.stance !== 'dead' && u.tag !== 'garrison' && u.aiState !== 'combat',
    )!
    put(w, patroller, { x: officer.pos.x - 17, z: officer.pos.z })
    const called = runUntil(w, () => logged('REINFORCEMENT CALL OUT'), 3)
    expect(called).toBe(true)
    expect(bridge.alertSting).toHaveBeenCalledTimes(stingsAtContact + 1)
  })

  it('a defend wave requests its sting when it enters', () => {
    const w = spawn(RUST_HAVEN, ops(DEFAULT_SQUAD))
    for (const u of w.units) if (u.kind === 'enemy') u.stance = 'dead'
    const a1 = w.unit('a1')!
    a1.pos.x = w.city.landmarks['yard-a'].x
    a1.pos.z = w.city.landmarks['yard-a'].z
    a1.path.length = 0
    w.tick(STEP)
    a1.pos.x = w.city.extraction.x
    a1.pos.z = w.city.extraction.z
    expect(bridge.alertSting).not.toHaveBeenCalled()

    for (const d of w.units) if (d.kind === 'device' && d.tag === 'relay') d.stance = 'dead'
    w.tick(STEP)
    expect(logged('CORPSEC WAVE INBOUND')).toBe(true)
    expect(bridge.alertSting).toHaveBeenCalledTimes(1)
  })

  it('ordinary suspicion requests no sting and does not raise the drone', () => {
    const w = spawn(BARE, ops(['op1']))
    const a1 = w.unit('a1')!
    w.orderHoldFire(['a1'], true)
    const guard = w.units.find((u) => u.kind === 'enemy')!
    for (const u of w.units) if (u.kind === 'enemy' && u !== guard) u.stance = 'dead'
    guard.patrol!.length = 0
    guard.holdGround = true
    // A grenade 10 m from the guard, thrown from 26 m away: the guard hears it
    // (noise radius 24) but sees nobody, so it investigates without contact.
    put(w, guard, { x: a1.pos.x, z: a1.pos.z - 26 })
    const bang = nearestWalkable(w.city, { x: a1.pos.x, z: a1.pos.z - 16 })!
    expect(w.orderGrenade('a1', bang)).toBe(true)
    const suspicious = runUntil(w, () => guard.aiState === 'suspicious', 2)
    expect(suspicious).toBe(true)
    warm(w, 0.5)
    expect(guard.aiState).not.toBe('combat')
    expect(bridge.alertSting).not.toHaveBeenCalled()
    expect(droneRaised()).toBe(false)
    expect(useMissionStore.getState().alert).toBe(0)
  })
})
