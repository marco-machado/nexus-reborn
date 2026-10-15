// Pure Debrief invoice rows (EC-022, TR-economy-007). Economy prices every
// figure and stores it on the outcome (appStore: priceOutcome, settleOutcome;
// ADR-0021 §4); this module only formats them. All five money lines print on
// every outcome, zeros included: a loss, a quiet replay and N = 0 never drop a
// line (GDD §10, Closed Q3 — one show-rule, no separate rule for zero rows).
// On an unpaid outcome (loss or quiet replay) Collateral and optional bonus
// keep their priced values but print dim with a NOT APPLIED tag, so they never
// read as money moved (GDD UI Requirements, Closed Q4).
import { collateralFine, isPaid, netPayout } from '../state/appStore'
import type { MissionOutcome } from '../state/appStore'
import { fmt } from './util'

/** The five invoice money lines, by GDD name. */
export type InvoiceLine = 'reward' | 'bonus' | 'collateral' | 'netPayout' | 'balance'

/** One Debrief row: a label, its formatted value, and an optional tone class. */
export interface InvoiceRow {
  label: string
  value: string
  /** CSS tone on the value: 'red', 'teal', 'amber' or 'dim' (unpaid priced line). */
  tone?: string
  /** Set on the five money lines; absent on ETA and the pyrrhic note. */
  line?: InvoiceLine
}

/** Everything the invoice needs; all of it is read from stores by the Debrief. */
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

/**
 * Suffix on Collateral and optional bonus when the outcome pays nothing. The
 * leading space and em dash are part of it, so it appends straight to a value.
 */
export const NOT_APPLIED = ' — NOT APPLIED'

/** `12,345 CR`; a non-finite figure prints `-- CR`, never `NaN CR`. */
function cr(n: number): string {
  return Number.isFinite(n) ? fmt(n) + ' CR' : '-- CR'
}

/** A signed money figure: `+n CR` / `-n CR` above zero, else `0 CR`. */
function signed(sign: '+' | '-', n: number): string {
  if (!Number.isFinite(n)) return '-- CR'
  return n > 0 ? sign + fmt(n) + ' CR' : '0 CR'
}

/** A priced line that may be unpaid: dim and tagged when unpaid, else `paidTone` above zero. */
function pricedRow(
  label: string,
  line: InvoiceLine,
  sign: '+' | '-',
  n: number,
  paid: boolean,
  paidTone: string,
): InvoiceRow {
  if (!paid) return { label, value: signed(sign, n) + NOT_APPLIED, tone: 'dim', line }
  return { label, value: signed(sign, n), tone: n > 0 ? paidTone : undefined, line }
}

/** Reward, Collateral, optional bonus and (on a win) ETA for a priced outcome. */
function outcomeRows(outcome: MissionOutcome, etaDays: number | null): InvoiceRow[] {
  const paid = isPaid(outcome)
  const rows: InvoiceRow[] = [
    { label: 'CONTRACT VALUE', value: cr(outcome.reward), line: 'reward' },
    pricedRow('COLLATERAL PENALTY', 'collateral', '-', collateralFine(outcome), paid, 'red'),
    pricedRow('OPTIONAL BONUS', 'bonus', '+', outcome.bonus, paid, 'teal'),
  ]
  if (outcome.won && etaDays !== null) {
    rows.push({ label: 'CONTRACT ETA', value: '+' + etaDays + ' DAYS ELAPSED', tone: 'amber' })
  }
  return rows
}

/**
 * Build the invoice tail of the Debrief: Reward, Collateral, optional bonus,
 * ETA (win), net payout, pyrrhic note, account balance — in that order.
 * Every figure is read from the stored priced outcome; nothing is priced here.
 * Without an outcome only payout (0 CR) and balance print.
 */
export function debriefInvoiceRows(input: InvoiceInput): InvoiceRow[] {
  const { outcome, credits, etaDays, pyrrhicNote } = input
  const payout = outcome ? netPayout(outcome) : 0
  const rows = outcome ? outcomeRows(outcome, etaDays) : []
  rows.push({
    label: 'PAYOUT',
    value: signed('+', payout),
    tone: payout > 0 ? 'teal' : 'red',
    line: 'netPayout',
  })
  if (pyrrhicNote) {
    rows.push({ label: 'NOTE', value: 'PYRRHIC — SQUAD LOST // CAMPAIGN FAILED', tone: 'red' })
  }
  rows.push({ label: 'ACCOUNT BALANCE', value: cr(credits), tone: 'amber', line: 'balance' })
  return rows
}
