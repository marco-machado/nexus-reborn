// Assembly row and bay click handlers (RA-008 AC 5). Reading a dossier only
// moves focus; the trailing assign key is the only control that edits the squad.
import { fmt } from './util'

/** What an Assembly row or bay may do: move focus, or toggle the squad. */
export interface AssemblyActions {
  focus: (id: string) => void
  toggle: (id: string) => void
}

/** Click handlers for one operative: `read` focuses the dossier, `assign` toggles the squad. */
export function assemblyRowHandlers(
  id: string,
  actions: AssemblyActions,
): { read: () => void; assign: () => void } {
  return {
    read: () => actions.focus(id),
    assign: () => actions.toggle(id),
  }
}

// Recruitment market hire control (IF-012, interface.md AC28). Presentation
// only: the fee clears and the roster grows in appStore.hireOperative /
// campaignStore.acceptHire (ADR-0013 Credits never overdraw). This view takes
// the owner-reported cost, balance, roster size, cap and failed flag and says
// whether HIRE is enabled and why not, mirroring the owner's refusals.

/** Owner-reported inputs for one candidate's hire control. */
export interface HireInputs {
  /** The candidate's listed fee (game/recruits.ts hireCost). */
  cost: number
  /** The live Credits balance (appStore.credits). */
  credits: number
  /** Operatives on the roster now (campaignStore.operatives.length). */
  rosterSize: number
  /** The roster cap (game/recruits.ts ROSTER_CAP). */
  rosterCap: number
  /** A failed campaign takes no hires (campaignStore.acceptHire). */
  campaignFailed: boolean
}

/** Why HIRE is refused, in the order the reason line reports them. */
export type HireRefusal = 'campaign-failed' | 'roster-full' | 'insufficient-credits'

export interface HireView {
  /** The HIRE control may be activated. */
  can: boolean
  /** Null exactly when `can`. */
  refusal: HireRefusal | null
  /** Always-visible cost versus Credits line. */
  ledger: string
  /** Visible reason line under the control; '' when hire is allowed. */
  reason: string
}

/** HIRE enabled state, the cost-versus-Credits line and the refusal reason. */
export function hireView(i: HireInputs): HireView {
  const ledger = 'COST ' + fmt(i.cost) + ' CR // CREDITS ' + fmt(i.credits) + ' CR'
  let refusal: HireRefusal | null = null
  let reason = ''
  if (i.campaignFailed) {
    refusal = 'campaign-failed'
    reason = 'CAMPAIGN FAILED // NO HIRES'
  } else if (i.rosterSize >= i.rosterCap) {
    refusal = 'roster-full'
    reason = 'ROSTER AT CAPACITY // ' + i.rosterSize + ' / ' + i.rosterCap
  } else if (i.credits < i.cost) {
    refusal = 'insufficient-credits'
    reason = 'INSUFFICIENT CREDITS // ' + fmt(i.cost - i.credits) + ' CR SHORT'
  }
  return { can: refusal === null, refusal, ledger, reason }
}
