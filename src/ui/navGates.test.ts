// IF-003 AC4/AC6: the destination nav gates Brief on a selected contract and
// leaves Assembly open. Real stores, real resolveMission; no mocks.
import { beforeEach, describe, expect, it } from 'vitest'
import { missionById } from '../game/data'
import { useAppStore } from '../state/appStore'
import { initialCampaignData, useCampaignStore } from '../state/campaignStore'
import { useWorldStore } from '../state/worldStore'
import { BRIEF_LOCK_REASON, briefReachable, navTabGate } from './navGates'
import { deployRefusalCopy } from './deployRefusal'
import { canDeploy } from '../game/deployGate'
import type { NavKind } from './bits'

const KINDS: NavKind[] = ['world', 'research', 'brief', 'assembly']

// Rust Haven is the authored contract open at intel 1 (WN-020).
const OPEN_CONTRACT = missionById('m03').id

beforeEach(() => {
  useAppStore.setState({ phase: 'world', missionId: null, outcome: null })
  useCampaignStore.setState(initialCampaignData())
})

describe('navTabGate', () => {
  it('locks only Brief with no selected contract, with the missing-contract reason (AC4)', () => {
    const open = briefReachable(null, useWorldStore.getState().contracts)
    expect(open).toBe(false)
    const gates = Object.fromEntries(KINDS.map((k) => [k, navTabGate(k, 'world', open)]))
    expect(gates.brief).toEqual({ open: false, locked: true, reason: 'NO CONTRACT SELECTED' })
    expect(gates.assembly).toEqual({ open: true, locked: false, reason: undefined })
    expect(gates.world.locked).toBe(false)
    expect(gates.research.locked).toBe(false)
  })

  it('uses the same reason text as the Deploy refusal (AC4)', () => {
    const gate = canDeploy({
      missionSelected: false,
      assignedIds: ['op1'],
      statusById: { op1: 'READY' },
      massKg: 70,
    })
    expect(deployRefusalCopy(gate)?.[0]).toBe(BRIEF_LOCK_REASON)
  })

  it('opens Brief once an unlocked contract is selected (AC5)', () => {
    useAppStore.getState().selectMission(OPEN_CONTRACT)
    const id = useAppStore.getState().missionId
    expect(briefReachable(id, useWorldStore.getState().contracts)).toBe(true)
    expect(navTabGate('brief', 'assembly', true)).toEqual({ open: true, locked: false, reason: undefined })
  })

  it('does not report the current screen as locked', () => {
    expect(navTabGate('brief', 'brief', false).locked).toBe(false)
  })

  it('locks Brief again after Debrief returns to the World Network (AC6)', () => {
    useAppStore.getState().selectMission(OPEN_CONTRACT)
    useAppStore.setState({ phase: 'debrief' })
    useAppStore.getState().returnFromDebrief()
    const s = useAppStore.getState()
    expect(s.phase).toBe('world')
    expect(briefReachable(s.missionId, useWorldStore.getState().contracts)).toBe(false)
    expect(navTabGate('brief', 'world', false).locked).toBe(true)
  })

  it('treats an id that no longer resolves as no contract', () => {
    expect(briefReachable('gone-contract', [])).toBe(false)
  })
})
