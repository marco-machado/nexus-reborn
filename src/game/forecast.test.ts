import { describe, expect, it } from 'vitest'
import {
  EVENT_MIN_SEC,
  EVENT_SPAN_SEC,
  FORECAST_KINDS,
  eventForecast,
  kindWeights,
  missionRisk,
  sectorEventWeight,
} from './forecast'
import { MISSIONS } from './data'
import { missionMods, riskWeather, weatherMul } from './missionParams'
import { useResearchStore } from '../state/researchStore'
import type { SectorForecastInput } from './forecast'

const INPUTS: SectorForecastInput[] = [
  { sector: 'na', unrest: 12, crisis: false },
  { sector: 'eu', unrest: 18, crisis: false },
  { sector: 'af', unrest: 60, crisis: false },
]

describe('generator weights', () => {
  it('covers every rollable kind, floored above zero at any unrest', () => {
    for (const unrest of [0, 40, 96]) {
      const table = kindWeights(unrest)
      expect(table.map(([kind]) => kind)).toEqual([...FORECAST_KINDS])
      for (const [, w] of table) expect(w).toBeGreaterThan(0)
    }
  })

  it('unrest raises the violent kinds and lowers trade', () => {
    const calm = Object.fromEntries(kindWeights(5))
    const hot = Object.fromEntries(kindWeights(70))
    expect(hot.riot).toBeGreaterThan(calm.riot)
    expect(hot.raid).toBeGreaterThan(calm.raid)
    expect(hot.trade).toBeLessThan(calm.trade)
  })

  it('crisis doubles a sector selection weight', () => {
    // Living spec §5 World Events: crisis doubles how often events pick that sector.
    expect(sectorEventWeight(40, true)).toBe(2 * sectorEventWeight(40, false))
    expect(sectorEventWeight(60, false)).toBeGreaterThan(sectorEventWeight(10, false))
  })

  it('keeps the generator pacing constants', () => {
    expect(EVENT_MIN_SEC).toBe(900)
    expect(EVENT_SPAN_SEC).toBe(1800)
  })
})

describe('event forecast', () => {
  it('returns one bounded chance per rollable kind for the focused sector', () => {
    const rows = eventForecast(INPUTS, 'eu')
    expect(rows.map((r) => r.kind)).toEqual([...FORECAST_KINDS])
    for (const r of rows) {
      expect(r.chance).toBeGreaterThanOrEqual(0)
      expect(r.chance).toBeLessThanOrEqual(100)
    }
    expect(eventForecast(INPUTS, 'oc')).toEqual([])
  })

  it('a restless sector forecasts more riots than a calm one', () => {
    const calm = eventForecast(INPUTS, 'na').find((r) => r.kind === 'riot')
    const hot = eventForecast(INPUTS, 'af').find((r) => r.kind === 'riot')
    expect(hot!.chance).toBeGreaterThan(calm!.chance)
  })

  it('crisis raises every chance in the sector it hits', () => {
    const flat = eventForecast(INPUTS, 'eu')
    const inCrisis = eventForecast(
      INPUTS.map((i) => (i.sector === 'eu' ? { ...i, crisis: true } : i)),
      'eu',
    )
    for (let i = 0; i < flat.length; i++) {
      expect(inCrisis[i].chance).toBeGreaterThan(flat[i].chance)
    }
  })
})

describe('mission risk', () => {
  it('grades the authored ladder: industrial calm low, checkpoint severe high', () => {
    // Counts measured from the three authored deployments.
    const light = missionRisk(
      { patrols: 3, garrison: 4, civilians: 8 },
      { enemyHpMul: 1, visionMul: 1 },
    )
    const heavy = missionRisk(
      { patrols: 8, garrison: 7, civilians: 22 },
      { enemyHpMul: 1.2, visionMul: 0.8 },
    )
    expect(light.band).toBe('GUARDED')
    expect(heavy.band).toBe('SEVERE')
    expect(heavy.index).toBeGreaterThan(light.index)
  })

  it('tougher garrisons raise risk and rain lowers it', () => {
    const counts = { patrols: 5, garrison: 5, civilians: 12 }
    const base = missionRisk(counts, { enemyHpMul: 1, visionMul: 1 })
    const tough = missionRisk(counts, { enemyHpMul: 1.2, visionMul: 1 })
    const rain = missionRisk(counts, { enemyHpMul: 1, visionMul: 0.8 })
    expect(tough.index).toBeGreaterThan(base.index)
    expect(rain.index).toBeLessThan(base.index)
  })

  it('never grades an empty district above LOW', () => {
    const empty = missionRisk(
      { patrols: 0, garrison: 0, civilians: 0 },
      { enemyHpMul: 1, visionMul: 1 },
    )
    expect(empty.index).toBe(0)
    expect(empty.band).toBe('LOW')
  })
})

// RS-020 / research.md (TR-research-004): Risk index is Tactical / Brief's and
// reads deployment counts, toughness and clearer-weather sight only. Completing
// research changes none of its inputs, so index and band hold.
describe('mission risk ignores the completed program (RS-020)', () => {
  it('done empty -> [Propellants, Interface I] leaves missionRisk index and band unchanged', () => {
    const mission = MISSIONS[0]
    const counts = { patrols: 6, garrison: 4, civilians: 14 }
    // Inputs built the way the Brief readout builds them (ui/index.tsx).
    const riskFor = () => {
      const mods = missionMods(mission)
      return missionRisk(counts, {
        enemyHpMul: mods.enemyHpMul,
        visionMul: weatherMul(riskWeather(mission)).visionMul,
      })
    }
    useResearchStore.setState({ done: [] })
    const before = riskFor()
    useResearchStore.setState({ done: ['b-propellants', 'c-interface'] })
    const after = riskFor()
    expect(after).toEqual(before)
    expect(after.index).toBe(before.index)
    expect(after.band).toBe(before.band)
    useResearchStore.setState({ done: [] })
  })
})

// TM-009 (Sprint 8, story 009; TR-tactical-004, GDD tactical-mission AC 26):
// risk_index = round(((4p + 5g) × h + 0.5c) × (0.7 + 0.3v)); bands at 30 /
// 50 / 75. Literals are pinned from the GDD, not read from the module.
describe('risk index formula (TM-009, AC 26)', () => {
  const FLAT = { enemyHpMul: 1, visionMul: 1 }

  it('p=8, g=7, c=22, h=1.2, v=0.9 gives index 89, band Severe', () => {
    const risk = missionRisk({ patrols: 8, garrison: 7, civilians: 22 }, { enemyHpMul: 1.2, visionMul: 0.9 })
    expect(risk).toEqual({ index: 89, band: 'SEVERE' })
  })

  it('band edges sit at 29/30, 49/50 and 74/75', () => {
    // With h = v = 1 the index is round(0.5c), so c = 2 × index.
    const at = (index: number) => missionRisk({ patrols: 0, garrison: 0, civilians: index * 2 }, FLAT)
    expect(at(29)).toEqual({ index: 29, band: 'LOW' })
    expect(at(30)).toEqual({ index: 30, band: 'GUARDED' })
    expect(at(49)).toEqual({ index: 49, band: 'GUARDED' })
    expect(at(50)).toEqual({ index: 50, band: 'HIGH' })
    expect(at(74)).toEqual({ index: 74, band: 'HIGH' })
    expect(at(75)).toEqual({ index: 75, band: 'SEVERE' })
  })

  it('the index is not capped at 100', () => {
    // (4·20 + 5·20) × 1 + 0.5·40 = 200.
    expect(missionRisk({ patrols: 20, garrison: 20, civilians: 40 }, FLAT)).toEqual({
      index: 200,
      band: 'SEVERE',
    })
  })

  it('v reads the clearer weather on the script, not the live weather after a front', () => {
    const counts = { patrols: 8, garrison: 7, civilians: 22 }
    const base = MISSIONS[0]
    // Light rain (v = 0.9) into heavy (v = 0.8): the clearer is light.
    const worsening = { ...base, weather: 'light' as const, weatherFront: { to: 'heavy' as const, atSec: 120 } }
    // Heavy into light: the clearer is still light.
    const lifting = { ...base, weather: 'heavy' as const, weatherFront: { to: 'light' as const, atSec: 120 } }
    for (const m of [worsening, lifting]) {
      expect(riskWeather(m)).toBe('light')
      const risk = missionRisk(counts, { enemyHpMul: 1.2, visionMul: weatherMul(riskWeather(m)).visionMul })
      expect(risk).toEqual({ index: 89, band: 'SEVERE' })
    }
    // Live heavy weather after the worsening front would have read lower.
    expect(missionRisk(counts, { enemyHpMul: 1.2, visionMul: 0.8 }).index).toBeLessThan(89)
  })
})
