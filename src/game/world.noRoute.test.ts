// TM-021 AC-2, the no-route half: a move nobody can walk is answered in the
// log, never dropped. No enclosed pocket exists in the authored cities, so the
// route finder is stubbed to fail for the one order under test.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createWorld } from './world'
import { headlessDeploy } from './deploy'
import { MISSIONS, operativeById } from './data'
import { useMissionStore } from '../state/missionStore'
import { useResearchStore } from '../state/researchStore'
import { initialCampaignData, useCampaignStore } from '../state/campaignStore'
import type { MissionDef } from './types'
import { isWalkable } from './types'

const route = vi.hoisted(() => ({ blocked: false }))
vi.mock('./pathfind', async (importOriginal) => {
  const real = await importOriginal<typeof import('./pathfind')>()
  return {
    ...real,
    findPath: (...args: Parameters<typeof real.findPath>) => (route.blocked ? [] : real.findPath(...args)),
  }
})

const STEP = 0.05
const BARE_MISSION: MissionDef = { ...MISSIONS[0], objectives: [] }

beforeEach(() => {
  route.blocked = false
  useMissionStore.getState().reset()
  useResearchStore.setState({ done: [], labs: { ballistics: null, cybernetics: null, control: null } })
  useCampaignStore.setState(initialCampaignData())
})

describe('a move with no route says so (TM-021 AC-2)', () => {
  it('logs NO ROUTE TO THAT POINT and leaves the operative idle', () => {
    const o = [operativeById('op1')]
    const w = createWorld(BARE_MISSION, o, headlessDeploy(BARE_MISSION, o, { done: [], roster: useCampaignStore.getState().roster }))
    useMissionStore.getState().reset()
    useMissionStore.getState().setLive(true)
    w.tick(STEP)
    const a1 = w.unit('a1')
    expect(a1).toBeDefined()
    if (!a1) return
    // A walkable point a few metres off, so the order is not snapped onto the operative.
    let dest = { x: a1.pos.x + 4, z: a1.pos.z }
    for (const [dx, dz] of [[4, 0], [-4, 0], [0, 4], [0, -4], [6, 6]]) {
      const p = { x: a1.pos.x + dx, z: a1.pos.z + dz }
      if (isWalkable(w.city, p.x, p.z)) {
        dest = p
        break
      }
    }
    route.blocked = true
    w.orderMove(['a1'], dest)
    expect(useMissionStore.getState().log.at(-1)?.msg).toBe('NO ROUTE TO THAT POINT. ORDER NOT TAKEN.')
    expect(a1.path).toHaveLength(0)
    expect(a1.stance).toBe('idle')

    // With a route the same order is taken and the line is not printed.
    route.blocked = false
    w.orderMove(['a1'], dest)
    expect(a1.path.length).toBeGreaterThan(0)
    expect(useMissionStore.getState().log.at(-1)?.msg).not.toBe('NO ROUTE TO THAT POINT. ORDER NOT TAKEN.')
  })
})
