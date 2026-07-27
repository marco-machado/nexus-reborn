// CONTRACT FILE. App level state: screen flow, mission choice, squad, credits.
import { create } from 'zustand'
import { DEFAULT_SQUAD } from '../game/data'

export type Phase = 'menu' | 'world' | 'research' | 'brief' | 'team' | 'mission' | 'debrief'

export interface MissionOutcome {
  won: boolean
  kills: number
  casualties: number
  timeSec: number
  civiliansHit: number
  reward: number
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

interface AppState {
  phase: Phase
  missionId: string | null
  squad: string[]
  credits: number
  outcome: MissionOutcome | null
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
  credits: 128450,
  outcome: null,
  goto: (phase) => set({ phase }),
  selectMission: (id) => set({ missionId: id, phase: 'brief' }),
  toggleOperative: (id) =>
    set((s) => {
      if (s.squad.includes(id)) {
        if (s.squad.length <= 1) return s
        return { squad: s.squad.filter((x) => x !== id) }
      }
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
    })),
}))
