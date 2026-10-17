import { beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_SQUAD, MISSIONS, operativeById } from '../game/data'
import { headlessDeploy } from '../game/deploy'
import { canDeploy } from '../game/deployGate'
import type { OperativeLoadout, SquadLoadout } from '../game/mass'
import { HINTS } from '../game/tutorial'
import type { OperativeDef } from '../game/types'
import { createWorld } from '../game/world'
import { useAppStore } from '../state/appStore'
import { initialCampaignData, useCampaignStore } from '../state/campaignStore'
import { useResearchStore } from '../state/researchStore'
import { useTutorialStore } from '../state/tutorialStore'
import { deployRefusalCopy } from './deployRefusal'
import { ABORT_ARM_HINT, abortArmHint } from './abortArm'
import {
  NEW_OPERATION_ERASE_HINT,
  NEW_OPERATION_START_HINT,
  newOperationArmHint,
} from './newOperationArm'

// P-01: while armed a reserved slot prints a hint naming the window and the
// consequence; disarm clears it (design/ux/interaction-patterns.md P-01,
// design/ux/main-menu.md Z5).
describe('P-01 armed hint slot', () => {
  it('Menu New Operation prints the erase hint when a save is on file', () => {
    expect(newOperationArmHint(true, true)).toBe('PRESS AGAIN WITHIN 3 S TO ERASE')
    expect(NEW_OPERATION_ERASE_HINT).toBe('PRESS AGAIN WITHIN 3 S TO ERASE')
  })

  it('Menu New Operation prints the start hint on a clean origin', () => {
    expect(newOperationArmHint(false, true)).toBe('PRESS AGAIN WITHIN 3 S TO START')
    expect(NEW_OPERATION_START_HINT).toBe('PRESS AGAIN WITHIN 3 S TO START')
  })

  it('Menu slot is empty while idle, so disarm clears it', () => {
    expect(newOperationArmHint(true, false)).toBe('')
    expect(newOperationArmHint(false, false)).toBe('')
  })

  it('Pause Abort prints its hint only while armed', () => {
    expect(abortArmHint(true)).toBe(ABORT_ARM_HINT)
    expect(ABORT_ARM_HINT).toMatch(/^PRESS AGAIN WITHIN 3 S TO /)
    expect(abortArmHint(false)).toBe('')
  })
})

// IF-012 (interface.md AC26): the heavy-tier speed-penalty advisory fires once
// per campaign at mission start, and an over-limit Assembly attempt is refused
// with its reason, never enters Mission and is not the advisory trigger.
describe('heavy-tier advisory and over-limit refusal (IF-012, AC26)', () => {
  // Every HP above the armour floor weighs ARMOR_KG_PER_HP; full med-kit slots
  // add 16 kg each. `extraHp` per operative tunes the squad onto a tier.
  const FULL: SquadLoadout = Object.fromEntries(
    DEFAULT_SQUAD.map((id) => [id, ['med', 'med'] as OperativeLoadout]),
  )
  const squadOps = (extraHp: number): OperativeDef[] =>
    DEFAULT_SQUAD.map((id) => ({ ...operativeById(id), maxHp: operativeById(id).maxHp + extraHp }))
  const deployMission = (ops: OperativeDef[]) => {
    const w = createWorld(MISSIONS[0], ops, headlessDeploy(MISSIONS[0], ops, { loadout: FULL }))
    w.tick(0.05) // startup() runs on the first tick
    return w
  }

  beforeEach(() => {
    useTutorialStore.getState().resetAll()
    useCampaignStore.setState(initialCampaignData())
    useResearchStore.setState({ done: [], labs: { ballistics: null, cybernetics: null, control: null } })
  })

  it('fixtures land on the intended tiers against the 380 / 400 kg literals', () => {
    const kg = (ops: OperativeDef[]) => headlessDeploy(MISSIONS[0], ops, { loadout: FULL }).roster.massKg
    expect(kg(squadOps(40))).toBeGreaterThan(380)
    expect(kg(squadOps(40))).toBeLessThanOrEqual(400)
    expect(kg(squadOps(80))).toBeGreaterThan(400)
    expect(kg(squadOps(0))).toBeLessThanOrEqual(380)
  })

  it('an unseen advisory and a valid heavy deployment show the hint once at mission start', () => {
    deployMission(squadOps(40))
    expect(useTutorialStore.getState().hints).toEqual(['hint-overweight'])
    expect(HINTS['hint-overweight'].body(() => '')).toMatch(/moves slower/)
  })

  it('a later valid heavy deployment in the same campaign does not repeat it', () => {
    deployMission(squadOps(40))
    useTutorialStore.getState().dismissHint('hint-overweight')
    deployMission(squadOps(40))
    expect(useTutorialStore.getState().hints).toEqual([])
    expect(useTutorialStore.getState().seen.filter((id) => id === 'hint-overweight')).toHaveLength(1)
  })

  it('a standard-tier deployment does not fire the advisory', () => {
    deployMission(squadOps(0))
    expect(useTutorialStore.getState().hints).not.toContain('hint-overweight')
  })

  it('an over-limit Assembly attempt is refused with its reason, stays out of Mission and fires no hint', () => {
    const ops = squadOps(80)
    useCampaignStore.setState({ operatives: ops })
    useAppStore.setState({ phase: 'team', missionId: MISSIONS[0].id, squad: [...DEFAULT_SQUAD], loadout: FULL })
    useAppStore.getState().startMission()
    expect(useAppStore.getState().phase).toBe('team')
    expect(useTutorialStore.getState().hints).toEqual([])
    expect(useTutorialStore.getState().seen).not.toContain('hint-overweight')
    const massKg = headlessDeploy(MISSIONS[0], ops, { loadout: FULL }).roster.massKg
    const gate = canDeploy({
      missionSelected: true,
      assignedIds: DEFAULT_SQUAD,
      statusById: Object.fromEntries(DEFAULT_SQUAD.map((id) => [id, 'READY' as const])),
      massKg,
    })
    expect(gate.reason).toBe('over-mass')
    expect(deployRefusalCopy(gate)?.[0]).toMatch(/^\d+\.\d KG OVER THE MASS LIMIT$/)
    // Control: the same attempt with a heavy but legal squad does enter Mission.
    useCampaignStore.setState({ operatives: squadOps(40) })
    useAppStore.getState().startMission()
    expect(useAppStore.getState().phase).toBe('mission')
  })
})
