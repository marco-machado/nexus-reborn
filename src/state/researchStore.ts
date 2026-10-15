// CONTRACT FILE. Research layer state: which projects are complete and what
// each of the three labs is running. Projects run on world time, so the same
// clock that moves the world finishes them; sync() is called from the tick.
import { create } from 'zustand'
import { BRANCH_IDS, branchDef, nodeById, nodeTitle } from '../game/research'
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
  // The world time of the last sync(t); null until the first one. The screen
  // paints remaining only when this equals the current t (P-22). Not saved:
  // hydrate calls sync(savedT), which stamps it; a new campaign resets it and
  // waits for the first clock sync.
  lastSyncT: number | null
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
  lastSyncT: null,

  start: (node, t) => {
    const s = get()
    if (s.labs[node.branch] || s.done.includes(node.id)) return false
    if (!node.needs.every((id) => s.done.includes(id))) return false
    // A non-finite clock or a non-positive duration would schedule an endT
    // that sync() never reaches, holding the lab forever.
    if (!Number.isFinite(t) || !(Number.isFinite(node.hours) && node.hours > 0)) return false
    set({
      labs: { ...s.labs, [node.branch]: { id: node.id, startedT: t, endT: t + node.hours * 3600 } },
    })
    return true
  },

  sync: (t) => {
    const s = get()
    // Due runs append in ascending endT, so done reads in the order the
    // projects finished on world time, not the order they were authorized.
    // Equal endT falls back to BRANCH_IDS house order: the scan below visits
    // branches in that order and Array.prototype.sort is stable.
    const due: Array<{ branch: BranchId; run: LabRun }> = []
    for (const b of BRANCH_IDS) {
      const run = s.labs[b]
      if (run && t >= run.endT) due.push({ branch: b, run })
    }
    // Every sync stamps lastSyncT, due or not; an unchanged stamp skips the
    // write so a paused clock does not notify subscribers each batch.
    if (due.length === 0) {
      if (s.lastSyncT !== t) set({ lastSyncT: t })
      return
    }
    due.sort((a, b) => a.run.endT - b.run.endT)
    const labs = { ...s.labs }
    const done = s.done.slice()
    for (const { branch, run } of due) {
      done.push(run.id)
      labs[branch] = null
    }
    set({ done, labs, lastSyncT: t })
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

/* ---------------------------- eligibility text ---------------------------- */

// Inspect surface (research.md UI Requirements): why this project cannot be
// authorized right now, or null when it can (available on an idle lab).
// Causes appear in eligibility order: missing prerequisites (every unmet one
// named), lab not idle, already researched. A state explanation only: it
// never mentions Credits, so it cannot imply a charge was attempted. Plain
// text by design; there is no reason enum (ADR-0013 / research.md Core Rule 3).
export function eligibilityText(node: ResearchNode, done: readonly string[], labs: Labs): string | null {
  const causes: string[] = []
  const unmet = node.needs.filter((id) => !done.includes(id))
  if (unmet.length > 0) {
    causes.push('Locked: requires ' + unmet.map((id) => nodeTitle(nodeById(id))).join(' and '))
  }
  const run = labs[node.branch]
  if (run) {
    const lab = branchDef(node.branch).lab
    causes.push(
      run.id === node.id
        ? 'lab not idle: the ' + lab + ' is already running this project'
        : 'lab not idle: the ' + lab + ' is running ' + nodeTitle(nodeById(run.id)),
    )
  }
  if (done.includes(node.id)) causes.push('already researched')
  return causes.length > 0 ? causes.join('; ') + '.' : null
}
