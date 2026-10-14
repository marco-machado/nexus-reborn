// Pure Debrief invoice rows (EC-022, TR-economy-007). Economy prices every
// figure (appStore: priceOutcome, collateralFine, netPayout); this module only
// formats them. All five money lines print on every outcome, zeros included:
// a loss, a quiet replay and N = 0 never drop a line (GDD §10, Closed Q3 —
// one show-rule, no separate rule for zero rows).
import { collateralFine, netPayout } from '../state/appStore'
import type { MissionOutcome } from '../state/appStore'
import { fmt } from './util'

/** The five invoice money lines, by GDD name. */
export type InvoiceLine = 'reward' | 'bonus' | 'collateral' | 'netPayout' | 'balance'

export interface InvoiceRow {
  label: string
  value: string
  tone?: string
  /** Set on the five money lines; absent on ETA and the pyrrhic note. */
  line?: InvoiceLine
}

export interface InvoiceInput {
  /** The stored priced outcome, or null before one exists. */
  outcome: MissionOutcome | null
  /** `appStore.credits` after this Debrief's apply (new balance). */
  credits: number
  /** Contract ETA in days, shown on a win; null when the contract is unknown. */
  etaDays: number | null
  /** From `debriefFlags`: print the PYRRHIC note. */
  pyrrhicNote: boolean
}

function signed(sign: '+' | '-', n: number): string {
  return n > 0 ? sign + fmt(n) + ' CR' : '0 CR'
}

/**
 * Build the invoice tail of the Debrief: Reward, Collateral, optional bonus,
 * ETA (win), net payout, pyrrhic note, account balance — in that order.
 * Collateral and net payout come from Economy's pricing helpers; nothing is
 * priced here. Without an outcome only payout (0 CR) and balance print.
 */
export function debriefInvoiceRows(input: InvoiceInput): InvoiceRow[] {
  const { outcome, credits, etaDays, pyrrhicNote } = input
  const rows: InvoiceRow[] = []
  const paid = outcome ? netPayout(outcome) : 0
  if (outcome) {
    const fine = collateralFine(outcome)
    rows.push({ label: 'CONTRACT VALUE', value: fmt(outcome.reward) + ' CR', line: 'reward' })
    rows.push({
      label: 'COLLATERAL PENALTY',
      value: signed('-', fine),
      tone: fine > 0 ? 'red' : undefined,
      line: 'collateral',
    })
    rows.push({
      label: 'OPTIONAL BONUS',
      value: signed('+', outcome.bonus),
      tone: outcome.bonus > 0 ? 'teal' : undefined,
      line: 'bonus',
    })
    if (outcome.won && etaDays !== null) {
      rows.push({ label: 'CONTRACT ETA', value: '+' + etaDays + ' DAYS ELAPSED', tone: 'amber' })
    }
  }
  rows.push({
    label: 'PAYOUT',
    value: signed('+', paid),
    tone: paid > 0 ? 'teal' : 'red',
    line: 'netPayout',
  })
  if (pyrrhicNote) {
    rows.push({ label: 'NOTE', value: 'PYRRHIC — SQUAD LOST // CAMPAIGN FAILED', tone: 'red' })
  }
  rows.push({ label: 'ACCOUNT BALANCE', value: fmt(credits) + ' CR', tone: 'amber', line: 'balance' })
  return rows
}
