// Local-only mission telemetry. Off by default behind the settings TELEMETRY
// toggle; when on, the debrief boundary appends one record per mission outcome
// to a versioned localStorage blob under its own key, capped at 60 records
// FIFO. Nothing here touches the network, and the mission hot path never
// calls in: world.ts keeps plain numeric counters and hands them over once,
// inside the outcome it already pushes (MissionOutcome.telemetry).
import { collateralFine, netPayout } from './appStore'
import type { MissionOutcome } from './appStore'
import { useSettingsStore } from './settingsStore'
import type { SettingsStorage } from './settingsStore'

export const TELEMETRY_KEY = 'nexus-telemetry-v1'
export const TELEMETRY_VERSION = 1 as const
export const TELEMETRY_CAP = 60

// The counters world.ts accumulates during a mission and hands to the outcome.
export interface MissionTelemetry {
  seed: number
  // Mission seconds to the first guard entering combat; null for a clean run.
  firstContactSec: number | null
  // Completion time of every objective that finished, in mission seconds.
  objectiveTimes: Array<{ id: string; atSec: number }>
  // Squad fire only, keyed by weapon id.
  shotsByWeapon: Record<string, number>
  damageByWeapon: Record<string, number>
  // Damage landed by the squad on enemies and devices / on the squad.
  damageDealt: number
  damageTaken: number
  civilianHitsBySquad: number
  civilianHitsByCorpsec: number
  medUsed: number
  cellUsed: number
  abilityUsesByRole: Record<string, number>
  squadRoles: string[]
}

/** A decided mission (Debrief ran): the full combat record. */
export interface FinishedRecord extends MissionTelemetry {
  at: number
  missionId: string
  outcome: 'won' | 'lost'
  durationSec: number
  kills: number
  kia: number
  civiliansHit: number
  reward: number
  bonus: number
  fine: number
  payout: number
}

/**
 * The thin row an Abort writes (GDD Rule 17): `aborted` plus duration, mission
 * id, seed and deployed roles. No combat invoice: no kills, fines or payout.
 */
export interface AbortRecord {
  at: number
  missionId: string
  outcome: 'aborted'
  durationSec: number
  seed: number
  squadRoles: string[]
}

export type MissionRecord = FinishedRecord | AbortRecord

// One record from the outcome the sim pushed. Null when the outcome carries no
// telemetry payload (older saves, headless constructions).
export function buildRecord(
  missionId: string,
  outcome: MissionOutcome,
  at: number = Date.now(),
): FinishedRecord | null {
  const t = outcome.telemetry
  if (!t) return null
  return {
    at,
    missionId,
    outcome: outcome.won ? 'won' : 'lost',
    durationSec: outcome.timeSec,
    kills: outcome.kills,
    kia: outcome.deadIds.length,
    civiliansHit: outcome.civiliansHit,
    reward: outcome.reward,
    bonus: outcome.bonus,
    fine: outcome.won ? collateralFine(outcome) : 0,
    payout: netPayout(outcome),
    ...t,
  }
}

// FIFO append: the oldest record leaves once the cap is reached.
export function appendRecord(
  records: MissionRecord[],
  record: MissionRecord,
): MissionRecord[] {
  const next = [...records, record]
  return next.length > TELEMETRY_CAP ? next.slice(next.length - TELEMETRY_CAP) : next
}

function browserStorage(): SettingsStorage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

// Version guard like the settings blob: a wrong version or garbage yields an
// empty log rather than a half-read one.
export function loadRecords(storage: SettingsStorage | null = browserStorage()): MissionRecord[] {
  if (!storage) return []
  try {
    const raw = storage.getItem(TELEMETRY_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      (parsed as Record<string, unknown>).version !== TELEMETRY_VERSION ||
      !Array.isArray((parsed as Record<string, unknown>).records)
    ) {
      return []
    }
    const rows = (parsed as { records: unknown[] }).records
    return rows.filter(
      (r): r is MissionRecord =>
        typeof r === 'object' &&
        r !== null &&
        typeof (r as MissionRecord).missionId === 'string' &&
        ((r as MissionRecord).outcome === 'won' ||
          (r as MissionRecord).outcome === 'lost' ||
          (r as MissionRecord).outcome === 'aborted'),
    )
  } catch {
    return []
  }
}

// Change notification for the log. The log is not a Zustand store (ADR-0015),
// so the screens that gate on it (the Balance entry point) subscribe here and
// re-read storage when the revision moves. Bumped on every write attempt.
let revision = 0
const listeners = new Set<() => void>()

/** Current log revision; changes after every save or clear. */
export function telemetryRevision(): number {
  return revision
}

/** Subscribe to log writes. Returns the unsubscribe function. */
export function subscribeTelemetry(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function saveRecords(
  records: MissionRecord[],
  storage: SettingsStorage | null = browserStorage(),
): void {
  try {
    storage?.setItem(TELEMETRY_KEY, JSON.stringify({ version: TELEMETRY_VERSION, records }))
  } catch {
    // Full or read-only storage never blocks the debrief.
  }
  revision += 1
  for (const listener of [...listeners]) listener()
}

/**
 * Whether Settings and Debrief show the Balance entry point. It follows the
 * log, not the TELEMETRY toggle: present while records exist (so turning the
 * toggle off still leaves Export and Clear reachable), gone once the log is
 * empty — a new origin, or a confirmed Clear.
 */
export function balanceEntryVisible(records: readonly MissionRecord[]): boolean {
  return records.length > 0
}

export function clearRecords(storage: SettingsStorage | null = browserStorage()): void {
  saveRecords([], storage)
}

// The debrief-boundary entry point: a no-op unless the player opted in.
export function recordMissionOutcome(
  missionId: string,
  outcome: MissionOutcome,
  storage: SettingsStorage | null = browserStorage(),
): void {
  if (!useSettingsStore.getState().telemetry) return
  const record = buildRecord(missionId, outcome)
  if (!record) return
  saveRecords(appendRecord(loadRecords(storage), record), storage)
}

/**
 * Append the thin abort row (only while telemetry is on). Never touches the
 * campaign blob: an Abort is not a campaign write (ADR-0002).
 */
export function recordAbort(
  missionId: string,
  durationSec: number,
  seed: number,
  squadRoles: string[],
  storage: SettingsStorage | null = browserStorage(),
): void {
  if (!useSettingsStore.getState().telemetry) return
  const record: AbortRecord = {
    at: Date.now(),
    missionId,
    outcome: 'aborted',
    durationSec,
    seed,
    squadRoles: [...squadRoles],
  }
  saveRecords(appendRecord(loadRecords(storage), record), storage)
}

export function exportJson(records: MissionRecord[]): string {
  return JSON.stringify({ version: TELEMETRY_VERSION, records }, null, 2)
}

/* -------------------------------- aggregates ------------------------------- */

export interface ShareRow {
  key: string
  value: number
  share: number
}

export interface BalanceAggregate {
  missions: number
  wins: number
  losses: number
  aborts: number
  /** Decided missions: won + lost. Aborts are never decided. */
  decided: number
  /**
   * `win_rate = won / (won + lost)`, aborts excluded (GDD Formulas). Null when
   * `won + lost = 0`: not computed, Balance shows the no-data marker. There is
   * deliberately no abort rate: `abort_rate` has no defined denominator (GDD
   * Open Question 4).
   */
  winRate: number | null
  // Means and rates over decided missions; null when none is decided.
  meanDurationSec: number | null
  // Over the missions that had a first contact at all.
  meanFirstContactSec: number | null
  // Fraction of decided missions with at least one squad-billed civilian hit.
  collateralRate: number | null
  civiliansHitTotal: number
  kiaTotal: number
  medUsedTotal: number
  cellUsedTotal: number
  meanPayout: number | null
  totalPayout: number
  totalFines: number
  // Damage share by weapon and ability use by role, sorted descending.
  weaponDamage: ShareRow[]
  abilityUses: ShareRow[]
}

function shareRows(totals: Record<string, number>): ShareRow[] {
  let sum = 0
  for (const key of Object.keys(totals)) sum += totals[key]
  return Object.keys(totals)
    .filter((key) => totals[key] > 0)
    .map((key) => ({ key, value: totals[key], share: sum > 0 ? totals[key] / sum : 0 }))
    .sort((a, b) => b.value - a.value || (a.key < b.key ? -1 : 1))
}

export function aggregate(records: MissionRecord[]): BalanceAggregate {
  const n = records.length
  let wins = 0
  let losses = 0
  let aborts = 0
  let duration = 0
  let contactSum = 0
  let contactN = 0
  let collateralMissions = 0
  let civilians = 0
  let kia = 0
  let med = 0
  let cell = 0
  let payout = 0
  let fines = 0
  const damage: Record<string, number> = {}
  const abilities: Record<string, number> = {}
  for (const r of records) {
    if (r.outcome === 'aborted') {
      // A thin row: it counts as an abort and feeds nothing else. Rows written
      // before the thin shape carried zeroed combat fields; skipping them here
      // gives the same totals.
      aborts += 1
      continue
    }
    if (r.outcome === 'won') wins += 1
    else losses += 1
    duration += r.durationSec
    if (r.firstContactSec !== null && r.firstContactSec !== undefined) {
      contactSum += r.firstContactSec
      contactN += 1
    }
    if (r.civilianHitsBySquad > 0) collateralMissions += 1
    civilians += r.civiliansHit
    kia += r.kia
    med += r.medUsed
    cell += r.cellUsed
    payout += r.payout
    fines += r.fine
    for (const [w, v] of Object.entries(r.damageByWeapon ?? {})) {
      damage[w] = (damage[w] ?? 0) + v
    }
    for (const [role, v] of Object.entries(r.abilityUsesByRole ?? {})) {
      abilities[role] = (abilities[role] ?? 0) + v
    }
  }
  const decided = wins + losses
  return {
    missions: n,
    wins,
    losses,
    aborts,
    decided,
    winRate: decided > 0 ? wins / decided : null,
    meanDurationSec: decided > 0 ? duration / decided : null,
    meanFirstContactSec: contactN > 0 ? contactSum / contactN : null,
    collateralRate: decided > 0 ? collateralMissions / decided : null,
    civiliansHitTotal: civilians,
    kiaTotal: kia,
    medUsedTotal: med,
    cellUsedTotal: cell,
    meanPayout: decided > 0 ? payout / decided : null,
    totalPayout: payout,
    totalFines: fines,
    weaponDamage: shareRows(damage),
    abilityUses: shareRows(abilities),
  }
}
