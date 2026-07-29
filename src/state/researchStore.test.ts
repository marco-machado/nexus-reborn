import { beforeEach, describe, expect, it } from 'vitest'
import { useResearchStore } from './researchStore'
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
