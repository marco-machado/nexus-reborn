// Tests for the procedural contract market. Rolls are pure functions of an
// explicit rng state, so everything here is deterministic and clock-free.
import { describe, expect, it } from 'vitest'
import {
  CONTRACT_EXPIRY_MIN_SEC,
  CONTRACT_EXPIRY_SPAN_SEC,
  CONTRACT_INTEL_REQ,
  CONTRACT_REWARD_MAX,
  CONTRACT_REWARD_MIN,
  PRIORITY_EXPIRY_MIN_SEC,
  PRIORITY_EXPIRY_SPAN_SEC,
  contractMission,
  contractThreat,
  expediteTarget,
  isGeneratedMissionId,
  reclientContract,
  rollContract,
  rollSuppressionContract,
  sectorClient,
} from './contracts'
import type { ContractSectorInput, ContractType, GeneratedContract } from './contracts'
import { CITIES, CITIES_BY_SECTOR, HOLDERS } from './atlas'
import type { CorpId } from './atlas'
import { MISSIONS, operativeById } from './data'
import { missionPeriod } from './missionParams'
import { isWalkable } from './types'
import { createWorld } from './world'

const OWNERSHIP: Record<string, CorpId> = {}
for (const city of CITIES) OWNERSHIP[city.id] = city.corp

const INPUTS: ContractSectorInput[] = [
  { sector: 'eu', control: 62, unrest: 18, defense: 74, garrison: 'SECURE', weight: 1.2, client: 'helix', ownership: OWNERSHIP },
  { sector: 'af', control: 37, unrest: 28, defense: 44, garrison: 'STRAINED', weight: 0.9, client: 'omni', ownership: OWNERSHIP },
  { sector: 'oc', control: 20, unrest: 60, defense: 11, garrison: 'CRITICAL', weight: 0.55, client: 'stratos', ownership: OWNERSHIP },
]

function inputFor(sector: string): ContractSectorInput {
  const input = INPUTS.find((i) => i.sector === sector)
  expect(input).toBeDefined()
  return input!
}

// A spread of contracts from a chained cursor, as the market would roll them.
function rollMany(count: number, state = 0x1234): GeneratedContract[] {
  const out: GeneratedContract[] = []
  for (let i = 0; i < count; i++) {
    const rolled = rollContract(INPUTS, 1000 + i, state)
    out.push(rolled.contract)
    state = rolled.state
  }
  return out
}

describe('rolling', () => {
  it('is a pure function of the rng state', () => {
    const a = rollContract(INPUTS, 5000, 0xbeef)
    const b = rollContract(INPUTS, 5000, 0xbeef)
    expect(b.contract).toEqual(a.contract)
    expect(b.state).toBe(a.state)
    expect(b.state).not.toBe(0xbeef)
  })

  it('derives every parameter from the source sector inside its bounds', () => {
    for (const c of rollMany(200)) {
      const input = inputFor(c.sector)
      expect(c.type === 'SEIZURE' || c.type === 'EXTRACTION' || c.type === 'SABOTAGE').toBe(true)
      expect(c.threat).toBe(contractThreat(input.defense, input.garrison))
      expect(c.client).toBe(input.client)
      expect(c.reward).toBeGreaterThanOrEqual(CONTRACT_REWARD_MIN)
      expect(c.reward).toBeLessThanOrEqual(CONTRACT_REWARD_MAX)
      expect(c.reward % 500).toBe(0)
      expect(CITIES_BY_SECTOR[c.sector].some((city) => city.id === c.cityId)).toBe(true)
      if (c.client !== 'nexus') expect(OWNERSHIP[c.cityId]).not.toBe('nexus')
      expect(c.district).toBeGreaterThanOrEqual(2)
      expect(c.district).toBeLessThanOrEqual(29)
      expect(c.expiresAtT - c.createdT).toBeGreaterThanOrEqual(CONTRACT_EXPIRY_MIN_SEC)
      expect(c.expiresAtT - c.createdT).toBeLessThanOrEqual(
        CONTRACT_EXPIRY_MIN_SEC + CONTRACT_EXPIRY_SPAN_SEC,
      )
      expect(c.seed).toBeGreaterThanOrEqual(0)
      expect(c.seed).toBeLessThanOrEqual(0xffffffff)
      expect(c.priority).toBe(false)
      expect(c.expedited).toBe(false)
      expect(isGeneratedMissionId(c.id)).toBe(true)
    }
  })

  it('pulls generated work toward restless, poorly held sectors', () => {
    const bySector: Record<string, number> = {}
    for (const c of rollMany(300)) bySector[c.sector] = (bySector[c.sector] ?? 0) + 1
    // oc: unrest 60, control 20. eu: unrest 18, control 62.
    expect(bySector.oc ?? 0).toBeGreaterThan(bySector.eu ?? 0)
  })

  it('a suppression contract is priority work: premium pay, short expiry', () => {
    const input = inputFor('oc')
    const { contract: c } = rollSuppressionContract(input, 2000, 0x77)
    expect(c.priority).toBe(true)
    expect(c.type).toBe('SUPPRESSION')
    expect(c.sector).toBe('oc')
    expect(c.expiresAtT - c.createdT).toBeGreaterThanOrEqual(PRIORITY_EXPIRY_MIN_SEC)
    expect(c.expiresAtT - c.createdT).toBeLessThanOrEqual(
      PRIORITY_EXPIRY_MIN_SEC + PRIORITY_EXPIRY_SPAN_SEC,
    )
    expect(c.reward).toBeGreaterThanOrEqual(CONTRACT_REWARD_MIN)
    expect(c.reward).toBeLessThanOrEqual(CONTRACT_REWARD_MAX)
    expect(OWNERSHIP[c.cityId]).not.toBe('nexus')
  })

  it('makes all-Nexus sectors internal without changing the economy', () => {
    const allNexus = { ...OWNERSHIP }
    for (const city of CITIES_BY_SECTOR.oc) allNexus[city.id] = 'nexus'
    const outsideInput = { ...inputFor('oc'), ownership: allNexus, client: 'stratos' as const }
    const internalInput = { ...outsideInput, client: 'nexus' as const }
    const forced = rollContract([outsideInput], 2000, 0x4040).contract
    const internal = rollContract([internalInput], 2000, 0x4040).contract

    expect(forced.client).toBe('nexus')
    expect({
      type: forced.type,
      threat: forced.threat,
      reward: forced.reward,
      expiresAtT: forced.expiresAtT,
      seed: forced.seed,
      intelReq: contractMission(forced).intelReq,
    }).toEqual({
      type: internal.type,
      threat: internal.threat,
      reward: internal.reward,
      expiresAtT: internal.expiresAtT,
      seed: internal.seed,
      intelReq: contractMission(internal).intelReq,
    })
    expect(rollSuppressionContract(outsideInput, 2000, 0x4040).contract.client).toBe('nexus')
  })
})

describe('threat and client derivation', () => {
  it('maps defense and garrison condition onto the threat ladder', () => {
    expect(contractThreat(80, 'SECURE')).toBe('MODERATE')
    expect(contractThreat(50, 'SECURE')).toBe('HIGH')
    expect(contractThreat(80, 'STRAINED')).toBe('HIGH')
    expect(contractThreat(30, 'SECURE')).toBe('SEVERE')
    expect(contractThreat(80, 'CRITICAL')).toBe('SEVERE')
  })

  it('names the corporation holding the most cities, ties in holder order', () => {
    const owner: Record<string, CorpId> = {}
    for (const c of CITIES) owner[c.id] = c.corp
    // At start eu splits helix 2 / omni 1.
    expect(sectorClient('eu', owner)).toBe('helix')
    // Hand omni a second eu city: the majority flips with it.
    owner.nc = 'omni'
    expect(sectorClient('eu', owner)).toBe('omni')
    // A three-way split breaks in HOLDERS order: stratos comes first.
    owner.ln = 'helix'
    owner.nc = 'omni'
    owner.os = 'stratos'
    expect(HOLDERS[0]).toBe('stratos')
    expect(sectorClient('eu', owner)).toBe('stratos')
  })
})

describe('expedite targeting', () => {
  function stub(
    id: string,
    sector: string,
    threat: GeneratedContract['threat'],
    over: Partial<GeneratedContract> = {},
  ): GeneratedContract {
    return {
      id,
      createdT: 100,
      expiresAtT: 5000,
      sector: sector as GeneratedContract['sector'],
      cityId: CITIES_BY_SECTOR[sector][0].id,
      district: 5,
      type: 'SEIZURE',
      client: 'helix',
      threat,
      reward: 50000,
      seed: 1,
      priority: false,
      expedited: false,
      ...over,
    }
  }

  it('picks the lowest intel gate in the sector, ignoring other sectors', () => {
    const contracts = [
      stub('gc-a', 'eu', 'SEVERE'),
      stub('gc-b', 'eu', 'HIGH'),
      stub('gc-c', 'af', 'MODERATE'),
    ]
    expect(expediteTarget(contracts, 'eu')?.id).toBe('gc-b')
    expect(expediteTarget(contracts, 'af')?.id).toBe('gc-c')
    expect(expediteTarget(contracts, 'oc')).toBeNull()
  })

  it('skips already-expedited records and breaks ties toward the oldest offer', () => {
    const contracts = [
      stub('gc-a', 'eu', 'HIGH', { createdT: 200 }),
      stub('gc-b', 'eu', 'HIGH', { createdT: 50 }),
      stub('gc-c', 'eu', 'MODERATE', { expedited: true }),
    ]
    expect(expediteTarget(contracts, 'eu')?.id).toBe('gc-b')
    expect(
      expediteTarget(
        contracts.map((c) => ({ ...c, expedited: true })),
        'eu',
      ),
    ).toBeNull()
  })
})

describe('derived missions', () => {
  it('derives identical missions from equal records', () => {
    const a = contractMission(rollContract(INPUTS, 1000, 0x42).contract)
    const b = contractMission(rollContract(INPUTS, 1000, 0x42).contract)
    expect(b).toEqual(a)
  })

  it('keeps a stable object identity per record', () => {
    const record = rollContract(INPUTS, 1000, 0x42).contract
    expect(contractMission(record)).toBe(contractMission(record))
  })

  it('rolls an opening hour after the existing cosmetic stream', () => {
    const m = contractMission(rollContract(INPUTS, 1000, 0x42).contract)
    // Weather and map jitter are the prefix of the stream; hour is last.
    expect(m.weather).toBe('none')
    expect(m.mapPos).toEqual({ x: 51.11282241260633, y: 20.108530740325268 })
    const wrapped = m.openingHour < 18 * 3600 ? m.openingHour + 86400 : m.openingHour
    expect(wrapped).toBeGreaterThanOrEqual(18 * 3600)
    expect(wrapped).toBeLessThan(18 * 3600 + 7 * 3600)
    expect(m.openingHour % 60).toBe(0)
    expect(m.notes[0]).toBeDefined()
    if (m.weather === 'none' && !m.weatherFront) {
      expect(m.notes[0]).toBe(
        missionPeriod(m.openingHour) === 'dusk'
          ? 'CLEAR DUSK. GUARDS SEE AND HEAR AT FULL RANGE.'
          : 'CLEAR NIGHT. GUARDS SEE AND HEAR AT FULL RANGE.',
      )
    } else {
      expect(m.notes[0]).not.toMatch(/CLEAR (DUSK|NIGHT)/)
    }
  })

  it('gates intel by threat', () => {
    for (const c of rollMany(60)) {
      expect(contractMission(c).intelReq).toBe(CONTRACT_INTEL_REQ[c.threat])
    }
  })

  it('an expedited record loses its intel gate and notes the waiver', () => {
    const record = rollMany(60).find((c) => c.threat !== 'MODERATE')
    expect(record).toBeDefined()
    if (!record) return
    const expedited = { ...record, expedited: true }
    expect(contractMission(record).intelReq).toBeGreaterThan(1)
    expect(contractMission(expedited).intelReq).toBe(1)
    expect(contractMission(expedited).notes.at(-1)).toContain('INTEL GATE WAIVED')
  })

  it.each<ContractType>(['SEIZURE', 'SUPPRESSION', 'EXTRACTION', 'SABOTAGE'])(
    'presents Nexus-signed %s work as an internal directive',
    (type) => {
      const record = {
        ...rollContract([{ ...inputFor('oc'), client: 'nexus' }], 1000, 0x40).contract,
        type,
      }
      const mission = contractMission(record)
      const briefing = mission.briefing.join(' ')
      expect(mission.client).toBe('INTERNAL')
      expect(briefing).toContain('The board')
      expect(briefing).not.toMatch(/\bNEXUS(?: GLOBAL)?\b/i)
    },
  )

  it('keeps the authored clients unchanged', () => {
    expect(MISSIONS.map((mission) => mission.client)).toEqual([
      'SABLE ENTERPRISES',
      'HELIX CORP',
      'STRATOS INDUSTRIES',
    ])
  })

  it('builds a playable mission for every contract type', () => {
    // Chain the cursor until every regular type showed up, then add a
    // suppression roll, and validate each derived mission like an authored
    // one: generated city, walkable spawns, resolvable objective chain.
    const byType = new Map<ContractType, GeneratedContract>()
    let state = 0x5eed
    for (let i = 0; i < 200 && byType.size < 3; i++) {
      const rolled = rollContract(INPUTS, 1000, state)
      state = rolled.state
      if (!byType.has(rolled.contract.type)) byType.set(rolled.contract.type, rolled.contract)
    }
    byType.set(
      'SUPPRESSION',
      rollSuppressionContract(inputFor('oc'), 1000, state).contract,
    )
    expect([...byType.keys()].sort()).toEqual([
      'EXTRACTION', 'SABOTAGE', 'SEIZURE', 'SUPPRESSION',
    ])

    for (const contract of byType.values()) {
      const m = contractMission(contract)
      const w = createWorld(m, [operativeById('op1')])

      // The generated district resolves the same core landmarks as authored
      // work, and the squad inserts on walkable ground.
      for (const key of ['insertion', 'extraction', 'target']) {
        expect(w.city.landmarks[key]).toBeDefined()
      }
      for (const p of w.city.spawnAgents) {
        expect(isWalkable(w.city, p.x, p.z)).toBe(true)
      }

      // The objective chain is well formed: unique ids, extract last, and
      // every reference resolves against the built city.
      const ids = m.objectives.map((o) => o.id)
      expect(new Set(ids).size).toBe(ids.length)
      expect(m.objectives.length).toBeGreaterThanOrEqual(3)
      expect(m.objectives.at(-1)?.kind).toBe('extract')
      for (const objective of m.objectives) {
        expect(objective.optional).toBeUndefined()
        if (objective.landmark) {
          expect(w.city.landmarks[objective.landmark]).toBeDefined()
        }
        if (objective.kind === 'eliminate-tag' || objective.kind === 'destroy') {
          expect(objective.tag).toBeDefined()
          const tagged =
            w.city.enemies.some((e) => e.tag === objective.tag) ||
            w.city.devices.some((d) => d.tag === objective.tag)
          expect(tagged).toBe(true)
        }
        if (objective.kind === 'interact') {
          expect(objective.durationSec ?? 0).toBeGreaterThan(0)
        }
        if (objective.kind === 'escort') {
          expect(w.city.vips.length).toBeGreaterThan(0)
        }
      }

      // The dossier fields the brief renders are all present.
      expect(m.codename.length).toBeGreaterThan(0)
      expect(m.briefing.length).toBeGreaterThanOrEqual(4)
      expect(m.notes.length).toBeGreaterThanOrEqual(3)
      expect(m.variants).toHaveLength(2)
      expect(m.mapPos.x).toBeGreaterThan(0)
      expect(m.mapPos.x).toBeLessThan(100)
      expect(m.mapPos.y).toBeGreaterThan(0)
      expect(m.mapPos.y).toBeLessThan(100)
    }
  })
})

describe('re-clienting', () => {
  const nexusRecord = (): GeneratedContract => ({
    ...rollContract([{ ...inputFor('eu'), sector: 'na', client: 'nexus' }], 1000, 0x40)
      .contract,
    cityId: 'nb',
  })

  it('moves outside work off a Nexus holding and preserves mission economics', () => {
    const before = nexusRecord()
    const moved = reclientContract(before, 'helix', OWNERSHIP, 0x4040).contract
    expect(moved.client).toBe('helix')
    expect(moved.cityId).toBe('dt')
    expect({ ...moved, client: before.client, cityId: before.cityId }).toEqual(before)
  })

  it('keeps expansion work in a rival city when re-cliented to Nexus', () => {
    const before = { ...nexusRecord(), client: 'helix' as const, cityId: 'dt' }
    const moved = reclientContract(before, 'nexus', OWNERSHIP, 0x4040).contract
    expect(moved.client).toBe('nexus')
    expect(moved.cityId).toBe('dt')
  })

  it('refuses to re-client an all-Nexus sector to an outside corporation', () => {
    const allNexus = { ...OWNERSHIP }
    for (const city of CITIES_BY_SECTOR.na) allNexus[city.id] = 'nexus'
    const moved = reclientContract(nexusRecord(), 'helix', allNexus, 0x4040).contract
    expect(moved.client).toBe('nexus')
    expect(moved.cityId).toBe('nb')
  })
})
