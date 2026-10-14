import { describe, expect, it } from 'vitest'
import { priceOutcome } from '../state/appStore'
import type { MissionOutcome, MissionResult } from '../state/appStore'
import { debriefInvoiceRows } from './debriefInvoice'
import type { InvoiceLine, InvoiceRow } from './debriefInvoice'

const C = 128450
const FIVE: InvoiceLine[] = ['reward', 'collateral', 'bonus', 'netPayout', 'balance']

function result(over: Partial<MissionResult>): MissionResult {
  return {
    applyKey: 1,
    won: true,
    kills: 0,
    casualties: 0,
    timeSec: 60,
    civiliansHit: 0,
    completedOptionalIds: [],
    deadIds: [],
    survivorHp: {},
    quietReplay: false,
    ...over,
  }
}

// Priced by Economy, as setOutcome stores it; the builder prices nothing.
function priced(over: Partial<MissionResult>, reward: number): MissionOutcome {
  return priceOutcome(result(over), { reward, bonusDefs: {} })
}

function lines(rows: InvoiceRow[]): Partial<Record<InvoiceLine, string>> {
  const out: Partial<Record<InvoiceLine, string>> = {}
  for (const r of rows) if (r.line) out[r.line] = r.value
  return out
}

function moneyLines(rows: InvoiceRow[]): InvoiceLine[] {
  return rows.flatMap((r) => (r.line ? [r.line] : []))
}

function build(outcome: MissionOutcome) {
  return debriefInvoiceRows({ outcome, credits: C, etaDays: 3, pyrrhicNote: false })
}

describe('debriefInvoiceRows (EC-022)', () => {
  it('AC1: a zero-priced invoice prints all five lines, each 0 CR but the balance', () => {
    const rows = build(priced({ won: true }, 0))
    expect(moneyLines(rows)).toEqual(FIVE)
    expect(lines(rows)).toEqual({
      reward: '0 CR',
      collateral: '0 CR',
      bonus: '0 CR',
      netPayout: '0 CR',
      balance: '128,450 CR',
    })
  })

  it('AC2: a loss prints stored Reward 85,000 CR, Collateral 10,000 CR and payout 0', () => {
    const rows = build(priced({ won: false, civiliansHit: 2 }, 85000))
    expect(moneyLines(rows)).toEqual(FIVE)
    expect(lines(rows)).toEqual({
      reward: '85,000 CR',
      collateral: '-10,000 CR',
      bonus: '0 CR',
      netPayout: '0 CR',
      balance: '128,450 CR',
    })
  })

  it('AC3: a quiet-replay win prints stored Reward 62,000 CR and payout 0', () => {
    const rows = build(priced({ won: true, quietReplay: true }, 62000))
    expect(moneyLines(rows)).toEqual(FIVE)
    expect(lines(rows)).toEqual({
      reward: '62,000 CR',
      collateral: '0 CR',
      bonus: '0 CR',
      netPayout: '0 CR',
      balance: '128,450 CR',
    })
  })

  it('AC4: a non-quiet win with N = 0 prints the Collateral 0 CR line', () => {
    const rows = build(priced({ won: true, civiliansHit: 0 }, 85000))
    expect(moneyLines(rows)).toEqual(FIVE)
    const v = lines(rows)
    expect(v.collateral).toBe('0 CR')
    expect(v.reward).toBe('85,000 CR')
    expect(v.netPayout).toBe('+85,000 CR')
  })

  it('prints Economy figures unchanged when they are non-zero', () => {
    const o = priceOutcome(result({ won: true, civiliansHit: 13, completedOptionalIds: ['opt'] }), {
      reward: 62000,
      bonusDefs: { opt: 9000 },
    })
    const v = lines(build(o))
    expect(v).toEqual({
      reward: '62,000 CR',
      collateral: '-62,000 CR',
      bonus: '+9,000 CR',
      netPayout: '+9,000 CR',
      balance: '128,450 CR',
    })
  })

  it('keeps ETA on a win and the pyrrhic note between payout and balance', () => {
    const rows = debriefInvoiceRows({
      outcome: priced({ won: true }, 85000),
      credits: C,
      etaDays: 3,
      pyrrhicNote: true,
    })
    expect(rows.map((r) => r.label)).toEqual([
      'CONTRACT VALUE',
      'COLLATERAL PENALTY',
      'OPTIONAL BONUS',
      'CONTRACT ETA',
      'PAYOUT',
      'NOTE',
      'ACCOUNT BALANCE',
    ])
  })

  it('omits ETA on a loss and prints only payout and balance without an outcome', () => {
    const loss = build(priced({ won: false }, 85000))
    expect(loss.some((r) => r.label === 'CONTRACT ETA')).toBe(false)
    const none = debriefInvoiceRows({ outcome: null, credits: C, etaDays: null, pyrrhicNote: false })
    expect(moneyLines(none)).toEqual(['netPayout', 'balance'])
  })

  it('labels are unique, so React row keys stay stable', () => {
    const rows = debriefInvoiceRows({
      outcome: priced({ won: true, civiliansHit: 1 }, 85000),
      credits: C,
      etaDays: 3,
      pyrrhicNote: true,
    })
    expect(new Set(rows.map((r) => r.label)).size).toBe(rows.length)
  })
})
