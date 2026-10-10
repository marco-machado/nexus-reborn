import { beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_SQUAD, MISSIONS, operativeById } from './data'
import { freezeDeploy } from '../state/deployFreeze'
import { useWorldStore } from '../state/worldStore'
import { initialCampaignData, useCampaignStore } from '../state/campaignStore'
import { useResearchStore } from '../state/researchStore'
import { useAppStore } from '../state/appStore'
import { mulberry32 } from './rng'
import {
  DIFFICULTY_FX,
  DUSK_END,
  MISSION_CLOCK_BASE,
  OPENING_HOUR_START,
  OPENING_WINDOW_SEC,
  RUST_HAVEN_HOUR,
  adjacentWeather,
  clearerWeather,
  clearWeatherNote,
  difficultyNote,
  missionChance,
  missionClockAt,
  missionMods,
  missionPeriod,
  riskWeather,
  rollOpeningHour,
  rollWeatherFront,
  weatherAt,
  weatherBriefLabel,
  weatherNote,
} from './missionParams'

describe('sector extras', () => {
  it('unrest above 20 adds civilians and a street patrol; Control does not raise CorpSec hit points', () => {
    const mission = MISSIONS[0]
    const calm = missionMods(mission, { control: 80, unrest: 10 })
    const hot = missionMods(mission, { control: 80, unrest: 21 })
    const loose = missionMods(mission, { control: 40, unrest: 10 })
    expect(hot.civilianCount - calm.civilianCount).toBe(6)
    expect(hot.enemyExtra - calm.enemyExtra).toBe(1)
    expect(calm.enemyHpMul).toBe(loose.enemyHpMul)
    expect(hot.enemyHpMul).toBe(calm.enemyHpMul)
  })
})

describe('difficulty modifiers', () => {
  it('HARDENED adds patrols and civilians; STANDARD matches the authored baseline', () => {
    const mission = MISSIONS[0]
    const standard = missionMods(mission)
    const hardened = missionMods(mission, undefined, 'hardened')
    expect(hardened.enemyExtra - standard.enemyExtra).toBe(DIFFICULTY_FX.hardened.extraPatrol)
    expect(hardened.civilianCount - standard.civilianCount).toBe(
      DIFFICULTY_FX.hardened.extraCivilians,
    )
    expect(DIFFICULTY_FX.hardened.extraPatrol).toBe(2)
    expect(DIFFICULTY_FX.hardened.extraCivilians).toBe(6)
    expect(DIFFICULTY_FX.standard).toEqual({
      extraPatrol: 0,
      extraCivilians: 0,
      sightConfirmMul: 1,
      enemyAccMul: 1,
      visionAdd: 0,
      optFailMul: 1,
    })
    expect(standard.sightConfirmMul).toBe(1)
    expect(standard.enemyAccMul).toBe(1)
    expect(standard.visionAdd).toBe(0)
    expect(standard.optFailMul).toBe(1)
    expect(hardened.sightConfirmMul).toBe(DIFFICULTY_FX.hardened.sightConfirmMul)
    expect(hardened.enemyAccMul).toBe(DIFFICULTY_FX.hardened.enemyAccMul)
    expect(hardened.visionAdd).toBe(DIFFICULTY_FX.hardened.visionAdd)
    expect(hardened.optFailMul).toBe(DIFFICULTY_FX.hardened.optFailMul)
    expect(hardened.sightConfirmMul).toBeGreaterThan(1)
    expect(hardened.enemyAccMul).toBeGreaterThan(1)
    expect(hardened.visionAdd).toBeGreaterThan(0)
    expect(hardened.optFailMul).toBeLessThan(1)
    expect(missionMods(mission, undefined, 'standard')).toEqual(standard)
  })

  it('missionChance is lower on HARDENED than STANDARD for the same mission', () => {
    const mission = MISSIONS[0]
    const standard = missionMods(mission)
    const hardened = missionMods(mission, undefined, 'hardened')
    expect(missionChance(mission, hardened, 0)).toBeLessThan(missionChance(mission, standard, 0))
    expect(missionChance(mission, hardened, 4)).toBeLessThan(missionChance(mission, standard, 4))
  })

  it('prints HARDENED knobs in the same voice as weather notes', () => {
    expect(difficultyNote('standard')).toBe('')
    expect(difficultyNote('hardened')).toBe(
      'HARDENED PROFILE. GUARD SIGHT +1M. ACCURACY UP. CONFIRM SLOW. OPTIONAL WINDOWS TIGHT.',
    )
  })
})

describe('weather script', () => {
  it('keeps adjacent steps and treats clearer weather as the worse fight', () => {
    expect(adjacentWeather('heavy')).toEqual(['light'])
    expect(adjacentWeather('none')).toEqual(['light'])
    expect(adjacentWeather('light')).toEqual(['none', 'heavy'])
    expect(clearerWeather('heavy', 'light')).toBe('light')
    expect(riskWeather(MISSIONS[0])).toBe('light')
    expect(weatherAt(MISSIONS[0], 149)).toBe('heavy')
    expect(weatherAt(MISSIONS[0], 150)).toBe('light')
    expect(missionClockAt(150)).toBe('22:16:38')
    expect(weatherNote('heavy', { to: 'light', atSec: 150 })).toBe(
      'HEAVY RAIN. FRONT CLEARS 22:16:38.',
    )
    expect(missionClockAt(150, RUST_HAVEN_HOUR)).toBe('18:16:38')
    expect(weatherNote('heavy', { to: 'light', atSec: 150 }, RUST_HAVEN_HOUR)).toBe(
      'HEAVY RAIN. FRONT CLEARS 18:16:38.',
    )
  })

  it('names clear weather by period and keeps rain lines period-free', () => {
    expect(clearWeatherNote(MISSION_CLOCK_BASE)).toBe(
      'CLEAR NIGHT. GUARDS SEE AND HEAR AT FULL RANGE.',
    )
    expect(clearWeatherNote(RUST_HAVEN_HOUR)).toBe(
      'CLEAR DUSK. GUARDS SEE AND HEAR AT FULL RANGE.',
    )
    expect(weatherNote('none', undefined, RUST_HAVEN_HOUR)).toBe(
      'CLEAR DUSK. GUARDS SEE AND HEAR AT FULL RANGE.',
    )
    expect(weatherNote('light')).toBe('LIGHT RAIN. GUARD SIGHT MILDLY REDUCED.')
    expect(weatherBriefLabel(MISSIONS[0])).toBe('HEAVY RAIN → LIGHT RAIN 22:16:38')
    expect(weatherBriefLabel(MISSIONS[2]!)).toBe('CLEAR DUSK // 18:14:08')
  })

  it('rolls a front about two times in five on a seeded stream', () => {
    let fronts = 0
    const n = 200
    for (let i = 0; i < n; i++) {
      const rng = mulberry32((i + 1) * 0x9e3779b9)
      if (rollWeatherFront(rng, 'light')) fronts += 1
    }
    expect(fronts / n).toBeGreaterThan(0.25)
    expect(fronts / n).toBeLessThan(0.55)
  })
})

describe('opening hour', () => {
  it('treats [18:00, 20:00) as dusk and the rest of the window as night', () => {
    expect(missionPeriod(OPENING_HOUR_START)).toBe('dusk')
    expect(missionPeriod(RUST_HAVEN_HOUR)).toBe('dusk')
    expect(missionPeriod(DUSK_END - 1)).toBe('dusk')
    expect(missionPeriod(DUSK_END)).toBe('night')
    expect(missionPeriod(MISSION_CLOCK_BASE)).toBe('night')
    expect(missionPeriod(0)).toBe('night')
    expect(MISSIONS[0]?.openingHour).toBe(MISSION_CLOCK_BASE)
    expect(MISSIONS[1]?.openingHour).toBe(MISSION_CLOCK_BASE)
    expect(MISSIONS[2]?.openingHour).toBe(RUST_HAVEN_HOUR)
  })

  it('rolls a uniform minute inside the dusk-night window', () => {
    const n = 400
    let dusk = 0
    for (let i = 0; i < n; i++) {
      const rng = mulberry32((i + 1) * 0x9e3779b9)
      const hour = rollOpeningHour(rng)
      const wrapped = hour < OPENING_HOUR_START ? hour + 86400 : hour
      expect(wrapped).toBeGreaterThanOrEqual(OPENING_HOUR_START)
      expect(wrapped).toBeLessThan(OPENING_HOUR_START + OPENING_WINDOW_SEC)
      expect(hour % 60).toBe(0)
      if (missionPeriod(hour) === 'dusk') dusk += 1
    }
    expect(dusk / n).toBeGreaterThan(0.15)
    expect(dusk / n).toBeLessThan(0.45)
  })
})

// Story WN-004 / ADR-0009: deploy hands the Tactical mission a frozen World
// Network slice, cloned once by the composer, never a live store handle.
describe('deploy freeze: World Network slice', () => {
  const mission = MISSIONS[0]
  const squad = DEFAULT_SQUAD.map(operativeById)

  beforeEach(() => {
    useWorldStore.setState({
      sectors: { ...useWorldStore.getState().sectors, [mission.sector]: { control: 71, unrest: 23 } },
    })
    useCampaignStore.setState(initialCampaignData())
    useResearchStore.setState({ done: [] })
    useAppStore.setState({ loadout: {} })
  })

  it('carries exactly {sector id, Control, Unrest}; Intel is not a field', () => {
    const deploy = freezeDeploy(mission, squad, 1)
    expect(deploy.wn).toEqual({ sector: mission.sector, control: 71, unrest: 23 })
    expect(Object.keys(deploy.wn).sort()).toEqual(['control', 'sector', 'unrest'])
    expect(Object.keys(deploy).sort()).toEqual(
      ['district', 'economy', 'mods', 'research', 'roster', 'wn'],
    )
  })

  it('is a clone: later World Network changes do not reach it', () => {
    const live = useWorldStore.getState().sectors[mission.sector]
    const deploy = freezeDeploy(mission, squad, 1)
    expect(deploy.wn).not.toBe(live)
    useWorldStore.setState({
      sectors: { ...useWorldStore.getState().sectors, [mission.sector]: { control: 5, unrest: 95 } },
    })
    live.control = 0
    expect(deploy.wn).toEqual({ sector: mission.sector, control: 71, unrest: 23 })
  })

  it('holds no live store handle anywhere in DeployParams', () => {
    useResearchStore.setState({ done: ['b-propellants'] })
    useAppStore.setState({ loadout: { op1: ['med', null] } })
    const deploy = freezeDeploy(mission, squad, 1)
    const live = new Set<unknown>([
      useWorldStore.getState().sectors,
      useWorldStore.getState().sectors[mission.sector],
      useResearchStore.getState().done,
      useCampaignStore.getState().roster,
      useCampaignStore.getState().contractsWon,
      useAppStore.getState().loadout,
      useAppStore.getState().loadout.op1,
    ])
    const walk = (v: unknown): void => {
      expect(typeof v).not.toBe('function')
      if (v && typeof v === 'object') {
        expect(live.has(v)).toBe(false)
        for (const child of Object.values(v)) walk(child)
      }
    }
    walk(deploy)
  })

  it('freezes quietReplay as a boolean at create, from contractsWon', () => {
    const fresh = freezeDeploy(mission, squad, 1)
    useCampaignStore.setState({ contractsWon: [mission.id] })
    expect(fresh.economy.quietReplay).toBe(false)
    expect(freezeDeploy(mission, squad, 1).economy.quietReplay).toBe(true)
  })
})
