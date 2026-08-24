import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getAudioLevels,
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

function installMockAudio() {
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
  }

  class FakeGain extends FakeNode {
    gain = new FakeParam()
  }

  class FakeSource extends FakeNode {
    buffer: { url: string } | null = null
    loop = false
    playbackRate = { value: 1 }
    start() {
      started.push({
        url: this.buffer?.url ?? '',
        loop: this.loop,
        dest: this.dest,
      })
    }
    stop() {}
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
      return Promise.resolve({ url: pendingUrls.shift() ?? '' })
    }
    resume() {
      return Promise.resolve()
    }
  }

  vi.stubGlobal('AudioContext', FakeCtx)
  vi.stubGlobal('webkitAudioContext', FakeCtx)
  vi.stubGlobal('fetch', (url: string | URL) => {
    const href = String(url)
    fetched.push(href)
    pendingUrls.push(href)
    return Promise.resolve({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    })
  })

  return { started, sources, fetched }
}

describe('clip playback', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
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
