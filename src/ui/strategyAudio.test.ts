import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppStore } from '../state/appStore'
import { useSettingsStore } from '../state/settingsStore'
import { bindStrategyBed } from './strategyAudio'
import { startStrategyBed, stopStrategyBed } from './sound'

vi.mock('./sound', () => ({ startStrategyBed: vi.fn(), stopStrategyBed: vi.fn() }))

let dispose: (() => void) | undefined
beforeEach(() => {
  useAppStore.setState({ phase: 'menu' })
  vi.clearAllMocks()
})
afterEach(() => {
  dispose?.()
  dispose = undefined
})

describe('strategy music across screen transitions', () => {
  it('keeps one bed across World Network, Research, Brief and Assembly', () => {
    dispose = bindStrategyBed()
    expect(startStrategyBed).not.toHaveBeenCalled()
    for (const phase of ['world', 'research', 'brief', 'team', 'world'] as const) {
      useAppStore.setState({ phase })
    }
    useAppStore.setState({ credits: 123 })
    expect(startStrategyBed).toHaveBeenCalledTimes(1)
    expect(stopStrategyBed).not.toHaveBeenCalled()
  })

  it('stops on deployment, stays stopped in debrief, and starts on return', () => {
    useAppStore.setState({ phase: 'team' })
    dispose = bindStrategyBed()
    useAppStore.setState({ phase: 'mission' })
    useAppStore.setState({ phase: 'debrief' })
    expect(startStrategyBed).toHaveBeenCalledTimes(1)
    expect(stopStrategyBed).toHaveBeenCalledTimes(1)
    useAppStore.setState({ phase: 'world' })
    expect(startStrategyBed).toHaveBeenCalledTimes(2)
  })

  it('settings changes (overlay sliders, mute) neither stop nor restart the bed', () => {
    useAppStore.setState({ phase: 'research' })
    dispose = bindStrategyBed()
    useSettingsStore.getState().setMuted(true)
    useSettingsStore.getState().setMuted(false)
    expect(useAppStore.getState().phase).toBe('research')
    expect(startStrategyBed).toHaveBeenCalledTimes(1)
    expect(stopStrategyBed).not.toHaveBeenCalled()
  })

  it('stops on menu and detaches when the app unmounts', () => {
    useAppStore.setState({ phase: 'world' })
    dispose = bindStrategyBed()
    useAppStore.setState({ phase: 'menu' })
    expect(stopStrategyBed).toHaveBeenCalledTimes(1)
    dispose()
    dispose = undefined
    useAppStore.setState({ phase: 'world' })
    expect(startStrategyBed).toHaveBeenCalledTimes(1)
  })
})
