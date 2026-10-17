// Research detail panel: whether Authorize is enabled and the reason line under
// it (IF-005, TR-interface-007). Presentation only: the debit and the lab start
// stay in appStore.authorizeResearch (Economy/Research, ADR-0013). Selecting a
// node never reaches this; only the Authorize control starts a project.
import { eligibilityText, nodeState, type Labs, type NodeState } from '../state/researchStore'
import type { ResearchNode } from '../game/research'
import { fmt } from './util'

export interface AuthorizeView {
  state: NodeState
  /** The enabled Authorize control may be activated. */
  can: boolean
  /** The reason line shown under the control. */
  sub: string
}

/** Enabled only for an available project, an idle lab and enough Credits. */
export function authorizeView(
  n: ResearchNode,
  done: readonly string[],
  labs: Labs,
  credits: number,
  labName: string,
): AuthorizeView {
  const state = nodeState(n, done as string[], labs)
  const run = labs[n.branch]
  const labBusy = run !== null && run.id !== n.id
  const short = credits < n.cost
  const can = state === 'available' && !labBusy && !short
  let sub = 'COMMITS ' + fmt(n.cost) + ' CR // ' + n.hours + 'H IN ' + labName
  const cause = eligibilityText(n, done, labs)
  if (state === 'active') sub = 'RUNNING IN ' + labName
  else if (cause !== null) sub = cause.toUpperCase()
  else if (short) sub = 'INSUFFICIENT CREDITS // ' + fmt(n.cost - credits) + ' CR SHORT'
  return { state, can, sub }
}
