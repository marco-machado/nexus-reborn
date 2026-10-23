// IF-004: Chance vs Risk chrome (Interface AC7) and World Network owner
// readouts (AC27). Spec literals are pinned here, not read back from the
// module under test.
import { beforeEach, describe, expect, it } from 'vitest'
import {
  briefOdds,
  eventToneClass,
  influenceActionsFor,
  influenceStatus,
  intelGate,
  lockReason,
  taxEligibilityLine,
  unrestTone,
  worldChance,
} from './worldChrome'
import {
  influenceRefusal,
  initialOwner,
  sectorReadout,
  taxEligible,
  useWorldStore,
} from '../state/worldStore'
import type { GeneratedContract } from '../game/contracts'
import { cooldownKey } from '../game/influence'
import { missionRisk } from '../game/forecast'

const snapshot = useWorldStore.getState()
beforeEach(() => {
  useWorldStore.setState(snapshot, true)
})

// One contract, two intel levels: the same Chance and the same deployment
// counts feed both surfaces.
const CHANCE = 64
const RISK = missionRisk({ patrols: 6, garrison: 4, civilians: 10 }, { enemyHpMul: 1, visionMul: 1 })

describe('Chance vs Risk chrome (AC7)', () => {
  it('World Network prints Chance at intel 1 and at intel 2', () => {
    // worldChance takes no intel input: the surface cannot switch.
    expect(worldChance(CHANCE)).toBe('CHANCE 64%')
  })

  it('Brief prints the Chance percentage at intel < 2', () => {
    for (const intel of [0, 1]) {
      const odds = briefOdds(intel, CHANCE, RISK)
      expect(odds.label).toBe('PROJECTED SUCCESS')
      expect(odds.value).toBe('64%')
    }
  })

  it('Brief prints Risk index bands at intel >= 2, never a percentage or a cap', () => {
    for (const intel of [2, 3]) {
      const odds = briefOdds(intel, CHANCE, RISK)
      expect(odds.label).toBe('RISK INDEX')
      expect(odds.value).toBe(RISK.index + ' // ' + RISK.band)
      expect(odds.value).not.toContain('%')
      expect(odds.value).not.toMatch(/\/\s*100|MAX|CAP/)
    }
  })

  it('a HIGH or SEVERE band is named in words, not only in red', () => {
    const odds = briefOdds(2, CHANCE, { index: 80, band: 'SEVERE' })
    expect(odds.tone).toBe('red')
    expect(odds.value).toBe('80 // SEVERE')
  })
})

describe('Tax printed vs paid (AC27)', () => {
  const owner = initialOwner()

  it('opening Europe prints a Tax figure but is not eligible to pay', () => {
    expect(sectorReadout('eu', snapshot.sectors.eu).taxYield).toBeGreaterThan(0)
    expect(taxEligible('eu', owner)).toBe(false)
    expect(taxEligibilityLine(false).text).toBe('NO // NOT NEXUS-HELD')
  })

  it('opening North America prints 4,080 CR / 24h and pays it', () => {
    expect(sectorReadout('na', snapshot.sectors.na).taxYield).toBe(4080)
    expect(taxEligible('na', owner)).toBe(true)
    expect(taxEligibilityLine(true).text).toBe('YES // NEXUS-HELD')
  })

  it('not paying prints dim, never Ledger Amber (living §12)', () => {
    expect(taxEligibilityLine(false).tone).toBe('dim')
    expect(taxEligibilityLine(true).tone).toBe('teal')
  })

  it('Antarctica is never eligible', () => {
    expect(taxEligible('an', owner)).toBe(false)
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

describe('Influence refusal reasons come from the owner (AC27)', () => {
  it('opening 0 points reads UNAFFORDABLE, not broken', () => {
    const s = { influence: 0, cooldowns: {}, contracts: [], t: 0 }
    expect(influenceRefusal(s, 'eu', 'stabilize')).toBe('unaffordable')
    expect(influenceStatus('unaffordable', false, 0)).toBe('UNAFFORDABLE')
  })

  it('a running cooldown reads COOLDOWN with hours left', () => {
    const s = { influence: 99, cooldowns: { [cooldownKey('eu', 'lobby')]: 5 * 3600 }, contracts: [], t: 0 }
    expect(influenceRefusal(s, 'eu', 'lobby')).toBe('cooldown')
    expect(influenceStatus('cooldown', false, 5)).toBe('COOLDOWN 5H')
  })

  it('Expedite with no open generated contract reads NO TARGET', () => {
    const s = { influence: 99, cooldowns: {}, contracts: [], t: 0 }
    expect(influenceRefusal(s, 'eu', 'expedite')).toBe('no-target')
    expect(influenceStatus('no-target', false, 0)).toBe('NO TARGET')
    expect(influenceRefusal({ ...s, contracts: [contract('eu')] }, 'eu', 'expedite')).toBeNull()
  })

  it('with several causes at once, the owner reports locked, then cooldown, then no target, then unaffordable', () => {
    // The opening board: 0 points and no generated contract in the sector.
    // Stabilize and Lobby read UNAFFORDABLE, Expedite reads NO TARGET (the
    // first-visit overlay teaches exactly this pair).
    const opening = { influence: 0, cooldowns: {}, contracts: [], t: 0 }
    expect(influenceRefusal(opening, 'eu', 'stabilize')).toBe('unaffordable')
    expect(influenceRefusal(opening, 'eu', 'lobby')).toBe('unaffordable')
    expect(influenceRefusal(opening, 'eu', 'expedite')).toBe('no-target')
    // A target but still 0 points: Expedite falls through to UNAFFORDABLE.
    expect(influenceRefusal({ ...opening, contracts: [contract('eu')] }, 'eu', 'expedite')).toBe('unaffordable')
    // Cooldown outranks no target and unaffordable.
    const cooling = { ...opening, cooldowns: { [cooldownKey('eu', 'expedite')]: 3600 } }
    expect(influenceRefusal(cooling, 'eu', 'expedite')).toBe('cooldown')
    // A locked sector outranks every other cause.
    const lockedCooling = { ...opening, cooldowns: { [cooldownKey('an', 'expedite')]: 3600 } }
    expect(influenceRefusal(lockedCooling, 'an', 'expedite')).toBe('locked-sector')
  })

  it('a locked sector reads SECTOR LOCKED and Antarctica offers no action', () => {
    const s = { influence: 99, cooldowns: {}, contracts: [], t: 0 }
    expect(influenceRefusal(s, 'an', 'stabilize')).toBe('locked-sector')
    expect(influenceStatus('locked-sector', false, 0)).toBe('SECTOR LOCKED')
    expect(influenceActionsFor('an')).toEqual([])
    expect(influenceActionsFor('na')).toEqual(['stabilize', 'lobby', 'expedite'])
  })

  it('a legal spend reads CLEAR, a running spend ACTIVE', () => {
    expect(influenceRefusal({ influence: 99, cooldowns: {}, contracts: [], t: 0 }, 'eu', 'stabilize')).toBeNull()
    expect(influenceStatus(null, false, 0)).toBe('CLEAR')
    expect(influenceStatus('cooldown', true, 3)).toBe('ACTIVE')
  })

  it('spendInfluence refuses exactly where the printed reason says it will', () => {
    useWorldStore.setState({ influence: 99, cooldowns: {}, contracts: [] })
    const before = useWorldStore.getState()
    useWorldStore.getState().spendInfluence('an', 'stabilize')
    expect(useWorldStore.getState()).toBe(before)
    useWorldStore.getState().spendInfluence('eu', 'expedite')
    expect(useWorldStore.getState()).toBe(before)

    useWorldStore.getState().spendInfluence('eu', 'stabilize')
    const after = useWorldStore.getState()
    expect(after.influence).toBe(91)
    expect(influenceRefusal(after, 'eu', 'stabilize')).toBe('cooldown')
    after.spendInfluence('eu', 'stabilize')
    expect(useWorldStore.getState()).toBe(after)

    useWorldStore.setState({ influence: 0, cooldowns: {} })
    const broke = useWorldStore.getState()
    broke.spendInfluence('na', 'lobby')
    expect(useWorldStore.getState()).toBe(broke)
  })
})

describe('Feed tone classes (Ledger Amber is price only, living §12)', () => {
  it('prints a saved amber event as a notice, not amber', () => {
    expect(eventToneClass('amber')).toBe('notice')
  })

  it('keeps red, green and dim', () => {
    expect(eventToneClass('red')).toBe('red')
    expect(eventToneClass('green')).toBe('green')
    expect(eventToneClass('dim')).toBe('dim')
  })
})

// IF-021: Unrest ink by state (owner 2026-10-23). Crisis wins over pressure.
describe('unrestTone (IF-021)', () => {
  it('calm Unrest prints Ink with the default bar', () => {
    expect(unrestTone(false, false)).toEqual({ ink: 'ink', bar: undefined })
  })
  it('past the pressure line: the notice tone', () => {
    expect(unrestTone(false, true)).toEqual({ ink: 'notice', bar: 'notice' })
  })
  it('in crisis: Red Hot, whether or not the pressure line is crossed', () => {
    expect(unrestTone(true, false)).toEqual({ ink: 'red', bar: 'red' })
    expect(unrestTone(true, true)).toEqual({ ink: 'red', bar: 'red' })
  })
})

// IF-017: the lock reason names the actual cause (P-03).
describe('lockReason (IF-017)', () => {
  it('a failed campaign reads CAMPAIGN LOST whatever the intel gate', () => {
    expect(lockReason(true, 1)).toBe('CAMPAIGN LOST')
    expect(lockReason(true, 2)).toBe('CAMPAIGN LOST')
  })
  it('otherwise the intel gate', () => {
    expect(lockReason(false, 2)).toBe('REQUIRES INTEL LVL 2')
    expect(intelGate(3)).toBe('REQUIRES INTEL LVL 3')
  })
})
