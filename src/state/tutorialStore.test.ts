import { beforeEach, describe, expect, it } from 'vitest'
import { TUTORIAL_IDS, WORLD_ONBOARD_ID } from '../game/tutorial'
import { fireTutorialHint, noteTutorial, useTutorialStore } from './tutorialStore'

beforeEach(() => {
  useTutorialStore.getState().resetAll()
})

describe('tutorial step advance', () => {
  it('advances on the matching action and only on the current step', () => {
    noteTutorial('select')
    expect(useTutorialStore.getState().seen).toEqual(['tut-select'])
    // The current step is now move; a later action does not skip ahead.
    noteTutorial('swap')
    expect(useTutorialStore.getState().seen).toEqual(['tut-select'])
    noteTutorial('move')
    expect(useTutorialStore.getState().seen).toEqual(['tut-select', 'tut-move'])
  })

  it('advances on dismiss without the action', () => {
    useTutorialStore.getState().dismissStep('tut-select')
    expect(useTutorialStore.getState().seen).toEqual(['tut-select'])
    // A repeat dismiss and an unknown id change nothing.
    useTutorialStore.getState().dismissStep('tut-select')
    useTutorialStore.getState().dismissStep('not-a-step')
    expect(useTutorialStore.getState().seen).toEqual(['tut-select'])
  })

  it('SKIP TUTORIAL marks every step seen and keeps hint history', () => {
    fireTutorialHint('hint-alert')
    useTutorialStore.getState().skipTutorial()
    const seen = useTutorialStore.getState().seen
    for (const id of TUTORIAL_IDS) expect(seen).toContain(id)
    expect(seen).toContain('hint-alert')
    // Actions after the skip are inert.
    noteTutorial('select')
    expect(useTutorialStore.getState().seen).toEqual(seen)
  })
})

describe('contextual hints', () => {
  it('fires a hint once per campaign', () => {
    fireTutorialHint('hint-lowhp')
    expect(useTutorialStore.getState().hints).toEqual(['hint-lowhp'])
    expect(useTutorialStore.getState().seen).toContain('hint-lowhp')
    // A second fire changes nothing, even after the toast is dismissed.
    fireTutorialHint('hint-lowhp')
    expect(useTutorialStore.getState().hints).toEqual(['hint-lowhp'])
    useTutorialStore.getState().dismissHint('hint-lowhp')
    expect(useTutorialStore.getState().hints).toEqual([])
    fireTutorialHint('hint-lowhp')
    expect(useTutorialStore.getState().hints).toEqual([])
  })

  it('queues independent hints side by side', () => {
    fireTutorialHint('hint-alert')
    fireTutorialHint('hint-overweight')
    expect(useTutorialStore.getState().hints).toEqual(['hint-alert', 'hint-overweight'])
  })

  it('marks the world onboarding seen through markSeen', () => {
    useTutorialStore.getState().markSeen(WORLD_ONBOARD_ID)
    expect(useTutorialStore.getState().seen).toEqual([WORLD_ONBOARD_ID])
    useTutorialStore.getState().markSeen(WORLD_ONBOARD_ID)
    expect(useTutorialStore.getState().seen).toEqual([WORLD_ONBOARD_ID])
  })
})

describe('persistence boundary', () => {
  it('hydrate replaces the seen set and clears live toasts', () => {
    fireTutorialHint('hint-alert')
    useTutorialStore.getState().hydrate(['tut-select', 'hint-lowhp'])
    expect(useTutorialStore.getState().seen).toEqual(['tut-select', 'hint-lowhp'])
    expect(useTutorialStore.getState().hints).toEqual([])
    // The hydrated history still gates refires.
    fireTutorialHint('hint-lowhp')
    expect(useTutorialStore.getState().hints).toEqual([])
  })

  it('resetAll returns a fresh campaign', () => {
    useTutorialStore.getState().skipTutorial()
    fireTutorialHint('hint-alert')
    useTutorialStore.getState().resetAll()
    expect(useTutorialStore.getState().seen).toEqual([])
    expect(useTutorialStore.getState().hints).toEqual([])
  })
})
