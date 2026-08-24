import { beforeEach, describe, expect, it, vi } from 'vitest'

type FakeParam = {
  value: number
  cancelScheduledValues: () => void
  setValueAtTime: () => void
  exponentialRampToValueAtTime: () => void
}

function fakeParam(value = 0.0001): FakeParam {
  return {
    value,
    cancelScheduledValues: vi.fn(),
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  }
}

type FakeSource = {
  buffer: unknown
  loop: boolean
  connect: (dest: unknown) => unknown
  start: ReturnType<typeof vi.fn>
  stop: ReturnType<typeof vi.fn>
}

const sources: FakeSource[] = []
const dummyBuffer = { duration: 1, length: 8, sampleRate: 44100, numberOfChannels: 1 }

class FakeAudioContext {
  currentTime = 0
  state = 'running'
  destination = {}
  decodeAudioData = vi.fn(async () => dummyBuffer)

  createGain() {
    return { gain: fakeParam(), connect: (dest: unknown) => dest }
  }
  createBiquadFilter() {
    return {
      type: 'lowpass',
      frequency: fakeParam(1400),
      Q: fakeParam(0.5),
      connect: (dest: unknown) => dest,
    }
  }
  createBufferSource(): FakeSource {
    const src: FakeSource = {
      buffer: null,
      loop: false,
      connect: (dest: unknown) => dest,
      start: vi.fn(),
      stop: vi.fn(),
    }
    sources.push(src)
    return src
  }
  createBuffer(_ch: number, len: number, rate: number) {
    return {
      getChannelData: () => new Float32Array(len),
      sampleRate: rate,
      length: len,
      numberOfChannels: 1,
    }
  }
  resume() {
    return Promise.resolve()
  }
}

let fetchImpl: () => Promise<{ ok: boolean; arrayBuffer: () => Promise<ArrayBuffer> }>
const fetchMock = vi.fn(async (url: string) => {
  void url
  return fetchImpl()
})

async function loadAudio() {
  vi.resetModules()
  sources.length = 0
  fetchMock.mockClear()
  fetchImpl = async () => ({
    ok: true,
    arrayBuffer: async () => new ArrayBuffer(8),
  })
  vi.stubGlobal('AudioContext', FakeAudioContext)
  vi.stubGlobal('fetch', fetchMock)
  return import('./audio')
}

async function flush() {
  for (let i = 0; i < 40; i++) await Promise.resolve()
}

describe('clip beds against a mocked AudioContext', () => {
  beforeEach(() => {
    vi.stubGlobal('AudioContext', FakeAudioContext)
    vi.stubGlobal('fetch', fetchMock)
  })

  it('starts the strategy bed from the strategy clip URL', async () => {
    const audio = await loadAudio()
    audio.startStrategyBed()
    await flush()
    const urls = fetchMock.mock.calls.map((c) => c[0])
    expect(urls).toContain(audio.STRATEGY_BED_URL)
    expect(sources.some((s) => s.loop && s.start.mock.calls.length > 0)).toBe(true)
  })

  it('starts the mission bed from one of the three mission clip URLs', async () => {
    const audio = await loadAudio()
    audio.startMissionBed()
    await flush()
    const urls = fetchMock.mock.calls.map((c) => c[0])
    expect(urls.some((u) => audio.MISSION_BED_URLS.includes(u as string))).toBe(true)
    expect(urls).not.toContain(audio.STRATEGY_BED_URL)
    expect(sources.filter((s) => s.loop && s.start.mock.calls.length > 0).length).toBeGreaterThanOrEqual(1)
  })

  it('does not start sources when stop wins the in-flight decode', async () => {
    const audio = await loadAudio()
    let release!: (value: { ok: boolean; arrayBuffer: () => Promise<ArrayBuffer> }) => void
    fetchImpl = () =>
      new Promise((resolve) => {
        release = resolve
      })
    audio.startMissionBed()
    audio.stopMissionBed()
    release({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(8),
    })
    await flush()
    expect(sources.some((s) => s.start.mock.calls.length > 0)).toBe(false)
  })
})
