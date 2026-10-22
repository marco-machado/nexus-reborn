// IF-014: the first-Debrief Research prompt (Interface Core Rule 13, AC32).
// Spec literals are pinned here, not read back from the module under test:
// the cheapest project on the live graph with idle labs is BARREL WEAR
// COATING at 14,000 CR over 2 hours (research.ts data), and the prompt fires
// iff the apply landed, the id is unfired and a project qualifies.
import { beforeEach, describe, expect, it } from 'vitest'
import {
  cheapestAvailableProject,
  researchPromptCopy,
  researchPromptShown,
} from './debriefResearch'
import { NODES, nodeById } from '../game/research'
import type { ResearchNode } from '../game/research'
import { eligibilityText, useResearchStore } from '../state/researchStore'
import type { Labs } from '../state/researchStore'
import { DEBRIEF_RESEARCH_ID, SEEN_IDS, WORLD_ONBOARD_ID } from '../game/tutorial'
import { useTutorialStore } from '../state/tutorialStore'
import { useAppStore } from '../state/appStore'

const idle = (): Labs => ({ ballistics: null, cybernetics: null, control: null })

beforeEach(() => {
  useResearchStore.setState({ done: [], labs: idle() })
  useTutorialStore.getState().resetAll()
})

describe('cheapest available project (AC32, decided 2026-10-22: available means affordable)', () => {
  it('on the opening graph with idle labs and full Credits it is BARREL WEAR COATING at 14,000 CR', () => {
    const node = cheapestAvailableProject([], idle(), 128450)
    expect(node?.id).toBe('b-coating')
    expect(node?.cost).toBe(14000)
    expect(node?.hours).toBe(2)
  })

  it('is the lowest-cost node the owner reports eligible: every cheaper node is refused by eligibilityText', () => {
    const done: string[] = []
    const labs = idle()
    const pick = cheapestAvailableProject(done, labs, 1e9)
    expect(pick).not.toBeNull()
    expect(eligibilityText(pick!, done, labs)).toBeNull()
    for (const n of NODES) {
      if (n.cost < pick!.cost) expect(eligibilityText(n, done, labs)).not.toBeNull()
    }
  })

  it('filters by cost <= Credits after the payout: 13,999 CR qualifies nothing, 14,000 CR qualifies the 14,000 project', () => {
    expect(cheapestAvailableProject([], idle(), 13999)).toBeNull()
    expect(cheapestAvailableProject([], idle(), 14000)?.id).toBe('b-coating')
  })

  it('skips a node whose lab is busy or which is already researched, and never a node the owner refuses', () => {
    const busy: Labs = { ...idle(), ballistics: { id: 'b-coating', startedT: 0, endT: 7200 } }
    const pick = cheapestAvailableProject([], busy, 1e9)
    expect(pick).not.toBeNull()
    expect(pick!.branch).not.toBe('ballistics')
    expect(eligibilityText(pick!, [], busy)).toBeNull()
    const researched = cheapestAvailableProject(['b-coating'], idle(), 1e9)
    expect(researched?.id).not.toBe('b-coating')
  })

  it('returns null when no idle lab has an eligible, affordable project', () => {
    const allBusy: Labs = {
      ballistics: { id: 'b-coating', startedT: 0, endT: 7200 },
      cybernetics: { id: 'c-interface', startedT: 0, endT: 7200 },
      control: { id: 'k-sensor', startedT: 0, endT: 7200 },
    }
    expect(cheapestAvailableProject([], allBusy, 1e9)).toBeNull()
    expect(cheapestAvailableProject([], idle(), 0)).toBeNull()
  })

  it('keeps graph order on a cost tie and ignores a non-positive cost', () => {
    const base = nodeById('b-coating')
    const a: ResearchNode = { ...base, id: 'tie-a', branch: 'ballistics', needs: [], cost: 100 }
    const b: ResearchNode = { ...base, id: 'tie-b', branch: 'cybernetics', needs: [], cost: 100 }
    const free: ResearchNode = { ...base, id: 'free', branch: 'control', needs: [], cost: 0 }
    expect(cheapestAvailableProject([], idle(), 1e9, [free, b, a])?.id).toBe('tie-b')
  })
})

describe('prompt shown iff first Debrief, applied, and a project qualifies (AC32)', () => {
  const node = nodeById('b-coating')

  it('fires on an unfired id once the apply landed', () => {
    expect(researchPromptShown([], true, node, DEBRIEF_RESEARCH_ID)).toBe(true)
  })

  it('does not fire before the apply, with no project, or once the id is seen', () => {
    expect(researchPromptShown([], false, node, DEBRIEF_RESEARCH_ID)).toBe(false)
    expect(researchPromptShown([], true, null, DEBRIEF_RESEARCH_ID)).toBe(false)
    expect(researchPromptShown([DEBRIEF_RESEARCH_ID], true, node, DEBRIEF_RESEARCH_ID)).toBe(false)
    // Another prompt's mark does not count as this one's.
    expect(researchPromptShown([WORLD_ONBOARD_ID], true, node, DEBRIEF_RESEARCH_ID)).toBe(true)
  })

  it('the id is a standalone seen id, listed once, and markSeen records it once', () => {
    expect(DEBRIEF_RESEARCH_ID).toBe('hint-debrief-research')
    expect(SEEN_IDS.filter((id) => id === DEBRIEF_RESEARCH_ID)).toHaveLength(1)
    useTutorialStore.getState().markSeen(DEBRIEF_RESEARCH_ID)
    useTutorialStore.getState().markSeen(DEBRIEF_RESEARCH_ID)
    expect(useTutorialStore.getState().seen).toEqual([DEBRIEF_RESEARCH_ID])
    expect(researchPromptShown(useTutorialStore.getState().seen, true, node, DEBRIEF_RESEARCH_ID)).toBe(false)
  })

  it('the live store: with the opening Credits and idle labs the Debrief has a project to name', () => {
    const { done, labs } = useResearchStore.getState()
    expect(cheapestAvailableProject(done, labs, useAppStore.getState().credits)?.id).toBe('b-coating')
  })
})

describe('prompt copy names the Research tab, the lab, the project, its cost and hours', () => {
  it('BARREL WEAR COATING reads 14,000 CR in 2 hours from the BALLISTICS LAB', () => {
    const copy = researchPromptCopy(nodeById('b-coating'))
    expect(copy.title).toBe('RESEARCH // BARREL WEAR COATING')
    expect(copy.body).toBe(
      'The BALLISTICS LAB is idle. 14,000 CR starts BARREL WEAR COATING in 2 hours. ' +
        'Open the RESEARCH tab and AUTHORIZE it before the next deploy.',
    )
  })

  it('a cybernetics project names its own lab', () => {
    const c = NODES.find((n) => n.branch === 'cybernetics' && n.needs.length === 0)!
    expect(researchPromptCopy(c).body).toContain('The CYBERNETICS LAB is idle.')
  })
})
