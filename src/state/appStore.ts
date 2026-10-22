// CONTRACT FILE. App level state: screen flow, mission choice, squad, credits.
import { create } from 'zustand'
import { DEFAULT_SQUAD } from '../game/data'
import type { MissionTelemetry } from './telemetry'
import { resolveMission } from './worldStore'
import { LOADOUT_SLOTS, emptyLoadout } from '../game/mass'
import { MAX_SQUAD, assignedMassKg, canDeploy } from '../game/deployGate'
import { eligibilityText, useResearchStore } from './researchStore'
import type { LoadoutItemId, OperativeLoadout, SquadLoadout } from '../game/mass'
import { nodeTitle } from '../game/research'
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
  // Priced once by Economy (ADR-0021 §4): min(reward, N × COLLATERAL_FINE).
  // Stored on a loss and a quiet replay too; only a paid win debits it.
  collateral: number
  // Credits this Debrief deposits (ADR-0021 §4): reward + bonus − collateral
  // on a paid win, else 0. Always a finite integer ≥ 0.
  netPayout: number
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

/** The priced fields `settleOutcome` adds; everything else comes from the sim and the slice. */
export type UnsettledOutcome = Omit<MissionOutcome, 'collateral' | 'netPayout'>

/**
 * Economy's payout gate: a win that is not a quiet replay. A loss and a quiet
 * replay still price Reward, bonus and Collateral, but none of them moves Credits.
 */
export function isPaid(o: Pick<MissionOutcome, 'won' | 'quietReplay'>): boolean {
  return o.won && !o.quietReplay
}

/**
 * Prices Collateral and net payout from an outcome's reward, bonus and hit
 * count, and stores them (ADR-0021 §4). N = max(0, floor(civiliansHit)),
 * non-finite → 0; Collateral is capped at Reward. Non-finite reward or bonus
 * price as 0, so both stored fields are always finite integers ≥ 0.
 */
export function settleOutcome(o: UnsettledOutcome): MissionOutcome {
  const reward = Number.isFinite(o.reward) ? Math.max(0, Math.floor(o.reward)) : 0
  const bonus = Number.isFinite(o.bonus) ? Math.max(0, Math.floor(o.bonus)) : 0
  const hits = Number.isFinite(o.civiliansHit) ? Math.max(0, Math.floor(o.civiliansHit)) : 0
  const collateral = Math.min(reward, hits * COLLATERAL_FINE)
  const netPayout = isPaid(o) ? reward + bonus - collateral : 0
  return { ...o, reward, bonus, collateral, netPayout }
}

/** The stored Collateral of a priced outcome (ADR-0021: helpers read, never derive). */
export function collateralFine(o: MissionOutcome): number {
  return o.collateral
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
  return settleOutcome({
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
  })
}

/** The stored net payout of a priced outcome (ADR-0021: helpers read, never derive). */
export function netPayout(o: MissionOutcome): number {
  return o.netPayout
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
  // Debrief → World Network (default) or, from the first-Debrief Research
  // prompt (IF-014), → the Research Screen. Either way drops the selected
  // contract so Brief locks (ADR-0011: the selection is not blob content
  // after Debrief). The one way out of Debrief; never a raw goto from there.
  returnFromDebrief: (to?: 'world' | 'research') => void
  selectMission: (id: string) => void
  toggleOperative: (id: string) => void
  setLoadout: (opId: string, slot: number, item: LoadoutItemId | null) => void
  spendCredits: (amount: number) => void
  // Research AUTHORIZE (ADR-0013): checks eligibility, re-reads the balance,
  // starts the project, then bills it and re-reads the balance to confirm the
  // debit landed. An ineligible project, a short balance, a lab that refuses
  // the project, or a debit that did not land is a full no-op (the occupancy
  // is released). `ok` says whether the project started and was billed; on a
  // refusal `text` is the visible sentence for the actual cause (research.md
  // UI Requirements), always ending in a credits-unchanged phrase. Plain
  // text, no reason enum. `text` is '' on success.
  authorizeResearch: (node: ResearchNode, t: number) => { ok: boolean; text: string }
  // Tax yield and other income. Does not convert from Influence.
  addCredits: (amount: number) => void
  hireOperative: (candidateId: string) => void
  // Stores the outcome and enters Debrief. Moves no Credits: the payout is
  // deposited by applyDebrief, under the outcome's apply-once key.
  setOutcome: (o: MissionOutcome) => void
}

// Authorize refusal copy (research.md UI Requirements, canonical substrings).
// Every refusal ends by saying the ledger was not touched; the mismatch undo
// and a start() refusal also say the lab was released.
const CREDITS_UNCHANGED = 'Credits did not change.'
const NOT_OCCUPIED = 'Credits did not change, and the lab was not occupied.'
function refused(text: string): { ok: false; text: string } {
  return { ok: false, text }
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
  returnFromDebrief: (to = 'world') => set({ phase: to, missionId: null }),
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
  // A non-finite deposit (NaN, Infinity) never reaches the ledger.
  addCredits: (amount) =>
    set((s) => (Number.isFinite(amount) && amount > 0 ? { credits: s.credits + amount } : s)),
  // Check, start, then spend: never spend first, since researchStore.start is
  // occupancy only and may still refuse (busy lab, unmet prerequisites).
  // A non-positive or non-finite listed cost is refused before start()
  // (research.md Core Rule 3), so no project can start unbilled.
  // After the spend, Credits are re-read (getState, same synchronous command):
  // the debit landed only if the balance fell by exactly the listed cost.
  // Otherwise the undo puts the labs back to their pre-start() value — lab
  // idle, project available. The undo is internal (no cancel API) and never
  // touches the ledger: no addCredits, no setState({ credits }).
  // Eligibility (not in the field, prerequisites, idle lab, not already
  // researched) is checked before start() and before spendCredits, even when
  // the balance covers the cost, so an ineligible project never reaches the
  // ledger.
  // A mission in progress (phase 'mission', the router's single phase —
  // ADR-0017) is the fourth eligibility cause: labs do not take work from the
  // field. The Research screen is unreachable in that phase, so this is
  // store-level defense with no cause text (in-field is not a screen reason).
  authorizeResearch: (node, t) => {
    if (get().phase === 'mission') return refused(CREDITS_UNCHANGED)
    if (!(Number.isFinite(node.cost) && node.cost > 0)) return refused(CREDITS_UNCHANGED)
    const research = useResearchStore.getState()
    const cause = eligibilityText(node, research.done, research.labs)
    if (cause !== null) return refused(nodeTitle(node) + ': ' + cause + ' ' + CREDITS_UNCHANGED)
    if (get().credits < node.cost) {
      return refused(nodeTitle(node) + ': listed cost exceeds Credits. ' + CREDITS_UNCHANGED)
    }
    const labsBefore = research.labs
    if (!research.start(node, t)) return refused(NOT_OCCUPIED)
    const before = get().credits
    get().spendCredits(node.cost)
    if (get().credits === before - node.cost) return { ok: true, text: '' }
    useResearchStore.setState({ labs: labsBefore })
    return refused(NOT_OCCUPIED)
  },
  // Signs a recruitment candidate. The fee clears here first, so a blocked
  // hire (unknown candidate, roster at cap, overdraw) costs nothing.
  hireOperative: (candidateId) => {
    const candidate = useCampaignStore
      .getState()
      .candidates.find((c) => c.id === candidateId)
    if (!candidate || !(Number.isFinite(candidate.cost) && candidate.cost > 0)) return
    if (get().credits < candidate.cost) return
    if (!useCampaignStore.getState().acceptHire(candidateId)) return
    set((s) => ({ credits: s.credits - candidate.cost }))
  },
  setOutcome: (o) => set({ outcome: o, phase: 'debrief' }),
}))
