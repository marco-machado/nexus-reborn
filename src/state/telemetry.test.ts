import { beforeEach, describe, expect, it } from 'vitest'
import type { MissionOutcome } from './appStore'
import { initSettings, useSettingsStore } from './settingsStore'
import type { SettingsStorage } from './settingsStore'
import {
  TELEMETRY_CAP,
  TELEMETRY_KEY,
  TELEMETRY_VERSION,
  aggregate,
  appendRecord,
  buildRecord,
  clearRecords,
  exportJson,
  loadRecords,
  recordMissionOutcome,
  saveRecords,
} from './telemetry'
import type { MissionRecord, MissionTelemetry } from './telemetry'

class MemoryStorage implements SettingsStorage {
  data = new Map<string, string>()

  getItem(key: string): string | null {
    return this.data.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value)
  }
}

let storage: MemoryStorage

beforeEach(() => {
  storage = new MemoryStorage()
  initSettings(null)
})

function telemetry(over: Partial<MissionTelemetry> = {}): MissionTelemetry {
  return {
    seed: 20870514,
    firstContactSec: 42.5,
    objectiveTimes: [
      { id: 'ob1', atSec: 40 },
      { id: 'ob2', atSec: 190 },
      { id: 'ob3', atSec: 260 },
    ],
    shotsByWeapon: { assault: 120, smg: 80, pistol: 0, longrifle: 0, shotgun: 0 },
    damageByWeapon: { assault: 900, smg: 300, pistol: 0, longrifle: 0, shotgun: 0 },
    damageDealt: 1100,
    damageTaken: 220,
    civilianHitsBySquad: 2,
    civilianHitsByCorpsec: 1,
    medUsed: 1,
    cellUsed: 2,
    abilityUsesByRole: { assault: 3, medic: 1 },
    squadRoles: ['assault', 'recon', 'infiltrator', 'demolitions'],
    ...over,
  }
}

function outcome(over: Partial<MissionOutcome> = {}): MissionOutcome {
  return {
    won: true,
    kills: 9,
    casualties: 0,
    timeSec: 265,
    civiliansHit: 2,
    reward: 85000,
    bonus: 0,
    deadIds: [],
    survivorHp: {},
    telemetry: telemetry(),
    ...over,
  }
}

function record(over: Partial<MissionRecord> = {}): MissionRecord {
  const built = buildRecord('m01', outcome(), 1000)
  expect(built).not.toBeNull()
  return { ...(built as MissionRecord), ...over }
}

describe('buildRecord', () => {
  it('folds the outcome and its counters into one record with fine and payout', () => {
    const r = buildRecord('m01', outcome(), 1234)
    expect(r).toMatchObject({
      at: 1234,
      missionId: 'm01',
      outcome: 'won',
      durationSec: 265,
      kills: 9,
      kia: 0,
      civiliansHit: 2,
      reward: 85000,
      fine: 10000,
      payout: 75000,
      seed: 20870514,
      firstContactSec: 42.5,
      medUsed: 1,
      cellUsed: 2,
    })
    expect(r?.objectiveTimes).toHaveLength(3)
    expect(r?.squadRoles).toEqual(['assault', 'recon', 'infiltrator', 'demolitions'])
  })

  it('a loss pays nothing and carries no fine', () => {
    const r = buildRecord('m01', outcome({ won: false, reward: 0, deadIds: ['op1', 'op2'] }))
    expect(r).toMatchObject({ outcome: 'lost', fine: 0, payout: 0, kia: 2 })
  })

  it('returns null for an outcome without a telemetry payload', () => {
    expect(buildRecord('m01', outcome({ telemetry: undefined }))).toBeNull()
  })
})

describe('storage', () => {
  it('rounds records through the versioned blob', () => {
    const r = record()
    saveRecords([r], storage)
    expect(JSON.parse(storage.getItem(TELEMETRY_KEY) ?? '')).toMatchObject({
      version: TELEMETRY_VERSION,
    })
    expect(loadRecords(storage)).toEqual([r])
  })

  it('caps the log at 60 records, oldest out first', () => {
    let records: MissionRecord[] = []
    for (let i = 0; i < TELEMETRY_CAP + 5; i++) {
      records = appendRecord(records, record({ at: i }))
    }
    expect(records).toHaveLength(TELEMETRY_CAP)
    expect(records[0].at).toBe(5)
    expect(records[records.length - 1].at).toBe(TELEMETRY_CAP + 4)
  })

  it('guards the version: a wrong version, garbage, or bad rows yield an empty log', () => {
    storage.setItem(TELEMETRY_KEY, JSON.stringify({ version: 99, records: [record()] }))
    expect(loadRecords(storage)).toEqual([])

    storage.setItem(TELEMETRY_KEY, '{not-json')
    expect(loadRecords(storage)).toEqual([])

    storage.setItem(
      TELEMETRY_KEY,
      JSON.stringify({ version: TELEMETRY_VERSION, records: [7, null, { outcome: 'maybe' }] }),
    )
    expect(loadRecords(storage)).toEqual([])
    expect(loadRecords(null)).toEqual([])
  })

  it('clearRecords empties the log in place', () => {
    saveRecords([record()], storage)
    clearRecords(storage)
    expect(loadRecords(storage)).toEqual([])
  })

  it('exportJson round-trips through loadRecords', () => {
    const r = record()
    storage.setItem(TELEMETRY_KEY, exportJson([r]))
    expect(loadRecords(storage)).toEqual([r])
  })
})

describe('recordMissionOutcome', () => {
  it('is a no-op while the TELEMETRY setting is off', () => {
    recordMissionOutcome('m01', outcome(), storage)
    expect(storage.getItem(TELEMETRY_KEY)).toBeNull()
  })

  it('appends one record per call once opted in', () => {
    useSettingsStore.setState({ telemetry: true })
    recordMissionOutcome('m01', outcome(), storage)
    recordMissionOutcome('m01', outcome({ won: false, reward: 0 }), storage)
    const records = loadRecords(storage)
    expect(records).toHaveLength(2)
    expect(records.map((r) => r.outcome)).toEqual(['won', 'lost'])
    useSettingsStore.setState({ telemetry: false })
  })
})

describe('aggregate', () => {
  it('returns zeros over an empty log', () => {
    const agg = aggregate([])
    expect(agg.missions).toBe(0)
    expect(agg.winRate).toBe(0)
    expect(agg.meanFirstContactSec).toBeNull()
    expect(agg.weaponDamage).toEqual([])
    expect(agg.abilityUses).toEqual([])
  })

  it('computes rates, means, totals, and shares over the log', () => {
    const rows = [
      record({ at: 1 }),
      record({
        at: 2,
        outcome: 'lost',
        durationSec: 135,
        payout: 0,
        fine: 0,
        kia: 4,
        firstContactSec: null,
        civilianHitsBySquad: 0,
        civiliansHit: 0,
        damageByWeapon: { longrifle: 600 },
        abilityUsesByRole: { sniper: 2 },
        medUsed: 3,
        cellUsed: 0,
      }),
    ]
    const agg = aggregate(rows)
    expect(agg.missions).toBe(2)
    expect(agg.wins).toBe(1)
    expect(agg.winRate).toBeCloseTo(0.5, 10)
    expect(agg.meanDurationSec).toBeCloseTo((265 + 135) / 2, 10)
    // Only the mission that had contact counts toward the mean.
    expect(agg.meanFirstContactSec).toBeCloseTo(42.5, 10)
    expect(agg.collateralRate).toBeCloseTo(0.5, 10)
    expect(agg.civiliansHitTotal).toBe(2)
    expect(agg.kiaTotal).toBe(4)
    expect(agg.medUsedTotal).toBe(4)
    expect(agg.cellUsedTotal).toBe(2)
    expect(agg.meanPayout).toBeCloseTo(37500, 10)
    expect(agg.totalPayout).toBe(75000)
    expect(agg.totalFines).toBe(10000)
    // Damage share sorts descending and sums to one.
    expect(agg.weaponDamage.map((r) => r.key)).toEqual(['assault', 'longrifle', 'smg'])
    expect(agg.weaponDamage.reduce((acc, r) => acc + r.share, 0)).toBeCloseTo(1, 10)
    expect(agg.weaponDamage[0]).toMatchObject({ key: 'assault', value: 900 })
    expect(agg.abilityUses.map((r) => r.key)).toEqual(['assault', 'sniper', 'medic'])
  })
})
