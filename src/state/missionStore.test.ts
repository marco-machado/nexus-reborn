import { beforeEach, describe, expect, it } from 'vitest'
import { useMissionStore } from './missionStore'
import type { AbilityAvailability, MissionAbilities, SquadMemberUi } from './missionStore'
import type { CommEntry } from '../game/types'

// The initial data shape, as declared in the source module.
const INITIAL = {
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
}

function data() {
  const s = useMissionStore.getState()
  return {
    live: s.live,
    paused: s.paused,
    selected: s.selected,
    squad: s.squad,
    objectives: s.objectives,
    log: s.log,
    alert: s.alert,
    result: s.result,
    clock: s.clock,
    inventory: s.inventory,
    abilities: s.abilities,
    grenadeTargeting: s.grenadeTargeting,
  }
}

// Captured at module load, before any test runs.
const boot = data()

function entry(i: number): CommEntry {
  return { t: '22:00:00', who: 'HQ', msg: 'm' + i }
}

function member(unitId: string, dead = false): SquadMemberUi {
  return {
    unitId,
    slot: 0,
    name: 'D. TORRES',
    codename: 'MARA',
    accent: '#f0b445',
    hp: dead ? 0 : 100,
    maxHp: 124,
    magazine: 30,
    magazineSize: 30,
    reloading: false,
    weaponName: 'RFC-27 ASSAULT',
    sidearmName: 'S-18 PISTOL',
    holdGround: false,
    holdFire: false,
    dead,
  }
}

function abilities(grenade: AbilityAvailability): MissionAbilities {
  return {
    medStim: { availability: 'usable', cooldownRemaining: 0, cooldownDuration: 2 },
    grenade: { availability: grenade, cooldownRemaining: 0, cooldownDuration: 4 },
  }
}

beforeEach(() => {
  useMissionStore.getState().reset()
})

describe('initial state and reset', () => {
  it('boots with the documented initial shape', () => {
    expect(boot).toEqual(INITIAL)
  })

  it('reset restores every field after a mission worth of mutations', () => {
    const s = useMissionStore.getState()
    s.setLive(true)
    s.setPaused(true)
    s.setSelected(['u1'])
    s.setSquad([member('u1')])
    s.setObjectives([{ id: 'ob1', label: 'REACH THE GATE', done: true, active: false }])
    s.addLog(entry(0))
    s.setAlert(3)
    s.setResult('won')
    s.setClock('22:14:07')
    s.setInventory({ med: 2, cell: 1 })
    s.setAbilities(abilities('usable'))
    s.setGrenadeTargeting(true)
    useMissionStore.getState().reset()
    expect(data()).toEqual(INITIAL)
  })
})

describe('log append', () => {
  it('appends entries in order', () => {
    const s = useMissionStore.getState()
    s.addLog(entry(0))
    s.addLog(entry(1))
    s.addLog(entry(2))
    expect(useMissionStore.getState().log.map((e) => e.msg)).toEqual(['m0', 'm1', 'm2'])
  })

  it('caps the log at 61 entries, dropping the oldest', () => {
    for (let i = 0; i < 100; i++) useMissionStore.getState().addLog(entry(i))
    const log = useMissionStore.getState().log
    expect(log).toHaveLength(61)
    expect(log[0].msg).toBe('m39')
    expect(log[60].msg).toBe('m99')
  })
})

describe('plain setters', () => {
  it('store the given values', () => {
    const s = useMissionStore.getState()
    const rows = [member('u1'), member('u2', true)]
    const obs = [{ id: 'ob1', label: 'EXTRACT', done: false, active: true }]
    s.setLive(true)
    s.setSelected(['u1', 'u2'])
    s.setSquad(rows)
    s.setObjectives(obs)
    s.setAlert(2)
    s.setClock('22:05:33')
    s.setInventory({ med: 1, cell: 3 })
    const out = useMissionStore.getState()
    expect(out.live).toBe(true)
    expect(out.selected).toEqual(['u1', 'u2'])
    expect(out.squad).toEqual(rows)
    expect(out.objectives).toEqual(obs)
    expect(out.alert).toBe(2)
    expect(out.clock).toBe('22:05:33')
    expect(out.inventory).toEqual({ med: 1, cell: 3 })
  })
})

describe('grenade targeting guards', () => {
  it('going not-live drops targeting; going live keeps it', () => {
    const s = useMissionStore.getState()
    s.setGrenadeTargeting(true)
    s.setLive(true)
    expect(useMissionStore.getState().grenadeTargeting).toBe(true)
    s.setLive(false)
    expect(useMissionStore.getState().grenadeTargeting).toBe(false)
  })

  it('pausing drops targeting; unpausing keeps it', () => {
    const s = useMissionStore.getState()
    s.setGrenadeTargeting(true)
    s.setPaused(false)
    expect(useMissionStore.getState().grenadeTargeting).toBe(true)
    s.setPaused(true)
    expect(useMissionStore.getState().grenadeTargeting).toBe(false)
  })

  it('a decided result drops targeting; none keeps it', () => {
    const s = useMissionStore.getState()
    s.setGrenadeTargeting(true)
    s.setResult('none')
    expect(useMissionStore.getState().grenadeTargeting).toBe(true)
    s.setResult('won')
    expect(useMissionStore.getState().grenadeTargeting).toBe(false)
  })

  it('an unusable grenade drops targeting; a usable one keeps it', () => {
    const s = useMissionStore.getState()
    s.setGrenadeTargeting(true)
    s.setAbilities(abilities('usable'))
    expect(useMissionStore.getState().grenadeTargeting).toBe(true)
    s.setAbilities(abilities('cooldown'))
    expect(useMissionStore.getState().grenadeTargeting).toBe(false)
  })

  it('a squad update keeps targeting while a selected thrower lives', () => {
    const s = useMissionStore.getState()
    s.setSelected(['u1'])
    s.setGrenadeTargeting(true)
    s.setSquad([member('u1')])
    expect(useMissionStore.getState().grenadeTargeting).toBe(true)
  })

  it('a squad update drops targeting once every selected unit is dead', () => {
    const s = useMissionStore.getState()
    s.setSelected(['u1'])
    s.setGrenadeTargeting(true)
    s.setSquad([member('u1', true), member('u2')])
    expect(useMissionStore.getState().grenadeTargeting).toBe(false)
  })

  it('a squad update drops targeting when nothing is selected', () => {
    const s = useMissionStore.getState()
    s.setGrenadeTargeting(true)
    s.setSquad([member('u1')])
    expect(useMissionStore.getState().grenadeTargeting).toBe(false)
  })
})
