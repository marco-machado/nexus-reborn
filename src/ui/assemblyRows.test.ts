// RA-008 AC 5: focusing a dossier never edits the squad. The Assembly row body
// and the squad bays call `read`; only the trailing assign key calls `assign`.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppStore } from '../state/appStore'
import { initialCampaignData, useCampaignStore } from '../state/campaignStore'
import { ROSTER_CAP } from '../game/recruits'
import { assemblyRowHandlers, hireView } from './assemblyRows'

describe('assemblyRowHandlers (RA-008 AC 5)', () => {
  beforeEach(() => {
    useAppStore.setState({ squad: ['op1', 'op2', 'op3'] })
  })

  it('reading a dossier focuses it and leaves the assigned set unchanged', () => {
    const focus = vi.fn()
    const toggle = vi.fn(useAppStore.getState().toggleOperative)
    for (const id of ['op1', 'op4', 'op5']) assemblyRowHandlers(id, { focus, toggle }).read()
    expect(focus.mock.calls).toEqual([['op1'], ['op4'], ['op5']])
    expect(toggle).not.toHaveBeenCalled()
    expect(useAppStore.getState().squad).toEqual(['op1', 'op2', 'op3'])
  })

  it('the assign key toggles the squad through the store and does not move focus', () => {
    const focus = vi.fn()
    const toggle = useAppStore.getState().toggleOperative
    assemblyRowHandlers('op4', { focus, toggle }).assign()
    expect(useAppStore.getState().squad).toEqual(['op1', 'op2', 'op3', 'op4'])
    assemblyRowHandlers('op2', { focus, toggle }).assign()
    expect(useAppStore.getState().squad).toEqual(['op1', 'op3', 'op4'])
    expect(focus).not.toHaveBeenCalled()
  })
})

// IF-012 (interface.md AC28): the recruitment market prints the hire cost
// against Credits on every candidate, and a refused HIRE is disabled with a
// visible reason that matches the owner's actual refusal.
describe('hireView (IF-012, AC28)', () => {
  const base = { cost: 20000, credits: 128450, rosterSize: 4, rosterCap: 8, campaignFailed: false }

  it('prints cost versus Credits on every candidate, allowed or not', () => {
    expect(hireView(base).ledger).toBe('COST 20,000 CR // CREDITS 128,450 CR')
    expect(hireView({ ...base, credits: 12000 }).ledger).toBe('COST 20,000 CR // CREDITS 12,000 CR')
    expect(hireView({ ...base, rosterSize: 8 }).ledger).toBe('COST 20,000 CR // CREDITS 128,450 CR')
  })

  it('an affordable candidate with roster room is enabled with no reason line', () => {
    expect(hireView(base)).toMatchObject({ can: true, refusal: null, reason: '' })
    expect(hireView({ ...base, credits: 20000, rosterSize: 7 }).can).toBe(true)
  })

  it('unaffordable fixture: disabled, and the reason names the shortfall', () => {
    const v = hireView({ ...base, credits: 12000 })
    expect(v.can).toBe(false)
    expect(v.refusal).toBe('insufficient-credits')
    expect(v.reason).toBe('INSUFFICIENT CREDITS // 8,000 CR SHORT')
    expect(hireView({ ...base, credits: 19999 }).reason).toBe('INSUFFICIENT CREDITS // 1 CR SHORT')
  })

  it('full-roster fixture: disabled, and the reason names capacity, not Credits', () => {
    const v = hireView({ ...base, rosterSize: 8 })
    expect(v.can).toBe(false)
    expect(v.refusal).toBe('roster-full')
    expect(v.reason).toBe('ROSTER AT CAPACITY // 8 / 8')
    expect(v.reason).not.toMatch(/CREDITS/)
  })

  it('a failed campaign refuses with its own reason', () => {
    expect(hireView({ ...base, campaignFailed: true })).toMatchObject({
      can: false,
      refusal: 'campaign-failed',
      reason: 'CAMPAIGN FAILED // NO HIRES',
    })
  })

  it('agrees with the owner: every refused fixture leaves Credits and roster unchanged', () => {
    const live = (over: { credits?: number; full?: boolean }) => {
      const campaign = initialCampaignData()
      const candidate = campaign.candidates[0]
      // Four on file leaves room; ROSTER_CAP on file is a full roster.
      const operatives = Array.from({ length: over.full ? ROSTER_CAP : 4 }, (_, n) => ({
        ...campaign.operatives[0],
        id: 'fill' + n,
      }))
      useCampaignStore.setState({ ...campaign, operatives })
      useAppStore.setState({ credits: over.credits ?? 128450 })
      const view = hireView({
        cost: candidate.cost,
        credits: useAppStore.getState().credits,
        rosterSize: useCampaignStore.getState().operatives.length,
        rosterCap: ROSTER_CAP,
        campaignFailed: false,
      })
      const before = { credits: useAppStore.getState().credits, n: operatives.length }
      useAppStore.getState().hireOperative(candidate.id)
      const hired = useCampaignStore.getState().operatives.length === before.n + 1
      return { view, hired, spent: before.credits - useAppStore.getState().credits, cost: candidate.cost }
    }
    const short = live({ credits: 1000 })
    expect(short.view.refusal).toBe('insufficient-credits')
    expect(short).toMatchObject({ hired: false, spent: 0 })
    const full = live({ full: true })
    expect(full.view.refusal).toBe('roster-full')
    expect(full).toMatchObject({ hired: false, spent: 0 })
    const ok = live({})
    expect(ok.view.can).toBe(true)
    expect(ok.hired).toBe(true)
    expect(ok.spent).toBe(ok.cost)
  })
})
