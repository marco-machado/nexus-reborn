// Pure Debrief display decisions (IF-011, TR-interface-008). The owner-supplied
// `campaignFailed` flag (campaignStore, ADR-0020) and the outcome are read, never
// recomputed: no roster length, no deadIds.
import { isGeneratedMissionId } from '../game/contracts'
import type { MissionOutcome } from '../state/appStore'

export interface DebriefFlags {
  /** Show the CAMPAIGN FAILED banner (any failed campaign, win or loss). */
  banner: boolean
  /** Show the pyrrhic invoice note (win on a failed campaign only). */
  pyrrhicNote: boolean
  /** Offer REPLAY MISSION. */
  replay: boolean
}

/**
 * Decide which failed-campaign elements the Debrief shows.
 * Pyrrhic = `outcome.won && campaignFailed`, including a zero-pay quiet replay
 * (the win still counted; only the payout is 0). Replay is offered only for an
 * authored contract on a campaign that has not failed.
 * @param outcome Owner-supplied mission outcome, or null before one exists.
 * @param campaignFailed `campaignStore.campaignFailed`, post-apply.
 * @param missionId The debriefed contract id, or null when none is set.
 */
export function debriefFlags(
  outcome: Pick<MissionOutcome, 'won'> | null,
  campaignFailed: boolean,
  missionId: string | null,
): DebriefFlags {
  return {
    banner: campaignFailed,
    pyrrhicNote: campaignFailed && outcome?.won === true,
    replay: !!missionId && !isGeneratedMissionId(missionId) && !campaignFailed,
  }
}
