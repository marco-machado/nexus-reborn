// AU-005: a cue requested while the lazily imported audio module is still
// loading is not replayed stale once it arrives. These tests vi.doMock('./audio')
// and live in their own file: the stale mock meta that doUnmock + resetModules
// leave on the audio.ts node made ./audio resolve to an empty module in later
// audio.test.ts suites (AU-006 `audio.unlockAudio is not a function`).
import { afterEach, describe, expect, it, vi } from 'vitest'

describe('module-load freshness evidence (AU-005)', () => {
  afterEach(() => {
    vi.doUnmock('./audio')
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  async function settle(): Promise<void> {
    for (let i = 0; i < 40; i++) await Promise.resolve()
  }

  // Defers resolution of the lazily imported audio module until `release()`.
  function deferAudioModule() {
    const uiClick = vi.fn()
    let release: () => void = () => undefined
    const ready = new Promise<void>((r) => {
      release = r
    })
    vi.doMock('./audio', async () => {
      await ready
      return { sfx: { uiClick, gunshot: uiClick } }
    })
    return { uiClick, release }
  }

  it('a UI click made while the module loads is not replayed once the module arrives stale', async () => {
    vi.resetModules()
    const { CUE_FRESHNESS_WINDOW_S } = await import('./audioFreshness')
    const { uiClick, release } = deferAudioModule()
    const now = vi.spyOn(performance, 'now').mockReturnValue(1000)
    const sound = await import('../ui/sound')
    sound.uiClick()
    now.mockReturnValue(1000 + (CUE_FRESHNESS_WINDOW_S + 0.01) * 1000)
    release()
    await settle()
    expect(uiClick).not.toHaveBeenCalled()
    // Once usable, a new click plays exactly once.
    sound.uiClick()
    expect(uiClick).toHaveBeenCalledTimes(1)
  })

  it('a UI click whose module arrives inside the freshness window is played once', async () => {
    vi.resetModules()
    const { CUE_FRESHNESS_WINDOW_S } = await import('./audioFreshness')
    const { uiClick, release } = deferAudioModule()
    const now = vi.spyOn(performance, 'now').mockReturnValue(1000)
    const sound = await import('../ui/sound')
    sound.uiClick()
    now.mockReturnValue(1000 + (CUE_FRESHNESS_WINDOW_S / 2) * 1000)
    release()
    await vi.waitFor(() => expect(uiClick).toHaveBeenCalledTimes(1))
  })

  it('mission one-shots requested while the module loads are dropped, not replayed on arrival', async () => {
    vi.resetModules()
    const { uiClick: gunshot, release } = deferAudioModule()
    const { missionSfx } = await import('./audioBridge')
    expect(() => missionSfx.gunshot('assault')).not.toThrow()
    release()
    await settle()
    expect(gunshot).not.toHaveBeenCalled()
  })

  it('a failed module load leaves the UI bridge usable and silent', async () => {
    vi.resetModules()
    vi.doMock('./audio', () => {
      throw new Error('chunk failed')
    })
    const sound = await import('../ui/sound')
    expect(() => {
      sound.uiClick()
      sound.unlockAudio()
      sound.startStrategyBed()
    }).not.toThrow()
    await settle()
  })
})
