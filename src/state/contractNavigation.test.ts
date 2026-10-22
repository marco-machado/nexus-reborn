// IF-003 (TR-interface-003): contract navigation gates Brief, Assembly and
// Deploy; Brief matches the deployed mission; Debrief return clears the
// contract and Replay needs no reselect. Real stores and the real composer.
import { beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_SQUAD, MISSIONS } from '../game/data'
import { isGeneratedMissionId } from '../game/contracts'
import { missionMods, missionVariant, weatherBriefLabel } from '../game/missionParams'
import { buildTacticalMap } from '../ui/briefMap'
import { debriefFlags } from '../ui/debriefFlags'
import { deployRefusalCopy } from '../ui/deployRefusal'
import { briefReachable, navTabGate } from '../ui/navGates'
import { canDeploy } from '../game/deployGate'
import { settleOutcome, useAppStore } from './appStore'
import { initialCampaignData, useCampaignStore } from './campaignStore'
import { useResearchStore } from './researchStore'
import { useSettingsStore } from './settingsStore'
import { useWorldStore } from './worldStore'
import { composeMission, teardownMission } from './missionLifecycle'

const outcome = () =>
  settleOutcome({
    applyKey: 1,
    won: true,
    kills: 1,
    casualties: 0,
    timeSec: 100,
    civiliansHit: 0,
    reward: 1000,
    bonus: 0,
    deadIds: [],
    survivorHp: {},
    quietReplay: false,
  })

beforeEach(() => {
  useAppStore.setState({
    phase: 'world',
    missionId: null,
    squad: [...DEFAULT_SQUAD],
    loadout: {},
    outcome: null,
    deploySerial: 0,
    lastAppliedKey: 0,
  })
  useCampaignStore.setState(initialCampaignData())
  useResearchStore.setState({ done: [] })
  useSettingsStore.setState({ difficulty: 'standard' })
})

describe('AC4: no selected contract', () => {
  it('Brief cannot open, Assembly opens, Deploy starts no mission and says why', () => {
    const contracts = useWorldStore.getState().contracts
    const open = briefReachable(useAppStore.getState().missionId, contracts)
    expect(navTabGate('brief', 'world', open).locked).toBe(true)
    expect(navTabGate('assembly', 'world', open).open).toBe(true)

    useAppStore.getState().goto('team')
    expect(useAppStore.getState().phase).toBe('team')

    useAppStore.getState().startMission()
    expect(useAppStore.getState().phase).toBe('team')
    const gate = canDeploy({
      missionSelected: false,
      assignedIds: DEFAULT_SQUAD,
      statusById: Object.fromEntries(DEFAULT_SQUAD.map((id) => [id, 'READY'])),
      massKg: 100,
    })
    expect(gate.ok).toBe(false)
    expect(deployRefusalCopy(gate)).toEqual([
      'NO CONTRACT SELECTED',
      'SELECT A CONTRACT ON THE WORLD NETWORK',
    ])
  })
})

describe('AC5: Brief fields match the deployed mission', () => {
  // Compare what Brief shows with what the composer builds; neither side is
  // recomputed here (owner computation stays Brief/Tactical).
  const cases = [
    { name: 'Glass Veil, standard, first deployment', id: 'm01', difficulty: 'standard', won: false },
    { name: 'Glass Veil, hardened, replay variant', id: 'm01', difficulty: 'hardened', won: true },
    { name: 'second authored contract', id: MISSIONS[1].id, difficulty: 'standard', won: false },
  ] as const
  for (const c of cases) {
    it(c.name, () => {
      useCampaignStore.setState({ intelLevel: 3, contractsWon: c.won ? [c.id] : [] })
      useSettingsStore.setState({ difficulty: c.difficulty })
      useAppStore.getState().selectMission(c.id)
      expect(useAppStore.getState().phase).toBe('brief')
      const m = MISSIONS.find((x) => x.id === c.id)!
      const sector = useWorldStore.getState().sectors[m.sector]
      const spec = missionVariant(m, c.won)
      const mods = missionMods(m, sector, c.difficulty)
      const tac = buildTacticalMap(m, spec, {
        enemyExtra: mods.enemyExtra,
        civilianCount: mods.civilianCount,
        officerCount: mods.officerCount,
        heavyCount: mods.heavyCount,
      })
      const briefLabel = weatherBriefLabel(m)

      useAppStore.getState().goto('team')
      useAppStore.getState().startMission()
      expect(useAppStore.getState().phase).toBe('mission')
      const { world } = composeMission(m, useAppStore.getState().squad)
      try {
        expect(world.city.spawnAgents[0]).toEqual(tac.insertion)
        expect({ x: world.city.extraction.x, z: world.city.extraction.z }).toEqual(tac.extraction)
        expect(world.city.enemies.filter((e) => e.tag === 'garrison').length).toBe(tac.counts.garrison)
        expect(world.city.civilians.length).toBe(tac.counts.civilians)
        expect(world.units.filter((u) => u.kind === 'civilian').length).toBe(tac.counts.civilians)
        expect(world.mission.objectives.map((o) => o.id)).toEqual(m.objectives.map((o) => o.id))
        expect(world.mission.openingHour).toBe(m.openingHour)
        expect(world.mission.weatherFront).toEqual(m.weatherFront)
        expect(weatherBriefLabel(world.mission)).toBe(briefLabel)
      } finally {
        teardownMission()
      }
    })
  }
})

describe('AC6: Debrief return and Replay', () => {
  // Rust Haven (m03) is the authored contract open at intel 1 (WN-020).
  it('return clears the selected contract and locks Brief', () => {
    useAppStore.getState().selectMission('m03')
    useAppStore.getState().setOutcome(outcome())
    useAppStore.getState().returnFromDebrief()
    const s = useAppStore.getState()
    expect(s.phase).toBe('world')
    expect(s.missionId).toBeNull()
    expect(navTabGate('brief', 'world', briefReachable(s.missionId, useWorldStore.getState().contracts)).locked).toBe(true)
  })

  it('Replay on an authored contract returns to Brief without reselecting', () => {
    useAppStore.getState().selectMission('m03')
    useAppStore.getState().setOutcome(outcome())
    const flags = debriefFlags(useAppStore.getState().outcome, false, useAppStore.getState().missionId)
    expect(flags.replay).toBe(true)
    useAppStore.getState().goto('brief')
    expect(useAppStore.getState().missionId).toBe('m03')
    expect(useAppStore.getState().phase).toBe('brief')
  })

  it('the contract can be selected again after returning', () => {
    useAppStore.getState().selectMission('m03')
    useAppStore.getState().setOutcome(outcome())
    useAppStore.getState().returnFromDebrief()
    useAppStore.getState().selectMission('m03')
    expect(useAppStore.getState().missionId).toBe('m03')
    expect(useAppStore.getState().phase).toBe('brief')
  })

  it('a generated contract has no Replay control', () => {
    const id = 'gc-test-1'
    expect(isGeneratedMissionId(id)).toBe(true)
    expect(debriefFlags(outcome(), false, id).replay).toBe(false)
  })

  it('no Replay on a failed campaign (AC30 owns the rest)', () => {
    expect(debriefFlags(outcome(), true, 'm03').replay).toBe(false)
  })
})
