// IF-005 (TR-interface-007): Research Authorize gating and start, Timeline
// keyboard model, and the activation-versus-authorize split. Real stores and
// the real nodes. Focus trap / focus return (AC18) is a DOM behaviour, covered
// by the retained headless run in production/qa/evidence/if-005/.
import { beforeEach, describe, expect, it } from 'vitest'
import { branchDef, nodeById } from '../game/research'
import { useAppStore } from '../state/appStore'
import { useResearchStore, nodeState, type Labs } from '../state/researchStore'
import { useWorldStore, DAY } from '../state/worldStore'
import { authorizeView } from './researchAuth'
import { reviewKey } from './timelineKeys'

const node = nodeById('b-propellants')
const idle = (): Labs => ({ ballistics: null, cybernetics: null, control: null })
const lab = branchDef(node.branch).lab

beforeEach(() => {
  useResearchStore.setState({ done: [], labs: idle(), lastSyncT: null })
  useAppStore.setState({ phase: 'research', credits: 1_000_000 })
})

describe('AC8: Authorize gating', () => {
  it('Credits below cost: disabled, with the unaffordable reason visible', () => {
    const v = authorizeView(node, [], idle(), node.cost - 1, lab)
    expect(v.state).toBe('available')
    expect(v.can).toBe(false)
    expect(v.sub).toBe('INSUFFICIENT CREDITS // 1 CR SHORT')
  })

  it('affordable twin: enabled, and activating starts the project as Active', () => {
    const v = authorizeView(node, [], idle(), node.cost, lab)
    expect(v.can).toBe(true)
    const r = useAppStore.getState().authorizeResearch(node, 0)
    expect(r.ok).toBe(true)
    const { done, labs } = useResearchStore.getState()
    expect(nodeState(node, done, labs)).toBe('active')
    expect(authorizeView(node, done, labs, 1_000_000, lab).state).toBe('active')
    expect(authorizeView(node, done, labs, 1_000_000, lab).can).toBe(false)
  })

  it('a busy laboratory or unmet prerequisite disables Authorize with its cause', () => {
    useAppStore.getState().authorizeResearch(node, 0)
    const { done, labs } = useResearchStore.getState()
    const other = nodeById('b-hypervelocity')
    const v = authorizeView(other, done, labs, 1_000_000, lab)
    expect(v.can).toBe(false)
    expect(v.sub).toMatch(/^LOCKED|LAB NOT IDLE/)
  })
})

describe('AC19: node activation selects only', () => {
  it('reading the Authorize view never changes Credits or laboratory occupancy', () => {
    const credits = useAppStore.getState().credits
    const labs = useResearchStore.getState().labs
    // Pointer, Enter and Space on a node call only the screen's setSelected;
    // the only store-writing path is authorizeResearch, reached from Authorize.
    authorizeView(node, [], labs, credits, lab)
    expect(useAppStore.getState().credits).toBe(credits)
    expect(useResearchStore.getState().labs).toBe(labs)
  })

  it('Authorize debits the listed cost once and occupies the lab', () => {
    const before = useAppStore.getState().credits
    expect(useAppStore.getState().authorizeResearch(node, 0).ok).toBe(true)
    expect(useAppStore.getState().credits).toBe(before - node.cost)
    expect(useResearchStore.getState().labs[node.branch]?.id).toBe(node.id)
  })
})

describe('AC19: Timeline keys', () => {
  const now = 10 * DAY
  const H = 3600
  it('Left steps Review back an hour, from Live and from a pin', () => {
    expect(reviewKey('ArrowLeft', now, null)).toBe(now - H)
    expect(reviewKey('ArrowLeft', now, now - 5 * H)).toBe(now - 6 * H)
  })
  it('Left stops at the oldest point of the window', () => {
    expect(reviewKey('ArrowLeft', now, now - DAY)).toBe(now - DAY)
  })
  it('Right steps forward and reaching now returns Live', () => {
    expect(reviewKey('ArrowRight', now, now - 5 * H)).toBe(now - 4 * H)
    expect(reviewKey('ArrowRight', now, now - H)).toBeNull()
    expect(reviewKey('ArrowRight', now, null)).toBeNull()
  })
  it('Home selects the oldest point, End returns Live, other keys are ignored', () => {
    expect(reviewKey('Home', now, null)).toBe(now - DAY)
    expect(reviewKey('End', now, now - 3 * H)).toBeNull()
    expect(reviewKey('a', now, null)).toBeUndefined()
  })
  it('Review keys mutate only the review pin, never the live clock or Credits', () => {
    useWorldStore.setState({ t: now, review: null })
    const credits = useAppStore.getState().credits
    for (const k of ['ArrowLeft', 'ArrowLeft', 'Home', 'ArrowRight', 'End']) {
      const next = reviewKey(k, useWorldStore.getState().t, useWorldStore.getState().review)
      if (next !== undefined) useWorldStore.getState().setReview(next)
    }
    expect(useWorldStore.getState().t).toBe(now)
    expect(useWorldStore.getState().review).toBeNull()
    expect(useAppStore.getState().credits).toBe(credits)
  })
})
