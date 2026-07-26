// CONTRACT FILE. Research layer state: which projects are complete and what
// each of the three labs is running. Projects run on world time, so the same
// clock that moves the world finishes them; sync() is called from the tick.
import { create } from 'zustand'
import { BRANCH_IDS, nodeById } from '../game/research'
import type { BranchId, ResearchNode } from '../game/research'

export interface LabRun {
  id: string
  startedT: number
  endT: number
}

export type Labs = Record<BranchId, LabRun | null>

export type NodeState = 'researched' | 'active' | 'available' | 'locked'

interface ResearchStoreState {
  // Completed project ids in the order they finished. Effects apply in that
  // order, so the list is the record, not a set.
  done: string[]
  labs: Labs
  // True when the lab took the project, so the caller only bills a real start.
  start: (node: ResearchNode, t: number) => boolean
  sync: (t: number) => void
}

function idleLabs(): Labs {
  return { ballistics: null, cybernetics: null, control: null }
}

export const useResearchStore = create<ResearchStoreState>((set, get) => ({
  done: [],
  labs: idleLabs(),

  start: (node, t) => {
    const s = get()
    if (s.labs[node.branch] || s.done.includes(node.id)) return false
    if (!node.needs.every((id) => s.done.includes(id))) return false
    set({
      labs: { ...s.labs, [node.branch]: { id: node.id, startedT: t, endT: t + node.hours * 3600 } },
    })
    return true
  },

  sync: (t) => {
    const s = get()
    let changed = false
    const labs = { ...s.labs }
    const done = s.done.slice()
    for (const b of BRANCH_IDS) {
      const run = labs[b]
      if (run && t >= run.endT) {
        done.push(run.id)
        labs[b] = null
        changed = true
      }
    }
    if (changed) set({ done, labs })
  },
}))

/* -------------------------------- selectors ------------------------------- */

export function nodeState(node: ResearchNode, done: readonly string[], labs: Labs): NodeState {
  if (done.includes(node.id)) return 'researched'
  if (labs[node.branch]?.id === node.id) return 'active'
  return node.needs.every((id) => done.includes(id)) ? 'available' : 'locked'
}

export function runProgress(run: LabRun, t: number): number {
  const span = run.endT - run.startedT
  if (span <= 0) return 1
  const f = (t - run.startedT) / span
  return f < 0 ? 0 : f > 1 ? 1 : f
}

export function committedFunds(labs: Labs): number {
  let sum = 0
  for (const b of BRANCH_IDS) {
    const run = labs[b]
    if (run) sum += nodeById(run.id).cost
  }
  return sum
}

export function labsRunning(labs: Labs): number {
  let n = 0
  for (const b of BRANCH_IDS) if (labs[b]) n++
  return n
}
