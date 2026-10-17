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
import type { MissionDef } from './types'

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

// AU-004 / TR-audio-002 / audio GDD `rain_voice` and `alert_tension`: rain
// follows live weather (none silent, light/heavy the matching recording,
// adjacent change crossfades, stops with the mission bed and never restarts
// after departure); the synthesized drone is silent at Alert 0, ramps with
// Alert 1–3 on the combat bus, releases on mission end, and a rise inside the
// release tail reuses the one layer instead of stacking a second.
describe('rain voice and alert-tension drone (AU-004)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  async function settle(): Promise<void> {
    for (let i = 0; i < 40; i++) await Promise.resolve()
  }

  const SILENT = 0.001

  type Voice = { buffer: { url: string } | null; dest: unknown; stop: ReturnType<typeof vi.fn> }
  const voiceFor = (sources: Voice[], url: string): Voice | undefined =>
    sources.find((s) => s.buffer?.url === url)
  const gainOf = (v: Voice): number => (v.dest as { gain: { value: number } }).gain.value

  it('crossfades light → heavy at a front and fades rain out when weather turns none', async () => {
    vi.resetModules()
    const { started, sources } = installMockAudio()
    const audio = await import('./audio')
    const { CLIPS: clips } = await import('./sfxClips')
    audio.startMissionBed()
    audio.setMissionBedWeather('light')
    await vi.waitFor(() => {
      expect(started.some((s) => s.url === clips.rainLight && s.loop)).toBe(true)
    })
    const light = voiceFor(sources, clips.rainLight)!
    expect(gainOf(light)).toBeGreaterThan(SILENT)

    audio.setMissionBedWeather('heavy')
    await vi.waitFor(() => {
      expect(started.some((s) => s.url === clips.rainHeavy && s.loop)).toBe(true)
    })
    const heavy = voiceFor(sources, clips.rainHeavy)!
    // Crossfade: the light loop ramps to silence and stops on its fade tail
    // (a scheduled time after now), not an instant cut; heavy ramps in.
    expect(gainOf(light)).toBeLessThan(SILENT)
    expect(light.stop).toHaveBeenCalledTimes(1)
    expect(light.stop.mock.calls[0][0]).toBeGreaterThan(0)
    expect(gainOf(heavy)).toBeGreaterThan(SILENT)
    expect(heavy.stop).not.toHaveBeenCalled()

    audio.setMissionBedWeather('none')
    expect(gainOf(heavy)).toBeLessThan(SILENT)
    expect(heavy.stop).toHaveBeenCalledTimes(1)
    await settle()
    // None is silence, not a third loop: exactly the two rain voices ever ran.
    expect(started.filter((s) => s.url.includes('rain-'))).toHaveLength(2)
  })

  it('keeps heavy rain playing until a slow-loading light clip starts (no gap at a front)', async () => {
    vi.resetModules()
    const { CLIPS: clips } = await import('./sfxClips')
    const { started, sources, release, fetched } = installMockAudio((u) => u === clips.rainLight)
    const audio = await import('./audio')
    audio.startMissionBed()
    audio.setMissionBedWeather('heavy')
    await vi.waitFor(() => {
      expect(started.some((s) => s.url === clips.rainHeavy && s.loop)).toBe(true)
    })
    const heavy = voiceFor(sources, clips.rainHeavy)!
    const heavyGain = gainOf(heavy)
    expect(heavyGain).toBeGreaterThan(SILENT)

    // Glass Veil's front: heavy -> light while rain-light is still loading.
    audio.setMissionBedWeather('light')
    await vi.waitFor(() => {
      expect(fetched).toContain(clips.rainLight)
    })
    await settle()
    expect(started.some((s) => s.url === clips.rainLight)).toBe(false)
    expect(heavy.stop).not.toHaveBeenCalled()
    expect(gainOf(heavy)).toBe(heavyGain)

    release(clips.rainLight)
    await vi.waitFor(() => {
      expect(started.some((s) => s.url === clips.rainLight && s.loop)).toBe(true)
    })
    const light = voiceFor(sources, clips.rainLight)!
    expect(gainOf(light)).toBeGreaterThan(SILENT)
    // Heavy fades on a scheduled tail only once light is playing.
    expect(gainOf(heavy)).toBeLessThan(SILENT)
    expect(heavy.stop).toHaveBeenCalledTimes(1)
    expect(heavy.stop.mock.calls[0][0]).toBeGreaterThan(0)
  })

  it('applies live weather that changed while the mission bed was still loading', async () => {
    vi.resetModules()
    const { started, release, fetched } = installMockAudio((url) => url.includes('mission-bed'))
    const audio = await import('./audio')
    const { CLIPS: clips } = await import('./sfxClips')
    audio.startMissionBed()
    await settle()
    audio.setMissionBedWeather('heavy')
    const bedUrl = fetched.find((u) => audio.MISSION_BED_URLS.includes(u))!
    release(bedUrl)
    await vi.waitFor(() => {
      expect(started.some((s) => s.url === clips.rainHeavy && s.loop)).toBe(true)
    })
    expect(started.some((s) => s.url === clips.rainLight)).toBe(false)
  })

  it('leaving the mission while rain is loading never starts the late rain loop', async () => {
    vi.resetModules()
    const { started, release, fetched } = installMockAudio((url) => url.includes('rain-'))
    const audio = await import('./audio')
    const { CLIPS: clips } = await import('./sfxClips')
    audio.startMissionBed()
    audio.setMissionBedWeather('heavy')
    await vi.waitFor(() => {
      expect(fetched).toContain(clips.rainHeavy)
    })
    audio.stopMissionBed()
    release(clips.rainHeavy)
    await settle()
    expect(started.some((s) => s.url.includes('rain-'))).toBe(false)
  })

  it('leaving while rain plays stops it, and a later weather change does not restart it', async () => {
    vi.resetModules()
    const { started, sources } = installMockAudio()
    const audio = await import('./audio')
    const { CLIPS: clips } = await import('./sfxClips')
    audio.startMissionBed()
    audio.setMissionBedWeather('light')
    await vi.waitFor(() => {
      expect(started.some((s) => s.url === clips.rainLight && s.loop)).toBe(true)
    })
    audio.stopMissionBed()
    expect(voiceFor(sources, clips.rainLight)!.stop).toHaveBeenCalled()
    audio.setMissionBedWeather('heavy')
    await settle()
    expect(started.filter((s) => s.url.includes('rain-'))).toHaveLength(1)
    expect(started.some((s) => s.url === clips.rainHeavy)).toBe(false)
  })

  function trackDrone(context: ReturnType<typeof installMockAudio>['context']) {
    const gains: { gain: { value: number }; dest: unknown }[] = []
    let oscillators = 0
    const createGain = context.createGain.bind(context)
    const createOsc = context.createOscillator.bind(context)
    context.createGain = () => {
      const g = createGain()
      gains.push(g)
      return g
    }
    context.createOscillator = () => {
      oscillators += 1
      return createOsc()
    }
    return { gains, oscillators: () => oscillators }
  }

  it('Alert 0 builds no drone; Alert 1–3 ramps one drone layer on the combat bus', async () => {
    vi.resetModules()
    const { context } = installMockAudio()
    const track = trackDrone(context)
    const audio = await import('./audio')
    audio.unlockAudio()
    // Graph build order: master, ui, combat, music, ambience.
    const combat = track.gains[2]
    audio.sfx.threatLevel(0)
    expect(track.oscillators()).toBe(0)
    expect(track.gains).toHaveLength(5)

    audio.sfx.threatLevel(1)
    expect(track.oscillators()).toBe(2)
    expect(track.gains).toHaveLength(6)
    const drone = track.gains[5]
    // gain -> combat bus; never the ambience or music bus.
    expect(drone.dest).toBe(combat)
    const at1 = drone.gain.value
    expect(at1).toBeGreaterThan(SILENT)
    audio.sfx.threatLevel(2)
    const at2 = drone.gain.value
    audio.sfx.threatLevel(3)
    const at3 = drone.gain.value
    expect(at2).toBeGreaterThan(at1)
    expect(at3).toBeGreaterThan(at2)
    // Ramping re-targets the one layer: no new oscillators or gains.
    expect(track.oscillators()).toBe(2)
    expect(track.gains).toHaveLength(6)
  })

  it('mission end releases the drone, and a rise in the release tail does not stack a layer', async () => {
    vi.resetModules()
    const { context } = installMockAudio()
    const track = trackDrone(context)
    const audio = await import('./audio')
    audio.unlockAudio()
    audio.sfx.threatLevel(3)
    const drone = track.gains[5]
    expect(drone.gain.value).toBeGreaterThan(SILENT)
    // Result banner / Debrief / Abort all release through threatLevel(0).
    audio.sfx.threatLevel(0)
    expect(drone.gain.value).toBeLessThan(SILENT)
    audio.sfx.threatLevel(2)
    expect(drone.gain.value).toBeGreaterThan(SILENT)
    expect(track.oscillators()).toBe(2)
    expect(track.gains).toHaveLength(6)
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

// AU-006 (Sprint 9; TR-audio-003, ADR-0017 / ADR-0016): the mission-bed pick
// and gunshot playback-rate jitter are presentation-only, unseeded draws. A
// controlled fixture replays one mission (same seed, deploy freeze, weather
// script, Opening hour, commands, command timing and timestep schedule) and
// varies only those two draws: the outcome, the weather script, the clock and
// the seeded sim stream's draw count must match step for step. Two
// independently played deploys are not this fixture, and two uncontrolled
// draws are not required to differ, so Math.random is pinned per run.
describe('presentation-only randomness does not change outcomes (AU-006)', () => {
  afterEach(() => {
    vi.doUnmock('./rng')
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  const STEP = 0.05
  const FRONT_AT = 3
  const OPENING_HOUR = 22 * 3600 + 40 * 60
  const STEPS = 200
  const GUN_URLS = new Set(WEAPONS.flatMap((id) => [gunClipUrl(id, 'squad'), gunClipUrl(id, 'corpsec')]))

  async function settle(): Promise<void> {
    for (let i = 0; i < 40; i++) await Promise.resolve()
  }

  interface Run {
    trace: unknown[]
    shots: { id: string; t: number; to: [number, number] }[]
    fetched: string[]
    gunRates: { url: string; rate: number }[]
  }

  // `audioOn` false is the jitter-off / no-audio baseline. `draw` is the value
  // every presentation Math.random() call returns in this run.
  async function play(audioOn: boolean, draw: number): Promise<Run> {
    vi.resetModules()
    // Count draws on the world's own seeded stream: the first mulberry32 made
    // once `armed` is set is the one createWorld builds from mission.seed.
    const sim = { armed: false, draws: 0 }
    vi.doMock('./rng', async (importOriginal) => {
      const real = await importOriginal<typeof import('./rng')>()
      return {
        ...real,
        mulberry32(seed: number) {
          const next = real.mulberry32(seed)
          if (!sim.armed) return next
          sim.armed = false
          return () => {
            sim.draws += 1
            return next()
          }
        },
      }
    })
    vi.spyOn(Math, 'random').mockReturnValue(draw)

    let mock: ReturnType<typeof installMockAudio> | null = null
    if (audioOn) mock = installMockAudio()
    else {
      vi.stubGlobal('AudioContext', undefined)
      vi.stubGlobal('webkitAudioContext', undefined)
    }

    const audio = await import('./audio')
    const { createWorld } = await import('./world')
    const { headlessDeploy } = await import('./deploy')
    const { MISSIONS, operativeById } = await import('./data')
    const { useMissionStore } = await import('../state/missionStore')
    // Let the mission bridge's lazy import of ./audio land before play.
    await settle()

    audio.unlockAudio()

    const mission: MissionDef = {
      ...MISSIONS[0],
      objectives: [],
      weather: 'light',
      weatherFront: { to: 'heavy', atSec: FRONT_AT },
      openingHour: OPENING_HOUR,
    }
    const squad = [operativeById('op1')]
    sim.armed = true
    const w = createWorld(mission, squad, headlessDeploy(mission, squad))
    expect(sim.armed).toBe(false)
    // Shipped order (MissionScreen): composeMission builds the world, then the
    // bed is picked. Picking after createWorld lets a bed pick that drew from
    // the world's seeded stream show up in the sim draw count and the trace.
    audio.startMissionBed()
    await settle()
    const ms = useMissionStore.getState()
    ms.reset()
    ms.setLive(true)

    const shots: Run['shots'] = []
    const trace: unknown[] = []
    // decayFx compacts w.tracers from the front inside each tick, so an index
    // cursor would skip new rounds. Track the tracer objects themselves: every
    // push is a fresh object and lives at least through the tick it was fired in.
    const seen = new WeakSet<object>()
    const step = async (): Promise<void> => {
      w.tick(STEP)
      // Gun voices decode and take their jitter after the tick, as in play.
      if (mock) {
        await settle()
        mock.context.currentTime = w.time
      }
      for (const tr of w.tracers) {
        if (seen.has(tr)) continue
        seen.add(tr)
        const by = w.units.find((u) => u.lastFireT === tr.t && u.pos.x === tr.from.x && u.pos.z === tr.from.z)
        shots.push({ id: by?.id ?? '?', t: tr.t, to: [tr.to.x, tr.to.z] })
      }
      const store = useMissionStore.getState()
      trace.push({
        t: w.time,
        simDraws: sim.draws,
        weather: w.weather,
        vision: w.vision,
        clock: store.clock,
        result: store.result,
        civiliansHit: store.civiliansHit,
        units: w.units.map((u) => ({
          id: u.id,
          x: u.pos.x,
          z: u.pos.z,
          hp: u.hp,
          stance: u.stance,
          cooldown: u.cooldown,
          magazine: u.magazine,
          reloading: u.reloading,
          lastFireT: u.lastFireT,
        })),
      })
    }

    for (let i = 0; i < 24; i++) await step()
    // Commands at a fixed step: one trooper 4 m from a1, both sides tough
    // enough to trade fire for the whole window; the rest of the garrison out.
    const a1 = w.unit('a1')!
    const enemy = w.units.find((u) => u.kind === 'enemy' && (u.archetype ?? 'trooper') === 'trooper')!
    for (const u of w.units) if (u.kind === 'enemy' && u !== enemy) u.stance = 'dead'
    enemy.pos.x = a1.pos.x
    enemy.pos.z = a1.pos.z - 4
    enemy.path.length = 0
    enemy.patrol!.length = 0
    enemy.holdGround = true
    for (const u of [a1, enemy]) {
      u.hp = 100000
      u.maxHp = 100000
    }
    w.orderAttack(['a1'], enemy.id)
    for (let i = 24; i < STEPS; i++) await step()

    const fetched = mock ? [...mock.fetched] : []
    const gunRates = mock
      ? mock.sources
          .filter((s) => s.buffer && GUN_URLS.has(s.buffer.url))
          .map((s) => ({ url: s.buffer!.url, rate: s.playbackRate.value }))
      : []
    return { trace, shots, fetched, gunRates }
  }

  it('fixture sanity: both sides fire, and the two presentation draws really differ between the jitter runs', async () => {
    const low = await play(true, 0)
    const high = await play(true, 0.9999)
    const { MISSION_BED_URLS: beds } = await import('./audio')
    // Bed pick: index 0 vs index 2 of the three clips.
    expect(low.fetched).toContain(beds[0])
    expect(low.fetched).not.toContain(beds[2])
    expect(high.fetched).toContain(beds[2])
    expect(high.fetched).not.toContain(beds[0])
    // Squad and CorpSec rounds both went off and were voiced with jitter.
    expect(low.shots.some((s) => s.id === 'a1')).toBe(true)
    expect(low.shots.some((s) => s.id !== 'a1' && s.id !== '?')).toBe(true)
    expect(low.gunRates.some((g) => g.url.includes('-corpsec'))).toBe(true)
    expect(low.gunRates.some((g) => !g.url.includes('-corpsec'))).toBe(true)
    // Rate jitter spans 0.97–1.03: pinned at its two ends by the draw.
    for (const g of low.gunRates) expect(g.rate).toBeCloseTo(0.97, 10)
    for (const g of high.gunRates) expect(g.rate).toBeCloseTo(0.97 + 0.9999 * 0.06, 10)
    // The weather script ran and the Opening hour shows on the clock.
    const last = low.trace.at(-1) as { weather: string; clock: string }
    expect(last.weather).toBe('heavy')
    expect(last.clock.startsWith('22:40')).toBe(true)
  })

  it('varying only the bed pick and gun-rate jitter leaves hits, outcome, weather and Opening hour equal at every step (AC 1)', async () => {
    const low = await play(true, 0)
    const high = await play(true, 0.9999)
    expect(high.trace).toHaveLength(STEPS)
    expect(high.trace).toEqual(low.trace)
    expect(high.shots).toEqual(low.shots)
  })

  it('the sim rng draw count at each step equals the count with no audio running (AC 2)', async () => {
    const silent = await play(false, 0.5)
    const voiced = await play(true, 0.9999)
    const draws = (r: Run) => r.trace.map((s) => (s as { simDraws: number }).simDraws)
    expect(draws(silent).at(-1)).toBeGreaterThan(0)
    expect(draws(voiced)).toEqual(draws(silent))
    expect(voiced.trace).toEqual(silent.trace)
  })

  it('each squad and CorpSec shot resolves and paces the same with jitter on as with it off (AC 3)', async () => {
    const off = await play(false, 0.5)
    const on = await play(true, 0)
    // Same rounds at the same times to the same points: same chance, same roll.
    expect(on.shots).toEqual(off.shots)
    const intervals = (r: Run, id: string) => {
      const ts = r.shots.filter((s) => s.id === id).map((s) => s.t)
      return ts.slice(1).map((t, i) => t - ts[i])
    }
    const shooters = [...new Set(off.shots.map((s) => s.id))]
    expect(shooters.length).toBeGreaterThanOrEqual(2)
    for (const id of shooters) {
      expect(intervals(on, id).length).toBeGreaterThan(0)
      expect(intervals(on, id)).toEqual(intervals(off, id))
    }
  })
})
