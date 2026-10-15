import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nodeState, useResearchStore } from './researchStore'
import { useAppStore } from './appStore'
import { TIME_SCALE, useWorldStore } from './worldStore'
import type { Labs } from './researchStore'
import { BRANCH_IDS, currentIssue, nodeById, nodesOfBranch } from '../game/research'

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

// RS-011: one sync that finishes several labs appends them in ascending endT;
// only equal endT falls back to BRANCH_IDS house order. Neither a BRANCH_IDS
// scan nor authorize order passes the first and third cases.
describe('done appends in ascending endT', () => {
  const sensor = nodeById('k-sensor')

  it('Targeting AI Suite (endT 7200) lands before Advanced Propellants (endT 10800)', () => {
    expect(useResearchStore.getState().start(targeting, 0)).toBe(true)
    expect(useResearchStore.getState().start(propellants, 3600)).toBe(true)
    expect(useResearchStore.getState().labs.control?.endT).toBe(7200)
    expect(useResearchStore.getState().labs.ballistics?.endT).toBe(10800)
    useResearchStore.getState().sync(10800)
    const s = useResearchStore.getState()
    expect(s.done).toEqual(['k-targeting', 'b-propellants'])
    expect(nodeState(targeting, s.done, s.labs)).toBe('researched')
    expect(nodeState(propellants, s.done, s.labs)).toBe('researched')
    expect(s.labs).toEqual(idle())
  })

  it('Sensor Fusion Array lands before Neural Interface I; the Neural bay issues Neural Interface I', () => {
    expect(useResearchStore.getState().start(sensor, 0)).toBe(true)
    expect(useResearchStore.getState().start(interfaceNode, 3600)).toBe(true)
    expect(useResearchStore.getState().labs.control?.endT).toBe(7200)
    expect(useResearchStore.getState().labs.cybernetics?.endT).toBe(10800)
    useResearchStore.getState().sync(10800)
    const s = useResearchStore.getState()
    expect(s.done).toEqual(['k-sensor', 'c-interface'])
    expect(currentIssue(s.done, 'NEURAL')?.id).toBe('c-interface')
  })

  it('equal endT authorized control, cybernetics, ballistics lands in BRANCH_IDS order', () => {
    expect(useResearchStore.getState().start(targeting, 0)).toBe(true)
    expect(useResearchStore.getState().start(interfaceNode, 0)).toBe(true)
    expect(useResearchStore.getState().start(propellants, 0)).toBe(true)
    for (const b of BRANCH_IDS) expect(useResearchStore.getState().labs[b]?.endT).toBe(7200)
    useResearchStore.getState().sync(7200)
    expect(useResearchStore.getState().done).toEqual(['b-propellants', 'c-interface', 'k-targeting'])
  })
})

// RS-012: an equal endT is not "latest". Same-bay completions that land on the
// same endT append in BRANCH_IDS house order, whatever the authorize order, so
// the bay's current issue is the later house (control after cybernetics).
describe('equal endT house order within a bay', () => {
  const sensor = nodeById('k-sensor')

  it('injected Neural Cache Array and Adaptive Command AI at one endT: cybernetics appends first, control is current issue', () => {
    const S = 100 * HOUR
    const endT = S + 14 * HOUR
    expect(nodeById('c-cache').augSlot).toBe('NEURAL')
    expect(nodeById('k-adaptive').augSlot).toBe('NEURAL')
    // Fixture set directly on the store, not via production authorize. The key
    // order records the authorize order: Adaptive Command AI first.
    useResearchStore.setState({
      labs: {
        control: { id: 'k-adaptive', startedT: S, endT },
        cybernetics: { id: 'c-cache', startedT: S, endT },
        ballistics: null,
      },
    })
    useResearchStore.getState().sync(S + 50400)
    const s = useResearchStore.getState()
    expect(s.done).toEqual(['c-cache', 'k-adaptive'])
    expect(currentIssue(s.done, 'NEURAL')?.id).toBe('k-adaptive')
    expect(s.labs).toEqual(idle())
  })

  it('Sensor Fusion Array authorized first, both ending at 7200: Neural Interface I appends first, Sensor Fusion Array is current issue', () => {
    expect(sensor.augSlot).toBe('NEURAL')
    expect(useResearchStore.getState().start(sensor, 0)).toBe(true)
    expect(useResearchStore.getState().start(interfaceNode, 0)).toBe(true)
    expect(useResearchStore.getState().labs.control?.endT).toBe(7200)
    expect(useResearchStore.getState().labs.cybernetics?.endT).toBe(7200)
    useResearchStore.getState().sync(7200)
    const s = useResearchStore.getState()
    expect(s.done).toEqual(['c-interface', 'k-sensor'])
    expect(currentIssue(s.done, 'NEURAL')?.id).toBe('k-sensor')
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

// RS-007: endT = startedT + hours × 3600, with hours read from the catalog.
// Each case goes through appStore.authorizeResearch, the authorize path the
// Research screen calls, so the run under test is a billed start.
describe('lab endT from authorize time and duration', () => {
  const caps = [nodeById('b-sabot'), nodeById('c-cache'), nodeById('k-adaptive')]
  let creditsBefore: number

  beforeEach(() => {
    creditsBefore = useAppStore.getState().credits
    useAppStore.setState({ credits: 1e9 })
  })

  afterEach(() => {
    useAppStore.setState({ credits: creditsBefore })
  })

  function authorize(node: typeof propellants, t: number): boolean {
    return useAppStore.getState().authorizeResearch(node, t).ok
  }

  it('catalog hours drive the cases: propellants 2h, hypervelocity 4h, each cap 14h', () => {
    expect(propellants.hours).toBe(2)
    expect(hyper.hours).toBe(4)
    for (const cap of caps) expect(cap.hours).toBe(14)
  })

  it('Advanced Propellants authorized at t = 0 ends at 7200', () => {
    expect(authorize(propellants, 0)).toBe(true)
    const run = useResearchStore.getState().labs.ballistics
    expect(run).toEqual({ id: 'b-propellants', startedT: 0, endT: 7200 })
    expect(run?.endT).toBe(propellants.hours * HOUR)
  })

  it('Advanced Propellants authorized at t = 1000 ends at 8200', () => {
    expect(authorize(propellants, 1000)).toBe(true)
    const run = useResearchStore.getState().labs.ballistics
    expect(run).toEqual({ id: 'b-propellants', startedT: 1000, endT: 8200 })
    expect(run?.endT).toBe(1000 + propellants.hours * HOUR)
  })

  it('Hypervelocity Core (4h) authorized at t = 0 ends at 14400', () => {
    useResearchStore.setState({ done: ['b-propellants'] })
    expect(authorize(hyper, 0)).toBe(true)
    const run = useResearchStore.getState().labs.ballistics
    expect(run).toEqual({ id: 'b-hypervelocity', startedT: 0, endT: 14400 })
    expect(run?.endT).toBe(hyper.hours * HOUR)
  })

  it('all three 14h caps from idle labs run at once, each endT = startedT + 50400', () => {
    const capIds = new Set(caps.map((c) => c.id))
    const prereqs = BRANCH_IDS.flatMap((b) => nodesOfBranch(b))
      .map((n) => n.id)
      .filter((id) => !capIds.has(id))
    useResearchStore.setState({ done: prereqs, labs: idle() })
    for (const cap of caps) expect(nodeState(cap, prereqs, idle())).toBe('available')

    const starts = [0, 1000, 2500]
    caps.forEach((cap, i) => expect(authorize(cap, starts[i])).toBe(true))

    const labs = useResearchStore.getState().labs
    caps.forEach((cap, i) => {
      const run = labs[cap.branch]
      expect(run?.id).toBe(cap.id)
      expect(run?.startedT).toBe(starts[i])
      expect(run?.endT).toBe(starts[i] + 50400)
      expect(run?.endT).toBe(starts[i] + cap.hours * HOUR)
    })
  })
})

// RS-008: sync(t) completes a run once t >= endT, at equality and not a
// second later, and completion pays nothing. The strategic case advances the
// World Network clock through tick(), the Screen path, then syncs at its t.
describe('sync(t) completes projects; completion pays nothing', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('sync(7199) leaves a run with endT 7200 active', () => {
    expect(useResearchStore.getState().start(propellants, 0)).toBe(true)
    expect(useResearchStore.getState().labs.ballistics?.endT).toBe(7200)
    useResearchStore.getState().sync(7199)
    const s = useResearchStore.getState()
    expect(s.done).toEqual([])
    expect(s.labs.ballistics).toEqual({ id: 'b-propellants', startedT: 0, endT: 7200 })
    expect(nodeState(propellants, s.done, s.labs)).toBe('active')
  })

  it('sync(7200) researches it, idles the lab, and neither calls addCredits nor moves Credits', () => {
    const addCredits = vi.spyOn(useAppStore.getState(), 'addCredits')
    useResearchStore.getState().start(propellants, 0)
    const creditsBefore = useAppStore.getState().credits
    useResearchStore.getState().sync(7200)
    const s = useResearchStore.getState()
    expect(s.done).toEqual(['b-propellants'])
    expect(s.labs.ballistics).toBeNull()
    expect(nodeState(propellants, s.done, s.labs)).toBe('researched')
    expect(addCredits).not.toHaveBeenCalled()
    expect(useAppStore.getState().credits).toBe(creditsBefore)
  })

  it('completes at equality, not one second later', () => {
    useResearchStore.getState().start(propellants, 0)
    useResearchStore.getState().sync(7199)
    expect(useResearchStore.getState().done).toEqual([])
    useResearchStore.getState().sync(7200)
    expect(useResearchStore.getState().done).toEqual(['b-propellants'])
    expect(useResearchStore.getState().labs.ballistics).toBeNull()
  })

  describe('after a strategic clock advance', () => {
    const T0 = 50_000
    let worldBefore: ReturnType<typeof useWorldStore.getState>

    beforeEach(() => {
      worldBefore = { ...useWorldStore.getState() }
      useWorldStore.setState({ t: T0, speed: 1, paused: false, review: null })
    })

    afterEach(() => {
      useWorldStore.setState(worldBefore, true)
    })

    it('Advanced Propellants started at T0 is researched once t advances >= 7200 and sync runs at that t', () => {
      expect(useResearchStore.getState().start(propellants, T0)).toBe(true)
      expect(useResearchStore.getState().labs.ballistics?.endT).toBe(T0 + 7200)

      // One Screen batch short of the end leaves it running.
      useWorldStore.getState().tick(7199 / TIME_SCALE)
      expect(useWorldStore.getState().t - T0).toBeLessThan(7200)
      useResearchStore.getState().sync(useWorldStore.getState().t)
      expect(useResearchStore.getState().labs.ballistics?.id).toBe('b-propellants')

      // Advance the strategic clock past T0 + 7200, then sync at that t.
      useWorldStore.getState().tick(2 / TIME_SCALE)
      const t = useWorldStore.getState().t
      expect(t - T0).toBeGreaterThanOrEqual(7200)
      useResearchStore.getState().sync(t)
      const s = useResearchStore.getState()
      expect(s.done).toEqual(['b-propellants'])
      expect(s.labs.ballistics).toBeNull()
    })
  })
})
