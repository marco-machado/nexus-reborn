import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { settleOutcome, useAppStore } from './appStore'
import type { MissionOutcome } from './appStore'
import { initSettings, useSettingsStore } from './settingsStore'
import type { SettingsStorage } from './settingsStore'
import {
  TELEMETRY_CAP,
  TELEMETRY_KEY,
  TELEMETRY_VERSION,
  aggregate,
  appendRecord,
  balanceEntryVisible,
  buildRecord,
  clearRecords,
  exportJson,
  loadRecords,
  recordAbort,
  recordMissionOutcome,
  saveRecords,
  subscribeTelemetry,
  telemetryRevision,
} from './telemetry'
import { applyDebrief } from './debrief'
import telemetrySrc from './telemetry.ts?raw'
import balanceSrc from '../ui/Balance.tsx?raw'
import balanceGateSrc from '../ui/balanceGate.ts?raw'
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
  return settleOutcome({
    applyKey: 1,
    won: true,
    kills: 9,
    casualties: 0,
    timeSec: 265,
    civiliansHit: 2,
    reward: 85000,
    bonus: 0,
    deadIds: [],
    survivorHp: {},
    quietReplay: false,
    telemetry: telemetry(),
    ...over,
  })
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

describe('recordAbort', () => {
  it('writes a thin aborted record and keeps win rate among finished missions', () => {
    useSettingsStore.setState({ telemetry: true })
    recordMissionOutcome('m01', outcome(), storage)
    recordAbort('m01', 12, 20870514, ['assault'], storage)
    const records = loadRecords(storage)
    expect(records.map((r) => r.outcome)).toEqual(['won', 'aborted'])
    const agg = aggregate(records)
    expect(agg.aborts).toBe(1)
    expect(agg.abortRate).toBeCloseTo(0.5, 10)
    expect(agg.winRate).toBe(1)
    expect(agg.meanDurationSec).toBeCloseTo(265, 10)
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

// PV-013 (TR-persistence-008, ADR-0015): opt-in default, the Balance entry
// point follows the log, and nothing on the telemetry path reaches the network.
describe('telemetry opt-in default (PV-013 AC1)', () => {
  it('a new origin has telemetry off, an empty log, and no Balance entry point', () => {
    const settingsBlob = new MemoryStorage()
    initSettings(settingsBlob)
    expect(useSettingsStore.getState().telemetry).toBe(false)

    // A finished mission with telemetry never enabled records nothing.
    recordMissionOutcome('m01', outcome(), storage)
    recordAbort('m01', 30, 20870514, ['assault'], storage)
    expect(storage.getItem(TELEMETRY_KEY)).toBeNull()
    expect(loadRecords(storage)).toEqual([])
    expect(balanceEntryVisible(loadRecords(storage))).toBe(false)
  })
})

describe('toggle off keeps the log (PV-013 AC2)', () => {
  afterEach(() => {
    useSettingsStore.setState({ telemetry: false })
  })

  it('records survive the toggle; Export and Clear work; Clear removes the entry point', () => {
    useSettingsStore.getState().setTelemetry(true)
    recordMissionOutcome('m01', outcome(), storage)
    expect(loadRecords(storage)).toHaveLength(1)

    useSettingsStore.getState().setTelemetry(false)
    expect(useSettingsStore.getState().telemetry).toBe(false)
    const kept = loadRecords(storage)
    expect(kept).toHaveLength(1)
    expect(balanceEntryVisible(kept)).toBe(true)

    // Off is a no-op for new outcomes; the existing record stays.
    recordMissionOutcome('m01', outcome({ won: false, reward: 0 }), storage)
    recordAbort('m01', 12, 20870514, ['assault'], storage)
    expect(loadRecords(storage)).toEqual(kept)

    // Export works while off.
    const exported = JSON.parse(exportJson(kept))
    expect(exported).toEqual({ version: TELEMETRY_VERSION, records: kept })

    // Clear works while off, and the gate follows the log.
    const seen: number[] = []
    const unsubscribe = subscribeTelemetry(() => seen.push(telemetryRevision()))
    const before = telemetryRevision()
    clearRecords(storage)
    unsubscribe()
    expect(loadRecords(storage)).toEqual([])
    expect(balanceEntryVisible(loadRecords(storage))).toBe(false)
    expect(seen).toEqual([before + 1])
  })

  it('the Settings and Debrief gate reads the log, never the toggle', () => {
    expect(balanceGateSrc).toMatch(/balanceEntryVisible\(loadRecords\(\)\)/)
    expect(balanceGateSrc).not.toMatch(/useSettingsStore|\.telemetry\b/)
  })
})

describe('no network egress (PV-013 AC3)', () => {
  const egress = {
    fetch: vi.fn(),
    sendBeacon: vi.fn(),
    xhr: vi.fn(),
    socket: vi.fn(),
  }

  beforeEach(() => {
    for (const spy of Object.values(egress)) spy.mockClear()
    vi.stubGlobal('fetch', egress.fetch)
    vi.stubGlobal('XMLHttpRequest', egress.xhr)
    vi.stubGlobal('WebSocket', egress.socket)
    vi.stubGlobal('navigator', { sendBeacon: egress.sendBeacon })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    useSettingsStore.setState({ telemetry: false })
  })

  function runEveryPath(): void {
    // Debrief apply (records through the default storage path).
    useAppStore.setState({ phase: 'debrief', missionId: 'm01', lastAppliedKey: 0 })
    useAppStore.getState().setOutcome(outcome({ applyKey: 1 }))
    applyDebrief('m01')
    expect(useAppStore.getState().lastAppliedKey).toBe(1)
    // The same entry points against an inspectable storage.
    recordMissionOutcome('m01', outcome(), storage)
    // Abort.
    recordAbort('m01', 12, 20870514, ['assault'], storage)
    // Balance view.
    aggregate(loadRecords(storage))
    // Export.
    exportJson(loadRecords(storage))
    // Clear.
    clearRecords(storage)
  }

  for (const on of [true, false]) {
    it(`emits no request from Debrief, Abort, Balance, Export or Clear with telemetry ${on ? 'on' : 'off'}`, () => {
      useSettingsStore.setState({ telemetry: on })
      runEveryPath()
      expect(egress.fetch).not.toHaveBeenCalled()
      expect(egress.sendBeacon).not.toHaveBeenCalled()
      expect(egress.xhr).not.toHaveBeenCalled()
      expect(egress.socket).not.toHaveBeenCalled()
    })
  }

  it('telemetry.ts and the Balance panel hold no network or cookie API', () => {
    const forbidden = /\bfetch\s*\(|sendBeacon|XMLHttpRequest|WebSocket|EventSource|document\.cookie|navigator\./
    expect(telemetrySrc).not.toMatch(forbidden)
    expect(balanceSrc).not.toMatch(forbidden)
    expect(balanceGateSrc).not.toMatch(forbidden)
    // Export is a local data: URL download, not an upload.
    expect(balanceSrc).toMatch(/'data:application\/json/)
  })
})
