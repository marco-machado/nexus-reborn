import { describe, expect, it } from 'vitest'
import { OPEN_SECTORS, sectorDef } from './atlas'
import {
  CRISIS_UNREST_ENTER,
  CRISIS_UNREST_EXIT,
  INFLUENCE_ACTIONS,
  INFLUENCE_ACTION_ORDER,
  PRESSURE_TAX_FLOOR,
  PRESSURE_UNREST_MIN,
  UNREST_MAX,
  cooldownKey,
  taxStrain,
  taxYieldCredits,
} from './influence'

describe('action table', () => {
  it('numbers the three actions 1-3 in panel order with the specified costs', () => {
    expect(INFLUENCE_ACTION_ORDER).toEqual(['stabilize', 'lobby', 'expedite'])
    expect(INFLUENCE_ACTION_ORDER.map((id) => INFLUENCE_ACTIONS[id].num)).toEqual([1, 2, 3])
    expect(INFLUENCE_ACTIONS.stabilize.cost).toBe(8)
    expect(INFLUENCE_ACTIONS.lobby.cost).toBe(10)
    expect(INFLUENCE_ACTIONS.expedite.cost).toBe(12)
  })

  it('stabilize stages -12 unrest over 6 world hours', () => {
    const def = INFLUENCE_ACTIONS.stabilize
    expect(def.steps * def.unrestDelta).toBe(-12)
    expect(def.steps * def.stepSec).toBe(6 * 3600)
    expect(def.controlDelta).toBe(0)
  })

  it('lobby stages +8 control over 12 world hours', () => {
    const def = INFLUENCE_ACTIONS.lobby
    expect(def.steps * def.controlDelta).toBe(8)
    expect(def.steps * def.stepSec).toBe(12 * 3600)
    expect(def.unrestDelta).toBe(0)
  })

  it('expedite is instant and every cooldown outlasts its staged duration', () => {
    expect(INFLUENCE_ACTIONS.expedite.steps).toBe(0)
    for (const id of INFLUENCE_ACTION_ORDER) {
      const def = INFLUENCE_ACTIONS[id]
      expect(def.cooldownSec).toBeGreaterThan(def.steps * def.stepSec)
    }
  })

  it('cooldown keys are per sector and per action', () => {
    expect(cooldownKey('eu', 'stabilize')).toBe('eu:stabilize')
    expect(cooldownKey('af', 'expedite')).not.toBe(cooldownKey('eu', 'expedite'))
  })
})

describe('pressure thresholds', () => {
  it('orders the marks: pressure under exit under enter, all inside the clamp', () => {
    expect(PRESSURE_UNREST_MIN).toBeLessThan(CRISIS_UNREST_EXIT)
    expect(CRISIS_UNREST_EXIT).toBeLessThan(CRISIS_UNREST_ENTER)
    expect(CRISIS_UNREST_ENTER).toBeLessThan(UNREST_MAX)
  })

  it('taxStrain holds at 1 below the threshold and falls to the floor above it', () => {
    expect(taxStrain(0)).toBe(1)
    expect(taxStrain(PRESSURE_UNREST_MIN)).toBe(1)
    expect(taxStrain(PRESSURE_UNREST_MIN + 10)).toBeLessThan(1)
    expect(taxStrain(PRESSURE_UNREST_MIN + 5)).toBeGreaterThan(
      taxStrain(PRESSURE_UNREST_MIN + 20),
    )
    expect(taxStrain(UNREST_MAX)).toBeGreaterThanOrEqual(PRESSURE_TAX_FLOOR)
  })

  it('taxYieldCredits matches the opening sector table', () => {
    const opening: Record<string, number> = {
      na: 4080,
      sa: 1722,
      eu: 2468,
      af: 1887,
      as: 4620,
      oc: 1606,
    }
    for (const id of OPEN_SECTORS) {
      const def = sectorDef(id)
      expect(taxYieldCredits(def.yieldBase, def.control, def.unrest)).toBe(opening[id])
    }
  })

  it('unrest above 60 cuts tax yield 2% per point, floored at 25%', () => {
    expect(taxYieldCredits(6000, 100, PRESSURE_UNREST_MIN)).toBe(6000)
    expect(taxYieldCredits(6000, 100, PRESSURE_UNREST_MIN + 10)).toBe(4800)
    expect(taxYieldCredits(6000, 100, UNREST_MAX)).toBe(1680)
    expect(taxYieldCredits(6000, 100, PRESSURE_UNREST_MIN + 40)).toBe(1500)
  })
})
