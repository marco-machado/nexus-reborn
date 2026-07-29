// CONTRACT FILE. Campaign progression that does not belong to the tactical,
// world, research, or screen-flow stores. Intel currently unlocks contracts;
// its second strategic use remains intentionally deferred to Milestone 4.
import { create } from 'zustand'
import { INTEL_LEVEL, INTEL_PROGRESS, MISSIONS, ROSTER } from '../game/data'
import type { MissionDef } from '../game/types'
import type { MissionOutcome } from './appStore'

const HOUR = 3600
const MISSION_INTEL = 40
const CLEAN_INTEL = 15
const CASUALTY_RECOVERY = 36 * HOUR
const INITIAL_INJURY_RECOVERY = 24 * HOUR

export type OperativeCondition = 'READY' | 'INJURED'

export interface CampaignRosterEntry {
  status: OperativeCondition
  recoverAtT: number | null
}

export interface CampaignState {
  intelLevel: number
  intelProgress: number
  roster: Record<string, CampaignRosterEntry>
  contractsWon: string[]
  // Number of app-store outcomes already consumed by the debrief boundary.
  outcomeApplied: number
  campaignWon: boolean
  awardIntel: (points: number) => void
  reportMission: (missionId: string, outcome: MissionOutcome, worldT: number) => void
  sync: (t: number) => void
}

export type CampaignData = Pick<
  CampaignState,
  'intelLevel' | 'intelProgress' | 'roster' | 'contractsWon' | 'outcomeApplied' | 'campaignWon'
>

export function initialCampaignData(): CampaignData {
  const roster: Record<string, CampaignRosterEntry> = {}
  for (const operative of ROSTER) {
    const injured = operative.status === 'INJURED'
    roster[operative.id] = {
      status: injured ? 'INJURED' : 'READY',
      recoverAtT: injured ? INITIAL_INJURY_RECOVERY : null,
    }
  }
  return {
    intelLevel: INTEL_LEVEL,
    intelProgress: INTEL_PROGRESS,
    roster,
    contractsWon: [],
    outcomeApplied: 0,
    campaignWon: false,
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
      const intelAward = (outcome.won ? MISSION_INTEL : 0) + (outcome.civiliansHit === 0 ? CLEAN_INTEL : 0)
      const [intelLevel, intelProgress] = addIntel(
        state.intelLevel,
        state.intelProgress,
        intelAward,
      )

      const won = outcome.won && !state.contractsWon.includes(missionId)
        ? [...state.contractsWon, missionId]
        : state.contractsWon
      const roster = { ...state.roster }
      for (const id of outcome.deadIds) {
        if (!roster[id]) continue
        roster[id] = { status: 'INJURED', recoverAtT: worldT + CASUALTY_RECOVERY }
      }

      return {
        intelLevel,
        intelProgress,
        roster,
        contractsWon: won,
        campaignWon: MISSIONS.every((mission) => won.includes(mission.id)),
        outcomeApplied: state.outcomeApplied + 1,
      }
    }),

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
      return changed ? { roster } : state
    }),
}))
