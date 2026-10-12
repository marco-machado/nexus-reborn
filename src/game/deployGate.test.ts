import { describe, expect, it } from 'vitest'
import { DEFAULT_SQUAD, operativeById } from './data'
import { MAX_SQUAD, assignedMassKg, canDeploy } from './deployGate'
import { MASS_LIMIT_KG, squadMassKg } from './mass'

const ids = (n: number) => Array.from({ length: n }, (_, i) => `op${i + 1}`)
const ready = (list: readonly string[]) =>
  Object.fromEntries(list.map((id) => [id, 'READY' as const]))
const gate = (assignedIds: readonly string[], over: Partial<Parameters<typeof canDeploy>[0]> = {}) =>
  canDeploy({ missionSelected: true, assignedIds, statusById: ready(assignedIds), massKg: 286.1, ...over })

describe('canDeploy', () => {
  it.each([1, 2, 3, 4])('allows %i Ready operatives under the limit (AC 1-4)', (n) => {
    expect(gate(ids(n))).toEqual({ ok: true, reason: null, overKg: 286.1 - MASS_LIMIT_KG })
  })

  it('refuses an empty Squad as none-assigned (AC 6)', () => {
    expect(gate([]).reason).toBe('none-assigned')
  })

  it('refuses a Squad over MAX_SQUAD or with a duplicate as none-assigned', () => {
    expect(gate(ids(MAX_SQUAD + 1)).reason).toBe('none-assigned')
    expect(gate(['op1', 'op1']).reason).toBe('none-assigned')
  })

  it('refuses a missing contract, a non-Ready operative, or an overweight squad', () => {
    expect(gate(['op1'], { missionSelected: false }).reason).toBe('no-contract')
    expect(gate(['op1', 'op5'], { statusById: { op1: 'READY', op5: 'INJURED' } }).reason).toBe(
      'not-ready',
    )
    expect(gate(['op1'], { statusById: {} }).reason).toBe('not-ready')
    const heavy = gate(['op1'], { massKg: MASS_LIMIT_KG + 0.1 })
    expect(heavy.reason).toBe('over-mass')
    expect(heavy.overKg).toBeCloseTo(0.1, 10)
  })

  it('allows exactly the mass limit', () => {
    expect(gate(['op1'], { massKg: MASS_LIMIT_KG })).toEqual({ ok: true, reason: null, overKg: 0 })
  })

  it('names the first failing check when several fail', () => {
    const all = { missionSelected: false, statusById: {}, massKg: 999 }
    expect(gate([], all).reason).toBe('no-contract')
    expect(gate([], { ...all, missionSelected: true }).reason).toBe('none-assigned')
    expect(gate(['op1'], { ...all, missionSelected: true }).reason).toBe('not-ready')
  })
})

describe('assignedMassKg', () => {
  const ops = DEFAULT_SQUAD.map(operativeById)
  const roster = Object.fromEntries(DEFAULT_SQUAD.map((id) => [id, { pins: {}, xp: 0 }]))

  it('matches squadMassKg with no research or Experience', () => {
    expect(assignedMassKg(ops, [], roster, {})).toBeCloseTo(squadMassKg(ops, 0), 10)
  })

  it('adds Experience max-HP as armor mass', () => {
    const veteran = { ...roster, op1: { pins: {}, xp: 1e6 } }
    expect(assignedMassKg(ops, [], veteran, {})).toBeGreaterThan(assignedMassKg(ops, [], roster, {}))
  })
})
