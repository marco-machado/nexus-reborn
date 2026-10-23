// Pure Debrief rows for what the contract moved on the World Network and what
// a death cost (WN-021 / IF-039, CD-PLAYTEST 2026-10-23: violence prints on
// the invoice, casualties and the world included). The readings come from
// state/debrief.ts; this file only words them.
import { CORPS } from '../game/atlas'
import { sectorDef } from '../game/atlas'
import type { SectorMove, SectorReading } from '../state/debrief'

export interface DebriefTextRow {
  label: string
  value: string
  tone?: 'teal' | 'red'
}

function pct(n: number): string {
  return Math.round(n) + '%'
}

/** `NEXUS-HELD`, `CONTESTED` or `HELD BY <CORP>`. */
export function holderText(r: SectorReading): string {
  if (r.holder === 'nexus') return 'NEXUS-HELD'
  if (r.holder === 'contested') return 'CONTESTED'
  return 'HELD BY ' + CORPS[r.holder].name
}

/**
 * The sector the contract sat in: the result's own move (t0 → write-back),
 * then, after a win, where the sector stands once the ETA days have run.
 */
export function sectorMoveRows(move: SectorMove | null): DebriefTextRow[] {
  if (!move) return []
  const name = sectorDef(move.sector).name
  const rows: DebriefTextRow[] = [
    {
      label: 'SECTOR // ' + name,
      value:
        'CONTROL ' + pct(move.before.control) + ' > ' + pct(move.result.control) +
        ' // UNREST ' + pct(move.before.unrest) + ' > ' + pct(move.result.unrest),
      tone: move.result.control >= move.before.control ? 'teal' : 'red',
    },
  ]
  if (move.days > 0) {
    const flipped = move.after.holder !== move.before.holder
    rows.push({
      label: 'AFTER +' + move.days + ' DAYS // ' + name,
      value:
        'CONTROL ' + pct(move.after.control) + ' // UNREST ' + pct(move.after.unrest) +
        ' // ' + (flipped ? 'NOW ' : '') + holderText(move.after),
      tone: move.after.holder === 'nexus' ? 'teal' : undefined,
    })
  } else if (move.result.holder !== move.before.holder) {
    rows.push({ label: 'HOLDER // ' + name, value: 'NOW ' + holderText(move.result) })
  }
  return rows
}

/** One row per operative killed: what the house lost with them. */
export function kiaCostRows(
  kia: ReadonlyArray<{ codename: string; xp: number }>,
  rosterLeft: number,
  rosterCap: number,
): DebriefTextRow[] {
  return kia.map((k) => ({
    label: 'KIA // ' + k.codename,
    value: k.xp + ' XP LOST // ROSTER ' + rosterLeft + '/' + rosterCap,
    tone: 'red' as const,
  }))
}
