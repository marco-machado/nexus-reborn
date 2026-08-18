import { describe, expect, it } from 'vitest'
import {
  getAudioLevels,
  missionRainGain,
  setAudioLevels,
  setMissionBedWeather,
  startMissionBed,
  startStrategyBed,
  stopMissionBed,
  stopStrategyBed,
  unlockAudio,
} from './audio'

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
})
