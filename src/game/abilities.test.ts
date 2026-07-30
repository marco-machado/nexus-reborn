import { describe, expect, it } from 'vitest'
import { MEDIC_REGEN_CAP, ROLE_ABILITIES, SUPPRESS_LINGER } from './abilities'
import { ROSTER } from './data'
import type { AgentRole } from './types'

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
