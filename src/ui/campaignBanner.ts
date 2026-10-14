// Pure World Network banner decision (ADR-0020). Reads the two owner-supplied
// campaignStore flags; never the roster. Failed wins over complete, which the
// store already keeps mutually exclusive.

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
