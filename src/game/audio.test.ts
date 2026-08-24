import { describe, expect, it } from 'vitest'
import {
  ALERT_STING,
  getAudioLevels,
  gunVoiceFor,
  MISSION_BED_URLS,
  missionRainGain,
  pickMissionBedUrl,
  RADIO_BLIP,
  setAudioLevels,
  setMissionBedWeather,
  sfx,
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

  it('picks the mission bed uniformly from the three clips, with no world arguments', () => {
    expect(MISSION_BED_URLS).toHaveLength(3)
    expect(new Set(MISSION_BED_URLS).size).toBe(3)
    expect(pickMissionBedUrl.length).toBe(0)
    for (let i = 0; i < 40; i++) {
      expect(MISSION_BED_URLS).toContain(pickMissionBedUrl())
    }
  })
})

describe('radio acknowledgements and side voices', () => {
  it('treats confirmBlip as a short band-limited radio click on the UI bus', () => {
    expect(RADIO_BLIP.bus).toBe('ui')
    expect(RADIO_BLIP.dur).toBeLessThan(0.12)
    expect(RADIO_BLIP.lowpassHz).toBeGreaterThanOrEqual(2000)
    expect(RADIO_BLIP.lowpassHz).toBeLessThanOrEqual(3000)
    expect(RADIO_BLIP.bandpassHz).toBeGreaterThan(0)
    expect(RADIO_BLIP.hiss.gain).toBeGreaterThan(0)
    expect(RADIO_BLIP.hiss.dur).toBeLessThan(RADIO_BLIP.dur)
    expect(RADIO_BLIP.tone.dur).toBeLessThan(RADIO_BLIP.dur)
  })

  it('gives CorpSec a darker, narrower, lower-punch gun voice than the squad', () => {
    const weapons = ['assault', 'smg', 'pistol', 'longrifle', 'shotgun'] as const
    for (const id of weapons) {
      const squad = gunVoiceFor(id)
      const corpsec = gunVoiceFor(id, 'corpsec')
      expect(gunVoiceFor(id, 'squad')).toEqual(squad)
      expect(corpsec.noise.freq).toBeLessThan(squad.noise.freq)
      expect(corpsec.noise.gain).toBeLessThan(squad.noise.gain)
      expect(corpsec.noise.q).toBeGreaterThan(squad.noise.q)
      expect(corpsec.punch.gain).toBeLessThan(squad.punch.gain)
      expect(corpsec.punch.f0).toBeLessThan(squad.punch.f0)
      if (squad.noise.freqEnd !== undefined && corpsec.noise.freqEnd !== undefined) {
        expect(corpsec.noise.freqEnd).toBeLessThan(squad.noise.freqEnd)
      }
    }
  })

  it('keeps the alert sting on combat with a UI pip, and objective-complete on UI', () => {
    expect(ALERT_STING.bus).toBe('combat')
    expect(ALERT_STING.pipBus).toBe('ui')
    expect(ALERT_STING.objectiveBus).toBe('ui')
    expect(ALERT_STING.pip.dur).toBeLessThan(0.12)
    expect(ALERT_STING.pip.gain).toBeGreaterThan(0)
  })

  it('sfx entry points do not throw without an AudioContext, with or without side', () => {
    expect(() => sfx.gunshot('assault')).not.toThrow()
    expect(() => sfx.gunshot('assault', 'squad')).not.toThrow()
    expect(() => sfx.gunshot('pistol', 'corpsec')).not.toThrow()
    expect(() => sfx.confirmBlip()).not.toThrow()
    expect(() => sfx.alertSting()).not.toThrow()
    expect(() => sfx.objectiveChime()).not.toThrow()
    expect(() => sfx.abilityCue()).not.toThrow()
    expect(() => sfx.uiClick()).not.toThrow()
  })
})
