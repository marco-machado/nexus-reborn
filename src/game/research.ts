// CONTRACT FILE. The research tree: three branches of projects, what each one
// costs, how long it runs, and what it changes. Every node carries its effects
// as data, so the screen generates its benefit lines from the same values the
// mission applies and can never promise a change the game does not make.
import { WEAPONS } from './data'
import type { WeaponDef, WeaponId } from './types'

export type BranchId = 'ballistics' | 'cybernetics' | 'control'

export interface Branch {
  id: BranchId
  name: string
  sub: string
  lab: string
}

export const BRANCHES: Branch[] = [
  { id: 'ballistics', name: 'BALLISTICS', sub: 'WEAPONS DEVELOPMENT', lab: 'BALLISTICS LAB' },
  { id: 'cybernetics', name: 'CYBERNETICS', sub: 'HUMAN AUGMENTATION', lab: 'CYBERNETICS LAB' },
  { id: 'control', name: 'CONTROL SYSTEMS', sub: 'AUTOMATION & AI', lab: 'SYSTEMS LAB' },
]

export const BRANCH_IDS: BranchId[] = ['ballistics', 'cybernetics', 'control']

/* --------------------------------- effects -------------------------------- */

// Weapon fields a project may move. All six are numbers the simulation reads.
export type WeaponField = 'damage' | 'range' | 'magazine' | 'reload' | 'spread' | 'cooldown'
// Operative fields, applied to every deployed agent.
export type CrewField = 'maxHp' | 'speed'

export interface WeaponEffect {
  target: 'weapon'
  weapon: WeaponId | 'all'
  field: WeaponField
  mul?: number
  add?: number
}

export interface CrewEffect {
  target: 'crew'
  field: CrewField
  add: number
}

export type Effect = WeaponEffect | CrewEffect

const WEAPON_FIELD: Record<WeaponField, { label: string; lowerIsBetter: boolean }> = {
  damage: { label: 'DAMAGE', lowerIsBetter: false },
  range: { label: 'RANGE', lowerIsBetter: false },
  magazine: { label: 'MAGAZINE', lowerIsBetter: false },
  reload: { label: 'RELOAD TIME', lowerIsBetter: true },
  spread: { label: 'SPREAD', lowerIsBetter: true },
  cooldown: { label: 'FIRE DELAY', lowerIsBetter: true },
}

const CREW_FIELD: Record<CrewField, string> = {
  maxHp: 'MAX HP',
  speed: 'MOVE SPEED',
}

export type AugSlot = 'NEURAL' | 'CHEST' | 'ARMS' | 'LEGS'

export const AUG_SLOTS: AugSlot[] = ['NEURAL', 'CHEST', 'ARMS', 'LEGS']

export interface ResearchNode {
  id: string
  branch: BranchId
  // Label as drawn in the hex, one entry per line. Where the drawn label is
  // abbreviated to fit, full carries the name every other panel prints.
  lines: string[]
  full?: string
  glyph: string
  // Grid cell in the branch column: column 0 or 1, or 2 for the centered node.
  col: 0 | 1 | 2
  row: number
  needs: string[]
  cost: number
  // World hours the lab runs before the project completes.
  hours: number
  blurb: string
  effects: Effect[]
  // Augmentation bay the project fills, shown on the operative detail panel.
  augSlot?: AugSlot
}

export const NODES: ResearchNode[] = [
  /* ------------------------------ ballistics ------------------------------ */
  {
    id: 'b-propellants',
    branch: 'ballistics',
    lines: ['ADV.', 'PROPELLANTS'],
    glyph: 'rounds',
    col: 0,
    row: 0,
    needs: [],
    cost: 16000,
    hours: 2,
    blurb: 'A hotter burning charge in the standard rifle round, seated deeper to hold pressure.',
    effects: [{ target: 'weapon', weapon: 'assault', field: 'damage', mul: 1.12 }],
  },
  {
    id: 'b-coating',
    branch: 'ballistics',
    lines: ['BARREL WEAR', 'COATING'],
    glyph: 'barrel',
    col: 1,
    row: 0,
    needs: [],
    cost: 14000,
    hours: 2,
    blurb: 'A ceramic bore liner that holds rifling true through a full contract cycle.',
    effects: [{ target: 'weapon', weapon: 'all', field: 'spread', mul: 0.9 }],
  },
  {
    id: 'b-hypervelocity',
    branch: 'ballistics',
    lines: ['HYPERVELOCITY', 'CORE'],
    glyph: 'velocity',
    col: 0,
    row: 1,
    needs: ['b-propellants'],
    cost: 30000,
    hours: 4,
    blurb: 'A dense penetrator core for the marksman round, cut for flat flight at long range.',
    effects: [
      { target: 'weapon', weapon: 'longrifle', field: 'damage', mul: 1.18 },
      { target: 'weapon', weapon: 'longrifle', field: 'range', mul: 1.1 },
    ],
  },
  {
    id: 'b-caseless',
    branch: 'ballistics',
    lines: ['CASELESS', 'AMMO FEED'],
    glyph: 'feed',
    col: 1,
    row: 1,
    needs: ['b-coating'],
    cost: 26000,
    hours: 4,
    blurb: 'Caseless rounds drop the brass, so a magazine holds more and a reload runs shorter.',
    effects: [
      { target: 'weapon', weapon: 'smg', field: 'magazine', add: 10 },
      { target: 'weapon', weapon: 'all', field: 'reload', mul: 0.88 },
    ],
  },
  {
    id: 'b-rail',
    branch: 'ballistics',
    lines: ['RAIL', 'STABILIZATION'],
    glyph: 'rail',
    col: 0,
    row: 2,
    needs: ['b-hypervelocity'],
    cost: 44000,
    hours: 8,
    blurb: 'An active rail that counters muzzle rise between shots across the whole armoury.',
    effects: [{ target: 'weapon', weapon: 'all', field: 'spread', mul: 0.85 }],
  },
  {
    id: 'b-fragmentation',
    branch: 'ballistics',
    lines: ['SMART', 'FRAGMENTATION'],
    glyph: 'frag',
    col: 1,
    row: 2,
    needs: ['b-caseless'],
    cost: 42000,
    hours: 8,
    blurb: 'Breaching shot that fragments on a timer rather than on contact, so the spread bites deeper.',
    effects: [
      { target: 'weapon', weapon: 'shotgun', field: 'damage', mul: 1.22 },
      { target: 'weapon', weapon: 'shotgun', field: 'range', mul: 1.15 },
    ],
  },
  {
    id: 'b-sabot',
    branch: 'ballistics',
    lines: ['TUNGSTEN', 'SABOT'],
    glyph: 'sabot',
    col: 2,
    row: 3,
    needs: ['b-rail', 'b-fragmentation'],
    cost: 76000,
    hours: 14,
    blurb: 'A discarding sabot line in tungsten, machined for every calibre the squad carries.',
    effects: [{ target: 'weapon', weapon: 'all', field: 'damage', mul: 1.15 }],
  },

  /* ------------------------------ cybernetics ----------------------------- */
  {
    id: 'c-interface',
    branch: 'cybernetics',
    lines: ['NEURAL', 'INTERFACE I'],
    glyph: 'brain',
    col: 0,
    row: 0,
    needs: [],
    cost: 15000,
    hours: 2,
    blurb: 'A cortical link that puts the trigger on the same circuit as the intent to fire.',
    effects: [{ target: 'weapon', weapon: 'all', field: 'cooldown', mul: 0.92 }],
    augSlot: 'NEURAL',
  },
  {
    id: 'c-synaptic',
    branch: 'cybernetics',
    lines: ['SYNAPTIC', 'ENHANCEMENT'],
    glyph: 'synapse',
    col: 1,
    row: 0,
    needs: [],
    cost: 17000,
    hours: 2,
    blurb: 'Myelin scaffolding down the spine, cutting the lag between decision and stride.',
    effects: [{ target: 'crew', field: 'speed', add: 0.2 }],
    augSlot: 'CHEST',
  },
  {
    id: 'c-reflex',
    branch: 'cybernetics',
    lines: ['REFLEX', 'BOOSTER'],
    glyph: 'reflex',
    col: 0,
    row: 1,
    needs: ['c-interface'],
    cost: 28000,
    hours: 4,
    blurb: 'Servo assisted forearms that seat a fresh magazine without conscious thought.',
    effects: [{ target: 'weapon', weapon: 'all', field: 'reload', mul: 0.85 }],
    augSlot: 'ARMS',
  },
  {
    id: 'c-pain',
    branch: 'cybernetics',
    lines: ['PAIN', 'INHIBITOR'],
    glyph: 'pulse',
    col: 1,
    row: 1,
    needs: ['c-synaptic'],
    cost: 27000,
    hours: 4,
    blurb: 'A regulated block on the pain channel that keeps an operative working through a hit.',
    effects: [{ target: 'crew', field: 'maxHp', add: 14 }],
    augSlot: 'CHEST',
  },
  {
    id: 'c-accelerator',
    branch: 'cybernetics',
    lines: ['NEURAL ACCEL.', 'MK II'],
    full: 'NEURAL ACCELERATOR MK II',
    glyph: 'accel',
    col: 0,
    row: 2,
    needs: ['c-reflex'],
    cost: 48000,
    hours: 8,
    blurb: 'Second generation accelerator with adaptive signal routing and micro phase timing.',
    effects: [
      { target: 'weapon', weapon: 'all', field: 'cooldown', mul: 0.88 },
      { target: 'crew', field: 'speed', add: 0.15 },
    ],
    augSlot: 'NEURAL',
  },
  {
    id: 'c-weave',
    branch: 'cybernetics',
    lines: ['SUBDERMAL', 'WEAVE'],
    glyph: 'weave',
    col: 1,
    row: 2,
    needs: ['c-pain'],
    cost: 46000,
    hours: 8,
    blurb: 'A woven mesh under the skin that spreads an impact across the ribs instead of into them.',
    effects: [{ target: 'crew', field: 'maxHp', add: 22 }],
    augSlot: 'CHEST',
  },
  {
    id: 'c-cache',
    branch: 'cybernetics',
    lines: ['NEURAL CACHE', 'ARRAY'],
    glyph: 'cache',
    col: 2,
    row: 3,
    needs: ['c-accelerator', 'c-weave'],
    cost: 80000,
    hours: 14,
    blurb: 'A cache array holding drilled movement and trauma response a step ahead of the body.',
    effects: [
      { target: 'crew', field: 'maxHp', add: 18 },
      { target: 'crew', field: 'speed', add: 0.35 },
    ],
    augSlot: 'NEURAL',
  },

  /* ---------------------------- control systems --------------------------- */
  {
    id: 'k-targeting',
    branch: 'control',
    lines: ['TARGETING', 'AI SUITE'],
    glyph: 'reticle',
    col: 0,
    row: 0,
    needs: [],
    cost: 18000,
    hours: 2,
    blurb: 'A firing solution the sight computes and holds while the operative settles on it.',
    effects: [{ target: 'weapon', weapon: 'all', field: 'spread', mul: 0.88 }],
    augSlot: 'ARMS',
  },
  {
    id: 'k-sensor',
    branch: 'control',
    lines: ['SENSOR FUSION', 'ARRAY'],
    glyph: 'sensor',
    col: 1,
    row: 0,
    needs: [],
    cost: 16000,
    hours: 2,
    blurb: 'Optical, thermal and acoustic returns folded into one picture of the street.',
    effects: [{ target: 'weapon', weapon: 'all', field: 'range', mul: 1.08 }],
    augSlot: 'NEURAL',
  },
  {
    id: 'k-swarm',
    branch: 'control',
    lines: ['SWARM', 'COORDINATION'],
    glyph: 'swarm',
    col: 0,
    row: 1,
    needs: ['k-targeting'],
    cost: 29000,
    hours: 4,
    blurb: 'Squad routing that keeps four operatives clear of one another at speed.',
    effects: [{ target: 'crew', field: 'speed', add: 0.25 }],
    augSlot: 'LEGS',
  },
  {
    id: 'k-threat',
    branch: 'control',
    lines: ['THREAT', 'PREDICTION'],
    glyph: 'threat',
    col: 1,
    row: 1,
    needs: ['k-sensor'],
    cost: 31000,
    hours: 4,
    blurb: 'A model of where the next shot comes from, called early enough to brace for it.',
    effects: [{ target: 'crew', field: 'maxHp', add: 12 }],
    augSlot: 'NEURAL',
  },
  {
    id: 'k-hardening',
    branch: 'control',
    lines: ['EM', 'HARDENING'],
    glyph: 'em',
    col: 0,
    row: 2,
    needs: ['k-swarm'],
    cost: 45000,
    hours: 8,
    blurb: 'Shielded implant buses that hold through the jamming CorpSec runs over a cordon.',
    effects: [{ target: 'crew', field: 'maxHp', add: 16 }],
    augSlot: 'LEGS',
  },
  {
    id: 'k-encryption',
    branch: 'control',
    lines: ['ENCRYPTION', 'CORE'],
    glyph: 'crypt',
    col: 1,
    row: 2,
    needs: ['k-threat'],
    cost: 47000,
    hours: 8,
    blurb: 'A sealed channel for loadout telemetry, so the armourer works from clean numbers.',
    effects: [{ target: 'weapon', weapon: 'all', field: 'reload', mul: 0.9 }],
    augSlot: 'ARMS',
  },
  {
    id: 'k-adaptive',
    branch: 'control',
    lines: ['ADAPTIVE', 'COMMAND AI'],
    glyph: 'ai',
    col: 2,
    row: 3,
    needs: ['k-hardening', 'k-encryption'],
    cost: 84000,
    hours: 14,
    blurb: 'A command layer that reads the engagement and pushes orders before the call goes out.',
    effects: [
      { target: 'weapon', weapon: 'all', field: 'cooldown', mul: 0.9 },
      { target: 'crew', field: 'speed', add: 0.2 },
    ],
    augSlot: 'NEURAL',
  },
]

const BY_ID: Record<string, ResearchNode> = {}
for (const n of NODES) BY_ID[n.id] = n

export function nodeById(id: string): ResearchNode {
  const n = BY_ID[id]
  if (!n) throw new Error('unknown research node ' + id)
  return n
}

export function nodeTitle(n: ResearchNode): string {
  return n.full ?? n.lines.join(' ')
}

export function branchDef(id: BranchId): Branch {
  const b = BRANCHES.find((b) => b.id === id)
  if (!b) throw new Error('unknown research branch ' + id)
  return b
}

export function nodesOfBranch(id: BranchId): ResearchNode[] {
  return NODES.filter((n) => n.branch === id)
}

/* -------------------------------- selectors ------------------------------- */

function pct(mul: number): string {
  const p = Math.round((mul - 1) * 100)
  return (p > 0 ? '+' : '') + p + '%'
}

// The line the detail panel prints for one effect, and the scope it applies to.
export function benefitOf(e: Effect): { line: string; scope: string } {
  if (e.target === 'crew') {
    const v = e.add
    const shown = Number.isInteger(v) ? String(v) : v.toFixed(2)
    return { line: (v > 0 ? '+' : '') + shown + ' ' + CREW_FIELD[e.field], scope: 'EVERY OPERATIVE' }
  }
  const f = WEAPON_FIELD[e.field]
  const line = e.mul !== undefined ? pct(e.mul) + ' ' + f.label : (e.add ?? 0) + ' ' + f.label
  return {
    line: e.mul === undefined && (e.add ?? 0) > 0 ? '+' + line : line,
    scope: e.weapon === 'all' ? 'ALL SQUAD WEAPONS' : WEAPONS[e.weapon].name,
  }
}

// True when a lower number is the improvement, so the panel can tone the line.
export function benefitIsGain(e: Effect): boolean {
  if (e.target === 'crew') return e.add > 0
  const f = WEAPON_FIELD[e.field]
  if (e.mul !== undefined) return f.lowerIsBetter ? e.mul < 1 : e.mul > 1
  return f.lowerIsBetter ? (e.add ?? 0) < 0 : (e.add ?? 0) > 0
}

// The weapon a deployed operative carries, with every completed project
// applied in the order the projects finished.
export function squadWeapon(id: WeaponId, done: readonly string[]): WeaponDef {
  const base = WEAPONS[id]
  let out: WeaponDef | null = null
  for (const nid of done) {
    const node = BY_ID[nid]
    if (!node) continue
    for (const e of node.effects) {
      if (e.target !== 'weapon') continue
      if (e.weapon !== 'all' && e.weapon !== id) continue
      if (!out) out = { ...base }
      const v = e.mul !== undefined ? out[e.field] * e.mul : out[e.field] + (e.add ?? 0)
      out[e.field] = e.field === 'magazine' ? Math.round(v) : v
    }
  }
  return out ?? base
}

export interface CrewBonus {
  maxHp: number
  speed: number
}

export function crewBonus(done: readonly string[]): CrewBonus {
  const out: CrewBonus = { maxHp: 0, speed: 0 }
  for (const nid of done) {
    const node = BY_ID[nid]
    if (!node) continue
    for (const e of node.effects) {
      if (e.target === 'crew') out[e.field] += e.add
    }
  }
  return out
}

// The augmentation filling each bay: the last project completed for that slot.
export function installedAugs(done: readonly string[]): Array<{ slot: AugSlot; node: ResearchNode | null }> {
  return AUG_SLOTS.map((slot) => {
    let latest: ResearchNode | null = null
    for (const nid of done) {
      const node = BY_ID[nid]
      if (node && node.augSlot === slot) latest = node
    }
    return { slot, node: latest }
  })
}
