// CONTRACT FILE. App level state: screen flow, mission choice, squad, credits.
import { create } from 'zustand'
import { DEFAULT_SQUAD, missionById } from '../game/data'
import { missionLocked, useCampaignStore } from './campaignStore'

export type Phase = 'menu' | 'world' | 'research' | 'brief' | 'team' | 'mission' | 'debrief'

export interface MissionOutcome {
  won: boolean
  kills: number
  casualties: number
  timeSec: number
  civiliansHit: number
  reward: number
  deadIds: string[]
}

// Every contract carries a collateral clause. Each bystander caught by a round
// costs this much off the fee; it can zero the payment, never run up a debt.
export const COLLATERAL_FINE = 5000

export function collateralFine(o: MissionOutcome): number {
  return Math.min(o.reward, o.civiliansHit * COLLATERAL_FINE)
}

export function netPayout(o: MissionOutcome): number {
  return o.won ? o.reward - collateralFine(o) : 0
}

export const INITIAL_CREDITS = 128450

export interface AppState {
  phase: Phase
  missionId: string | null
  squad: string[]
  credits: number
  outcome: MissionOutcome | null
  outcomeSerial: number
  goto: (phase: Phase) => void
  selectMission: (id: string) => void
  toggleOperative: (id: string) => void
  spendCredits: (amount: number) => void
  setOutcome: (o: MissionOutcome) => void
}

export const useAppStore = create<AppState>((set) => ({
  phase: 'menu',
  missionId: null,
  squad: [...DEFAULT_SQUAD],
  credits: INITIAL_CREDITS,
  outcome: null,
  outcomeSerial: 0,
  goto: (phase) => set({ phase }),
  selectMission: (id) => {
    const mission = missionById(id)
    if (missionLocked(mission, useCampaignStore.getState().intelLevel)) return
    set({ missionId: id, phase: 'brief' })
  },
  toggleOperative: (id) =>
    set((s) => {
      if (s.squad.includes(id)) {
        if (s.squad.length <= 1) return s
        return { squad: s.squad.filter((x) => x !== id) }
      }
      if (useCampaignStore.getState().roster[id]?.status !== 'READY') return s
      if (s.squad.length >= 4) return s
      return { squad: [...s.squad, id] }
    }),
  // Funds research. Guarded here so no caller can overdraw the account.
  spendCredits: (amount) =>
    set((s) => (amount > 0 && s.credits >= amount ? { credits: s.credits - amount } : s)),
  setOutcome: (o) =>
    set((s) => ({
      outcome: o,
      credits: s.credits + netPayout(o),
      phase: 'debrief',
      outcomeSerial: s.outcomeSerial + 1,
    })),
}))
