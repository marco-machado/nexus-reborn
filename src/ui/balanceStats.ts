// The CAMPAIGN AGGREGATES rows of the Balance panel as plain data, so the
// zero-denominator rule is testable without a DOM. With no decided mission
// (won + lost = 0: an empty or abort-only log) win rate is not computed, and
// neither is any stat drawn from decided missions: each shows the no-data
// marker instead of 0, NaN or Infinity (GDD Formulas, win_rate). The abort
// count always shows. Abort rate is not listed: `abort_rate` has no defined
// denominator (GDD Open Question 4). Marker copy is Interface.
import type { BalanceAggregate } from '../state/telemetry'
import { fmt, mmss } from './util'

/** The no-data marker, matching the existing MEAN FIRST CONTACT dash. */
export const NO_DATA = '--'

export interface BalanceStatRow {
  label: string
  value: string
  tone?: string
}

function pct(rate: number): string {
  return Math.round(rate * 100) + '%'
}

export function balanceStatRows(agg: BalanceAggregate): BalanceStatRow[] {
  const decided = agg.decided > 0
  const rows: BalanceStatRow[] = [
    { label: 'MISSIONS', value: String(agg.missions) },
    agg.winRate === null
      ? { label: 'WIN RATE', value: NO_DATA }
      : { label: 'WIN RATE', value: pct(agg.winRate), tone: agg.winRate >= 0.5 ? 'teal' : 'red' },
    { label: 'ABORTS', value: String(agg.aborts), tone: agg.aborts > 0 ? 'amber' : undefined },
    {
      label: 'MEAN DURATION',
      value: agg.meanDurationSec === null ? NO_DATA : mmss(agg.meanDurationSec),
    },
    {
      label: 'MEAN FIRST CONTACT',
      value: agg.meanFirstContactSec === null ? NO_DATA : mmss(agg.meanFirstContactSec),
    },
    agg.collateralRate === null
      ? { label: 'COLLATERAL RATE', value: NO_DATA }
      : {
          label: 'COLLATERAL RATE',
          value: pct(agg.collateralRate),
          tone: agg.collateralRate > 0.5 ? 'red' : undefined,
        },
    { label: 'CIVILIANS HIT', value: decided ? String(agg.civiliansHitTotal) : NO_DATA },
    {
      label: 'OPERATIVES KIA',
      value: decided ? String(agg.kiaTotal) : NO_DATA,
      tone: agg.kiaTotal > 0 ? 'red' : undefined,
    },
    {
      label: 'MED / CELL USED',
      value: decided ? agg.medUsedTotal + ' / ' + agg.cellUsedTotal : NO_DATA,
    },
    {
      label: 'MEAN PAYOUT',
      value: agg.meanPayout === null ? NO_DATA : fmt(Math.round(agg.meanPayout)) + ' CR',
    },
    {
      label: 'TOTAL PAYOUT',
      value: decided ? fmt(agg.totalPayout) + ' CR' : NO_DATA,
      tone: decided ? 'teal' : undefined,
    },
    {
      label: 'TOTAL FINES',
      value: decided ? fmt(agg.totalFines) + ' CR' : NO_DATA,
      tone: agg.totalFines > 0 ? 'red' : undefined,
    },
  ]
  return rows
}
