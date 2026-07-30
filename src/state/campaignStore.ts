// CONTRACT FILE. Campaign progression that does not belong to the tactical,
// world, research, or screen-flow stores: intel, contract record, and the live
// operative roster (hires, losses, injuries, and the recruitment market).
// Intel currently unlocks contracts; its second strategic use remains
// intentionally deferred to Milestone 4.
import { create } from 'zustand'
import { INTEL_LEVEL, INTEL_PROGRESS, MISSIONS, ROSTER } from '../game/data'
import {
  CANDIDATE_POOL,
  CANDIDATE_REFRESH_SEC,
  INITIAL_RECRUIT_RNG,
  ROSTER_CAP,
  candidateToOperative,
  rollCandidate,
} from '../game/recruits'
import type { Candidate } from '../game/recruits'
import type { MissionDef, OperativeDef } from '../game/types'
import type { MissionOutcome } from './appStore'

const HOUR = 3600
const MISSION_INTEL = 40
const CLEAN_INTEL = 15
const INITIAL_INJURY_RECOVERY = 24 * HOUR
// A survivor below this fraction of max HP leaves the mission injured. The
// downtime scales with how deep below it the operative ended: just under the
// threshold costs the minimum, near death costs the maximum.
export const INJURY_HP_FRAC = 0.35
export const INJURY_RECOVERY_MIN = 12 * HOUR
export const INJURY_RECOVERY_MAX = 48 * HOUR

export type OperativeCondition = 'READY' | 'INJURED'

export interface CampaignRosterEntry {
  status: OperativeCondition
  recoverAtT: number | null
}

// What the last debrief did to the roster, for the debrief screen. Transient:
// never saved, rebuilt by every reportMission.
export interface DebriefReport {
  kia: Array<{ id: string; codename: string }>
  injured: Array<{ id: string; codename: string; downtimeSec: number }>
}

export function injuryRecoverySec(hpFrac: number): number {
  const frac = Math.min(INJURY_HP_FRAC, Math.max(0, hpFrac))
  const depth = 1 - frac / INJURY_HP_FRAC
  return Math.round(
    INJURY_RECOVERY_MIN + depth * (INJURY_RECOVERY_MAX - INJURY_RECOVERY_MIN),
  )
}

export interface CampaignState {
  intelLevel: number
  intelProgress: number
  // The live roster. `operatives` carries the full definitions (hires are
  // procedural, so static data cannot); `roster` carries condition and the
  // recovery clock, keyed by the same ids.
  operatives: OperativeDef[]
  roster: Record<string, CampaignRosterEntry>
  candidates: Candidate[]
  recruitRngState: number
  nextCandidateT: number
  contractsWon: string[]
  // Number of app-store outcomes already consumed by the debrief boundary.
  outcomeApplied: number
  campaignWon: boolean
  lastReport: DebriefReport | null
  awardIntel: (points: number) => void
  reportMission: (missionId: string, outcome: MissionOutcome, worldT: number) => void
  // Moves a candidate onto the roster. The credit charge lives in
  // appStore.hireOperative, which calls this only after the fee cleared.
  acceptHire: (candidateId: string) => boolean
  sync: (t: number) => void
}

export type CampaignData = Pick<
  CampaignState,
  | 'intelLevel'
  | 'intelProgress'
  | 'operatives'
  | 'roster'
  | 'candidates'
  | 'recruitRngState'
  | 'nextCandidateT'
  | 'contractsWon'
  | 'outcomeApplied'
  | 'campaignWon'
  | 'lastReport'
>

// One candidate the rest of the campaign has not seen: rerolls a bounded
// number of times when the id or codename collides with the roster or the
// pool, advancing the cursor deterministically either way.
function rollFreshCandidate(
  state: number,
  operatives: OperativeDef[],
  candidates: Candidate[],
): { candidate: Candidate; state: number } {
  const ids = new Set([...operatives.map((o) => o.id), ...candidates.map((c) => c.id)])
  const codenames = new Set([
    ...operatives.map((o) => o.codename),
    ...candidates.map((c) => c.codename),
  ])
  let rolled = rollCandidate(state)
  for (
    let tries = 0;
    tries < 16 && (ids.has(rolled.candidate.id) || codenames.has(rolled.candidate.codename));
    tries++
  ) {
    rolled = rollCandidate(rolled.state)
  }
  return rolled
}

export function initialCampaignData(): CampaignData {
  const operatives = ROSTER.map((operative) => ({ ...operative }))
  const roster: Record<string, CampaignRosterEntry> = {}
  for (const operative of operatives) {
    const injured = operative.status === 'INJURED'
    roster[operative.id] = {
      status: injured ? 'INJURED' : 'READY',
      recoverAtT: injured ? INITIAL_INJURY_RECOVERY : null,
    }
  }
  const candidates: Candidate[] = []
  let recruitRngState = INITIAL_RECRUIT_RNG
  for (let i = 0; i < CANDIDATE_POOL; i++) {
    const rolled = rollFreshCandidate(recruitRngState, operatives, candidates)
    candidates.push(rolled.candidate)
    recruitRngState = rolled.state
  }
  return {
    intelLevel: INTEL_LEVEL,
    intelProgress: INTEL_PROGRESS,
    operatives,
    roster,
    candidates,
    recruitRngState,
    nextCandidateT: CANDIDATE_REFRESH_SEC,
    contractsWon: [],
    outcomeApplied: 0,
    campaignWon: false,
    lastReport: null,
  }
}

function addIntel(level: number, progress: number, points: number): [number, number] {
  let nextLevel = level
  let nextProgress = progress + Math.max(0, Math.floor(points))
  while (nextProgress >= 100) {
    nextProgress -= 100
    nextLevel += 1
  }
  return [nextLevel, nextProgress]
}

export function missionLocked(mission: MissionDef, intelLevel: number): boolean {
  return intelLevel < mission.intelReq
}

// Live-roster lookup for read sites that hold an operative id (mission
// deployment, dossier panels). Throws on an id the roster does not carry.
export function liveOperativeById(id: string): OperativeDef {
  const operative = useCampaignStore.getState().operatives.find((o) => o.id === id)
  if (!operative) throw new Error('unknown operative ' + id)
  return operative
}

export const useCampaignStore = create<CampaignState>((set) => ({
  ...initialCampaignData(),

  awardIntel: (points) =>
    set((state) => {
      if (!Number.isFinite(points) || points <= 0) return state
      const [intelLevel, intelProgress] = addIntel(
        state.intelLevel,
        state.intelProgress,
        points,
      )
      return { intelLevel, intelProgress }
    }),

  reportMission: (missionId, outcome, worldT) =>
    set((state) => {
      const intelAward = outcome.won
        ? MISSION_INTEL + (outcome.civiliansHit === 0 ? CLEAN_INTEL : 0)
        : 0
      const [intelLevel, intelProgress] = addIntel(
        state.intelLevel,
        state.intelProgress,
        intelAward,
      )

      // Only authored contracts join the campaign record: a fulfilled
      // generated contract pays and moves the world, then leaves the market.
      const authored = MISSIONS.some((mission) => mission.id === missionId)
      const won = outcome.won && authored && !state.contractsWon.includes(missionId)
        ? [...state.contractsWon, missionId]
        : state.contractsWon

      // A death is final: the operative leaves the roster for good. A survivor
      // who ended below the injury threshold recovers on the world clock, for
      // a downtime scaled by the missing health.
      const dead = new Set(outcome.deadIds)
      const kia = state.operatives
        .filter((o) => dead.has(o.id))
        .map((o) => ({ id: o.id, codename: o.codename }))
      const operatives = state.operatives.filter((o) => !dead.has(o.id))
      const roster: Record<string, CampaignRosterEntry> = {}
      const injured: DebriefReport['injured'] = []
      for (const operative of operatives) {
        const entry = state.roster[operative.id] ?? { status: 'READY', recoverAtT: null }
        const hpFrac = outcome.survivorHp[operative.id]
        if (hpFrac !== undefined && hpFrac < INJURY_HP_FRAC) {
          const downtimeSec = injuryRecoverySec(hpFrac)
          roster[operative.id] = { status: 'INJURED', recoverAtT: worldT + downtimeSec }
          injured.push({ id: operative.id, codename: operative.codename, downtimeSec })
        } else {
          roster[operative.id] = { ...entry }
        }
      }

      return {
        intelLevel,
        intelProgress,
        operatives,
        roster,
        contractsWon: won,
        campaignWon: MISSIONS.every((mission) => won.includes(mission.id)),
        outcomeApplied: state.outcomeApplied + 1,
        lastReport: { kia, injured },
      }
    }),

  acceptHire: (candidateId) => {
    let hired = false
    set((state) => {
      const candidate = state.candidates.find((c) => c.id === candidateId)
      if (!candidate || state.operatives.length >= ROSTER_CAP) return state
      hired = true
      return {
        operatives: [...state.operatives, candidateToOperative(candidate)],
        roster: {
          ...state.roster,
          [candidate.id]: { status: 'READY', recoverAtT: null },
        },
        candidates: state.candidates.filter((c) => c.id !== candidateId),
      }
    })
    return hired
  },

  sync: (t) =>
    set((state) => {
      let changed = false
      const roster = { ...state.roster }
      for (const [id, entry] of Object.entries(roster)) {
        if (
          entry.status === 'INJURED' &&
          entry.recoverAtT !== null &&
          t >= entry.recoverAtT
        ) {
          roster[id] = { status: 'READY', recoverAtT: null }
          changed = true
        }
      }

      // The recruitment market refreshes one candidate per 24 world hours,
      // catching up whole intervals after a contract's ETA jump exactly as
      // continuous ticking would have.
      let candidates = state.candidates
      let recruitRngState = state.recruitRngState
      let nextCandidateT = state.nextCandidateT
      while (t >= nextCandidateT) {
        const rolled = rollFreshCandidate(recruitRngState, state.operatives, candidates)
        candidates =
          candidates.length >= CANDIDATE_POOL
            ? [...candidates.slice(1), rolled.candidate]
            : [...candidates, rolled.candidate]
        recruitRngState = rolled.state
        nextCandidateT += CANDIDATE_REFRESH_SEC
        changed = true
      }

      return changed
        ? { roster, candidates, recruitRngState, nextCandidateT }
        : state
    }),
}))
