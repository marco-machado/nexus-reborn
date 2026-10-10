// Deploy freeze (ADR-0009): the four plain-data slices a mission is created
// from. Pure TypeScript. The composer outside src/game (state/deployFreeze.ts)
// reads the live stores once and hands plain copies to composeDeploy; after
// that, createWorld reads only what is on DeployParams and never a store.
// There is deliberately no umbrella type for the four slices.
import type { DistrictSpec, MissionDef, OperativeDef, SectorId } from './types'
import type { MissionMods } from './missionParams'
import { NEUTRAL_SECTOR, defaultDistrict, missionMods } from './missionParams'
import type { AugSlot, BayPins } from './research'
import { AUG_SLOTS, NODES, appliedNodeIds, crewBonus, wornNode } from './research'
import { xpBonus } from './experience'
import type { MassTier, SquadLoadout } from './mass'
import { massTier, operativeItems, squadMassKg, tierSpeedDelta } from './mass'

// World Network slice: the target sector's Control and Unrest at deploy.
// Intel is not a field.
export interface WorldNetworkSlice {
  sector: SectorId
  control: number
  unrest: number
}

// Economy slice: what the contract pays, frozen at deploy. `quietReplay` is
// sampled from contractsWon once, here, and never restamped later.
// `applyKey` is the ADR-0021 apply-once key the composer minted for this
// deploy; the outcome echoes it unchanged.
export interface EconomySlice {
  id: string
  generated: boolean
  applyKey: number
  reward: number
  // Optional objective id → its bonusReward.
  bonusDefs: Readonly<Record<string, number>>
  etaDays: number
  quietReplay: boolean
}

// Research slice: completed unslotted node ids, in completion order.
export type ResearchSlice = readonly string[]

// Roster slice: the assigned operatives and everything resolved about them at
// deploy. Maps are keyed by operative id. `maxHp` / `speed` are final totals
// (body + research + experience; the mass tier is already in `speed`).
export interface RosterSlice {
  ids: readonly string[]
  // Worn slotted project per bay; an empty bay is an omitted key.
  wear: Readonly<Record<string, Partial<Record<AugSlot, string>>>>
  appliedIds: Readonly<Record<string, readonly string[]>>
  items: SquadLoadout
  massKg: number
  massTier: MassTier
  maxHp: Readonly<Record<string, number>>
  speed: Readonly<Record<string, number>>
}

// The single input bag createWorld takes besides the mission and operatives.
// `mods` and `district` are computed by the composer from the frozen slices.
export interface DeployParams {
  wn: WorldNetworkSlice
  economy: EconomySlice
  research: ResearchSlice
  roster: RosterSlice
  mods: MissionMods
  district: DistrictSpec
}

// Plain-data reads the composer took from the live stores. Every field is
// copied again by composeDeploy, so a caller may pass live references.
export interface DeployInputs {
  sector: { control: number; unrest: number }
  generated: boolean
  quietReplay: boolean
  // Minted by the MissionScreen composer; never minted here.
  applyKey: number
  done: readonly string[]
  // Experience and bay pins per operative id; a missing entry is 0 XP, no pins.
  roster: Readonly<Record<string, { xp: number; pins?: BayPins } | undefined>>
  loadout: SquadLoadout
  mods: MissionMods
  district: DistrictSpec
}

export function worldNetworkSlice(
  sector: SectorId,
  state: { control: number; unrest: number },
): WorldNetworkSlice {
  return { sector, control: state.control, unrest: state.unrest }
}

export function economySlice(
  mission: MissionDef,
  generated: boolean,
  quietReplay: boolean,
  applyKey: number,
): EconomySlice {
  const bonusDefs: Record<string, number> = {}
  for (const o of mission.objectives) {
    if (o.optional && o.bonusReward) bonusDefs[o.id] = o.bonusReward
  }
  return {
    id: mission.id,
    generated,
    applyKey,
    reward: mission.reward,
    bonusDefs,
    etaDays: mission.etaDays,
    quietReplay: quietReplay === true,
  }
}

const UNSLOTTED = new Set(NODES.filter((n) => !n.augSlot).map((n) => n.id))

export function researchSlice(done: readonly string[]): ResearchSlice {
  return done.filter((id) => UNSLOTTED.has(id))
}

export function rosterSlice(
  operatives: readonly OperativeDef[],
  done: readonly string[],
  roster: DeployInputs['roster'],
  loadout: SquadLoadout,
): RosterSlice {
  const wear: Record<string, Partial<Record<AugSlot, string>>> = {}
  const appliedIds: Record<string, readonly string[]> = {}
  const items: SquadLoadout = {}
  const hpBonus: Record<string, number> = {}
  const maxHp: Record<string, number> = {}
  const speed: Record<string, number> = {}
  for (const op of operatives) {
    const pins = roster[op.id]?.pins
    const worn: Partial<Record<AugSlot, string>> = {}
    for (const slot of AUG_SLOTS) {
      const node = wornNode(done, pins, slot)
      if (node) worn[slot] = node.id
    }
    wear[op.id] = worn
    appliedIds[op.id] = appliedNodeIds(done, pins)
    items[op.id] = operativeItems(loadout, op.id)
    hpBonus[op.id] =
      crewBonus(appliedIds[op.id]).maxHp + xpBonus(roster[op.id]?.xp ?? 0).maxHp
  }
  const massKg = squadMassKg(operatives, hpBonus, items)
  const tier = massTier(massKg)
  const massDelta = tierSpeedDelta(tier)
  for (const op of operatives) {
    const bonus = crewBonus(appliedIds[op.id])
    const xp = xpBonus(roster[op.id]?.xp ?? 0)
    maxHp[op.id] = op.maxHp + bonus.maxHp + xp.maxHp
    speed[op.id] = op.speed + bonus.speed + massDelta + xp.speed
  }
  return {
    ids: operatives.map((op) => op.id),
    wear,
    appliedIds,
    items,
    massKg,
    massTier: tier,
    maxHp,
    speed,
  }
}

// Clones the composer's reads into the four slices plus mods and district.
export function composeDeploy(
  mission: MissionDef,
  operatives: readonly OperativeDef[],
  inputs: DeployInputs,
): DeployParams {
  return {
    wn: worldNetworkSlice(mission.sector, inputs.sector),
    economy: economySlice(mission, inputs.generated, inputs.quietReplay, inputs.applyKey),
    research: researchSlice(inputs.done),
    roster: rosterSlice(operatives, inputs.done, inputs.roster, inputs.loadout),
    mods: { ...inputs.mods },
    district: { ...inputs.district },
  }
}

// An explicit freeze for tests and headless tools: neutral sector, no
// research, no experience, empty loadout, authored layout, STANDARD mods,
// apply key 0 (never applies at Debrief). Any field can be overridden. This is a constructed freeze, not a store read.
export function headlessDeploy(
  mission: MissionDef,
  operatives: readonly OperativeDef[],
  over: Partial<DeployInputs> = {},
): DeployParams {
  return composeDeploy(mission, operatives, {
    sector: NEUTRAL_SECTOR,
    generated: false,
    quietReplay: false,
    applyKey: 0,
    done: [],
    roster: {},
    loadout: {},
    mods: missionMods(mission, over.sector ?? NEUTRAL_SECTOR),
    district: defaultDistrict(mission),
    ...over,
  })
}
