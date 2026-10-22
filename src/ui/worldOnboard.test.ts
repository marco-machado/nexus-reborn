// IF-013: the four-row orientation card and the sector-panel Influence moment
// (World Network Core Rule 13, Interface AC27). Spec literals are pinned
// here, not read back from the module under test.
import { beforeEach, describe, expect, it } from 'vitest'
import {
  influenceMoment,
  influenceMomentCopy,
  orientationRows,
  startHere,
  startHereLine,
} from './worldOnboard'
import { influenceRefusal, useWorldStore } from '../state/worldStore'
import { MISSIONS } from '../game/data'
import { contractMission, visibleContracts } from '../game/contracts'
import type { GeneratedContract } from '../game/contracts'
import { cooldownKey } from '../game/influence'
import type { InfluenceActionId } from '../game/influence'
import { missionChance, missionMods } from '../game/missionParams'
import { missionLocked } from '../state/campaignStore'
import { INFLUENCE_MOMENT_ID, SEEN_IDS, WORLD_ONBOARD_ID } from '../game/tutorial'

const snapshot = useWorldStore.getState()
beforeEach(() => {
  useWorldStore.setState(snapshot, true)
})

describe('START HERE names the highest-Chance open contract (AC27)', () => {
  const op = (codename: string, chance: number, locked = false) => ({
    codename,
    city: codename + ' CITY',
    chance,
    locked,
  })

  it('picks the unlocked offer with the highest Chance and skips locked ones', () => {
    const ops = [op('GLASS VEIL', 95, true), op('RUST HAVEN', 70), op('G-1', 82), op('G-2', 60)]
    expect(startHere(ops)?.codename).toBe('G-1')
  })

  it('keeps list order on a tie', () => {
    expect(startHere([op('A', 80), op('B', 80)])?.codename).toBe('A')
  })

  it('returns null when nothing is open', () => {
    expect(startHere([])).toBeNull()
    expect(startHere([op('GLASS VEIL', 95, true)])).toBeNull()
  })

  it('does not compute Chance: the sentence prints the value it was handed', () => {
    expect(startHereLine(op('RUST HAVEN', 82))).toBe(
      'Start with RUST HAVEN in RUST HAVEN CITY, the open contract with the highest Chance (82%).',
    )
    expect(startHereLine(null)).not.toMatch(/marker/i)
  })

  it('at New Operation (intel 1) names an unlocked offer at the top Chance of the Scan list', () => {
    // The same list the Scan prints: the authored spine plus the visible
    // generated market (WN-020 opens Rust Haven at intel 1; EC-023 seeds one
    // Moderate offer). Chance comes from the owner (missionChance).
    const intelLevel = 1
    const s = useWorldStore.getState()
    const ops = [
      ...MISSIONS.map((m) => ({ m, gen: null as GeneratedContract | null })),
      ...visibleContracts(s.contracts, intelLevel).map((c) => ({ m: contractMission(c), gen: c })),
    ].map(({ m }) => ({
      codename: m.codename,
      city: m.city,
      chance: missionChance(m, missionMods(m, s.sectors[m.sector], 'standard'), 0),
      locked: missionLocked(m, intelLevel),
    }))
    const target = startHere(ops)
    expect(target).not.toBeNull()
    expect(target!.locked).toBe(false)
    const best = Math.max(...ops.filter((o) => !o.locked).map((o) => o.chance))
    expect(target!.chance).toBe(best)
    // Glass Veil and Hollow Crown are locked at intel 1 and never named.
    expect(['GLASS VEIL', 'HOLLOW CROWN']).not.toContain(target!.codename)
  })
})

describe('the card holds four rows and no Influence or Research row (AC27)', () => {
  const rows = orientationRows({ codename: 'RUST HAVEN', city: 'DETROIT', chance: 82, locked: false })

  it('is THE JOB, START HERE, STRATEGIC TIME and the four numbers, in that order', () => {
    expect(rows.map((r) => r.title)).toEqual([
      'THE JOB',
      'START HERE',
      'STRATEGIC TIME',
      'THE FOUR NUMBERS',
    ])
    expect(rows).toHaveLength(4)
  })

  it('carries no Influence or Research row', () => {
    for (const r of rows) {
      expect(r.title).not.toMatch(/INFLUENCE|RESEARCH/)
      for (const line of r.lines) expect(line).not.toMatch(/Influence|Research|Stabilize|Lobby|Expedite/)
    }
  })

  it('states Nexus-held Tax eligibility in THE JOB', () => {
    expect(rows[0].lines.join(' ')).toMatch(/Nexus-held/)
    expect(rows[0].lines.join(' ')).toMatch(/North America pays/)
  })

  it('names the START HERE contract and its Chance', () => {
    expect(rows[1].lines.join(' ')).toContain('RUST HAVEN')
    expect(rows[1].lines.join(' ')).toContain('82%')
    expect(rows[1].lines.join(' ')).toMatch(/Pause/)
  })

  it('identifies Pause and Clock speed as control over strategic time', () => {
    expect(rows[2].lines.join(' ')).toMatch(/Pause and Clock speed control strategic time/)
  })

  it('the four numbers are Control, Unrest, Tax yield and Garrison condition, one line each', () => {
    expect(rows[3].lines).toHaveLength(4)
    expect(rows[3].lines[0]).toMatch(/^CONTROL:/)
    expect(rows[3].lines[1]).toMatch(/^UNREST:/)
    expect(rows[3].lines[2]).toMatch(/^TAX YIELD:/)
    expect(rows[3].lines[3]).toMatch(/^GARRISON CONDITION:/)
  })

  it('never onboards "click the marker"', () => {
    for (const r of rows) for (const line of r.lines) expect(line).not.toMatch(/marker/i)
  })
})

function contract(sector: GeneratedContract['sector']): GeneratedContract {
  return {
    id: 'g-test', createdT: 0, expiresAtT: 10 * 86400, sector, cityId: 'x', district: 1,
    type: 'SABOTAGE', client: 'helix',
    threat: 'MODERATE', reward: 1000, seed: 1, priority: false,
    expedited: false,
  }
}

// The trigger bound to the owner's refusal on one focused sector, as the
// sector panel binds it.
function trigger(
  s: { influence: number; cooldowns: Record<string, number>; contracts: GeneratedContract[]; t: number },
  sector: 'eu' | 'na' | 'an',
): InfluenceActionId | null {
  return influenceMoment((action) => influenceRefusal(s, sector, action))
}

describe('the Influence moment fires on influenceRefusal === null only', () => {
  const opening = { influence: 0, cooldowns: {}, contracts: [], t: 0 }

  it('is silent at the opening 0 points: Stabilize and Lobby unaffordable, Expedite no target', () => {
    expect(influenceRefusal(opening, 'eu', 'stabilize')).toBe('unaffordable')
    expect(influenceRefusal(opening, 'eu', 'lobby')).toBe('unaffordable')
    expect(influenceRefusal(opening, 'eu', 'expedite')).toBe('no-target')
    expect(trigger(opening, 'eu')).toBeNull()
  })

  it('fires on a clean first win (+8): Stabilize is the affordable action', () => {
    expect(trigger({ ...opening, influence: 8 }, 'eu')).toBe('stabilize')
  })

  it('never fires for Antarctica (locked-sector), whatever the wallet holds', () => {
    expect(trigger({ ...opening, influence: 99, contracts: [contract('an')] }, 'an')).toBeNull()
  })

  it('is the owner refusal, not an influence >= cost compare', () => {
    // 99 points but every action refused on cooldown: no moment.
    const cooling = {
      ...opening,
      influence: 99,
      cooldowns: {
        [cooldownKey('eu', 'stabilize')]: 3600,
        [cooldownKey('eu', 'lobby')]: 3600,
        [cooldownKey('eu', 'expedite')]: 3600,
      },
    }
    expect(trigger(cooling, 'eu')).toBeNull()
    // Stabilize cooling, 10 points: Lobby is the first the owner clears.
    const stabCooling = { ...opening, influence: 10, cooldowns: { [cooldownKey('eu', 'stabilize')]: 3600 } }
    expect(trigger(stabCooling, 'eu')).toBe('lobby')
  })

  it('names the action, its cost and effect', () => {
    const copy = influenceMomentCopy('stabilize', '-12 UNREST OVER 6H')
    expect(copy.title).toBe('INFLUENCE // 1 STABILIZE')
    expect(copy.body).toContain('Affordable now: 8 PTS')
    expect(copy.body).toContain('-12 UNREST OVER 6H')
  })
})

describe('seen ids', () => {
  it('the moment carries its own standalone id in SEEN_IDS beside the card', () => {
    expect(INFLUENCE_MOMENT_ID).toBe('hint-influence')
    expect(SEEN_IDS).toContain(INFLUENCE_MOMENT_ID)
    expect(SEEN_IDS).toContain(WORLD_ONBOARD_ID)
    expect(SEEN_IDS.filter((id) => id === INFLUENCE_MOMENT_ID)).toHaveLength(1)
  })
})
