import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nodeState, useResearchStore } from './researchStore'
import { useAppStore } from './appStore'
import type { Labs } from './researchStore'
import { nodeById } from '../game/research'

const HOUR = 3600

// Root nodes, one per branch, each 2 world hours. hyper needs propellants.
const propellants = nodeById('b-propellants')
const coating = nodeById('b-coating')
const interfaceNode = nodeById('c-interface')
const targeting = nodeById('k-targeting')
const hyper = nodeById('b-hypervelocity')

function idle(): Labs {
  return { ballistics: null, cybernetics: null, control: null }
}

// Captured at module load, before any test mutates the singleton.
const boot = {
  done: [...useResearchStore.getState().done],
  labs: { ...useResearchStore.getState().labs },
}

beforeEach(() => {
  useResearchStore.setState({ done: [], labs: idle() })
})

describe('initial state', () => {
  it('boots with nothing researched and all three labs idle', () => {
    expect(boot.done).toEqual([])
    expect(boot.labs).toEqual(idle())
  })
})

describe('start', () => {
  it('takes a free lab and schedules the end from the node hours', () => {
    const ok = useResearchStore.getState().start(propellants, 1000)
    expect(ok).toBe(true)
    const s = useResearchStore.getState()
    expect(s.labs.ballistics).toEqual({
      id: 'b-propellants',
      startedT: 1000,
      endT: 1000 + propellants.hours * HOUR,
    })
    expect(s.labs.cybernetics).toBeNull()
    expect(s.labs.control).toBeNull()
    expect(s.done).toEqual([])
  })

  it('refuses a project while its branch lab is busy', () => {
    useResearchStore.getState().start(propellants, 0)
    const ok = useResearchStore.getState().start(coating, 10)
    expect(ok).toBe(false)
    expect(useResearchStore.getState().labs.ballistics?.id).toBe('b-propellants')
  })

  it('refuses a project already done', () => {
    useResearchStore.setState({ done: ['b-propellants'] })
    expect(useResearchStore.getState().start(propellants, 0)).toBe(false)
    expect(useResearchStore.getState().labs.ballistics).toBeNull()
  })

  it('refuses a project whose prerequisites are missing', () => {
    expect(useResearchStore.getState().start(hyper, 0)).toBe(false)
    expect(useResearchStore.getState().labs.ballistics).toBeNull()
  })

  it('accepts a project once its prerequisites are done', () => {
    useResearchStore.setState({ done: ['b-propellants'] })
    expect(useResearchStore.getState().start(hyper, 500)).toBe(true)
    expect(useResearchStore.getState().labs.ballistics).toEqual({
      id: 'b-hypervelocity',
      startedT: 500,
      endT: 500 + hyper.hours * HOUR,
    })
  })

  it('refuses a non-positive or non-finite duration and leaves the lab idle', () => {
    for (const hours of [0, -2, NaN, Infinity]) {
      expect(useResearchStore.getState().start({ ...propellants, hours }, 0)).toBe(false)
      expect(useResearchStore.getState().labs.ballistics).toBeNull()
    }
  })

  it('refuses a non-finite start time and leaves the lab idle', () => {
    for (const t of [NaN, Infinity, -Infinity]) {
      expect(useResearchStore.getState().start(propellants, t)).toBe(false)
      expect(useResearchStore.getState().labs.ballistics).toBeNull()
    }
  })
})

describe('sync', () => {
  it('leaves a lab running before its end time', () => {
    useResearchStore.getState().start(propellants, 0)
    useResearchStore.getState().sync(propellants.hours * HOUR - 1)
    const s = useResearchStore.getState()
    expect(s.done).toEqual([])
    expect(s.labs.ballistics?.id).toBe('b-propellants')
  })

  it('completes a project exactly at its end time and frees the lab', () => {
    useResearchStore.getState().start(propellants, 0)
    useResearchStore.getState().sync(propellants.hours * HOUR)
    const s = useResearchStore.getState()
    expect(s.done).toEqual(['b-propellants'])
    expect(s.labs.ballistics).toBeNull()
  })

  it('completes only the labs whose time has passed', () => {
    useResearchStore.getState().start(propellants, 0) // ends 7200
    useResearchStore.getState().start(interfaceNode, 1000) // ends 8200
    useResearchStore.getState().sync(7200)
    let s = useResearchStore.getState()
    expect(s.done).toEqual(['b-propellants'])
    expect(s.labs.cybernetics?.id).toBe('c-interface')
    useResearchStore.getState().sync(8200)
    s = useResearchStore.getState()
    expect(s.done).toEqual(['b-propellants', 'c-interface'])
    expect(s.labs.cybernetics).toBeNull()
  })

  it('leaves idle labs idle no matter how far time runs', () => {
    useResearchStore.getState().sync(1e9)
    const s = useResearchStore.getState()
    expect(s.done).toEqual([])
    expect(s.labs).toEqual(idle())
  })

  it('never duplicates a completed project on repeated syncs', () => {
    useResearchStore.getState().start(propellants, 0)
    useResearchStore.getState().sync(7200)
    useResearchStore.getState().sync(7200)
    useResearchStore.getState().sync(99999)
    expect(useResearchStore.getState().done).toEqual(['b-propellants'])
  })

  it('grows done in completion order down a branch', () => {
    useResearchStore.getState().start(propellants, 0)
    useResearchStore.getState().sync(7200)
    expect(useResearchStore.getState().start(hyper, 7200)).toBe(true)
    useResearchStore.getState().sync(7200 + hyper.hours * HOUR)
    expect(useResearchStore.getState().done).toEqual(['b-propellants', 'b-hypervelocity'])
  })

  it('three branches finishing in one sync land in branch order', () => {
    useResearchStore.getState().start(propellants, 0)
    useResearchStore.getState().start(interfaceNode, 0)
    useResearchStore.getState().start(targeting, 0)
    useResearchStore.getState().sync(2 * HOUR)
    const s = useResearchStore.getState()
    expect(s.done).toEqual(['b-propellants', 'c-interface', 'k-targeting'])
    expect(s.labs).toEqual(idle())
  })
})

// RS-004: state is derived from done, the active runs and the catalog
// prerequisites. A busy lab never makes a project locked.
describe('nodeState', () => {
  const sabot = nodeById('b-sabot')

  function stateOf(node: typeof hyper) {
    const s = useResearchStore.getState()
    return nodeState(node, s.done, s.labs)
  }

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('locks Hypervelocity Core while Advanced Propellants is unresearched', () => {
    expect(stateOf(hyper)).toBe('locked')
  })

  it('Hypervelocity Core stays locked while Advanced Propellants is only running', () => {
    useResearchStore.getState().start(propellants, 0)
    expect(stateOf(propellants)).toBe('active')
    expect(stateOf(hyper)).toBe('locked')
  })

  it('completing Advanced Propellants via sync makes Hypervelocity Core available, not active, and pays nothing', () => {
    const addCredits = vi.spyOn(useAppStore.getState(), 'addCredits')
    const creditsBefore = useAppStore.getState().credits
    useResearchStore.getState().start(propellants, 0)
    useResearchStore.getState().sync(propellants.hours * HOUR)
    expect(stateOf(propellants)).toBe('researched')
    expect(stateOf(hyper)).toBe('available')
    expect(stateOf(hyper)).not.toBe('active')
    expect(addCredits).not.toHaveBeenCalled()
    expect(useAppStore.getState().credits).toBe(creditsBefore)
  })

  it('Barrel Wear Coating stays available while Ballistics runs Advanced Propellants', () => {
    expect(useResearchStore.getState().start(propellants, 0)).toBe(true)
    expect(useResearchStore.getState().labs.ballistics?.id).toBe('b-propellants')
    expect(stateOf(coating)).toBe('available')
  })

  it('a node with two prerequisites stays locked with only one done', () => {
    useResearchStore.setState({ done: ['b-propellants', 'b-hypervelocity', 'b-rail'], labs: idle() })
    expect(stateOf(sabot)).toBe('locked')
    useResearchStore.setState({
      done: ['b-propellants', 'b-hypervelocity', 'b-rail', 'b-coating', 'b-caseless', 'b-fragmentation'],
      labs: idle(),
    })
    expect(stateOf(sabot)).toBe('available')
  })
})
