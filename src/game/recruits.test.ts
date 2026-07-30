import { describe, expect, it } from 'vitest'
import { ROSTER, WEAPONS } from './data'
import {
  CANDIDATE_POOL,
  HIRE_MAX_COST,
  HIRE_MIN_COST,
  INITIAL_RECRUIT_RNG,
  ROSTER_CAP,
  candidateToOperative,
  hireCost,
  rollCandidate,
} from './recruits'

const HP_MIN = Math.min(...ROSTER.map((o) => o.maxHp))
const HP_MAX = Math.max(...ROSTER.map((o) => o.maxHp))
const SPEED_MIN = Math.min(...ROSTER.map((o) => o.speed))
const SPEED_MAX = Math.max(...ROSTER.map((o) => o.speed))

describe('candidate generation', () => {
  it('is deterministic: the same cursor state rolls the same candidate', () => {
    const a = rollCandidate(INITIAL_RECRUIT_RNG)
    const b = rollCandidate(INITIAL_RECRUIT_RNG)
    expect(a.candidate).toEqual(b.candidate)
    expect(a.state).toBe(b.state)
  })

  it('serializes through the cursor: resuming from a saved state continues the sequence', () => {
    let state = INITIAL_RECRUIT_RNG
    const continuous = []
    for (let i = 0; i < 5; i++) {
      const rolled = rollCandidate(state)
      continuous.push(rolled.candidate)
      state = rolled.state
    }

    // Roll two, save the cursor, resume: the tail must match roll for roll.
    let resumed = INITIAL_RECRUIT_RNG
    for (let i = 0; i < 2; i++) resumed = rollCandidate(resumed).state
    const savedCursor = resumed
    const tail = []
    let cursor = savedCursor
    for (let i = 0; i < 3; i++) {
      const rolled = rollCandidate(cursor)
      tail.push(rolled.candidate)
      cursor = rolled.state
    }
    expect(tail).toEqual(continuous.slice(2))
  })

  it('rolls candidates inside the authored envelopes with the role kit', () => {
    let state = INITIAL_RECRUIT_RNG
    const roleWeapon = new Map(ROSTER.map((o) => [o.role, o.weapon]))
    for (let i = 0; i < 40; i++) {
      const { candidate, state: next } = rollCandidate(state)
      state = next
      expect(candidate.id.startsWith('rc')).toBe(true)
      expect(roleWeapon.get(candidate.role)).toBe(candidate.weapon)
      expect(candidate.sidearm).toBe('pistol')
      expect(candidate.maxHp).toBeGreaterThanOrEqual(HP_MIN)
      expect(candidate.maxHp).toBeLessThanOrEqual(HP_MAX)
      expect(candidate.speed).toBeGreaterThanOrEqual(SPEED_MIN)
      expect(candidate.speed).toBeLessThanOrEqual(SPEED_MAX)
      expect(candidate.cost).toBeGreaterThanOrEqual(HIRE_MIN_COST)
      expect(candidate.cost).toBeLessThanOrEqual(HIRE_MAX_COST)
      expect(candidate.cost % 500).toBe(0)
      expect(candidate.status).toBe('READY')
      expect(WEAPONS[candidate.weapon]).toBeDefined()
    }
  })

  it('prices quality across the full band and clamps at the ends', () => {
    expect(hireCost(HP_MIN, SPEED_MIN)).toBe(HIRE_MIN_COST)
    expect(hireCost(HP_MAX, SPEED_MAX)).toBe(HIRE_MAX_COST)
    const mid = hireCost((HP_MIN + HP_MAX) / 2, (SPEED_MIN + SPEED_MAX) / 2)
    expect(mid).toBeGreaterThan(HIRE_MIN_COST)
    expect(mid).toBeLessThan(HIRE_MAX_COST)
  })

  it('strips the market fields when a candidate signs', () => {
    const { candidate } = rollCandidate(INITIAL_RECRUIT_RNG)
    const operative = candidateToOperative(candidate)
    expect('cost' in operative).toBe(false)
    expect(operative).toMatchObject({
      id: candidate.id,
      codename: candidate.codename,
      role: candidate.role,
      maxHp: candidate.maxHp,
      speed: candidate.speed,
    })
  })

  it('keeps the market constants coherent with the roster cap', () => {
    expect(CANDIDATE_POOL).toBeLessThanOrEqual(ROSTER_CAP)
  })
})
