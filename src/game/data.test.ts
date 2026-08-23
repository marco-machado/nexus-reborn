import { describe, it, expect } from 'vitest'
import type { WeaponId } from './types'
import { cityPlatePos } from './atlas'
import {
  WEAPONS,
  weaponNoise,
  ROSTER,
  DEFAULT_SQUAD,
  MISSIONS,
  missionById,
  operativeById,
} from './data'

const WEAPON_IDS = Object.keys(WEAPONS) as WeaponId[]

describe('WEAPONS', () => {
  it('keys the record by each weapon id', () => {
    for (const id of WEAPON_IDS) expect(WEAPONS[id].id).toBe(id)
  })

  it('keeps every stat positive and the magazine a whole number', () => {
    for (const id of WEAPON_IDS) {
      const w = WEAPONS[id]
      expect(w.name.length).toBeGreaterThan(0)
      expect(w.damage).toBeGreaterThan(0)
      expect(w.range).toBeGreaterThan(0)
      expect(w.cooldown).toBeGreaterThan(0)
      expect(w.magazine).toBeGreaterThan(0)
      expect(Number.isInteger(w.magazine)).toBe(true)
      expect(w.reload).toBeGreaterThan(0)
      expect(w.spread).toBeGreaterThanOrEqual(0)
    }
  })

  it('gives every weapon a hex tracer color', () => {
    for (const id of WEAPON_IDS) expect(WEAPONS[id].tracer).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it('authors a positive carried mass per weapon', () => {
    expect(WEAPONS.assault.massKg).toBeCloseTo(4.2, 10)
    expect(WEAPONS.smg.massKg).toBeCloseTo(3.1, 10)
    expect(WEAPONS.pistol.massKg).toBeCloseTo(1.2, 10)
    expect(WEAPONS.longrifle.massKg).toBeCloseTo(6.8, 10)
    expect(WEAPONS.shotgun.massKg).toBeCloseTo(4.9, 10)
  })
})

describe('weaponNoise', () => {
  it('derives carry distance from range and damage', () => {
    // 6 + range * 0.6 + damage * 0.35
    expect(weaponNoise(WEAPONS.pistol)).toBeCloseTo(16.1, 10)
    expect(weaponNoise(WEAPONS.longrifle)).toBeCloseTo(37.7, 10)
  })

  it('is positive for every weapon and loudest for the longrifle', () => {
    const noises = WEAPON_IDS.map((id) => weaponNoise(WEAPONS[id]))
    expect(noises.every((n) => n > 0)).toBe(true)
    expect(Math.max(...noises)).toBeCloseTo(weaponNoise(WEAPONS.longrifle), 10)
  })

  it('grows with range and with damage', () => {
    const base = WEAPONS.pistol
    expect(weaponNoise({ ...base, range: base.range + 5 })).toBeGreaterThan(weaponNoise(base))
    expect(weaponNoise({ ...base, damage: base.damage + 5 })).toBeGreaterThan(weaponNoise(base))
  })
})

describe('ROSTER', () => {
  it('has unique ids and codenames', () => {
    expect(new Set(ROSTER.map((o) => o.id)).size).toBe(ROSTER.length)
    expect(new Set(ROSTER.map((o) => o.codename)).size).toBe(ROSTER.length)
  })

  it('arms every operative from the weapon table, with positive stats', () => {
    for (const o of ROSTER) {
      expect(WEAPONS[o.weapon]).toBeDefined()
      expect(WEAPONS[o.sidearm]).toBeDefined()
      expect(o.maxHp).toBeGreaterThan(0)
      expect(o.speed).toBeGreaterThan(0)
      expect(o.accent).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })
})

describe('DEFAULT_SQUAD', () => {
  it('names four distinct operatives from the roster', () => {
    expect(DEFAULT_SQUAD).toHaveLength(4)
    expect(new Set(DEFAULT_SQUAD).size).toBe(4)
    for (const id of DEFAULT_SQUAD) expect(operativeById(id).id).toBe(id)
  })
})

describe('MISSIONS', () => {
  it('has unique mission ids and unique objective ids within a mission', () => {
    expect(new Set(MISSIONS.map((m) => m.id)).size).toBe(MISSIONS.length)
    for (const m of MISSIONS) {
      const obIds = m.objectives.map((o) => o.id)
      expect(new Set(obIds).size).toBe(obIds.length)
    }
  })

  it('keeps reward, eta, seed, and variants in sane ranges', () => {
    for (const m of MISSIONS) {
      expect(m.reward).toBeGreaterThan(0)
      expect(m.etaDays).toBeGreaterThan(0)
      expect(Number.isInteger(m.seed)).toBe(true)
      expect(m.seed).toBeGreaterThan(0)
      expect(m.variants.length).toBeGreaterThanOrEqual(2)
      for (const v of m.variants) expect(Number.isInteger(v.seed)).toBe(true)
    }
  })

  it('tags every eliminate-tag objective', () => {
    for (const m of MISSIONS) {
      for (const ob of m.objectives) {
        if (ob.kind === 'eliminate-tag') expect(ob.tag ?? '').not.toBe('')
      }
    }
  })

  it('gates missions with positive intel requirements and makes every contract playable', () => {
    for (const m of MISSIONS) {
      expect(Number.isInteger(m.intelReq)).toBe(true)
      expect(m.intelReq).toBeGreaterThan(0)
      // Every mission runs a required sequence ending in extraction; the
      // optional entries never carry the sequence.
      const required = m.objectives.filter((objective) => !objective.optional)
      expect(required.length).toBeGreaterThanOrEqual(3)
      expect(required[required.length - 1].kind).toBe('extract')
      for (const objective of m.objectives) {
        if (objective.optional) expect(objective.bonusReward ?? 0).toBeGreaterThan(0)
        if (objective.kind === 'interact' || objective.kind === 'defend') {
          expect(objective.durationSec ?? 0).toBeGreaterThan(0)
        }
        if (objective.kind === 'destroy') expect(objective.tag ?? '').not.toBe('')
        if (objective.kind === 'defend') {
          expect(objective.wave).toBeDefined()
          expect(objective.wave?.entry.length ?? 0).toBeGreaterThan(0)
        }
      }
    }
    const open = MISSIONS.filter((m) => m.intelReq <= 1)
    expect(open.length).toBeGreaterThan(0)
  })

  it('pins each authored contract on its city', () => {
    expect(missionById('m01').mapPos).toEqual(cityPlatePos('nc'))
    expect(missionById('m02').mapPos).toEqual(cityPlatePos('sg'))
    expect(missionById('m03').mapPos).toEqual(cityPlatePos('dt'))
  })
})

describe('lookups', () => {
  it('missionById resolves a known id and throws on an unknown one', () => {
    expect(missionById('m01').codename).toBe('GLASS VEIL')
    expect(() => missionById('zzz')).toThrow('unknown mission zzz')
  })

  it('operativeById resolves a known id and throws on an unknown one', () => {
    expect(operativeById('op1').codename).toBe('MARA')
    expect(() => operativeById('op99')).toThrow('unknown operative op99')
  })
})
