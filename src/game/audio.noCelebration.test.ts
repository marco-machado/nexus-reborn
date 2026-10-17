// AU-007 / audio GDD (TR-audio-004): no payout celebration sting, no
// mission-end sting on an Abort arm. Advisory mocked-context evidence for a
// Visual/Feel story: both audio bridges (the sim's `missionSfx` and the UI's
// `ui/sound`) are replaced with spies, so the test reads every request the
// mission end, the Debrief apply and the Abort arm make, independent of Web
// Audio. The listening pass in production/qa/evidence/au-007/ is the gate.
// Everything is deterministic: mission.seed drives the city, the sim is ticked
// by hand, and the Abort window runs on fake timers.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const bridge = vi.hoisted(() => ({
  gunshot: vi.fn(),
  reload: vi.fn(),
  confirmBlip: vi.fn(),
  alertSting: vi.fn(),
  objectiveChime: vi.fn(),
  deathThud: vi.fn(),
  blast: vi.fn(),
  interactTick: vi.fn(),
  abilityCue: vi.fn(),
  agentHit: vi.fn(),
  threatLevel: vi.fn(),
  weatherBed: vi.fn(),
}))
vi.mock('./audioBridge', () => ({ missionSfx: bridge }))

const ui = vi.hoisted(() => ({
  uiClick: vi.fn(),
  unlockAudio: vi.fn(),
  startStrategyBed: vi.fn(),
  stopStrategyBed: vi.fn(),
  startMissionBed: vi.fn(),
  stopMissionBed: vi.fn(),
}))
vi.mock('../ui/sound', () => ui)

import type { MissionDef, WorldApi } from './types'
import { createWorld } from './world'
import { headlessDeploy } from './deploy'
import { DEFAULT_SQUAD, MISSIONS, operativeById } from './data'
import { setWorld } from './runtime'
import { useMissionStore } from '../state/missionStore'
import { useAppStore } from '../state/appStore'
import { applyDebrief } from '../state/debrief'
import { abortMission } from '../state/missionLifecycle'
import { createAbortArm } from '../ui/abortArm'

const STEP = 0.05
// One required extract objective: standing in the extraction zone wins.
const EXTRACT_ONLY: MissionDef = {
  ...MISSIONS[0],
  objectives: [{ id: 'au7-x', label: 'EXTRACT THE SQUAD', kind: 'extract' }],
}

// The reference cue set the bridges expose (AU-002). A new mission-end,
// payout or spoken cue would have to be added here first.
const MISSION_CUES = [
  'abilityCue',
  'agentHit',
  'alertSting',
  'blast',
  'confirmBlip',
  'deathThud',
  'gunshot',
  'interactTick',
  'objectiveChime',
  'reload',
  'threatLevel',
  'weatherBed',
]

function spawn(m: MissionDef, quietReplay: boolean, prep: (w: WorldApi) => void = () => {}): WorldApi {
  const o = DEFAULT_SQUAD.map(operativeById)
  const w = createWorld(m, o, headlessDeploy(m, o, { quietReplay, applyKey: 1 }))
  prep(w)
  const ms = useMissionStore.getState()
  ms.reset()
  ms.setLive(true)
  useAppStore.setState({ outcome: null, lastAppliedKey: 0, phase: 'mission' })
  w.tick(STEP)
  return w
}

function standInExtraction(w: WorldApi): void {
  for (const u of w.units) {
    if (u.kind !== 'agent') continue
    u.pos.x = w.city.extraction.x
    u.pos.z = w.city.extraction.z
    u.path.length = 0
  }
}

function runToOutcome(w: WorldApi, maxSec = 10): void {
  const until = w.time + maxSec
  while (w.time < until && !useAppStore.getState().outcome) w.tick(STEP)
}

function allCalls(): number {
  return [...Object.values(bridge), ...Object.values(ui)].reduce((n, fn) => n + fn.mock.calls.length, 0)
}

function clearSpies(): void {
  for (const fn of [...Object.values(bridge), ...Object.values(ui)]) fn.mockClear()
}

beforeEach(clearSpies)
afterEach(() => {
  vi.useRealTimers()
  setWorld(null)
})

describe('no celebration sting at mission end or on Debrief (AU-007)', () => {
  it('a paid win reaches Debrief with no sting and nothing after the result', () => {
    const w = spawn(EXTRACT_ONLY, false)
    standInExtraction(w)
    runToOutcome(w)
    const outcome = useAppStore.getState().outcome
    expect(outcome?.won).toBe(true)
    expect(outcome?.quietReplay).toBe(false)
    expect(useAppStore.getState().phase).toBe('debrief')
    expect(bridge.alertSting).not.toHaveBeenCalled()
    // The result releases the drone (threatLevel 0) and nothing else plays.
    expect(bridge.threatLevel.mock.calls.every(([lvl]) => lvl === 0)).toBe(true)

    clearSpies()
    applyDebrief(EXTRACT_ONLY.id)
    expect(useAppStore.getState().lastAppliedKey).toBe(1)
    expect(allCalls()).toBe(0)
  })

  it('a quiet replay win stays paperwork-quiet: no sting on the result or the Debrief apply', () => {
    const w = spawn(EXTRACT_ONLY, true)
    standInExtraction(w)
    runToOutcome(w)
    const outcome = useAppStore.getState().outcome
    expect(outcome?.won).toBe(true)
    expect(outcome?.quietReplay).toBe(true)
    expect(bridge.alertSting).not.toHaveBeenCalled()

    clearSpies()
    applyDebrief(EXTRACT_ONLY.id)
    expect(allCalls()).toBe(0)
  })

  it('a loss (squad wiped) reaches Debrief with no sting', () => {
    // The squad is wiped before the first step, so the extract never completes.
    const w = spawn(EXTRACT_ONLY, false, (sim) => {
      for (const u of sim.units) if (u.kind === 'agent') u.stance = 'dead'
    })
    runToOutcome(w)
    expect(useAppStore.getState().outcome?.won).toBe(false)
    expect(bridge.alertSting).not.toHaveBeenCalled()

    clearSpies()
    applyDebrief(EXTRACT_ONLY.id)
    expect(allCalls()).toBe(0)
  })
})

describe('no mission-end sting on Abort (AU-007)', () => {
  it('arming Abort, letting it lapse, and re-arming request no audio at all', () => {
    vi.useFakeTimers()
    const arm = createAbortArm()
    expect(arm.press()).toBe('arm')
    vi.advanceTimersByTime(3000)
    expect(arm.armed).toBe(false)
    expect(arm.press()).toBe('arm')
    arm.disarm()
    // The Pause menu's own acknowledgement is one uiClick per press, made by
    // the component; the arm itself requests nothing.
    expect(allCalls()).toBe(0)
  })

  it('confirming Abort leaves for the World Network with no sting', () => {
    const w = spawn(EXTRACT_ONLY, false)
    setWorld(w)
    clearSpies()
    abortMission(EXTRACT_ONLY.id)
    expect(useAppStore.getState().phase).toBe('world')
    expect(useAppStore.getState().outcome).toBeNull()
    expect(bridge.alertSting).not.toHaveBeenCalled()
    expect(allCalls()).toBe(0)
  })
})

describe('the shipping cue set has no celebration or spoken cue (AU-007)', () => {
  it('the mission bridge exposes exactly the reference cues', async () => {
    const real = await vi.importActual<typeof import('./audioBridge')>('./audioBridge')
    expect(Object.keys(real.missionSfx).sort()).toEqual(MISSION_CUES)
  })
})
