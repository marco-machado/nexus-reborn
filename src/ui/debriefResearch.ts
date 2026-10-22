// The first-Debrief Research prompt (IF-014, Interface Core Rule 13 / AC32;
// design/difficulty-curve.md 2026-10-21). Pure presentation: the project is
// chosen with the owner's one eligibility rule (researchStore.eligibilityText,
// the function AUTHORIZE calls — ADR-0013) plus the owner's affordability
// test against post-payout Credits (decided 2026-10-22: "available" means
// affordable). Nothing here recomputes a research rule, and the Debrief marks
// the prompt fired through tutorialStore.markSeen, never from here.
import { NODES, branchDef, nodeTitle } from '../game/research'
import type { ResearchNode } from '../game/research'
import { eligibilityText } from '../state/researchStore'
import type { Labs } from '../state/researchStore'
import { fmt } from './util'

/**
 * The cheapest project the director could AUTHORIZE right now: the
 * lowest-cost node for which `eligibilityText` returns null AND
 * `cost <= credits`. Ties keep `NODES` order. Null when nothing qualifies
 * (no idle lab, nothing unlocked, or Credits short of every open project);
 * the prompt then stays unfired for a later Debrief.
 * @param done `researchStore.done` after this Debrief's apply.
 * @param labs `researchStore.labs` after this Debrief's apply.
 * @param credits `appStore.credits` after the payout applied.
 * @param nodes The research graph; defaults to the live `NODES`.
 */
export function cheapestAvailableProject(
  done: readonly string[],
  labs: Labs,
  credits: number,
  nodes: readonly ResearchNode[] = NODES,
): ResearchNode | null {
  let best: ResearchNode | null = null
  for (const node of nodes) {
    if (!(Number.isFinite(node.cost) && node.cost > 0)) continue
    if (node.cost > credits) continue
    if (eligibilityText(node, done, labs) !== null) continue
    if (best === null || node.cost < best.cost) best = node
  }
  return best
}

/**
 * Whether the Debrief shows the prompt: the apply has landed (the figures
 * are post-payout), the id is unfired this campaign, and a project qualifies.
 * One rule, so "shown" and "marked" cannot drift apart.
 * @param seen `tutorialStore.seen`.
 * @param applied `lastAppliedKey >= outcome.applyKey` (ADR-0021 apply-once key).
 * @param project The `cheapestAvailableProject` result.
 */
export function researchPromptShown(
  seen: readonly string[],
  applied: boolean,
  project: ResearchNode | null,
  id: string,
): boolean {
  return applied && project !== null && !seen.includes(id)
}

/** The prompt's words: the tab, the lab, the project, its cost and its hours. */
export function researchPromptCopy(node: ResearchNode): { title: string; body: string } {
  const lab = branchDef(node.branch).lab
  return {
    title: 'RESEARCH // ' + nodeTitle(node),
    body:
      'The ' +
      lab +
      ' is idle. ' +
      fmt(node.cost) +
      ' CR starts ' +
      nodeTitle(node) +
      ' in ' +
      node.hours +
      ' hours. Open the RESEARCH tab and AUTHORIZE it before the next deploy.',
  }
}
