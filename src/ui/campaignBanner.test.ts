import { beforeEach, describe, expect, it } from 'vitest'
import { campaignBanner } from './campaignBanner'
import { initialCampaignData, useCampaignStore } from '../state/campaignStore'
import type { MissionOutcome } from '../state/appStore'

function outcome(over: Partial<MissionOutcome> = {}): MissionOutcome {
  return {
    applyKey: 1, won: true, kills: 0, casualties: 0, timeSec: 10, civiliansHit: 1,
    reward: 0, bonus: 0, deadIds: [], survivorHp: {}, quietReplay: false, ...over,
  }
}

const banner = () => {
  const { campaignWon, campaignFailed } = useCampaignStore.getState()
  return campaignBanner(campaignWon, campaignFailed)
}
const wipe = () => {
  const ids = useCampaignStore.getState().operatives.map((o) => o.id)
  return { won: false, reward: 0, casualties: ids.length, deadIds: ids }
}

beforeEach(() => {
  useCampaignStore.setState(initialCampaignData())
})

describe('campaignBanner', () => {
  it('maps the two flags to one banner', () => {
    expect(campaignBanner(false, false)).toBeNull()
    expect(campaignBanner(true, false)).toBe('complete')
    expect(campaignBanner(false, true)).toBe('failed')
    expect(campaignBanner(true, true)).toBe('failed')
  })

  it('a complete campaign keeps the complete banner after a roster wipe (WN-019)', () => {
    for (const id of ['m01', 'm02', 'm03']) {
      useCampaignStore.getState().reportMission(id, outcome(), 0)
    }
    expect(banner()).toBe('complete')
    useCampaignStore.getState().reportMission('m01', outcome(wipe()), 0)
    expect(banner()).toBe('complete')
  })

  it('an incomplete campaign wiped at debrief shows the fail banner (WN-019)', () => {
    useCampaignStore.getState().reportMission('m01', outcome(wipe()), 0)
    expect(banner()).toBe('failed')
  })
})
