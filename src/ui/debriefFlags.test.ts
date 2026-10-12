import { describe, expect, it } from 'vitest'
import { isGeneratedMissionId } from '../game/contracts'
import { MISSIONS } from '../game/data'
import { debriefFlags } from './debriefFlags'

const WIN = { won: true }
const LOSS = { won: false }
const AUTHORED = MISSIONS[0].id
const GENERATED = 'gc-test'

describe('debriefFlags (IF-011)', () => {
  it('fixtures: AUTHORED is authored and GENERATED is generated', () => {
    expect(isGeneratedMissionId(AUTHORED)).toBe(false)
    expect(isGeneratedMissionId(GENERATED)).toBe(true)
  })

  it('AC29: pyrrhic win shows banner and pyrrhic note, no replay', () => {
    expect(debriefFlags(WIN, true, AUTHORED)).toEqual({ banner: true, pyrrhicNote: true, replay: false })
  })

  it('AC29: non-pyrrhic win shows neither banner nor note', () => {
    const f = debriefFlags(WIN, false, AUTHORED)
    expect(f.banner).toBe(false)
    expect(f.pyrrhicNote).toBe(false)
  })

  it('AC30: failed-campaign loss shows banner, no pyrrhic note, no replay', () => {
    expect(debriefFlags(LOSS, true, AUTHORED)).toEqual({ banner: true, pyrrhicNote: false, replay: false })
  })

  it('AC30: non-failed authored loss offers replay and no banner', () => {
    expect(debriefFlags(LOSS, false, AUTHORED)).toEqual({ banner: false, pyrrhicNote: false, replay: true })
  })

  it('AC30: non-failed authored win offers replay', () => {
    expect(debriefFlags(WIN, false, AUTHORED).replay).toBe(true)
  })

  it('generated mission never offers replay', () => {
    expect(debriefFlags(WIN, false, GENERATED).replay).toBe(false)
  })

  it('no mission id never offers replay', () => {
    expect(debriefFlags(WIN, false, null).replay).toBe(false)
  })

  it('empty mission id never offers replay', () => {
    expect(debriefFlags(WIN, false, '').replay).toBe(false)
  })

  it('failed campaign shows the banner whatever the mission id', () => {
    expect(debriefFlags(WIN, true, GENERATED)).toEqual({ banner: true, pyrrhicNote: true, replay: false })
    expect(debriefFlags(LOSS, true, GENERATED)).toEqual({ banner: true, pyrrhicNote: false, replay: false })
    expect(debriefFlags(WIN, true, null)).toEqual({ banner: true, pyrrhicNote: true, replay: false })
  })

  it('generated loss on a live campaign shows nothing', () => {
    expect(debriefFlags(LOSS, false, GENERATED)).toEqual({ banner: false, pyrrhicNote: false, replay: false })
  })

  it('null outcome: banner follows the flag, no pyrrhic note', () => {
    expect(debriefFlags(null, true, AUTHORED)).toEqual({ banner: true, pyrrhicNote: false, replay: false })
    expect(debriefFlags(null, false, AUTHORED)).toEqual({ banner: false, pyrrhicNote: false, replay: true })
  })
})
