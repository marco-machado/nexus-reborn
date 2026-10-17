// IF-008 (TR-interface-006, ADR-0002, ADR-0017): the mission pause modal and
// its two-step Abort. The arm runs on fake timers standing in for real time;
// the mission runs through the real composer, the real Hud abort and the real
// frame gate, so the boundary checked here is the one the game crosses.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ABORT_ARM_HINT, ABORT_ARM_MS, abortArmHint, createAbortArm, pressAbort } from './abortArm'
import { missionKeyAnswers, pauseBindingGroups, pauseMenuShown } from './pauseMenuModel'
import { BINDINGS, applyOverrides, bindingFor, remappable } from '../game/bindings'
import type { BindingId } from '../game/bindings'
import { DEFAULT_SQUAD, MISSIONS } from '../game/data'
import { tickIfLive } from '../game/frameTick'
import { getWorld, setWorld } from '../game/runtime'
import { useAppStore } from '../state/appStore'
import { initialCampaignData, useCampaignStore } from '../state/campaignStore'
import { abortMission, composeMission } from '../state/missionLifecycle'
import { useMissionStore } from '../state/missionStore'
import { SAVE_KEY, captureSave } from '../state/save'
import { useSettingsStore } from '../state/settingsStore'

const MISSION_ID = MISSIONS[0].id
// Empty objectives: ticking never ends the mission, so it stays in progress.
const BARE = { ...MISSIONS[0], objectives: [] }

const mem = new Map<string, string>()
const storage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => void mem.set(k, v),
  removeItem: (k: string) => void mem.delete(k),
}

// Team Deploy, then the real MissionScreen composer, then a few seconds of play.
function deployLive(): ReturnType<typeof composeMission>['world'] {
  useAppStore.setState({ phase: 'team', missionId: MISSION_ID, squad: [...DEFAULT_SQUAD] })
  useAppStore.getState().startMission()
  const { world } = composeMission(BARE, useAppStore.getState().squad)
  for (let i = 0; i < 40; i++) tickIfLive(world, useMissionStore.getState(), 0.05)
  expect(useMissionStore.getState().result).toBe('none')
  return world
}

// Space / Esc on the live mission, through the same gate scene/Input.tsx runs.
function pressPauseKey(code: 'Space' | 'Escape'): void {
  const b = bindingFor(code)
  expect(b?.id).toBe('pause')
  const ms = useMissionStore.getState()
  if (b && missionKeyAnswers(b.id, ms)) ms.setPaused(!ms.paused)
}

// Counts every outcome hand-off (the Debrief/invoice entry) across `fn`.
function countOutcomes(fn: () => void): number {
  const real = useAppStore.getState().setOutcome
  let calls = 0
  useAppStore.setState({ setOutcome: (o) => (calls++, real(o)) })
  try {
    fn()
  } finally {
    useAppStore.setState({ setOutcome: real })
  }
  return calls
}

beforeEach(() => {
  vi.useFakeTimers()
  mem.clear()
  vi.stubGlobal('window', { localStorage: storage })
  useSettingsStore.setState({ telemetry: false })
  useCampaignStore.setState(initialCampaignData())
  useAppStore.setState({ outcome: null, deploySerial: 0, lastAppliedKey: 0 })
  setWorld(null)
  useMissionStore.getState().reset()
})

afterEach(() => {
  vi.useRealTimers()
  setWorld(null)
  useMissionStore.getState().reset()
  applyOverrides({})
  useSettingsStore.setState({ overrides: {} })
  vi.unstubAllGlobals()
})

describe('AC11: Space or Escape opens a modal pause that freezes the mission', () => {
  it('both pause keys open the menu on a live mission with no result, and the sim stops', () => {
    for (const code of ['Space', 'Escape'] as const) {
      const world = deployLive()
      expect(pauseMenuShown(useMissionStore.getState())).toBe(false)
      pressPauseKey(code)
      expect(useMissionStore.getState().paused).toBe(true)
      expect(pauseMenuShown(useMissionStore.getState())).toBe(true)
      // The pause is not a phase change (ADR-0017 overlay rule).
      expect(useAppStore.getState().phase).toBe('mission')
      const t = world.time
      for (let i = 0; i < 100; i++) tickIfLive(world, useMissionStore.getState(), 0.05)
      expect(world.time).toBe(t)
      setWorld(null)
      useMissionStore.getState().reset()
    }
  })

  it('while paused only the pause key answers; every squad and camera order is held', () => {
    const paused = { paused: true, result: 'none' as const }
    for (const b of BINDINGS) {
      expect(missionKeyAnswers(b.id, paused)).toBe(b.id === 'pause')
    }
    const live = { paused: false, result: 'none' as const }
    for (const b of BINDINGS) expect(missionKeyAnswers(b.id, live)).toBe(true)
  })

  it('the menu does not show once a result is in, so Abort is never offered after a win or loss', () => {
    expect(pauseMenuShown({ paused: true, result: 'won' })).toBe(false)
    expect(pauseMenuShown({ paused: true, result: 'lost' })).toBe(false)
    expect(pauseMenuShown({ paused: false, result: 'none' })).toBe(false)
  })

  it('Resume unfreezes the sim', () => {
    const world = deployLive()
    pressPauseKey('Escape')
    // RESUME calls setPaused(false) (Hud onResume).
    useMissionStore.getState().setPaused(false)
    const t = world.time
    tickIfLive(world, useMissionStore.getState(), 0.05)
    expect(world.time).toBeGreaterThan(t)
  })

  it('the bindings print from the live BINDINGS table, every row in order', () => {
    const printed = pauseBindingGroups().flatMap((g) => g.rows.map((r) => r.id))
    const groups = ['camera', 'squad', 'abilities', 'mouse']
    const table = groups.flatMap((g) => BINDINGS.filter((b) => b.group === g).map((b) => b.id))
    expect(printed).toEqual(table)
    expect(pauseBindingGroups().map((g) => g.title)).toEqual(['CAMERA', 'SQUAD', 'ABILITIES', 'MOUSE'])
  })

  it('Abort is not a single click: the first press only arms', () => {
    expect(pressAbort(false)).toBe('arm')
    expect(pressAbort(true)).toBe('confirm')
  })
})

describe('AC12: the two-step Abort', () => {
  it('first activation arms and discards nothing; a second before expiry confirms with no Debrief, invoice or campaign write', () => {
    const before = captureSave()
    const changes: boolean[] = []
    const arm = createAbortArm((a) => changes.push(a))
    const calls = countOutcomes(() => {
      const world = deployLive()
      pressPauseKey('Escape')

      expect(arm.press()).toBe('arm')
      expect(arm.armed).toBe(true)
      expect(abortArmHint(arm.armed)).toBe(ABORT_ARM_HINT)
      // Arming discarded nothing: same world, same phase, still paused.
      expect(getWorld()).toBe(world)
      expect(useAppStore.getState().phase).toBe('mission')
      expect(useMissionStore.getState().paused).toBe(true)

      // Second activation inside the window, at the last real millisecond of
      // the spec's three seconds (a literal, not the module constant).
      vi.advanceTimersByTime(2999)
      expect(arm.armed).toBe(true)
      const what = arm.press()
      expect(what).toBe('confirm')
      // The Hud's onAbort runs immediately on 'confirm'.
      if (what === 'confirm') abortMission(MISSION_ID)
    })

    // Observed at the Abort boundary, before any later Screen tick or autosave.
    const app = useAppStore.getState()
    expect(calls).toBe(0)
    expect(app.phase).toBe('world')
    expect(app.outcome).toBeNull()
    expect(app.lastAppliedKey).toBe(0)
    expect(useMissionStore.getState().result).toBe('none')
    expect(mem.has(SAVE_KEY)).toBe(false)
    expect(mem.size).toBe(0)
    expect(captureSave()).toEqual(before)
    expect(changes).toEqual([true, false])
    expect(arm.armed).toBe(false)
  })

  it('three real seconds without confirmation disarm, the mission stays paused, and the next activation only re-arms', () => {
    const world = deployLive()
    pressPauseKey('Space')
    const t = world.time
    const arm = createAbortArm()
    const onAbort = vi.fn(() => abortMission(MISSION_ID))
    const activate = (): void => {
      if (arm.press() === 'confirm') onAbort()
    }

    activate()
    expect(arm.armed).toBe(true)
    // The window runs on real time while the Tactical clock is frozen.
    for (let i = 0; i < 60; i++) tickIfLive(world, useMissionStore.getState(), 0.05)
    expect(world.time).toBe(t)
    // Still armed one real millisecond short of three seconds, idle at three.
    vi.advanceTimersByTime(2999)
    expect(arm.armed).toBe(true)
    vi.advanceTimersByTime(1)
    expect(arm.armed).toBe(false)
    expect(abortArmHint(arm.armed)).toBe('')
    expect(useMissionStore.getState().paused).toBe(true)
    expect(useAppStore.getState().phase).toBe('mission')
    expect(getWorld()).toBe(world)

    // The next activation after the lapse arms again; it does not abort.
    activate()
    expect(arm.armed).toBe(true)
    expect(onAbort).not.toHaveBeenCalled()
    expect(useAppStore.getState().phase).toBe('mission')
  })

  it('the window constant is the spec three real seconds', () => {
    expect(ABORT_ARM_MS).toBe(3000)
  })

  it('disarm (menu closed) drops the window without confirming', () => {
    const changes: boolean[] = []
    const arm = createAbortArm((a) => changes.push(a))
    arm.press()
    arm.disarm()
    expect(arm.armed).toBe(false)
    vi.advanceTimersByTime(ABORT_ARM_MS * 2)
    expect(changes).toEqual([true, false])
    expect(arm.press()).toBe('arm')
  })
})

describe('EC-remap: Settings opened from pause', () => {
  it('a remapped key shows in the pause bindings list on return', () => {
    useMissionStore.getState().setPaused(true)
    const row = (id: BindingId) => pauseBindingGroups().flatMap((g) => g.rows).find((r) => r.id === id)
    expect(row('stop')?.keys).toEqual(['X'])
    // The Settings capture commits through the store, which swaps the live table.
    useSettingsStore.getState().setBindingOverride('stop', ['KeyZ'])
    expect(row('stop')?.keys).toEqual(['Z'])
    // Settings stays inside the freeze.
    expect(useMissionStore.getState().paused).toBe(true)
  })

  it('Pause, operative slots 1-4 and mouse rows are not offered for remap', () => {
    const byId = (id: BindingId) => BINDINGS.find((b) => b.id === id)!
    expect(remappable(byId('pause'))).toBe(false)
    expect(remappable(byId('selectSlot'))).toBe(false)
    for (const b of BINDINGS.filter((x) => x.group === 'mouse')) expect(remappable(b)).toBe(false)
    expect(remappable(byId('stop'))).toBe(true)
    // An attempt to remap them is dropped and the defaults stand.
    useSettingsStore.getState().setBindingOverride('pause', ['KeyP'])
    expect(bindingFor('Space')?.id).toBe('pause')
    expect(bindingFor('KeyP')).toBeUndefined()
  })
})
