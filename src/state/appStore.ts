// CONTRACT FILE. App level state: screen flow, mission choice, squad, credits.
import { create } from 'zustand'
import { DEFAULT_SQUAD } from '../game/data'
import type { MissionTelemetry } from './telemetry'
import { resolveMission } from './worldStore'
import { LOADOUT_SLOTS, emptyLoadout } from '../game/mass'
import { MAX_SQUAD, assignedMassKg, canDeploy } from '../game/deployGate'
import { useResearchStore } from './researchStore'
import type { LoadoutItemId, OperativeLoadout, SquadLoadout } from '../game/mass'
import type { ResearchNode } from '../game/research'
import { missionLocked, useCampaignStore } from './campaignStore'

export type Phase = 'menu' | 'world' | 'research' | 'brief' | 'team' | 'mission' | 'debrief'

export interface MissionOutcome {
  // ADR-0021 apply-once key: minted by the MissionScreen composer at mission
  // create, frozen on the Economy slice and echoed here unchanged. Debrief
  // applies this outcome only while it is above `lastAppliedKey`.
  applyKey: number
  won: boolean
  kills: number
  casualties: number
  timeSec: number
  civiliansHit: number
  reward: number
  // Optional-objective pay, priced from the Economy slice. A loss stores it
  // and pays none of it.
  bonus: number
  deadIds: string[]
  // End-of-mission health of each surviving deployed operative, as a fraction
  // of max HP. The debrief grades injuries from it (campaignStore).
  survivorHp: Record<string, number>
  // Copied from the Economy slice. Required, so a missing flag cannot pay.
  // A quiet replay stores the fee and pays nothing.
  quietReplay: boolean
  // Mission counters for the local telemetry log (state/telemetry.ts). Rides
  // the existing outcome push; the debrief boundary records it when the
  // TELEMETRY setting is on. Optional so hand-built outcomes stay valid.
  telemetry?: MissionTelemetry
}

// What the sim reports. Reward and bonus are priced from the Economy slice
// by priceOutcome; the sim does not send either figure.
export interface MissionResult {
  applyKey: number
  won: boolean
  kills: number
  casualties: number
  timeSec: number
  civiliansHit: number
  completedOptionalIds: readonly string[]
  deadIds: string[]
  survivorHp: Record<string, number>
  quietReplay: boolean
  telemetry?: MissionTelemetry
}

export interface OutcomePricing {
  reward: number
  bonusDefs: Readonly<Record<string, number>>
}

// Every contract carries a collateral clause. Each bystander caught by a round
// costs this much off the fee; it can zero the payment, never run up a debt.
export const COLLATERAL_FINE = 5000

export function collateralFine(o: MissionOutcome): number {
  const hits = Number.isFinite(o.civiliansHit) ? Math.max(0, Math.floor(o.civiliansHit)) : 0
  return Math.min(o.reward, hits * COLLATERAL_FINE)
}

// Prices the invoice from the frozen Economy slice. The contract fee is stored
// on a loss and on a quiet replay. Bonus is the sum of bonusDefs for each
// distinct completed optional id; an unknown, negative, or non-finite value
// adds nothing. Credits do not move here.
export function priceOutcome(result: MissionResult, economy: OutcomePricing): MissionOutcome {
  const reward = Number.isFinite(economy.reward) ? Math.max(0, Math.floor(economy.reward)) : 0
  let bonus = 0
  const seen = new Set<string>()
  for (const id of result.completedOptionalIds) {
    if (seen.has(id)) continue
    seen.add(id)
    const value = economy.bonusDefs[id]
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) continue
    bonus += Math.floor(value)
  }
  return {
    applyKey: result.applyKey,
    won: result.won,
    kills: result.kills,
    casualties: result.casualties,
    timeSec: result.timeSec,
    civiliansHit: result.civiliansHit,
    reward,
    bonus,
    deadIds: result.deadIds,
    survivorHp: result.survivorHp,
    quietReplay: result.quietReplay,
    telemetry: result.telemetry,
  }
}

export function netPayout(o: MissionOutcome): number {
  if (o.quietReplay) return 0
  return o.won ? o.reward - collateralFine(o) + o.bonus : 0
}

export function isQuietReplay(missionId: string | null): boolean {
  if (!missionId) return false
  return useCampaignStore.getState().contractsWon.includes(missionId)
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
  // Session-only apply-once counters (ADR-0021); never in the campaign blob,
  // reset to 0 by hydrate and New Operation. `deploySerial` is bumped once per
  // mission create by the MissionScreen composer; `lastAppliedKey` is written
  // only by applyDebrief (state/debrief.ts).
  deploySerial: number
  lastAppliedKey: number
  goto: (phase: Phase) => void
  // Team Deploy (ADR-0019). Enters the mission only while canDeploy is ok;
  // otherwise a no-op. The one start API: never goto('mission') directly.
  startMission: () => void
  // Debrief → World Network. Drops the selected contract so Brief locks.
  returnFromDebrief: () => void
  selectMission: (id: string) => void
  toggleOperative: (id: string) => void
  setLoadout: (opId: string, slot: number, item: LoadoutItemId | null) => void
  spendCredits: (amount: number) => void
  // Research AUTHORIZE (ADR-0013): re-reads the balance, starts the project,
  // then bills it. A short balance or a lab that refuses the project is a
  // full no-op. Returns whether the project started.
  authorizeResearch: (node: ResearchNode, t: number) => boolean
  // Tax yield and other income. Does not convert from Influence.
  addCredits: (amount: number) => void
  hireOperative: (candidateId: string) => void
  // Stores the outcome and enters Debrief. Moves no Credits: the payout is
  // deposited by applyDebrief, under the outcome's apply-once key.
  setOutcome: (o: MissionOutcome) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  phase: 'menu',
  missionId: null,
  squad: [...DEFAULT_SQUAD],
  loadout: {},
  credits: INITIAL_CREDITS,
  outcome: null,
  deploySerial: 0,
  lastAppliedKey: 0,
  // 'mission' is not a phase change. startMission is the only way in.
  goto: (phase) => {
    if (phase === 'mission') return
    set({ phase })
  },
  startMission: () => {
    const { missionId, squad, loadout } = get()
    const { operatives, roster } = useCampaignStore.getState()
    const done = useResearchStore.getState().done
    const ops = squad.flatMap((id) => operatives.filter((o) => o.id === id))
    const gate = canDeploy({
      missionSelected: !!missionId && !!resolveMission(missionId),
      assignedIds: squad,
      statusById: Object.fromEntries(squad.map((id) => [id, roster[id]?.status])),
      massKg: assignedMassKg(ops, done, roster, loadout),
    })
    if (gate.ok) set({ phase: 'mission' })
  },
  returnFromDebrief: () => set({ phase: 'world', missionId: null }),
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
      if (s.squad.length >= MAX_SQUAD) return s
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
  addCredits: (amount) =>
    set((s) => (amount > 0 ? { credits: s.credits + amount } : s)),
  // Check, start, then spend: never spend first, since researchStore.start is
  // occupancy only and may still refuse (busy lab, unmet prerequisites).
  authorizeResearch: (node, t) => {
    if (get().credits < node.cost) return false
    if (!useResearchStore.getState().start(node, t)) return false
    get().spendCredits(node.cost)
    return true
  },
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
  setOutcome: (o) => set({ outcome: o, phase: 'debrief' }),
}))
