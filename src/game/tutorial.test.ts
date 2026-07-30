import { afterEach, describe, expect, it } from 'vitest'
import { applyOverrides } from './bindings'
import {
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
    for (const id of TUTORIAL_IDS) expect(SEEN_IDS).toContain(id)
    for (const id of HINT_IDS) expect(SEEN_IDS).toContain(id)
  })
})
