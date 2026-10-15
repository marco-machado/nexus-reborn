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
import { SAVE_KEY, captureSave, startNewOperation, writeSave } from './save'
import { useWorldStore } from './worldStore'
import telemetrySrc from './telemetry.ts?raw'
import balanceSrc from '../ui/Balance.tsx?raw'
import balanceGateSrc from '../ui/balanceGate.ts?raw'
import { NO_DATA, balanceStatRows } from '../ui/balanceStats'
import type {
  AbortRecord,
  FinishedRecord,
  MissionRecord,
  MissionTelemetry,
} from './telemetry'

class MemoryStorage implements SettingsStorage {
  data = new Map<string, string>()

  getItem(key: string): string | null {
    return this.data.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value)
  }

  removeItem(key: string): void {
    this.data.delete(key)
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

function record(over: Partial<FinishedRecord> = {}): FinishedRecord {
  const built = buildRecord('m01', outcome(), 1000)
  expect(built).not.toBeNull()
  return { ...(built as FinishedRecord), ...over }
}

// The thin row recordAbort writes.
function abortRow(over: Partial<AbortRecord> = {}): AbortRecord {
  return {
    at: 1000,
    missionId: 'm01',
    outcome: 'aborted',
    durationSec: 12,
    seed: 20870514,
    squadRoles: ['assault'],
    ...over,
  }
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
    expect(agg.winRate).toBe(1)
    expect(agg.meanDurationSec).toBeCloseTo(265, 10)
    useSettingsStore.setState({ telemetry: false })
  })
})

describe('aggregate', () => {
  it('computes no win rate and zero totals over an empty log', () => {
    const agg = aggregate([])
    expect(agg.missions).toBe(0)
    expect(agg.winRate).toBeNull()
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

// PV-014 (TR-persistence-008, ADR-0015, ADR-0021): one record per outcome, a
// 60-row FIFO log, and a log that New Operation leaves alone.
describe('one record per outcome, cap 60 FIFO, log survives New Operation (PV-014)', () => {
  beforeEach(() => {
    // applyDebrief records through the default (browser) storage path.
    vi.stubGlobal('window', { localStorage: storage })
    useSettingsStore.setState({ telemetry: true })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    useSettingsStore.setState({ telemetry: false })
  })

  // A mission that reaches Debrief with a fresh apply key, then the invoice applies.
  function debrief(applyKey: number, over: Partial<MissionOutcome> = {}): void {
    useAppStore.setState({ phase: 'debrief', missionId: 'm01', lastAppliedKey: applyKey - 1 })
    useAppStore.getState().setOutcome(outcome({ applyKey, ...over }))
    applyDebrief('m01')
  }

  function seed(rows: MissionRecord[]): void {
    saveRecords(rows, storage)
    expect(loadRecords(storage)).toHaveLength(rows.length)
  }

  const identity = (r: MissionRecord) => `${r.outcome}|${r.missionId}|${r.durationSec}`

  for (const won of [true, false]) {
    it(`AC1: a ${won ? 'won' : 'lost'} Debrief adds exactly one ${won ? 'won' : 'lost'} row (N+1, not N+2)`, () => {
      const N = 3
      seed([record({ at: 1 }), record({ at: 2 }), abortRow({ at: 3 })])
      debrief(1, won ? {} : { won: false, reward: 0 })
      // The Debrief screen staying open re-runs the apply; the key makes it a no-op.
      applyDebrief('m01')
      const rows = loadRecords(storage)
      expect(rows).toHaveLength(N + 1)
      expect(aggregate(rows).missions).toBe(N + 1)
      const added = rows[rows.length - 1]
      expect(added.outcome).toBe(won ? 'won' : 'lost')
      expect(added.outcome).not.toBe('aborted')
    })
  }

  const oldest = { outcome: 'lost', missionId: 'm07', durationSec: 123 } as const
  function fullLog(): MissionRecord[] {
    const rows = [record({ at: 0, ...oldest, payout: 0, fine: 0 })]
    for (let i = 1; i < TELEMETRY_CAP; i++) rows.push(record({ at: i }))
    return rows
  }

  it('AC2: at 60 records, another Debrief keeps 60 and drops the recorded oldest row', () => {
    seed(fullLog())
    const before = loadRecords(storage)
    expect(identity(before[0])).toBe('lost|m07|123')
    debrief(1)
    const rows = loadRecords(storage)
    expect(rows).toHaveLength(TELEMETRY_CAP)
    expect(aggregate(rows).missions).toBe(TELEMETRY_CAP)
    expect(rows.map(identity)).not.toContain('lost|m07|123')
    expect(rows.slice(0, TELEMETRY_CAP - 1)).toEqual(before.slice(1))
  })

  it('AC2: at 60 records, an Abort keeps 60 and drops the recorded oldest row', () => {
    seed(fullLog())
    const before = loadRecords(storage)
    recordAbort('m02', 12, 20870514, ['assault'])
    const rows = loadRecords(storage)
    expect(rows).toHaveLength(TELEMETRY_CAP)
    expect(rows.map(identity)).not.toContain('lost|m07|123')
    expect(rows.slice(0, TELEMETRY_CAP - 1)).toEqual(before.slice(1))
    expect(rows[TELEMETRY_CAP - 1].outcome).toBe('aborted')
  })

  it('AC3: confirmed New Operation yields a new campaign and keeps the toggle and the log', () => {
    // A new Operation from a parallel clean origin is the reference campaign.
    startNewOperation(new MemoryStorage())
    const fresh = captureSave()

    // Snapshot S: a lived-in campaign with telemetry on and records present.
    useAppStore.setState({ phase: 'world', credits: 77777 })
    useWorldStore.setState({ t: 3600, influence: 5 })
    seed([record({ at: 1 }), record({ at: 2, outcome: 'lost' })])
    const toggle = useSettingsStore.getState().telemetry
    const blob = storage.getItem(TELEMETRY_KEY)
    const log = loadRecords(storage)
    expect(toggle).toBe(true)

    startNewOperation(storage)

    const now = captureSave()
    expect(now.app.credits).toBe(fresh.app.credits)
    expect(now.campaign).toEqual(fresh.campaign)
    expect(now.world.t).toBe(fresh.world.t)
    expect(now.world.influence).toBe(fresh.world.influence)
    expect(useSettingsStore.getState().telemetry).toBe(toggle)
    expect(storage.getItem(TELEMETRY_KEY)).toBe(blob)
    expect(loadRecords(storage)).toEqual(log)
    expect(balanceEntryVisible(loadRecords(storage))).toBe(true)
  })
})

// PV-015 (TR-persistence-008, ADR-0015, ADR-0002): the Abort row is thin and
// never a campaign write; Balance win rate is won / (won + lost) with aborts
// out of the denominator, and a no-data marker when nothing was decided.
describe('abort telemetry row and Balance win rate (PV-015)', () => {
  const statValue = (rows: ReturnType<typeof balanceStatRows>, label: string) =>
    rows.find((r) => r.label === label)?.value

  // A rendered zero value ('0', '0%', '0 CR', '0 / 0', '0:00'), not a digit in a larger number.
  const ZERO_NAN_INF = /(^|[^\d.,])0(?![\d.,])|NaN|Infinity/

  function log(won: number, lost: number, aborted: number): MissionRecord[] {
    const rows: MissionRecord[] = []
    for (let i = 0; i < won; i++) rows.push(record({ at: rows.length }))
    for (let i = 0; i < lost; i++) {
      rows.push(record({ at: rows.length, outcome: 'lost', payout: 0, fine: 0 }))
    }
    for (let i = 0; i < aborted; i++) rows.push(abortRow({ at: rows.length }))
    return rows
  }

  afterEach(() => {
    vi.unstubAllGlobals()
    useSettingsStore.setState({ telemetry: false })
  })

  it('AC1: Abort from pause with telemetry on leaves the campaign at S and appends one thin aborted row', () => {
    // The Hud pause-menu Abort records through the default (browser) storage path.
    vi.stubGlobal('window', { localStorage: storage })
    useSettingsStore.setState({ telemetry: true })
    useAppStore.setState({ phase: 'world', credits: 222333 })
    useWorldStore.setState({ t: 3600, influence: 7 })
    expect(writeSave(storage)).toBe(true)
    const S = storage.getItem(SAVE_KEY)
    const snapshot = captureSave()
    saveRecords([record({ at: 1 }), abortRow({ at: 2 })], storage)
    const abortsBefore = aggregate(loadRecords(storage)).aborts

    recordAbort('m03', 45.5, 4242, ['assault', 'medic'])

    // Campaign still equals S: neither the stored blob nor the stores moved.
    expect(storage.getItem(SAVE_KEY)).toBe(S)
    expect(captureSave()).toEqual(snapshot)
    const rows = loadRecords(storage)
    expect(rows).toHaveLength(3)
    expect(aggregate(rows).aborts).toBe(abortsBefore + 1)
    const row = rows[rows.length - 1]
    expect(row).toMatchObject({
      outcome: 'aborted',
      durationSec: 45.5,
      missionId: 'm03',
      seed: 4242,
      squadRoles: ['assault', 'medic'],
    })
    // Not a combat invoice: only the thin fields (plus the record time) exist.
    expect(Object.keys(row).sort()).toEqual(
      ['at', 'durationSec', 'missionId', 'outcome', 'seed', 'squadRoles'].sort(),
    )
    for (const key of ['kills', 'kia', 'reward', 'bonus', 'fine', 'payout', 'damageDealt']) {
      expect(row).not.toHaveProperty(key)
    }
    // The export carries the same thin row.
    const exported = JSON.parse(exportJson(rows)) as { records: Array<Record<string, unknown>> }
    expect(exported.records[2]).toEqual(row)
  })

  it('AC2: 2 won, 1 lost, 3 aborted: win rate 2 / (2 + 1), abort count 3', () => {
    const agg = aggregate(log(2, 1, 3))
    expect(agg).toMatchObject({ wins: 2, losses: 1, aborts: 3, decided: 3, missions: 6 })
    expect(agg.winRate).toBeCloseTo(2 / 3, 10)
    // Aborts in the denominator would read 2 / 6.
    expect(agg.winRate).not.toBeCloseTo(2 / 6, 10)
    const rows = balanceStatRows(agg)
    expect(statValue(rows, 'WIN RATE')).toBe('67%')
    expect(statValue(rows, 'ABORTS')).toBe('3')
  })

  it('AC3: 0 won, 2 lost: win rate is 0.0', () => {
    const agg = aggregate(log(0, 2, 0))
    expect(agg.winRate).toBe(0)
    expect(statValue(balanceStatRows(agg), 'WIN RATE')).toBe('0%')
  })

  it('AC4: 0 won, 0 lost, 3 aborted: abort count 3, no-data marker, no 0 / NaN / Infinity in Balance', () => {
    const agg = aggregate(log(0, 0, 3))
    expect(agg.aborts).toBe(3)
    expect(agg.decided).toBe(0)
    expect(agg.winRate).toBeNull()
    const rows = balanceStatRows(agg)
    expect(statValue(rows, 'WIN RATE')).toBe(NO_DATA)
    expect(statValue(rows, 'ABORTS')).toBe('3')
    for (const row of rows) expect(row.value, row.label).not.toMatch(ZERO_NAN_INF)
    // The share bars render their empty copy, not zero rows.
    expect(agg.weaponDamage).toEqual([])
    expect(agg.abilityUses).toEqual([])
    // No aggregate number is NaN or Infinity either.
    for (const [key, value] of Object.entries(agg)) {
      if (typeof value === 'number') expect(Number.isFinite(value), key).toBe(true)
    }
  })

  it('AC4: abort rows written before the thin shape (zeroed combat fields) still read as no data', () => {
    const legacy = { ...record({ at: 1, payout: 0, fine: 0, reward: 0, kills: 0 }), outcome: 'aborted' }
    storage.setItem(
      TELEMETRY_KEY,
      JSON.stringify({ version: TELEMETRY_VERSION, records: [legacy, legacy, legacy] }),
    )
    const agg = aggregate(loadRecords(storage))
    expect(agg.aborts).toBe(3)
    expect(agg.winRate).toBeNull()
    for (const row of balanceStatRows(agg)) expect(row.value, row.label).not.toMatch(ZERO_NAN_INF)
  })

  it('formula: win_rate = won / (won + lost) for every mix, aborts excluded', () => {
    for (const [won, lost, aborted] of [
      [1, 0, 0],
      [0, 1, 5],
      [3, 1, 2],
      [5, 5, 50],
    ]) {
      const agg = aggregate(log(won, lost, aborted))
      expect(agg.winRate).toBeCloseTo(won / (won + lost), 10)
      expect(agg.aborts).toBe(aborted)
    }
  })

  it('Balance computes no abort rate: abort_rate has no defined denominator', () => {
    expect(aggregate(log(1, 1, 1))).not.toHaveProperty('abortRate')
    expect(balanceStatRows(aggregate(log(1, 1, 1))).map((r) => r.label)).not.toContain('ABORT RATE')
    expect(balanceSrc).not.toMatch(/abortRate|ABORT RATE/)
  })
})
