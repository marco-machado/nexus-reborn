import { beforeEach, describe, expect, it } from 'vitest'
import { campaignBanner, campaignBannerCount } from './campaignBanner'
import { initialCampaignData, useCampaignStore } from '../state/campaignStore'
import { settleOutcome } from '../state/appStore'
import type { MissionOutcome } from '../state/appStore'

function outcome(over: Partial<MissionOutcome> = {}): MissionOutcome {
  return settleOutcome({
    applyKey: 1, won: true, kills: 0, casualties: 0, timeSec: 10, civiliansHit: 1,
    reward: 0, bonus: 0, deadIds: [], survivorHp: {}, quietReplay: false, ...over,
  })
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

  describe('campaignBannerCount (BUG-0012)', () => {
    const count = () => campaignBannerCount(banner(), useCampaignStore.getState().contractsWon)

    it('no banner, no count', () => {
      expect(count()).toBeNull()
    })

    it('a failed campaign with no wins reads 0 / 3', () => {
      useCampaignStore.getState().reportMission('m01', outcome(wipe()), 0)
      expect(banner()).toBe('failed')
      expect(count()).toBe('0 / 3')
    })

    it('a failed campaign after one authored win reads 1 / 3', () => {
      useCampaignStore.getState().reportMission('m01', outcome(), 0)
      useCampaignStore.getState().reportMission('m02', outcome(wipe()), 0)
      expect(banner()).toBe('failed')
      expect(count()).toBe('1 / 3')
    })

    it('a complete campaign reads 3 / 3', () => {
      for (const id of ['m01', 'm02', 'm03']) {
        useCampaignStore.getState().reportMission(id, outcome(), 0)
      }
      expect(banner()).toBe('complete')
      expect(count()).toBe('3 / 3')
    })
  })
})
