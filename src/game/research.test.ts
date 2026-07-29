import { describe, it, expect } from 'vitest'
import type { ResearchNode } from './research'
import {
  NODES,
  BRANCHES,
  BRANCH_IDS,
  AUG_SLOTS,
  nodeById,
  nodeTitle,
  branchDef,
  nodesOfBranch,
  benefitOf,
  benefitIsGain,
  squadWeapon,
  crewBonus,
  installedAugs,
} from './research'
import { WEAPONS } from './data'

const byId = new Map<string, ResearchNode>(NODES.map((n) => [n.id, n]))

describe('tree integrity', () => {
  it('has unique node ids', () => {
    expect(byId.size).toBe(NODES.length)
  })

  it('resolves every prerequisite to an existing node', () => {
    for (const n of NODES) {
      for (const need of n.needs) {
        expect(byId.has(need), `${n.id} needs missing node ${need}`).toBe(true)
        expect(need).not.toBe(n.id)
      }
    }
  })

  it('contains no prerequisite cycles', () => {
    const state = new Map<string, 'visiting' | 'done'>()
    const visit = (id: string): boolean => {
      const s = state.get(id)
      if (s === 'visiting') return true
      if (s === 'done') return false
      state.set(id, 'visiting')
      for (const need of byId.get(id)?.needs ?? []) if (visit(need)) return true
      state.set(id, 'done')
      return false
    }
    expect(NODES.some((n) => visit(n.id))).toBe(false)
  })

  it('prices every project with positive cost and hours', () => {
    for (const n of NODES) {
      expect(n.cost).toBeGreaterThan(0)
      expect(n.hours).toBeGreaterThan(0)
    }
  })

  it('keeps each node presentable: lines, glyph, blurb, grid cell', () => {
    for (const n of NODES) {
      expect(n.lines.length).toBeGreaterThan(0)
      expect(n.lines.every((l) => l.length > 0)).toBe(true)
      expect(n.glyph.length).toBeGreaterThan(0)
      expect(n.blurb.length).toBeGreaterThan(0)
      expect([0, 1, 2]).toContain(n.col)
      expect(n.row).toBeGreaterThanOrEqual(0)
      if (n.augSlot !== undefined) expect(AUG_SLOTS).toContain(n.augSlot)
    }
  })

  it('gives every node at least one well formed effect', () => {
    for (const n of NODES) {
      expect(n.effects.length).toBeGreaterThan(0)
      for (const e of n.effects) {
        if (e.target === 'crew') {
          expect(Number.isFinite(e.add)).toBe(true)
          expect(e.add).not.toBe(0)
        } else {
          expect(e.weapon === 'all' || WEAPONS[e.weapon] !== undefined).toBe(true)
          const hasMul = e.mul !== undefined
          const hasAdd = e.add !== undefined
          expect(hasMul !== hasAdd, `${n.id} effect must set exactly one of mul/add`).toBe(true)
          if (hasMul) expect(e.mul).toBeGreaterThan(0)
          if (hasAdd) expect(e.add).not.toBe(0)
        }
      }
    }
  })

  it('assigns every node to a listed branch, partitioning the tree', () => {
    expect(BRANCHES.map((b) => b.id)).toEqual(BRANCH_IDS)
    for (const n of NODES) expect(BRANCH_IDS).toContain(n.branch)
    const total = BRANCH_IDS.reduce((sum, id) => sum + nodesOfBranch(id).length, 0)
    expect(total).toBe(NODES.length)
    for (const id of BRANCH_IDS) {
      expect(nodesOfBranch(id).every((n) => n.branch === id)).toBe(true)
    }
  })
})

describe('lookups', () => {
  it('nodeById resolves and throws', () => {
    expect(nodeById('b-propellants').branch).toBe('ballistics')
    expect(() => nodeById('nope')).toThrow('unknown research node nope')
  })

  it('branchDef resolves each listed branch', () => {
    for (const id of BRANCH_IDS) expect(branchDef(id).id).toBe(id)
  })

  it('nodeTitle prefers the full name and falls back to joined lines', () => {
    expect(nodeTitle(nodeById('c-accelerator'))).toBe('NEURAL ACCELERATOR MK II')
    expect(nodeTitle(nodeById('b-propellants'))).toBe('ADV. PROPELLANTS')
  })
})

describe('squadWeapon', () => {
  it('returns the base weapon for an empty done set', () => {
    expect(squadWeapon('assault', [])).toEqual(WEAPONS.assault)
    expect(squadWeapon('longrifle', [])).toEqual(WEAPONS.longrifle)
  })

  it('ignores unknown ids and projects that do not touch the weapon', () => {
    expect(squadWeapon('assault', ['no-such-node'])).toEqual(WEAPONS.assault)
    // b-propellants only moves the assault rifle.
    expect(squadWeapon('pistol', ['b-propellants'])).toEqual(WEAPONS.pistol)
    // c-synaptic is a crew effect.
    expect(squadWeapon('assault', ['c-synaptic'])).toEqual(WEAPONS.assault)
  })

  it('applies a multiplier to the named weapon', () => {
    const w = squadWeapon('assault', ['b-propellants'])
    expect(w.damage).toBeCloseTo(11 * 1.12, 10)
    expect(w.range).toBe(WEAPONS.assault.range)
  })

  it('applies all-weapon effects to any weapon', () => {
    const w = squadWeapon('pistol', ['b-coating'])
    expect(w.spread).toBeCloseTo(0.03 * 0.9, 10)
  })

  it('adds flat magazine rounds as whole numbers and compounds reload', () => {
    const smg = squadWeapon('smg', ['b-caseless'])
    expect(smg.magazine).toBe(50)
    expect(smg.reload).toBeCloseTo(1.9 * 0.88, 10)
    // The magazine add names the smg only; the reload part is all-weapon.
    const rifle = squadWeapon('assault', ['b-caseless'])
    expect(rifle.magazine).toBe(30)
    expect(rifle.reload).toBeCloseTo(1.7 * 0.88, 10)
  })

  it('stacks every completed project', () => {
    const w = squadWeapon('assault', ['b-propellants', 'b-sabot'])
    expect(w.damage).toBeCloseTo(11 * 1.12 * 1.15, 10)
    const smg = squadWeapon('smg', ['b-caseless', 'c-reflex'])
    expect(smg.reload).toBeCloseTo(1.9 * 0.88 * 0.85, 10)
  })

  it('never mutates the base weapon table', () => {
    squadWeapon('assault', ['b-propellants', 'b-coating', 'b-sabot'])
    expect(WEAPONS.assault.damage).toBe(11)
    expect(WEAPONS.assault.spread).toBe(0.045)
  })
})

describe('crewBonus', () => {
  it('is zero for an empty done set and ignores unknown ids', () => {
    expect(crewBonus([])).toEqual({ maxHp: 0, speed: 0 })
    expect(crewBonus(['no-such-node', 'b-propellants'])).toEqual({ maxHp: 0, speed: 0 })
  })

  it('sums the crew effects of completed projects', () => {
    expect(crewBonus(['c-synaptic'])).toEqual({ maxHp: 0, speed: 0.2 })
    expect(crewBonus(['c-pain'])).toEqual({ maxHp: 14, speed: 0 })
    const both = crewBonus(['c-synaptic', 'c-cache'])
    expect(both.maxHp).toBe(18)
    expect(both.speed).toBeCloseTo(0.55, 10)
  })

  it('picks the crew part out of a mixed effect list', () => {
    // c-accelerator carries a weapon cooldown mul and a speed add.
    const b = crewBonus(['c-accelerator'])
    expect(b.speed).toBeCloseTo(0.15, 10)
    expect(b.maxHp).toBe(0)
  })
})

describe('benefit lines', () => {
  it('prints crew effects with sign and field name for every operative', () => {
    expect(benefitOf({ target: 'crew', field: 'maxHp', add: 14 })).toEqual({
      line: '+14 MAX HP',
      scope: 'EVERY OPERATIVE',
    })
    expect(benefitOf({ target: 'crew', field: 'speed', add: 0.2 })).toEqual({
      line: '+0.20 MOVE SPEED',
      scope: 'EVERY OPERATIVE',
    })
  })

  it('prints weapon multipliers as percentages with the weapon as scope', () => {
    expect(benefitOf({ target: 'weapon', weapon: 'assault', field: 'damage', mul: 1.12 })).toEqual({
      line: '+12% DAMAGE',
      scope: WEAPONS.assault.name,
    })
    expect(benefitOf({ target: 'weapon', weapon: 'all', field: 'spread', mul: 0.9 })).toEqual({
      line: '-10% SPREAD',
      scope: 'ALL SQUAD WEAPONS',
    })
  })

  it('prints flat weapon adds with a plus sign', () => {
    expect(benefitOf({ target: 'weapon', weapon: 'smg', field: 'magazine', add: 10 })).toEqual({
      line: '+10 MAGAZINE',
      scope: WEAPONS.smg.name,
    })
  })

  it('marks lower-is-better fields as gains when they shrink', () => {
    expect(benefitIsGain({ target: 'weapon', weapon: 'all', field: 'spread', mul: 0.9 })).toBe(true)
    expect(benefitIsGain({ target: 'weapon', weapon: 'all', field: 'reload', mul: 1.1 })).toBe(false)
    expect(benefitIsGain({ target: 'weapon', weapon: 'assault', field: 'damage', mul: 1.12 })).toBe(true)
    expect(benefitIsGain({ target: 'weapon', weapon: 'smg', field: 'magazine', add: 10 })).toBe(true)
    expect(benefitIsGain({ target: 'crew', field: 'maxHp', add: -5 })).toBe(false)
  })

  it('marks every shipped node effect as a gain', () => {
    for (const n of NODES) {
      for (const e of n.effects) {
        expect(benefitIsGain(e), `${n.id} carries a non-gain effect`).toBe(true)
      }
    }
  })
})

describe('installedAugs', () => {
  it('returns every bay empty for an empty done set', () => {
    const augs = installedAugs([])
    expect(augs.map((a) => a.slot)).toEqual(AUG_SLOTS)
    expect(augs.every((a) => a.node === null)).toBe(true)
  })

  it('fills a bay with the last completed project for that slot', () => {
    const first = installedAugs(['c-interface', 'c-accelerator'])
    expect(first.find((a) => a.slot === 'NEURAL')?.node?.id).toBe('c-accelerator')
    const reversed = installedAugs(['c-accelerator', 'c-interface'])
    expect(reversed.find((a) => a.slot === 'NEURAL')?.node?.id).toBe('c-interface')
    expect(reversed.find((a) => a.slot === 'LEGS')?.node).toBeNull()
  })
})
