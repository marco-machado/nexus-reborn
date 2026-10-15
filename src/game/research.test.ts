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
  appliedNodeIds,
  wornNode,
  wornAugs,
  currentIssue,
  completedInBay,
  remaining,
} from './research'
import { WEAPONS } from './data'
import { generatedReward } from './contracts'
import { INITIAL_CREDITS } from '../state/appStore'

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
    expect(nodeTitle(nodeById('b-propellants'))).toBe('ADVANCED PROPELLANTS')
    expect(nodeTitle(nodeById('b-coating'))).toBe('BARREL WEAR COATING')
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

// RS-018 (TR-research-002): bases are read from the weapon-table owner
// (src/game/data.ts WEAPONS) at sample time, never pasted.
describe('weapon sampling from applied ids (RS-018)', () => {
  it('[Advanced Propellants, Tungsten Sabot] → assault damage = table base × 1.12 × 1.15', () => {
    const base = WEAPONS.assault.damage
    const w = squadWeapon('assault', ['b-propellants', 'b-sabot'])
    expect(w.damage).toBeCloseTo(base * 1.12 * 1.15, 12)
  })

  it('Caseless Ammo Feed only → smg magazine = round(table magazine + 10)', () => {
    const base = WEAPONS.smg.magazine
    const smg = squadWeapon('smg', ['b-caseless'])
    expect(smg.magazine).toBe(Math.round(base + 10))
    expect(Number.isInteger(smg.magazine)).toBe(true)
  })

  it('empty applied ids → every field of every weapon equals its table base', () => {
    for (const id of Object.keys(WEAPONS) as (keyof typeof WEAPONS)[]) {
      const w = squadWeapon(id, [])
      for (const field of Object.keys(WEAPONS[id]) as (keyof (typeof WEAPONS)[typeof id])[]) {
        expect(w[field]).toBe(WEAPONS[id][field])
      }
    }
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

describe('worn bays', () => {
  it('applies unslotted projects always and slotted projects only when worn', () => {
    const done = ['b-propellants', 'c-interface', 'c-accelerator']
    expect(appliedNodeIds(done, undefined)).toEqual(['b-propellants', 'c-accelerator'])
    expect(appliedNodeIds(done, { NEURAL: 'STOCK' })).toEqual(['b-propellants'])
    expect(appliedNodeIds(done, { NEURAL: 'c-interface' })).toEqual([
      'b-propellants',
      'c-interface',
    ])
    expect(wornNode(done, { NEURAL: 'c-interface' }, 'NEURAL')?.id).toBe('c-interface')
  })
})

// RS-014: appliedNodeIds = every completed unslotted id + the worn id per bay,
// in done order. Unpinned bays wear currentIssue; STOCK wears nothing; a pin
// wears that older completed project.
describe('appliedNodeIds for unpinned, stock and pinned bays', () => {
  const done = ['b-propellants', 'c-interface', 'c-accelerator']

  it('wears only Mk II in an unpinned Neural bay after Interface I then Mk II', () => {
    const applied = appliedNodeIds(['c-interface', 'c-accelerator'], undefined)
    expect(applied).toEqual(['c-accelerator'])
    expect(applied).not.toContain('c-interface')
  })

  it('applies Propellants and Mk II with Neural unpinned', () => {
    expect(appliedNodeIds(done, undefined)).toEqual(['b-propellants', 'c-accelerator'])
    expect(appliedNodeIds(done, {})).toEqual(['b-propellants', 'c-accelerator'])
  })

  it('applies Propellants only with Neural STOCK', () => {
    expect(appliedNodeIds(done, { NEURAL: 'STOCK' })).toEqual(['b-propellants'])
  })

  it('applies Propellants and Interface I with Neural pinned to Interface I', () => {
    expect(appliedNodeIds(done, { NEURAL: 'c-interface' })).toEqual([
      'b-propellants',
      'c-interface',
    ])
  })

  it('keeps done order in the output', () => {
    const mixed = ['c-interface', 'b-propellants', 'c-synaptic', 'b-coating', 'k-swarm']
    expect(mixed.map((id) => byId.get(id)?.augSlot)).toEqual([
      'NEURAL',
      undefined,
      'CHEST',
      undefined,
      'LEGS',
    ])
    expect(appliedNodeIds(mixed, undefined)).toEqual(mixed)
    const pinned = ['c-accelerator', 'b-propellants', 'c-interface']
    expect(appliedNodeIds(pinned, { NEURAL: 'c-accelerator' })).toEqual([
      'c-accelerator',
      'b-propellants',
    ])
  })

  it('applies unslotted ids only when all four bays are STOCK', () => {
    const all = ['c-interface', 'b-propellants', 'c-synaptic', 'c-reflex', 'b-coating', 'k-swarm']
    expect(new Set(all.map((id) => byId.get(id)?.augSlot))).toEqual(
      new Set([...AUG_SLOTS, undefined]),
    )
    const stock = { NEURAL: 'STOCK', CHEST: 'STOCK', ARMS: 'STOCK', LEGS: 'STOCK' } as const
    expect(appliedNodeIds(all, undefined)).toEqual(all)
    expect(appliedNodeIds(all, stock)).toEqual(['b-propellants', 'b-coating'])
  })
})

// RS-015 (TR-research-002 / TR-research-003): four bays, at most one worn
// slotted project per bay; pins hold an older completed project; any pin that
// is not in done, belongs to another bay, or names current issue / a tie
// winner falls through to currentIssue.
describe('pin and bay edges (RS-015)', () => {
  it('lists Neural, Chest, Arms, Legs and wears at most one completed slotted project per bay', () => {
    expect(AUG_SLOTS).toEqual(['NEURAL', 'CHEST', 'ARMS', 'LEGS'])
    // Every slotted catalog project names one of those four bays.
    for (const n of NODES) {
      if (n.augSlot !== undefined) expect(AUG_SLOTS).toContain(n.augSlot)
    }
    // Every slotted project completed: each bay has several, wears one.
    const done = NODES.map((n) => n.id)
    for (const pins of [undefined, { NEURAL: 'c-interface' }] as const) {
      const worn = wornAugs(done, pins)
      expect(worn.map((w) => w.slot)).toEqual(AUG_SLOTS)
      const applied = appliedNodeIds(done, pins)
      for (const slot of AUG_SLOTS) {
        expect(completedInBay(done, slot).length).toBeGreaterThanOrEqual(1)
        const inBay = applied.filter((id) => byId.get(id)?.augSlot === slot)
        expect(inBay.length).toBeLessThanOrEqual(1)
        const node = worn.find((w) => w.slot === slot)?.node
        expect(inBay).toEqual(node ? [node.id] : [])
      }
    }
  })

  it('a project is a blueprint: every operative may wear the same one', () => {
    const done = ['c-interface']
    const mara = wornNode(done, undefined, 'NEURAL')
    const hire = wornNode(done, {}, 'NEURAL')
    const pinned = wornNode(done, { NEURAL: 'c-interface' }, 'NEURAL')
    expect(mara?.id).toBe('c-interface')
    expect(hire).toBe(mara)
    expect(pinned).toBe(mara)
  })

  it('pinned to Interface I, Mk II completes: currentIssue is Mk II, the pinned bay still wears Interface I', () => {
    const pins = { NEURAL: 'c-interface' }
    const before = ['c-interface']
    expect(wornNode(before, pins, 'NEURAL')?.id).toBe('c-interface')
    const after = [...before, 'c-accelerator']
    expect(currentIssue(after, 'NEURAL')?.id).toBe('c-accelerator')
    expect(wornNode(after, pins, 'NEURAL')?.id).toBe('c-interface')
    // A new completion updates unpinned bays only.
    expect(wornNode(after, undefined, 'NEURAL')?.id).toBe('c-accelerator')
    expect(appliedNodeIds(after, pins)).toEqual(['c-interface'])
  })

  it('a pin naming an id not in done falls through to currentIssue', () => {
    const done = ['c-interface']
    expect(byId.get('c-accelerator')?.augSlot).toBe('NEURAL')
    expect(wornNode(done, { NEURAL: 'c-accelerator' }, 'NEURAL')?.id).toBe('c-interface')
    expect(wornNode(done, { NEURAL: 'no-such-project' }, 'NEURAL')?.id).toBe('c-interface')
    expect(appliedNodeIds(done, { NEURAL: 'c-accelerator' })).toEqual(['c-interface'])
  })

  it('a pin naming a completed project of another bay falls through to currentIssue', () => {
    const done = ['c-interface', 'c-synaptic']
    expect(byId.get('c-synaptic')?.augSlot).toBe('CHEST')
    expect(wornNode(done, { NEURAL: 'c-synaptic' }, 'NEURAL')?.id).toBe('c-interface')
    // The Chest project is still worn in its own bay, once.
    expect(appliedNodeIds(done, { NEURAL: 'c-synaptic' })).toEqual(['c-interface', 'c-synaptic'])
  })

  it('a pin naming an unslotted Ballistics project falls through to currentIssue', () => {
    const done = ['b-propellants', 'c-interface']
    expect(wornNode(done, { NEURAL: 'b-propellants' }, 'NEURAL')?.id).toBe('c-interface')
  })

  it('falls through to none when the bay has no slotted completion', () => {
    expect(wornNode([], { NEURAL: 'c-interface' }, 'NEURAL')).toBeNull()
    expect(wornNode(['b-propellants'], { NEURAL: 'c-accelerator' }, 'NEURAL')).toBeNull()
  })

  it('edge: a pin to current issue or to an equal-endT tie winner resolves to currentIssue', () => {
    const done = ['c-interface', 'c-accelerator']
    expect(wornNode(done, { NEURAL: 'c-accelerator' }, 'NEURAL')).toBe(currentIssue(done, 'NEURAL'))
    // Same-tick Neural tie appended in house order: Sensor Fusion Array issues.
    const tie = ['c-interface', 'k-sensor']
    expect(currentIssue(tie, 'NEURAL')?.id).toBe('k-sensor')
    expect(wornNode(tie, { NEURAL: 'k-sensor' }, 'NEURAL')).toBe(currentIssue(tie, 'NEURAL'))
    // The tie non-issue stays pinnable.
    expect(wornNode(tie, { NEURAL: 'c-interface' }, 'NEURAL')?.id).toBe('c-interface')
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

  // RS-012: currentIssue is the last same-bay entry of done. For an equal-endT
  // tie, sync appends in BRANCH_IDS house order, so the later house issues and
  // the earlier one stays an older completed project that can still be pinned.
  it('issues the later house for a same-bay tie appended in house order', () => {
    expect(BRANCH_IDS.indexOf('cybernetics')).toBeLessThan(BRANCH_IDS.indexOf('control'))
    expect(currentIssue(['c-cache', 'k-adaptive'], 'NEURAL')?.id).toBe('k-adaptive')
    expect(currentIssue(['c-interface', 'k-sensor'], 'NEURAL')?.id).toBe('k-sensor')
    expect(wornNode(['c-interface', 'k-sensor'], { NEURAL: 'c-interface' }, 'NEURAL')?.id).toBe(
      'c-interface',
    )
  })
})

// RS-013: currentIssue is the latest completed project in a bay, by done order.
describe('currentIssue by bay', () => {
  it('never returns an unslotted Ballistics project for any bay', () => {
    expect(byId.get('b-propellants')?.augSlot).toBeUndefined()
    const done = ['b-propellants']
    for (const slot of AUG_SLOTS) {
      expect(currentIssue(done, slot)).toBeNull()
    }
    const mixed = ['c-interface', 'b-propellants']
    for (const slot of AUG_SLOTS) {
      expect(currentIssue(mixed, slot)?.id).not.toBe('b-propellants')
    }
  })

  it('issues the later Neural project by done order', () => {
    expect(currentIssue(['c-interface', 'c-accelerator'], 'NEURAL')?.id).toBe('c-accelerator')
    expect(currentIssue(['c-accelerator', 'c-interface'], 'NEURAL')?.id).toBe('c-interface')
  })

  it('returns none in every bay for an empty done', () => {
    for (const slot of AUG_SLOTS) {
      expect(currentIssue([], slot)).toBeNull()
    }
  })
})

describe('authored program sums', () => {
  // The design document's authored totals: 248,000 + 261,000 + 270,000 CR.
  const BRANCH_TOTALS: Record<string, number> = {
    ballistics: 248000,
    cybernetics: 261000,
    control: 270000,
  }

  it('sums each branch and the whole program to the authored figures', () => {
    let total = 0
    for (const b of BRANCH_IDS) {
      const sum = nodesOfBranch(b).reduce((acc, n) => acc + n.cost, 0)
      expect(sum, b + ' branch total').toBe(BRANCH_TOTALS[b])
      total += sum
    }
    expect(total).toBe(779000)
  })

  it('lists three laboratories with seven projects each, 21 in all', () => {
    expect(BRANCHES).toHaveLength(3)
    expect(BRANCHES.map((b) => b.name)).toEqual(['BALLISTICS', 'CYBERNETICS', 'CONTROL SYSTEMS'])
    for (const b of BRANCH_IDS) expect(nodesOfBranch(b), b).toHaveLength(7)
    expect(NODES).toHaveLength(21)
  })

  it('keeps Ballistics unslotted and every Cybernetics / Control Systems project a bay blueprint', () => {
    for (const n of NODES) {
      if (n.branch === 'ballistics') expect(n.augSlot, n.id).toBeUndefined()
      else expect(AUG_SLOTS, n.id).toContain(n.augSlot)
    }
  })

  it('runs every tier on the authored hour ladder: 2h, 4h, 8h, 14h by row', () => {
    const HOURS_BY_ROW: Record<number, number> = { 0: 2, 1: 4, 2: 8, 3: 14 }
    for (const n of NODES) {
      expect(n.hours, n.id + ' hours').toBe(HOURS_BY_ROW[n.row])
    }
  })

  it('keeps every prerequisite inside the branch and strictly above its tier', () => {
    for (const n of NODES) {
      for (const need of n.needs) {
        const p = byId.get(need)
        expect(p, n.id + ' needs unknown ' + need).toBeDefined()
        if (!p) continue
        expect(p.branch, n.id + ' crosses branches').toBe(n.branch)
        expect(p.row, n.id + ' prerequisite not in an earlier tier').toBeLessThan(n.row)
      }
    }
  })

  it('caps each branch with one node requiring both tier-3 projects', () => {
    for (const b of BRANCH_IDS) {
      const caps = nodesOfBranch(b).filter((n) => n.row === 3)
      expect(caps).toHaveLength(1)
      const tier3 = nodesOfBranch(b)
        .filter((n) => n.row === 2)
        .map((n) => n.id)
        .sort()
      expect([...caps[0].needs].sort()).toEqual(tier3)
    }
  })
})

describe('effect stacking order', () => {
  it('folds same-stat weapon projects in completion order', () => {
    // Three projects all shrink spread. The fold runs left to right down the
    // done list, so the expectation is the explicit sequential product.
    const done = ['b-coating', 'b-rail', 'k-targeting']
    let expected = WEAPONS.assault.spread
    for (const mul of [0.9, 0.85, 0.88]) expected *= mul
    expect(squadWeapon('assault', done).spread).toBeCloseTo(expected, 12)
  })

  it('yields the same stats when pure multipliers complete in another order', () => {
    // Every shipped same-field pair is multiplicative, so completion order
    // changes the fold sequence but never the deployed number.
    const done = ['b-coating', 'b-rail', 'k-targeting', 'b-propellants', 'b-sabot']
    const reversed = [...done].reverse()
    const a = squadWeapon('assault', done)
    const b = squadWeapon('assault', reversed)
    expect(b.spread).toBeCloseTo(a.spread, 12)
    expect(b.damage).toBeCloseTo(a.damage, 12)
    expect(b.reload).toBeCloseTo(a.reload, 12)
  })

  it('sums crew projects identically in either completion order', () => {
    const done = ['c-synaptic', 'k-swarm', 'c-pain', 'k-threat']
    const a = crewBonus(done)
    const b = crewBonus([...done].reverse())
    expect(a).toEqual(b)
    expect(a.speed).toBeCloseTo(0.2 + 0.25, 12)
    expect(a.maxHp).toBe(14 + 12)
  })
})

describe('program fundability gap (GDD research AC, TR-research-002)', () => {
  // GDD §6 Credits row: one clean pass of the three authored contracts
  // (85k + 62k + 9k + 41k + 6k). A derived design figure with no code owner.
  const AUTHORED_CLEAN_PASS = 203000
  const program = NODES.reduce((acc, n) => acc + n.cost, 0)
  const gap = program - INITIAL_CREDITS - AUTHORED_CLEAN_PASS
  // Minimum generated offer: Moderate, u = 0, not initially priority, from the
  // contracts reward oracle rather than a pasted literal.
  const minWin = generatedReward('MODERATE', 0, false)

  it('reads the opening Credits and the minimum generated reward from their owners', () => {
    expect(INITIAL_CREDITS).toBe(128450)
    expect(minWin).toBe(30500)
  })

  it('leaves a 447,550 CR gap after opening Credits and one authored pass', () => {
    expect(gap).toBe(447550)
  })

  it('funds the gap with 15 minimum-reward generated wins, not 14', () => {
    expect(15 * minWin).toBe(457500)
    expect(15 * minWin).toBeGreaterThanOrEqual(gap)
    expect(14 * minWin).toBe(427000)
    expect(14 * minWin).toBeLessThan(gap)
  })
})

// RS-006 / TR-research-005 (research.md Interface): Research exports no
// cancel, stop or abort-project method, including one that returns a refusal.
describe('no cancel verb (RS-006)', () => {
  it('src/game/research exports no cancel, stop or abort-project name', async () => {
    const mod = await import('./research')
    const names = Object.keys(mod)
    expect(names.length).toBeGreaterThan(0)
    for (const name of names) expect(name).not.toMatch(/cancel|stop|abort/i)
  })
})

// RS-009 / research.md Formulas: the remaining oracle. Querying it is not a
// screen paint; none collapses not-active, researched and past-endT.
describe('remaining(run, t) oracle', () => {
  const run = { id: 'b-propellants', startedT: 0, endT: 7200 }

  it('is endT - t strategic seconds for an active run, not the catalog duration', () => {
    expect(remaining(run, 1000)).toBe(6200)
    expect(remaining(run, 1000)).not.toBe(nodeById('b-propellants').hours * 3600)
  })

  it('is none with no active run (idle lab, researched project): no countdown', () => {
    expect(remaining(null, 1000)).toBeNull()
    expect(remaining(undefined, 1000)).toBeNull()
  })

  it('is none, not 0, at t = endT and after endT before the matching sync', () => {
    expect(remaining(run, 7200)).toBeNull()
    expect(remaining(run, 7201)).toBeNull()
    expect(remaining(run, 1e9)).toBeNull()
  })

  it('has no max(0, ...) clamp and keeps fractional remainders positive', () => {
    expect(remaining(run, 7199)).toBe(1)
    expect(remaining(run, 7199.75)).toBe(0.25)
    // Before startedT the formula is still endT - t, not clamped to the span.
    expect(remaining(run, -100)).toBe(7300)
  })

  it('is none for a non-finite clock rather than painting a bogus value', () => {
    expect(remaining(run, Number.NaN)).toBeNull()
  })
})
