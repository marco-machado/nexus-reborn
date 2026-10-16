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
  // Living spec §8 Roles: one active and one passive per role. Active names
  // come from the spec table; effect, duration, range and cooldown rows are
  // Tactical and are not asserted here (GDD AC 42 note).
  const KITS: Record<AgentRole, { active: string; passive: string }> = {
    assault: { active: 'OVERDRIVE', passive: 'COMBAT DRILLS' },
    recon: { active: 'PULSE SCAN', passive: 'SENSOR MESH' },
    infiltrator: { active: 'GHOST VEIL', passive: 'LOW PROFILE' },
    demolitions: { active: 'FRAG CHARGE', passive: 'BLAST PLATING' },
    sniper: { active: 'DEADEYE', passive: 'MATCH OPTICS' },
    tech: { active: 'EM BURST', passive: 'OPS UPLINK' },
    support: { active: 'SUPPRESSION SWEEP', passive: 'AMMO DISCIPLINE' },
    medic: { active: 'FIELD STIM', passive: 'FIELD TRIAGE' },
  }
  const names = (kit: { active: { name: string }; passive: { name: string } }) => ({
    active: kit.active.name,
    passive: kit.passive.name,
  })

  it('gives each of the 8 roles exactly 1 active and 1 passive (AC 42)', () => {
    expect([...ROLES].sort()).toEqual(Object.keys(KITS).sort())
    for (const role of ROLES) {
      const kit = ROLE_ABILITIES[role]
      expect(Object.keys(kit).sort()).toEqual(['active', 'passive'])
      expect(names(kit)).toEqual(KITS[role])
    }
  })

  it('resolves each assigned operative kit from its definition role through the deploy inputs (AC 43)', () => {
    const mission = MISSIONS[0]
    const operatives = ROSTER.slice(0, 4)
    const deploy = headlessDeploy(mission, operatives)
    // The Roster slice carries no kit fields; the kit comes from the definition.
    expect(Object.keys(deploy.roster)).not.toContain('active')
    expect(Object.keys(deploy.roster)).not.toContain('passive')
    expect(Object.keys(deploy.roster)).not.toContain('kits')
    expect(deploy.roster.ids).toEqual(['op1', 'op2', 'op3', 'op4'])
    // Mara assault, Ghost recon, Dart infiltrator, Torq demolitions (§8 roster).
    const resolved = deploy.roster.ids.map((id) =>
      names(operativeKit(operatives.find((o) => o.id === id) as OperativeDef)).active,
    )
    expect(resolved).toEqual(['OVERDRIVE', 'PULSE SCAN', 'GHOST VEIL', 'FRAG CHARGE'])
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
    expect(names(operativeKit(dup))).toEqual(KITS.assault)
  })
})
