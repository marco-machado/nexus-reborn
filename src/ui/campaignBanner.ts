// Pure World Network banner decision (ADR-0020). Reads the two owner-supplied
// campaignStore flags; never the roster. Failed wins over complete, which the
// store already keeps mutually exclusive.

import { MISSIONS } from '../game/data'

export type CampaignBanner = 'failed' | 'complete' | null

/**
 * Which campaign banner the World Network shows.
 * @param campaignWon `campaignStore.campaignWon`.
 * @param campaignFailed `campaignStore.campaignFailed`.
 */
export function campaignBanner(campaignWon: boolean, campaignFailed: boolean): CampaignBanner {
  if (campaignFailed) return 'failed'
  if (campaignWon) return 'complete'
  return null
}

/**
 * The banner's `n / 3` count (design/ux/world-network.md, Banner row).
 * @param banner Which banner shows, from `campaignBanner`.
 * @param contractsWon `campaignStore.contractsWon`: authored contracts won.
 * @returns `n / N` with N the authored contract count, or null with no banner.
 */
export function campaignBannerCount(
  banner: CampaignBanner,
  contractsWon: readonly string[],
): string | null {
  if (banner === null) return null
  // Both banners count wins: a campaign can fail after one or two (BUG-0012).
  return `${contractsWon.length} / ${MISSIONS.length}`
}
