// Story RA-020 (TR-roster-002, ADR-0009): the Roster slice is frozen when the
// mission is created. Wear, unslotted research, Experience, item pools, mass
// and mass tier are sampled once by freezeDeploy; later Assembly or campaign
// changes reach the next deploy only, never the squad already on the ground.
import { beforeEach, describe, expect, it } from 'vitest'
import type { MissionDef, OperativeDef, WorldApi } from '../game/types'
import { MISSIONS } from '../game/data'
import { createWorld } from '../game/world'
import { setWorld } from '../game/runtime'
import { freezeDeploy } from './deployFreeze'
import { useAppStore } from './appStore'
import { initialCampaignData, liveOperativeById, useCampaignStore } from './campaignStore'
import { useMissionStore } from './missionStore'
import { useResearchStore } from './researchStore'

// Same city and seed as m01, nothing to complete: ticking never ends it.
const MISSION: MissionDef = { ...MISSIONS[0], objectives: [] }
const STEP = 0.05

const ops = (ids: readonly string[]): OperativeDef[] => ids.map((id) => liveOperativeById(id))

// Mirrors MissionScreen: freeze, create, reset the HUD store, go live, tick.
function deploy(ids: readonly string[]) {
  const squad = ops(ids)
  const params = freezeDeploy(MISSION, squad, 1)
  const world = createWorld(MISSION, squad, params)
  setWorld(world)
  const ms = useMissionStore.getState()
  ms.reset()
  ms.setLive(true)
  world.tick(STEP)
  return { params, world }
}

function unitStats(world: WorldApi, n: number) {
  const out: { maxHp: number; speed: number }[] = []
  for (let i = 1; i <= n; i++) {
    const u = world.unit('a' + i)
    if (!u) throw new Error('missing unit a' + i)
    out.push({ maxHp: u.maxHp, speed: u.speed })
  }
  return out
}

function setXp(id: string, xp: number): void {
  const roster = useCampaignStore.getState().roster
  useCampaignStore.setState({ roster: { ...roster, [id]: { ...roster[id], xp } } })
}

beforeEach(() => {
  useCampaignStore.setState(initialCampaignData())
  useResearchStore.setState({ done: [] })
  useAppStore.setState({ loadout: {}, squad: ['op1', 'op8'], outcome: null })
  setWorld(null)
  useMissionStore.getState().reset()
})

describe('deploy freeze of the Roster slice (RA-020)', () => {
  it('keeps the sampled freeze when wear, pins, items, assignment or Experience change after create (AC 11)', () => {
    // Worn Neural Interface I on both bays, one unslotted project, some XP,
    // a med kit on op1: everything the Roster slice samples is non-trivial.
    useResearchStore.setState({ done: ['b-propellants', 'c-interface'] })
    setXp('op1', 2)
    useAppStore.getState().setLoadout('op1', 0, 'med')
    const { params, world } = deploy(['op1', 'op8'])
    const roster = structuredClone(params.roster)
    const research = params.research.slice()
    const stats = unitStats(world, 2)
    const pools = { ...useMissionStore.getState().inventory }
    expect(roster.wear.op1.NEURAL).toBe('c-interface')
    expect(research).toEqual(['b-propellants'])

    // Every campaign-side input changes after create.
    useCampaignStore.getState().setBay('op1', 'NEURAL', 'STOCK') // wear + pins
    useResearchStore.setState({ done: [] }) // unslotted research
    setXp('op1', 7) // Experience
    setXp('op8', 3)
    useAppStore.getState().setLoadout('op1', 0, 'cell') // items
    useAppStore.getState().setLoadout('op8', 1, 'med')
    useAppStore.getState().toggleOperative('op8') // assignment
    expect(useAppStore.getState().squad).toEqual(['op1'])

    for (let i = 0; i < 40; i++) world.tick(STEP)

    expect(params.roster).toEqual(roster)
    expect(params.research).toEqual(research)
    expect(unitStats(world, 2)).toEqual(stats)
    expect(world.unit('a2')).toBeDefined()
    expect(useMissionStore.getState().inventory).toEqual(pools)

    // The next create samples the new campaign state.
    const next = freezeDeploy(MISSION, ops(['op1']), 2)
    expect(next.roster.wear.op1.NEURAL).toBeUndefined()
    expect(next.research).toEqual([])
    expect(next.roster.items.op1).toEqual(['cell', null])
    expect(next.roster.maxHp.op1).not.toBe(roster.maxHp.op1)
  })

  it('keeps pools M and C when Assembly item slots change after create (AC 45)', () => {
    useAppStore.getState().setLoadout('op1', 0, 'med')
    useAppStore.getState().setLoadout('op8', 0, 'cell')
    const { params, world } = deploy(['op1', 'op8'])
    const { med: M, cell: C } = useMissionStore.getState().inventory
    const massKg = params.roster.massKg
    const massTier = params.roster.massTier

    useAppStore.getState().setLoadout('op1', 0, null)
    useAppStore.getState().setLoadout('op1', 1, 'med')
    useAppStore.getState().setLoadout('op8', 0, 'med')
    useAppStore.getState().setLoadout('op8', 1, 'cell')
    for (let i = 0; i < 40; i++) world.tick(STEP)

    expect(useMissionStore.getState().inventory).toEqual({ med: M, cell: C })
    expect(params.roster.items).toEqual({ op1: ['med', null], op8: ['cell', null] })
    expect(params.roster.massKg).toBe(massKg)
    expect(params.roster.massTier).toBe(massTier)
  })

  it('samples pools as base + role grants + 1 med kit + 1 power cell from the slots (AC 49)', () => {
    // Base pools are 2 med / 1 cell; a medic grants +2 med.
    const empty = deploy(['op8'])
    expect(useMissionStore.getState().inventory).toEqual({ med: 2 + 2, cell: 1 })
    expect(empty.params.roster.items.op8).toEqual([null, null])

    useAppStore.getState().setLoadout('op8', 0, 'med')
    useAppStore.getState().setLoadout('op8', 1, 'cell')
    const loaded = deploy(['op8'])
    expect(loaded.params.roster.items.op8).toEqual(['med', 'cell'])
    expect(useMissionStore.getState().inventory).toEqual({ med: 2 + 2 + 1, cell: 1 + 0 + 1 })
  })

  it('freezes by clone: no live reference and no Object.freeze of live arrays (ADR-0009 edge case)', () => {
    useResearchStore.setState({ done: ['b-propellants'] })
    useAppStore.getState().setLoadout('op1', 0, 'med')
    const liveLoadout = useAppStore.getState().loadout.op1
    const liveDone = useResearchStore.getState().done
    const livePins = useCampaignStore.getState().roster.op1.pins
    const params = freezeDeploy(MISSION, ops(['op1']), 1)

    expect(params.roster.items.op1).not.toBe(liveLoadout)
    expect(params.research).not.toBe(liveDone)
    expect(Object.isFrozen(liveLoadout)).toBe(false)
    expect(Object.isFrozen(liveDone)).toBe(false)
    expect(Object.isFrozen(livePins)).toBe(false)

    // An in-place write to a live array still cannot reach the slice.
    liveLoadout[0] = 'cell'
    ;(liveDone as string[]).push('c-interface')
    expect(params.roster.items.op1).toEqual(['med', null])
    expect(params.research).toEqual(['b-propellants'])
    expect(params.roster.wear.op1).toEqual({})
  })
})
