// CONTRACT FILE. App level state: screen flow, mission choice, squad, credits.
import { create } from 'zustand'
import { DEFAULT_SQUAD } from '../game/data'
import type { MissionTelemetry } from './telemetry'
import { resolveMission } from './worldStore'
import { LOADOUT_SLOTS, emptyLoadout } from '../game/mass'
import type { LoadoutItemId, OperativeLoadout, SquadLoadout } from '../game/mass'
import { missionLocked, useCampaignStore } from './campaignStore'

export type Phase = 'menu' | 'world' | 'research' | 'brief' | 'team' | 'mission' | 'debrief'

export interface MissionOutcome {
  won: boolean
  kills: number
  casualties: number
  timeSec: number
  civiliansHit: number
  reward: number
  // Optional-objective pay, on top of the contract fee. Zero on a loss.
  bonus: number
  deadIds: string[]
  // End-of-mission health of each surviving deployed operative, as a fraction
  // of max HP. The debrief grades injuries from it (campaignStore).
  survivorHp: Record<string, number>
  // Mission counters for the local telemetry log (state/telemetry.ts). Rides
  // the existing outcome push; the debrief boundary records it when the
  // TELEMETRY setting is on. Optional so hand-built outcomes stay valid.
  telemetry?: MissionTelemetry
}

// Every contract carries a collateral clause. Each bystander caught by a round
// costs this much off the fee; it can zero the payment, never run up a debt.
export const COLLATERAL_FINE = 5000

export function collateralFine(o: MissionOutcome): number {
  return Math.min(o.reward, o.civiliansHit * COLLATERAL_FINE)
}

export function netPayout(o: MissionOutcome): number {
  return o.won ? o.reward - collateralFine(o) + o.bonus : 0
}

export const INITIAL_CREDITS = 128450

export interface AppState {
  phase: Phase
  missionId: string | null
  squad: string[]
  // Per-operative extra item slots (game/mass.ts). Keyed by operative id; a
  // missing entry means both slots empty. Persisted by the versioned save.
  loadout: SquadLoadout
  credits: number
  outcome: MissionOutcome | null
  outcomeSerial: number
  goto: (phase: Phase) => void
  selectMission: (id: string) => void
  toggleOperative: (id: string) => void
  setLoadout: (opId: string, slot: number, item: LoadoutItemId | null) => void
  spendCredits: (amount: number) => void
  hireOperative: (candidateId: string) => void
  setOutcome: (o: MissionOutcome) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  phase: 'menu',
  missionId: null,
  squad: [...DEFAULT_SQUAD],
  loadout: {},
  credits: INITIAL_CREDITS,
  outcome: null,
  outcomeSerial: 0,
  goto: (phase) => set({ phase }),
  selectMission: (id) => {
    const campaign = useCampaignStore.getState()
    const mission = resolveMission(id)
    if (!mission || campaign.campaignFailed || missionLocked(mission, campaign.intelLevel)) {
      return
    }
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
  setLoadout: (opId, slot, item) =>
    set((s) => {
      if (slot < 0 || slot >= LOADOUT_SLOTS) return s
      const items = [...(s.loadout[opId] ?? emptyLoadout())] as OperativeLoadout
      items[slot] = item
      return { loadout: { ...s.loadout, [opId]: items } }
    }),
  // Funds research. Guarded here so no caller can overdraw the account.
  spendCredits: (amount) =>
    set((s) => (amount > 0 && s.credits >= amount ? { credits: s.credits - amount } : s)),
  // Signs a recruitment candidate. The fee clears here first, so a blocked
  // hire (unknown candidate, roster at cap, overdraw) costs nothing.
  hireOperative: (candidateId) => {
    const candidate = useCampaignStore
      .getState()
      .candidates.find((c) => c.id === candidateId)
    if (!candidate || get().credits < candidate.cost) return
    if (!useCampaignStore.getState().acceptHire(candidateId)) return
    set((s) => ({ credits: s.credits - candidate.cost }))
  },
  setOutcome: (o) =>
    set((s) => ({
      outcome: o,
      credits: s.credits + netPayout(o),
      phase: 'debrief',
      outcomeSerial: s.outcomeSerial + 1,
    })),
}))
