import { describe, expect, it } from 'vitest'
import { MEDIC_REGEN_CAP, ROLE_ABILITIES, SUPPRESS_LINGER, operativeKit } from './abilities'
import { MISSIONS, ROSTER } from './data'
import { headlessDeploy } from './deploy'
import { candidateToOperative, rollCandidate } from './recruits'
import type { AgentRole, OperativeDef } from './types'

const ROLES = Object.keys(ROLE_ABILITIES) as AgentRole[]

describe('ROLE_ABILITIES', () => {
  it('covers every role the roster uses', () => {
    for (const op of ROSTER) {
      expect(ROLE_ABILITIES[op.role]).toBeDefined()
    }
  })

  it('gives every role a named, described active and passive with unique ids', () => {
    const ids: string[] = []
    for (const role of ROLES) {
      const kit = ROLE_ABILITIES[role]
      expect(kit.active.name.length).toBeGreaterThan(0)
      expect(kit.active.description.length).toBeGreaterThan(0)
      expect(kit.passive.name.length).toBeGreaterThan(0)
      expect(kit.passive.description.length).toBeGreaterThan(0)
      ids.push(kit.active.id, kit.passive.id)
    }
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('keeps every cooldown inside the 25-45 second design band', () => {
    for (const role of ROLES) {
      const cd = ROLE_ABILITIES[role].active.cooldown
      expect(cd).toBeGreaterThanOrEqual(25)
      expect(cd).toBeLessThanOrEqual(45)
      // The cooldown always outlasts the effect, so an effect cannot stack
      // onto itself.
      expect(cd).toBeGreaterThan(ROLE_ABILITIES[role].active.duration)
    }
  })

  it('carries non-negative geometry and sane constants', () => {
    for (const role of ROLES) {
      const kit = ROLE_ABILITIES[role]
      expect(kit.active.duration).toBeGreaterThanOrEqual(0)
      expect(kit.active.range).toBeGreaterThanOrEqual(0)
      expect(kit.active.radius).toBeGreaterThanOrEqual(0)
      expect(kit.passive.radius).toBeGreaterThanOrEqual(0)
    }
    // The frag charge is the one active that both seeks a target and blasts
    // an area.
    expect(ROLE_ABILITIES.demolitions.active.range).toBeGreaterThan(0)
    expect(ROLE_ABILITIES.demolitions.active.radius).toBeGreaterThan(0)
    expect(MEDIC_REGEN_CAP).toBeGreaterThan(0)
    expect(MEDIC_REGEN_CAP).toBeLessThanOrEqual(1)
    expect(SUPPRESS_LINGER).toBeGreaterThan(0)
  })
})

// RA-011 (GDD roster-and-assembly AC 42, AC 43). Effect rows (§8) and the Q
// keypress are Tactical and are not asserted here.
describe('role kits (RA-011)', () => {
  it('gives each of the 8 roles exactly 1 active and 1 passive', () => {
    const roles: AgentRole[] = [
      'assault',
      'recon',
      'infiltrator',
      'demolitions',
      'sniper',
      'tech',
      'support',
      'medic',
    ]
    expect([...ROLES].sort()).toEqual([...roles].sort())
    for (const role of roles) {
      const kit = ROLE_ABILITIES[role]
      expect(Object.keys(kit).sort()).toEqual(['active', 'passive'])
      expect(Array.isArray(kit.active)).toBe(false)
      expect(Array.isArray(kit.passive)).toBe(false)
      expect(typeof kit.active.id).toBe('string')
      expect(typeof kit.passive.id).toBe('string')
    }
  })

  it('resolves each assigned operative kit from its definition role through the deploy inputs', () => {
    const mission = MISSIONS[0]
    const operatives = ROSTER.slice(0, 4)
    const deploy = headlessDeploy(mission, operatives)
    // The Roster slice carries no kit fields; the kit comes from the definition.
    expect(Object.keys(deploy.roster)).not.toContain('active')
    expect(Object.keys(deploy.roster)).not.toContain('passive')
    expect(Object.keys(deploy.roster)).not.toContain('kits')
    expect(deploy.roster.ids).toEqual(operatives.map((op) => op.id))
    for (const id of deploy.roster.ids) {
      const op = operatives.find((o) => o.id === id) as OperativeDef
      const kit = operativeKit(op)
      expect(kit).toBe(ROLE_ABILITIES[op.role])
      expect(kit.active.id).toBe(ROLE_ABILITIES[op.role].active.id)
      expect(kit.passive.id).toBe(ROLE_ABILITIES[op.role].passive.id)
    }
  })

  it('resolves a hired duplicate-role operative to the same canonical kit', () => {
    const base = ROSTER[0]
    // Walk the deterministic recruit cursor until it offers the same role.
    let state = 1
    let hired: OperativeDef | undefined
    for (let i = 0; i < 200 && !hired; i++) {
      const rolled = rollCandidate(state)
      state = rolled.state
      if (rolled.candidate.role === base.role) hired = candidateToOperative(rolled.candidate)
    }
    expect(hired).toBeDefined()
    const dup = hired as OperativeDef
    expect(dup.id).not.toBe(base.id)
    const deploy = headlessDeploy(MISSIONS[0], [base, dup])
    expect(deploy.roster.ids).toEqual([base.id, dup.id])
    expect(operativeKit(dup)).toBe(operativeKit(base))
    expect(operativeKit(dup)).toBe(ROLE_ABILITIES[base.role])
  })
})
