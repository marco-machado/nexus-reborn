// IF-015: the Brief KIT line from objective kinds (Interface AC31). The four
// spec strings are pinned here as literals, not read back from the module:
// destroy -> "power cells arm grenades, the fast tool; gunfire works, slowly";
// interact -> "an operative holds the console for N s"; escort -> "the asset
// must reach the pad alive"; defend -> "hold the zone for N s". The line is
// a function of kind and durationSec alone, so authored and generated
// objectives of one kind print the same line, and the Brief agrees with the
// deployed mission because both read one MissionDef's objectives.
import { describe, expect, it } from 'vitest'
import { kitLine, kitLines } from './kitLine'
import { MISSIONS, missionById, operativeById } from '../game/data'
import { contractMission, reclientContract, sequenceVariant } from '../game/contracts'
import type { ContractType, GeneratedContract } from '../game/contracts'
import { CITIES } from '../game/atlas'
import type { CorpId } from '../game/atlas'
import { headlessDeploy } from '../game/deploy'
import { createWorld } from '../game/world'
import type { ObjectiveDef, ObjectiveKind } from '../game/types'
import { resolveMission, useWorldStore } from '../state/worldStore'
import { useMissionStore } from '../state/missionStore'

const TYPES: ContractType[] = ['SEIZURE', 'EXTRACTION', 'SABOTAGE', 'SUPPRESSION']
const VARIANTS = [0, 1, 2]
const KIT_KINDS: ObjectiveKind[] = ['destroy', 'interact', 'escort', 'defend']
const BARE_KINDS: ObjectiveKind[] = ['reach-zone', 'eliminate-tag', 'extract']
const OWNERSHIP: Record<string, CorpId> = {}
for (const city of CITIES) OWNERSHIP[city.id] = city.corp

const DESTROY = 'power cells arm grenades, the fast tool; gunfire works, slowly'
const ESCORT = 'the asset must reach the pad alive'

function def(kind: ObjectiveKind, durationSec?: number, extra: Partial<ObjectiveDef> = {}): ObjectiveDef {
  return { id: 'x', label: 'X', kind, ...(durationSec === undefined ? {} : { durationSec }), ...extra }
}

function contractOf(type: ContractType, seed: number, over: Partial<GeneratedContract> = {}): GeneratedContract {
  return {
    id: 'gc' + seed.toString(16).padStart(8, '0'),
    createdT: 1000,
    expiresAtT: 90000,
    sector: 'eu',
    cityId: 'nc',
    district: 7,
    type,
    client: 'helix',
    threat: 'HIGH',
    reward: 52000,
    seed,
    priority: type === 'SUPPRESSION',
    expedited: false,
    ...over,
  }
}

function seedForVariant(variant: number): number {
  for (let s = 0; s < 4096; s++) {
    if (sequenceVariant(s) === variant) return s
  }
  throw new Error('no seed for variant ' + variant)
}

describe('kitLine: the four kinds (AC31)', () => {
  it('destroy reads the power-cell line, with no duration', () => {
    expect(kitLine(def('destroy'))).toBe(DESTROY)
    expect(kitLine(def('destroy', 45))).toBe(DESTROY)
  })

  it('interact names the console hold with durationSec as is: 5 s and 45 s', () => {
    expect(kitLine(def('interact', 5))).toBe('an operative holds the console for 5 s')
    expect(kitLine(def('interact', 45))).toBe('an operative holds the console for 45 s')
  })

  it('escort reads the pad line, with no duration', () => {
    expect(kitLine(def('escort'))).toBe(ESCORT)
    expect(kitLine(def('escort', 5))).toBe(ESCORT)
  })

  it('defend names the zone hold with durationSec as is: 5 s and 45 s', () => {
    expect(kitLine(def('defend', 5))).toBe('hold the zone for 5 s')
    expect(kitLine(def('defend', 45))).toBe('hold the zone for 45 s')
  })

  it('reach-zone, eliminate-tag and extract carry no KIT line', () => {
    for (const kind of BARE_KINDS) {
      expect(kitLine(def(kind))).toBeNull()
      expect(kitLine(def(kind, 45))).toBeNull()
    }
  })

  it('a missing durationSec prints the 0 s the sim holds for, never NaN or undefined', () => {
    expect(kitLine(def('interact'))).toBe('an operative holds the console for 0 s')
    expect(kitLine(def('defend'))).toBe('hold the zone for 0 s')
  })

  it('optional, failSec, tag, landmark, id and label do not change the line', () => {
    const base = kitLine(def('destroy'))
    expect(kitLine(def('destroy', undefined, { optional: true, bonusReward: 6000, tag: 'transformer', id: 'rh-opt', label: 'DROP IT' }))).toBe(base)
    expect(kitLine(def('interact', 4, { optional: true, failSec: 90, landmark: 'server', id: 'hc-opt' }))).toBe(
      kitLine(def('interact', 4)),
    )
    expect(kitLine(def('escort', undefined, { failSec: 90, landmark: 'extraction' }))).toBe(ESCORT)
  })
})

describe('kitLines over a contract', () => {
  it('a contract with none of the four kinds carries no KIT line: Glass Veil, SEIZURE and SUPPRESSION variants 0 and 2', () => {
    expect(kitLines(missionById('m01').objectives)).toEqual([])
    for (const type of ['SEIZURE', 'SUPPRESSION'] as const) {
      for (const v of [0, 2]) {
        expect(kitLines(contractMission(contractOf(type, seedForVariant(v))).objectives)).toEqual([])
      }
    }
  })

  it('Hollow Crown prints two console holds (4 s, 5 s) and the pad line, in objective order', () => {
    expect(kitLines(missionById('m02').objectives)).toEqual([
      'an operative holds the console for 4 s',
      'an operative holds the console for 5 s',
      ESCORT,
    ])
  })

  it('Rust Haven prints the power-cell line twice (optional transformer, relays) and a 45 s hold', () => {
    expect(kitLines(missionById('m03').objectives)).toEqual([DESTROY, DESTROY, 'hold the zone for 45 s'])
  })
})

describe('authored and generated objectives of one kind print one line (AC31, change-impact F)', () => {
  // Every generated type in all three sequence variants plus the three
  // authored missions: that set covers all four kinds (SABOTAGE v1 has
  // destroy and defend; EXTRACTION has interact and escort).
  const generated: ObjectiveDef[] = []
  for (const type of TYPES) {
    for (const v of VARIANTS) {
      generated.push(...contractMission(contractOf(type, seedForVariant(v))).objectives)
    }
  }
  const authored: ObjectiveDef[] = MISSIONS.flatMap((m) => m.objectives)
  const all = [...authored, ...generated]

  it('the matrix reaches all four KIT kinds on both sides', () => {
    for (const kind of KIT_KINDS) {
      expect(authored.some((o) => o.kind === kind), 'authored ' + kind).toBe(true)
      expect(generated.some((o) => o.kind === kind), 'generated ' + kind).toBe(true)
    }
  })

  it('the output depends on kind and durationSec alone', () => {
    for (const o of all) {
      expect(kitLine(o)).toBe(kitLine(def(o.kind, o.durationSec)))
    }
  })

  it('every (kind, durationSec) pair prints one string, whichever mission it came from', () => {
    const seen = new Map<string, string | null>()
    for (const o of all) {
      const key = o.kind + ':' + (o.durationSec ?? '')
      const line = kitLine(o)
      if (seen.has(key)) expect(line).toBe(seen.get(key))
      else seen.set(key, line)
    }
    expect(seen.get('destroy:')).toBe(DESTROY)
    expect(seen.get('escort:')).toBe(ESCORT)
    expect(seen.get('defend:45')).toBe('hold the zone for 45 s')
    expect(seen.get('interact:5')).toBe('an operative holds the console for 5 s')
  })
})

describe('the Brief agrees with the deployed mission (AC31 / Pillar 2)', () => {
  it('a generated contract: resolveMission (Brief and MissionScreen) and createWorld read one objective list', () => {
    const c = contractOf('SABOTAGE', seedForVariant(1))
    useWorldStore.setState({ contracts: [c] })
    const brief = resolveMission(c.id)
    expect(brief).not.toBeNull()
    const m = brief!
    const w = createWorld(m, [operativeById('op1')], headlessDeploy(m, [operativeById('op1')]))
    // The sim's objective rows (what the HUD objective panel prints) are the
    // same list, in order.
    w.tick(0.05)
    const live = useMissionStore.getState().objectives
    expect(live.map((o) => o.label)).toEqual(m.objectives.map((o) => o.label))
    expect(kitLines(m.objectives)).toEqual([DESTROY, 'hold the zone for 45 s'])
    useWorldStore.setState({ contracts: [] })
  })

  it('a reclient between Brief and deploy changes neither the objectives nor the KIT lines', () => {
    const c = contractOf('EXTRACTION', seedForVariant(2))
    const before = kitLines(contractMission(c).objectives)
    expect(before).toEqual(['an operative holds the console for 4 s', 'an operative holds the console for 5 s', ESCORT])
    const re = reclientContract(c, 'omni', OWNERSHIP, 0x1234).contract
    expect(re.id).toBe(c.id)
    expect(contractMission(re).objectives.map((o) => o.id)).toEqual(contractMission(c).objectives.map((o) => o.id))
    expect(kitLines(contractMission(re).objectives)).toEqual(before)
  })

  it('an Expedite between Brief and deploy changes neither', () => {
    const c = contractOf('SABOTAGE', seedForVariant(1))
    const before = kitLines(contractMission(c).objectives)
    const expedited = { ...c, expedited: true, expiresAtT: c.expiresAtT + 86400 }
    expect(contractMission(expedited).objectives.map((o) => o.kind)).toEqual(contractMission(c).objectives.map((o) => o.kind))
    expect(kitLines(contractMission(expedited).objectives)).toEqual(before)
  })
})
