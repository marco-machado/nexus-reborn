import { afterEach, describe, expect, it } from 'vitest'
import { applyOverrides } from './bindings'
import {
  DEBRIEF_RESEARCH_ID,
  HINTS,
  HINT_IDS,
  SEEN_IDS,
  TUTORIAL_IDS,
  TUTORIAL_STEPS,
  WORLD_ONBOARD_ID,
  bindingKeys,
  currentStep,
} from './tutorial'

describe('tutorial steps', () => {
  it('runs the documented sequence in order', () => {
    expect(TUTORIAL_STEPS.map((s) => s.event)).toEqual([
      'select',
      'move',
      'attack',
      'hold',
      'ability',
      'item',
      'swap',
      'objective',
      'extract',
    ])
  })

  it('has a unique id and non-empty copy per step', () => {
    expect(new Set(TUTORIAL_IDS).size).toBe(TUTORIAL_STEPS.length)
    for (const step of TUTORIAL_STEPS) {
      expect(step.title.length).toBeGreaterThan(0)
      expect(step.body(bindingKeys).length).toBeGreaterThan(0)
    }
  })

  it('advances by first-unseen: currentStep walks the list', () => {
    expect(currentStep([])?.id).toBe('tut-select')
    expect(currentStep(['tut-select'])?.id).toBe('tut-move')
    // A later id seen early never blocks the pointer.
    expect(currentStep(['tut-select', 'tut-swap'])?.id).toBe('tut-move')
    expect(currentStep([...TUTORIAL_IDS])).toBeNull()
  })
})

describe('binding-aware copy', () => {
  afterEach(() => {
    applyOverrides({})
  })

  it('prints the live binding keys, not literals', () => {
    const hold = TUTORIAL_STEPS.find((s) => s.id === 'tut-hold')
    expect(hold?.body(bindingKeys)).toContain('H')
    expect(hold?.body(bindingKeys)).toContain('C')
    applyOverrides({ holdGround: ['KeyJ'] })
    expect(hold?.body(bindingKeys)).toContain('J')
    expect(hold?.body(bindingKeys)).not.toContain('H holds')
  })

  it('resolves every id the copy asks for', () => {
    const asked: string[] = []
    const probe = (id: string): string => {
      asked.push(id)
      return bindingKeys(id as never)
    }
    for (const step of TUTORIAL_STEPS) step.body(probe as never)
    for (const id of HINT_IDS) HINTS[id].body(probe as never)
    for (const id of asked) {
      expect(bindingKeys(id as never)).not.toBe('?')
    }
  })
})

describe('hint and seen ids', () => {
  it('keeps hint copy present and ids disjoint from the steps', () => {
    for (const id of HINT_IDS) {
      expect(HINTS[id].title.length).toBeGreaterThan(0)
      expect(HINTS[id].body(bindingKeys).length).toBeGreaterThan(0)
      expect(TUTORIAL_IDS.includes(id)).toBe(false)
    }
  })

  it('lists every seen id exactly once, including the world onboarding', () => {
    expect(new Set(SEEN_IDS).size).toBe(SEEN_IDS.length)
    expect(SEEN_IDS).toContain(WORLD_ONBOARD_ID)
    expect(SEEN_IDS).toContain(DEBRIEF_RESEARCH_ID)
    for (const id of TUTORIAL_IDS) expect(SEEN_IDS).toContain(id)
    for (const id of HINT_IDS) expect(SEEN_IDS).toContain(id)
  })
})

describe('grenade hint and the hold key (TM-021 AC-1)', () => {
  afterEach(() => {
    applyOverrides({})
  })

  it('BLAST RADIUS says the ring hits everyone, the squad included, and names throw and cancel', () => {
    const hint = HINTS['hint-grenade']
    expect(hint.title).toBe('BLAST RADIUS')
    const body = hint.body(bindingKeys)
    expect(body).toContain('everyone inside it takes damage, your squad included')
    expect(body).toContain('Left click throws')
    expect(body).toContain('G cancels')
    applyOverrides({ grenade: ['KeyT'] })
    expect(hint.body(bindingKeys)).toContain('T cancels')
  })

  it('the first tutorial step names the tactical hold key', () => {
    const first = TUTORIAL_STEPS[0]
    expect(first.id).toBe('tut-select')
    expect(first.body(bindingKeys)).toContain('Space stops time with orders open')
    // The hold row is fixed (TM-019 AC-1): an override does not rename it.
    applyOverrides({ tacticalHold: ['KeyB'] })
    expect(first.body(bindingKeys)).toContain('Space stops time with orders open')
  })
})
