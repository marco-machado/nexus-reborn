// CONTRACT FILE. App level state: screen flow, mission choice, squad, credits.
import { create } from 'zustand'
import { DEFAULT_SQUAD } from '../game/data'

export type Phase = 'menu' | 'world' | 'brief' | 'team' | 'mission' | 'debrief'

export interface MissionOutcome {
  won: boolean
  kills: number
  casualties: number
  timeSec: number
  civiliansHit: number
  reward: number
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
  setOutcome: (o) =>
    set((s) => ({
      outcome: o,
      credits: s.credits + (o.won ? o.reward : 0),
      phase: 'debrief',
    })),
}))
