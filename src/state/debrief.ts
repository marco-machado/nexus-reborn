// The Debrief apply transaction (ADR-0021). The only caller of the Debrief
// owner mutators: Credits, campaign report, World Network write-back, squad
// cleanup and the win ETA catch-up all run here, once, behind one key.
import { netPayout, useAppStore } from './appStore'
import { useCampaignStore } from './campaignStore'
import { useResearchStore } from './researchStore'
import { recordMissionOutcome } from './telemetry'
import { resolveMission, useWorldStore } from './worldStore'

/**
 * Applies the stored outcome for `missionId` exactly once.
 *
 * A key applies iff `outcome.applyKey > lastAppliedKey`; keys only increase,
 * so a repeat or a stray older key is a no-op for every owner. The key is
 * claimed before any owner mutation, so a re-entrant call is also a no-op.
 * Order: telemetry, Credits, campaign report, World Network write-back at the
 * frozen strategic time, squad cleanup, then (win only) the ETA catch-up and
 * the Research / Roster sync to the new time. Catch-up never runs before the
 * write-back.
 */
export function applyDebrief(missionId: string): void {
  const app = useAppStore.getState()
  const outcome = app.outcome
  if (!outcome || !(outcome.applyKey > app.lastAppliedKey)) return
  useAppStore.setState({ lastAppliedKey: outcome.applyKey })

  // Frozen t0: the strategic clock does not tick on Debrief, and nothing in
  // this transaction moves it before the write-back below.
  const t0 = useWorldStore.getState().t
  // Local telemetry; a no-op unless the TELEMETRY setting is on.
  recordMissionOutcome(missionId, outcome)
  useAppStore.getState().addCredits(netPayout(outcome))
  // reportMission writes lastReport, which the World Network feed reads for
  // KIA codenames: it must run before applyMissionResult.
  useCampaignStore.getState().reportMission(missionId, outcome, t0)
  const report = useCampaignStore.getState().lastReport
  useWorldStore
    .getState()
    .applyMissionResult(missionId, outcome, report?.kia.map((k) => k.codename) ?? [])

  // Dead or newly injured operatives leave the squad so the bays are
  // refilled before the next deployment; the dead also lose their loadout.
  const out = new Set([...outcome.deadIds, ...(report?.injured.map((i) => i.id) ?? [])])
  if (out.size > 0) {
    const dead = new Set(outcome.deadIds)
    useAppStore.setState((state) => {
      const loadout = { ...state.loadout }
      for (const id of dead) delete loadout[id]
      return { squad: state.squad.filter((id) => !out.has(id)), loadout }
    })
  }

  // A win costs the contract's ETA in strategic days (ADR-0001); a loss
  // spends none. Labs and recovery clocks then catch up to the new time.
  if (outcome.won) {
    useWorldStore.getState().advanceDays(resolveMission(missionId)?.etaDays ?? 0)
    const t = useWorldStore.getState().t
    useResearchStore.getState().sync(t)
    useCampaignStore.getState().sync(t)
  }
}
