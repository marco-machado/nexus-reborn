import { describe, expect, it } from 'vitest'
import { holderText, kiaCostRows, sectorMoveRows } from './debriefWorld'

const r = (control: number, unrest: number, holder: 'nexus' | 'helix' | 'contested') => ({ control, unrest, holder })

describe('Debrief world and casualty rows (WN-021, IF-039)', () => {
  it('a win prints the result move, then the sector after the ETA days, naming a holder change', () => {
    const rows = sectorMoveRows({
      sector: 'na', before: r(68, 12, 'contested'), result: r(80.4, 4.2, 'nexus'), after: r(78, 9, 'nexus'), days: 4,
    })
    expect(rows).toEqual([
      { label: 'SECTOR // NORTH AMERICA', value: 'CONTROL 68% > 80% // UNREST 12% > 4%', tone: 'teal' },
      { label: 'AFTER +4 DAYS // NORTH AMERICA', value: 'CONTROL 78% // UNREST 9% // NOW NEXUS-HELD', tone: 'teal' },
    ])
  })

  it('a loss prints the drop in red and no ETA row', () => {
    const rows = sectorMoveRows({ sector: 'eu', before: r(60, 20, 'helix'), result: r(52, 28, 'helix'), after: r(52, 28, 'helix'), days: 0 })
    expect(rows).toEqual([{ label: 'SECTOR // EUROPE', value: 'CONTROL 60% > 52% // UNREST 20% > 28%', tone: 'red' }])
  })

  it('no move, no rows', () => {
    expect(sectorMoveRows(null)).toEqual([])
  })

  it('holder words', () => {
    expect(holderText(r(1, 1, 'nexus'))).toBe('NEXUS-HELD')
    expect(holderText(r(1, 1, 'contested'))).toBe('CONTESTED')
    expect(holderText(r(1, 1, 'helix'))).toBe('HELD BY HELIX CORP')
  })

  it('each KIA prints the experience lost and the roster left', () => {
    expect(kiaCostRows([{ codename: 'DART', xp: 3 }], 7, 8)).toEqual([
      { label: 'KIA // DART', value: '3 XP LOST // ROSTER 7/8', tone: 'red' },
    ])
  })
})
