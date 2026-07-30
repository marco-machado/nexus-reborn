// Tutorial and hint progress. `seen` is campaign state: it rides in the
// versioned save (state/save.ts), resets with NEW OPERATION, and gates every
// prompt to once per campaign. `hints` is session state: the fired-but-not-
// dismissed toasts currently on screen; it never persists.
//
// The sim (game/world.ts) and the input layer report player actions through
// noteTutorial/fireTutorialHint; the toast layer and the world-map overlay
// subscribe here. Like the other stores the sim writes, nothing in the sim
// reads this state back.
import { create } from 'zustand'
import { HINT_IDS, TUTORIAL_IDS, TUTORIAL_STEPS, currentStep } from '../game/tutorial'
import type { HintId, TutorialEvent } from '../game/tutorial'

export interface TutorialState {
  seen: string[]
  hints: HintId[]
  // Marks the live tutorial step done when the reported action matches it.
  note: (event: TutorialEvent) => void
  // The dismiss control on the step toast.
  dismissStep: (id: string) => void
  // SKIP TUTORIAL: every step is marked seen at once.
  skipTutorial: () => void
  // Fires a one-shot hint. A hint already seen this campaign never fires.
  fireHint: (id: HintId) => void
  dismissHint: (id: HintId) => void
  // Generic seen marker for non-toast prompts (the world-map overlay).
  markSeen: (id: string) => void
  hydrate: (seen: string[]) => void
  resetAll: () => void
}

function withSeen(seen: string[], id: string): string[] {
  return seen.includes(id) ? seen : [...seen, id]
}

export const useTutorialStore = create<TutorialState>((set, get) => ({
  seen: [],
  hints: [],
  note: (event) => {
    const step = currentStep(get().seen)
    if (!step || step.event !== event) return
    set((s) => ({ seen: withSeen(s.seen, step.id) }))
  },
  dismissStep: (id) => {
    if (!TUTORIAL_STEPS.some((s) => s.id === id)) return
    set((s) => ({ seen: withSeen(s.seen, id) }))
  },
  skipTutorial: () =>
    set((s) => ({
      seen: [...s.seen, ...TUTORIAL_IDS.filter((id) => !s.seen.includes(id))],
    })),
  fireHint: (id) => {
    if (!HINT_IDS.includes(id) || get().seen.includes(id)) return
    set((s) => ({ seen: withSeen(s.seen, id), hints: [...s.hints, id] }))
  },
  dismissHint: (id) => set((s) => ({ hints: s.hints.filter((h) => h !== id) })),
  markSeen: (id) => set((s) => ({ seen: withSeen(s.seen, id) })),
  hydrate: (seen) => set({ seen: [...seen], hints: [] }),
  resetAll: () => set({ seen: [], hints: [] }),
}))

// Thin call points for the sim and the input handlers.
export function noteTutorial(event: TutorialEvent): void {
  useTutorialStore.getState().note(event)
}

export function fireTutorialHint(id: HintId): void {
  useTutorialStore.getState().fireHint(id)
}
