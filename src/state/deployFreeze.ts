// The deploy composer (ADR-0009): reads the live stores once, at mission
// create, and clones what the mission needs into DeployParams. Nothing it
// returns references live store data, so later Screen changes cannot reach a
// running mission, and createWorld never has to read a store.
import type { MissionDef, OperativeDef } from '../game/types'
import type { DeployParams } from '../game/deploy'
import type { BayPins } from '../game/research'
import { composeDeploy } from '../game/deploy'
import { NEUTRAL_SECTOR, missionMods, missionVariant } from '../game/missionParams'
import { isGeneratedMissionId } from '../game/contracts'
import { useAppStore } from './appStore'
import { useCampaignStore } from './campaignStore'
import { useResearchStore } from './researchStore'
import { useSettingsStore } from './settingsStore'
import { useWorldStore } from './worldStore'

// `applyKey` is the ADR-0021 apply-once key the MissionScreen composer
// minted for this create; it is stamped on the Economy slice unchanged.
export function freezeDeploy(
  mission: MissionDef,
  operatives: readonly OperativeDef[],
  applyKey: number,
): DeployParams {
  const campaign = useCampaignStore.getState()
  const live = useWorldStore.getState().sectors[mission.sector] ?? NEUTRAL_SECTOR
  const sector = { control: live.control, unrest: live.unrest }
  const quietReplay = campaign.contractsWon.includes(mission.id)
  const roster: Record<string, { xp: number; pins: BayPins }> = {}
  for (const op of operatives) {
    const entry = campaign.roster[op.id]
    if (entry) roster[op.id] = { xp: entry.xp, pins: { ...entry.pins } }
  }
  return composeDeploy(mission, operatives, {
    sector,
    generated: isGeneratedMissionId(mission.id),
    quietReplay,
    applyKey,
    done: useResearchStore.getState().done.slice(),
    roster,
    loadout: useAppStore.getState().loadout,
    mods: missionMods(mission, sector, useSettingsStore.getState().difficulty),
    district: missionVariant(mission, quietReplay),
  })
}
