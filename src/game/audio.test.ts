import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  BUSES,
  getAudioLevels,
  playerFactor,
  gunClipUrl,
  MISSION_BED_URLS,
  missionRainGain,
  pickMissionBedUrl,
  setAudioLevels,
  setMissionBedWeather,
  sfx,
  startMissionBed,
  startStrategyBed,
  stopMissionBed,
  stopStrategyBed,
  unlockAudio,
} from './audio'
import { CLIPS } from './sfxClips'

const WEAPONS = ['assault', 'smg', 'pistol', 'longrifle', 'shotgun'] as const

describe('audio beds', () => {
  it('start and stop entry points do not throw without an AudioContext', () => {
    expect(() => setAudioLevels({ music: 0.4, ambience: 0.6 })).not.toThrow()
    expect(() => startStrategyBed()).not.toThrow()
    expect(() => startMissionBed()).not.toThrow()
    expect(() => stopStrategyBed()).not.toThrow()
    expect(() => stopMissionBed()).not.toThrow()
    expect(() => unlockAudio()).not.toThrow()
    expect(() => setMissionBedWeather('none')).not.toThrow()
    expect(() => setMissionBedWeather('heavy')).not.toThrow()
  })

  it('silences the rain-hiss on clear weather and keeps it audible in rain', () => {
    expect(missionRainGain('none')).toBeLessThan(0.01)
    expect(missionRainGain('light')).toBeGreaterThan(missionRainGain('none'))
    expect(missionRainGain('heavy')).toBeGreaterThan(missionRainGain('light'))
  })

  it('the pipeline stores independent music and ambience stage factors', () => {
    setAudioLevels({ music: 0.4, ambience: 0.6, master: 1, ui: 1, combat: 1 })
    expect(getAudioLevels()).toMatchObject({ music: 0.4, ambience: 0.6 })
    setAudioLevels({ music: 0, ambience: 1 })
    expect(getAudioLevels().music).toBe(0)
    expect(getAudioLevels().ambience).toBe(1)
  })

  it('picks the mission bed uniformly from the three clips, with no world arguments', () => {
    expect(MISSION_BED_URLS).toHaveLength(3)
    expect(new Set(MISSION_BED_URLS).size).toBe(3)
    expect(pickMissionBedUrl.length).toBe(0)
    for (let i = 0; i < 40; i++) {
      expect(MISSION_BED_URLS).toContain(pickMissionBedUrl())
    }
  })
})

describe('clip map', () => {
  it('gives CorpSec a distinct file from the squad for every weapon', () => {
    for (const id of WEAPONS) {
      const squad = gunClipUrl(id)
      const corpsec = gunClipUrl(id, 'corpsec')
      expect(gunClipUrl(id, 'squad')).toBe(squad)
      expect(corpsec).not.toBe(squad)
      expect(corpsec).toContain('-corpsec')
      expect(squad).not.toContain('-corpsec')
    }
  })

  it('maps rain intensity to the matching loop file', () => {
    expect(CLIPS.rainLight).not.toBe(CLIPS.rainHeavy)
    expect(CLIPS.rainLight).toContain('rain-light')
    expect(CLIPS.rainHeavy).toContain('rain-heavy')
  })
})

describe('radio acknowledgements and side voices', () => {
  it('sfx entry points do not throw without an AudioContext, with or without side', () => {
    expect(() => sfx.gunshot('assault')).not.toThrow()
    expect(() => sfx.gunshot('assault', 'squad')).not.toThrow()
    expect(() => sfx.gunshot('pistol', 'corpsec')).not.toThrow()
    expect(() => sfx.confirmBlip()).not.toThrow()
    expect(() => sfx.alertSting()).not.toThrow()
    expect(() => sfx.objectiveChime()).not.toThrow()
    expect(() => sfx.abilityCue()).not.toThrow()
    expect(() => sfx.uiClick()).not.toThrow()
    expect(() => sfx.reload()).not.toThrow()
    expect(() => sfx.blast()).not.toThrow()
    expect(() => sfx.deathThud()).not.toThrow()
    expect(() => sfx.agentHit()).not.toThrow()
    expect(() => sfx.interactTick()).not.toThrow()
    expect(() => sfx.threatLevel(0)).not.toThrow()
    expect(() => sfx.weatherBed('none')).not.toThrow()
  })
})

type Started = { url: string; loop: boolean; dest: unknown }

// `hold` keeps a matching fetch in flight until `release(url)` is called, so a
// test can stop a bed while its clip is still loading.
function installMockAudio(hold: (url: string) => boolean = () => false) {
  const started: Started[] = []
  const sources: unknown[] = []
  const pendingUrls: string[] = []
  const fetched: string[] = []

  class FakeParam {
    value = 0
    setValueAtTime(v: number) {
      this.value = v
    }
    exponentialRampToValueAtTime(v: number) {
      this.value = v
    }
    cancelScheduledValues() {}
  }

  class FakeNode {
    dest: unknown = null
    connect(next: unknown) {
      this.dest = next
      return next
    }
    disconnect = vi.fn()
  }

  class FakeGain extends FakeNode {
    gain = new FakeParam()
  }

  class FakeSource extends FakeNode {
    buffer: { url: string; duration: number } | null = null
    loop = false
    playbackRate = { value: 1 }
    onended: (() => void) | null = null
    start() {
      started.push({
        url: this.buffer?.url ?? '',
        loop: this.loop,
        dest: this.dest,
      })
    }
    stop = vi.fn()
  }

  class FakeOsc extends FakeNode {
    type = 'sine'
    frequency = new FakeParam()
    start() {}
    stop() {}
  }

  class FakeFilter extends FakeNode {
    type = 'lowpass'
    Q = new FakeParam()
    frequency = new FakeParam()
  }

  class FakeCtx {
    currentTime = 0
    state = 'running'
    destination = new FakeNode()
    sampleRate = 48000
    createGain() {
      return new FakeGain()
    }
    createDynamicsCompressor() {
      return Object.assign(new FakeNode(), {
        threshold: new FakeParam(), knee: new FakeParam(), ratio: new FakeParam(),
        attack: new FakeParam(), release: new FakeParam(),
      })
    }
    createBufferSource() {
      const src = new FakeSource()
      sources.push(src)
      return src
    }
    createOscillator() {
      return new FakeOsc()
    }
    createBiquadFilter() {
      return new FakeFilter()
    }
    decodeAudioData() {
      return Promise.resolve({ url: pendingUrls.shift() ?? '', duration: 0.5 })
    }
    resume() {
      return Promise.resolve()
    }
  }

  const context = new FakeCtx()
  vi.stubGlobal('AudioContext', class { constructor() { return context } })
  const held = new Map<string, () => void>()
  vi.stubGlobal('fetch', (url: string | URL) => {
    const href = String(url)
    fetched.push(href)
    const response = () => {
      pendingUrls.push(href)
      return { ok: true, arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)) }
    }
    if (!hold(href)) return Promise.resolve(response())
    return new Promise((resolve) => held.set(href, () => resolve(response())))
  })
  const release = (url: string) => {
    const go = held.get(url)
    held.delete(url)
    go?.()
  }

  return { started, sources: sources as FakeSource[], fetched, context, release }
}

describe('clip playback', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('bounds overlapping gunfire across both sides while leaving room for an alert', async () => {
    vi.resetModules()
    const { sources, context } = installMockAudio()
    const audio = await import('./audio')
    audio.unlockAudio()
    for (let i = 0; i < 20; i++) await Promise.resolve()
    for (let i = 0; i < 30; i++) {
      context.currentTime = i * 0.03
      audio.sfx.gunshot(WEAPONS[i % WEAPONS.length], i % 2 ? 'corpsec' : 'squad')
      for (let j = 0; j < 4; j++) await Promise.resolve()
    }
    await vi.waitFor(() => expect(sources.length).toBeGreaterThan(0))
    expect(sources.filter((s) => s.stop.mock.calls.length === 0).length).toBeLessThanOrEqual(6)
    const before = sources.length
    audio.sfx.alertSting()
    await vi.waitFor(() => expect(sources.length).toBe(before + 1))
  })

  it('drops sounds that finish loading after their event is stale', async () => {
    vi.resetModules()
    const { started, context } = installMockAudio()
    const audio = await import('./audio')
    audio.sfx.uiClick()
    context.currentTime = 2
    for (let i = 0; i < 20; i++) await Promise.resolve()
    expect(started).toHaveLength(0)
  })

  it('varies repeated gunshots and releases their audio nodes when they end', async () => {
    vi.resetModules()
    const { sources, context } = installMockAudio()
    const audio = await import('./audio')
    vi.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(1)
    audio.sfx.gunshot('pistol')
    await vi.waitFor(() => expect(sources).toHaveLength(1))
    context.currentTime = 0.1
    audio.sfx.gunshot('pistol')
    await vi.waitFor(() => expect(sources).toHaveLength(2))
    expect(sources[0].playbackRate.value).not.toBe(sources[1].playbackRate.value)
    expect(sources.every((s) => s.playbackRate.value >= 0.96 && s.playbackRate.value <= 1.04)).toBe(true)
    sources[0].onended?.()
    expect(sources[0].disconnect).toHaveBeenCalled()
  })

  it("gunshot with 'corpsec' requests the corpsec file, not the squad file", async () => {
    vi.resetModules()
    const { started } = installMockAudio()
    const { sfx: liveSfx, gunClipUrl: liveUrl } = await import('./audio')
    liveSfx.gunshot('pistol', 'corpsec')
    await vi.waitFor(() => {
      expect(started.some((s) => s.url === liveUrl('pistol', 'corpsec'))).toBe(true)
    })
    expect(started.some((s) => s.url === liveUrl('pistol', 'squad'))).toBe(false)
    expect(liveUrl('pistol', 'corpsec')).toContain('-corpsec')
  })

  it("gunshot with 'squad' requests the squad file", async () => {
    vi.resetModules()
    const { started } = installMockAudio()
    const { sfx: liveSfx, gunClipUrl: liveUrl } = await import('./audio')
    liveSfx.gunshot('assault', 'squad')
    await vi.waitFor(() => {
      expect(started.some((s) => s.url === liveUrl('assault', 'squad'))).toBe(true)
    })
    expect(started.some((s) => s.url === liveUrl('assault', 'corpsec'))).toBe(false)
  })

  it('alert sting plays one combat clip and does not start extra sources', async () => {
    vi.resetModules()
    const { started, sources } = installMockAudio()
    const { sfx: liveSfx } = await import('./audio')
    const { CLIPS: liveClips } = await import('./sfxClips')
    const before = sources.length
    liveSfx.alertSting()
    await vi.waitFor(() => {
      expect(started.some((s) => s.url === liveClips.alertSting && !s.loop)).toBe(true)
    })
    expect(started.filter((s) => s.url === liveClips.alertSting)).toHaveLength(1)
    expect(sources.length - before).toBe(1)
  })

  it('weather none does not start a rain source', async () => {
    vi.resetModules()
    const { started, fetched } = installMockAudio()
    const { startMissionBed: start } = await import('./audio')
    start()
    await vi.waitFor(() => {
      expect(started.some((s) => s.loop)).toBe(true)
    })
    expect(fetched.some((u) => u.includes('rain-'))).toBe(false)
    expect(started.some((s) => s.url.includes('rain-'))).toBe(false)
  })

  it('weather light / heavy pick the matching loop', async () => {
    vi.resetModules()
    const { started } = installMockAudio()
    const { startMissionBed: start, setMissionBedWeather: setWeather } = await import('./audio')
    const { CLIPS: liveClips } = await import('./sfxClips')
    start()
    setWeather('light')
    await vi.waitFor(() => {
      expect(started.some((s) => s.url === liveClips.rainLight && s.loop)).toBe(true)
    })
    setWeather('heavy')
    await vi.waitFor(() => {
      expect(started.some((s) => s.url === liveClips.rainHeavy && s.loop)).toBe(true)
    })
  })
})

// AU-001 / audio GDD Formulas `staged_gain`: master and mute apply once, at
// the master stage; each channel stage carries only its own factor. Literals
// pinned from the GDD, not from the module's constants.
describe('mixer buses and staged gain (AU-001)', () => {
  afterEach(() => {
    setAudioLevels({ master: 1, ui: 1, combat: 1, music: 1, ambience: 1 })
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('has exactly four buses: ui, combat, music, ambience', () => {
    expect([...BUSES]).toEqual(['ui', 'combat', 'music', 'ambience'])
  })

  it('master 0.5 × combat 0.8 reads 0.4; mute (master 0) reads 0; restoring master reads 0.4', () => {
    setAudioLevels({ master: 0.5, ui: 1, combat: 0.8, music: 1, ambience: 1 })
    expect(playerFactor('combat')).toBeCloseTo(0.4, 10)
    expect(playerFactor('ui')).toBeCloseTo(0.5, 10)
    setAudioLevels({ master: 0 })
    expect(playerFactor('combat')).toBe(0)
    expect(getAudioLevels().combat).toBeCloseTo(0.8, 10)
    setAudioLevels({ master: 0.5 })
    expect(playerFactor('combat')).toBeCloseTo(0.4, 10)
  })

  it('wires four bus gains into master, then a compressor, then the destination', async () => {
    vi.resetModules()
    const { context } = installMockAudio()
    const gains: { gain: { value: number }; dest: unknown }[] = []
    const comps: unknown[] = []
    const createGain = context.createGain.bind(context)
    const createComp = context.createDynamicsCompressor.bind(context)
    context.createGain = () => {
      const g = createGain()
      gains.push(g)
      return g
    }
    context.createDynamicsCompressor = () => {
      const c = createComp()
      comps.push(c)
      return c
    }
    const audio = await import('./audio')
    audio.unlockAudio()
    // Graph build: one master, four buses, one compressor — no fifth bus.
    expect(gains).toHaveLength(5)
    expect(comps).toHaveLength(1)
    const [masterNode, ui, combat, music, ambience] = gains
    expect(masterNode.dest).toBe(comps[0])
    expect((comps[0] as { dest: unknown }).dest).toBe(context.destination)
    for (const bus of [ui, combat, music, ambience]) expect(bus.dest).toBe(masterNode)

    audio.setAudioLevels({ master: 0.5, ui: 0.3, combat: 0.8, music: 0.6, ambience: 0.7 })
    // Master lands once, on the master node (authored base 0.25)...
    expect(masterNode.gain.value).toBeCloseTo(0.25 * 0.5, 10)
    // ...and each bus node carries only its own factor (authored dB bases).
    // Distinct factors per bus, so a dropped or swapped channel fails.
    const busValues = (): number[] => [ui, combat, music, ambience].map((n) => n.gain.value)
    const expectedBuses = [10 ** (-3 / 20) * 0.3, 10 ** (-1.5 / 20) * 0.8, 0.6, 0.7]
    busValues().forEach((v, i) => expect(v).toBeCloseTo(expectedBuses[i], 10))

    // Each channel control changes only its own bus node.
    audio.setAudioLevels({ music: 0.2 })
    expect(music.gain.value).toBeCloseTo(0.2, 10)
    expect(ambience.gain.value).toBeCloseTo(0.7, 10)
    expect(ui.gain.value).toBeCloseTo(10 ** (-3 / 20) * 0.3, 10)
    expect(combat.gain.value).toBeCloseTo(10 ** (-1.5 / 20) * 0.8, 10)
    expect(masterNode.gain.value).toBeCloseTo(0.25 * 0.5, 10)
    audio.setAudioLevels({ music: 0.6 })

    // Mute (master 0) zeroes the master node only; the buses keep their values.
    audio.setAudioLevels({ master: 0 })
    expect(masterNode.gain.value).toBe(0)
    busValues().forEach((v, i) => expect(v).toBeCloseTo(expectedBuses[i], 10))
    audio.setAudioLevels({ master: 0.5 })
    expect(masterNode.gain.value).toBeCloseTo(0.25 * 0.5, 10)
  })
})

// AU-003 / audio GDD: the strategy bed is one music-stage source for the four
// Screens; the mission bed is one of three city-hum clips, picked unseeded,
// and neither bed may start after its owner has left, even when the clip
// finishes loading late.
describe('bed lifetimes (AU-003)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  async function settle(): Promise<void> {
    for (let i = 0; i < 40; i++) await Promise.resolve()
  }

  it('keeps one strategy source playing through repeated starts and stops it on leave', async () => {
    vi.resetModules()
    const { started, sources } = installMockAudio()
    const audio = await import('./audio')
    audio.startStrategyBed()
    await settle()
    // A second start (another Screen) must not restart or add a source.
    audio.startStrategyBed()
    audio.startStrategyBed()
    await settle()
    expect(started).toHaveLength(1)
    expect(started[0]).toMatchObject({ url: audio.STRATEGY_BED_URL, loop: true })
    expect(audio.MISSION_BED_URLS).not.toContain(started[0].url)
    expect(sources[0].stop).not.toHaveBeenCalled()
    audio.stopStrategyBed()
    expect(sources[0].stop).toHaveBeenCalledTimes(1)
  })

  it('discards an in-flight strategy decode when the director leaves the Screens', async () => {
    vi.resetModules()
    const { started, release, fetched } = installMockAudio(() => true)
    const audio = await import('./audio')
    audio.startStrategyBed()
    await settle()
    expect(fetched).toContain(audio.STRATEGY_BED_URL)
    audio.stopStrategyBed()
    release(audio.STRATEGY_BED_URL)
    await settle()
    expect(started).toHaveLength(0)
  })

  it('starts one looping city-hum clip for a mission and stops it on leave', async () => {
    vi.resetModules()
    const { started, sources } = installMockAudio()
    const audio = await import('./audio')
    audio.startMissionBed()
    audio.startMissionBed()
    await settle()
    expect(started).toHaveLength(1)
    expect(started[0].loop).toBe(true)
    expect(audio.MISSION_BED_URLS).toContain(started[0].url)
    expect(started[0].url).not.toBe(audio.STRATEGY_BED_URL)
    audio.stopMissionBed()
    expect(sources[0].stop).toHaveBeenCalledTimes(1)
  })

  it('picks each of the three clips from the unseeded roll alone; two deploys may differ', async () => {
    vi.resetModules()
    installMockAudio()
    const audio = await import('./audio')
    const random = vi.spyOn(Math, 'random')
    const picks = [0, 0.4, 0.99].map((r) => {
      random.mockReturnValueOnce(r)
      return audio.pickMissionBedUrl()
    })
    expect(new Set(picks).size).toBe(3)
    expect([...picks].sort()).toEqual([...audio.MISSION_BED_URLS].sort())
    // The pick reads no contract, district, hour, weather or Threat argument.
    expect(audio.pickMissionBedUrl.length).toBe(0)
  })

  it('a mission bed whose clip loads after departure never starts', async () => {
    vi.resetModules()
    const { started, release, fetched } = installMockAudio((url) => url.includes('mission-bed'))
    const audio = await import('./audio')
    audio.startMissionBed()
    await settle()
    const url = fetched.find((u) => audio.MISSION_BED_URLS.includes(u))
    expect(url).toBeDefined()
    // Abort, result -> Debrief and unmount all leave through stopMissionBed.
    audio.stopMissionBed()
    release(url!)
    await settle()
    expect(started).toHaveLength(0)
  })
})

// AU-005 / TR-audio-003: unavailable or late audio never blocks play and never
// dumps as a delayed burst. The freshness window is read from the runtime
// constant (audio README, "Runtime integration"), never restated here.
// Clip-decode evidence and module-load evidence are recorded in separate
// blocks below.
describe('unavailable audio and dropped one-shots (AU-005)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  async function settle(): Promise<void> {
    for (let i = 0; i < 40; i++) await Promise.resolve()
  }

  function fireEveryOneShot(audio: typeof import('./audio')): void {
    audio.sfx.uiClick()
    audio.sfx.confirmBlip()
    audio.sfx.objectiveChime()
    audio.sfx.interactTick()
    audio.sfx.gunshot('assault')
    audio.sfx.gunshot('pistol', 'corpsec')
    audio.sfx.reload()
    audio.sfx.alertSting()
    audio.sfx.deathThud()
    audio.sfx.blast()
    audio.sfx.abilityCue()
    audio.sfx.agentHit()
  }

  it('with no Web Audio at all, every entry point returns and play is not blocked', async () => {
    vi.resetModules()
    vi.stubGlobal('AudioContext', undefined)
    vi.stubGlobal('webkitAudioContext', undefined)
    const audio = await import('./audio')
    expect(() => {
      audio.unlockAudio()
      fireEveryOneShot(audio)
      audio.sfx.threatLevel(3)
      audio.startStrategyBed()
      audio.startMissionBed()
      audio.setMissionBedWeather('heavy')
      audio.stopMissionBed()
      audio.stopStrategyBed()
    }).not.toThrow()
  })

  it('a context that throws on construction leaves play usable and never starts a source', async () => {
    vi.resetModules()
    const { sources } = installMockAudio()
    vi.stubGlobal('AudioContext', class { constructor() { throw new Error('blocked') } })
    const audio = await import('./audio')
    expect(() => {
      audio.unlockAudio()
      fireEveryOneShot(audio)
    }).not.toThrow()
    await settle()
    expect(sources).toHaveLength(0)
  })

  it('one-shots requested while the context is not running are dropped, not queued', async () => {
    vi.resetModules()
    const { sources, context } = installMockAudio()
    context.state = 'suspended'
    const audio = await import('./audio')
    fireEveryOneShot(audio)
    await settle()
    expect(sources).toHaveLength(0)
    // The context becomes available later: nothing requested earlier plays.
    context.state = 'running'
    audio.unlockAudio()
    await settle()
    expect(sources).toHaveLength(0)
    // A new event after the rate gate clears is a fresh cue and plays alone.
    context.currentTime = 1
    audio.sfx.uiClick()
    await vi.waitFor(() => expect(sources).toHaveLength(1))
    await settle()
    expect(sources).toHaveLength(1)
  })

  it('a context that stops running while a clip decodes drops the cue', async () => {
    vi.resetModules()
    const { sources, context, release } = installMockAudio((u) => u === CLIPS.blast)
    const audio = await import('./audio')
    audio.sfx.blast()
    await settle()
    context.state = 'suspended'
    release(CLIPS.blast)
    await settle()
    context.state = 'running'
    await settle()
    expect(sources).toHaveLength(0)
  })

  it('a rate-limited repeat is dropped, not deferred', async () => {
    vi.resetModules()
    const { sources } = installMockAudio()
    const audio = await import('./audio')
    audio.sfx.uiClick()
    audio.sfx.uiClick()
    audio.sfx.uiClick()
    await settle()
    expect(sources).toHaveLength(1)
  })

  it('the UI overlap cap drops a new one-shot instead of stealing or queueing', async () => {
    vi.resetModules()
    const { sources, context } = installMockAudio()
    const audio = await import('./audio')
    // Distinct UI cues, so only the overlap cap (not a rate gate) can refuse one.
    audio.sfx.uiClick()
    audio.sfx.confirmBlip()
    audio.sfx.objectiveChime()
    await settle()
    expect(sources).toHaveLength(3)
    audio.sfx.interactTick()
    await settle()
    expect(sources).toHaveLength(3)
    expect(sources.every((s) => s.stop.mock.calls.length === 0)).toBe(true)
    // A voice ending frees a slot: the next fresh cue is admitted.
    sources[0].onended?.()
    context.currentTime = 1
    audio.sfx.interactTick()
    await vi.waitFor(() => expect(sources).toHaveLength(4))
  })
})

describe('clip-decode freshness evidence (AU-005)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  async function settle(): Promise<void> {
    for (let i = 0; i < 40; i++) await Promise.resolve()
  }

  const cases = [
    { label: 'UI', url: () => CLIPS.uiClick, fire: (a: typeof import('./audio')) => a.sfx.uiClick() },
    {
      label: 'combat',
      url: () => gunClipUrl('assault', 'squad'),
      fire: (a: typeof import('./audio')) => a.sfx.gunshot('assault', 'squad'),
    },
  ]

  for (const c of cases) {
    it(`a single ${c.label} cue whose decode completes after the freshness window never starts a source`, async () => {
      vi.resetModules()
      const { sources, context, release } = installMockAudio((u) => u === c.url())
      const audio = await import('./audio')
      const createSource = vi.spyOn(context, 'createBufferSource')
      c.fire(audio)
      await settle()
      context.currentTime = audio.CUE_FRESHNESS_WINDOW_S + 0.01
      release(c.url())
      await settle()
      expect(createSource).not.toHaveBeenCalled()
      expect(sources).toHaveLength(0)

      // The clip is now decoded and the rate gate has cleared: a fresh event plays.
      c.fire(audio)
      await vi.waitFor(() => expect(sources).toHaveLength(1))
      await settle()
      expect(sources).toHaveLength(1)
    })

    it(`a ${c.label} cue whose decode completes inside the freshness window still plays`, async () => {
      vi.resetModules()
      const { sources, context, release } = installMockAudio((u) => u === c.url())
      const audio = await import('./audio')
      c.fire(audio)
      await settle()
      context.currentTime = audio.CUE_FRESHNESS_WINDOW_S / 2
      release(c.url())
      await vi.waitFor(() => expect(sources).toHaveLength(1))
    })
  }

  it('a burst of held cues all arriving late starts no source at all', async () => {
    vi.resetModules()
    const url = gunClipUrl('smg', 'corpsec')
    const { sources, context, release } = installMockAudio((u) => u === url)
    const audio = await import('./audio')
    for (let i = 0; i < 10; i++) {
      context.currentTime = i * 0.03
      audio.sfx.gunshot('smg', 'corpsec')
    }
    await settle()
    context.currentTime += audio.CUE_FRESHNESS_WINDOW_S + 0.01
    release(url)
    await settle()
    expect(sources).toHaveLength(0)
  })

  it('rejected decoding starts no source and leaves play usable', async () => {
    vi.resetModules()
    const { sources, context } = installMockAudio()
    const decode = context.decodeAudioData.bind(context)
    context.decodeAudioData = () => Promise.reject(new Error('corrupt clip'))
    const audio = await import('./audio')
    expect(() => {
      audio.sfx.uiClick()
      audio.sfx.gunshot('assault')
      audio.sfx.alertSting()
      audio.startStrategyBed()
      audio.startMissionBed()
    }).not.toThrow()
    await settle()
    expect(sources).toHaveLength(0)
    // Nothing is stuck: once decoding succeeds, a fresh event plays normally.
    context.decodeAudioData = decode
    context.currentTime = 1
    audio.sfx.uiClick()
    await vi.waitFor(() => expect(sources).toHaveLength(1))
  })
})

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
