import { describe, expect, it } from 'vitest'
import { MEDIC_REGEN_CAP, ROLE_ABILITIES, SUPPRESS_LINGER, operativeKit } from './abilities'
import { MISSIONS, ROSTER } from './data'
import { headlessDeploy } from './deploy'
import { useMissionStore } from '../state/missionStore'
import { createWorld } from './world'
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

  // Ids are not in the GDD or game-design §8 (names only); these literals are
  // copied from the current ROLE_ABILITIES data and pinned here on purpose.
  const IDS: Record<AgentRole, { active: string; passive: string }> = {
    assault: { active: 'overdrive', passive: 'combat-drills' },
    recon: { active: 'pulse-scan', passive: 'sensor-mesh' },
    infiltrator: { active: 'ghost-veil', passive: 'low-profile' },
    demolitions: { active: 'frag-charge', passive: 'blast-plating' },
    sniper: { active: 'deadeye', passive: 'match-optics' },
    tech: { active: 'em-burst', passive: 'ops-uplink' },
    support: { active: 'suppression-sweep', passive: 'ammo-discipline' },
    medic: { active: 'field-stim', passive: 'field-triage' },
  }
  const ids = (kit: { active: { id: string }; passive: { id: string } }) => ({
    active: kit.active.id,
    passive: kit.passive.id,
  })
  // Test-local hire of the first recruit whose role matches, walking the
  // deterministic recruit cursor.
  const hireRole = (role: AgentRole): OperativeDef => {
    let state = 1
    for (let i = 0; i < 500; i++) {
      const rolled = rollCandidate(state)
      state = rolled.state
      if (rolled.candidate.role === role) return candidateToOperative(rolled.candidate)
    }
    throw new Error('no recruit rolled for ' + role)
  }

  it('pins literal ids for all 8 roles and 8 distinct active ids', () => {
    expect(ROSTER.map((o) => o.role).sort()).toEqual(Object.keys(IDS).sort())
    for (const role of ROLES) expect(ids(ROLE_ABILITIES[role])).toEqual(IDS[role])
    const actives = Object.values(IDS).map((k) => k.active)
    expect(actives).toHaveLength(8)
    expect(new Set(actives).size).toBe(8)
  })

  it('resolves every ROSTER operative to its literal kit through the deploy inputs (AC 43)', () => {
    const deploy = headlessDeploy(MISSIONS[0], ROSTER.slice(0, 4))
    // The Roster slice carries no kit fields; the kit comes from the definition.
    expect(Object.keys(deploy.roster)).not.toContain('active')
    expect(Object.keys(deploy.roster)).not.toContain('passive')
    expect(Object.keys(deploy.roster)).not.toContain('kits')
    expect(ROSTER).toHaveLength(8)
    for (const op of ROSTER) {
      expect(ids(operativeKit(op))).toEqual(IDS[op.role])
      expect(names(operativeKit(op))).toEqual(KITS[op.role])
    }
  })

  it('resolves from role, ignoring a stale or misleading extra field', () => {
    const medic = ROSTER.find((o) => o.role === 'medic') as OperativeDef
    const assault = ROSTER.find((o) => o.role === 'assault') as OperativeDef
    const stale = { ...assault, role: 'medic' as const, kit: ROLE_ABILITIES.assault, active: 'overdrive' }
    expect(ids(operativeKit(stale))).toEqual(IDS.medic)
    expect(ids(operativeKit({ ...medic, kit: ROLE_ABILITIES.assault } as OperativeDef))).toEqual(IDS.medic)
  })

  it('resolves a hired duplicate-role operative to the literal kit of its role', () => {
    const base = ROSTER[0]
    const dup = hireRole(base.role)
    expect(dup.id).not.toBe(base.id)
    expect(ids(operativeKit(dup))).toEqual(IDS.assault)
    expect(ids(operativeKit(base))).toEqual(IDS.assault)
  })

  it('carries the literal kit onto both duplicate-role agents in the created world squad rows', () => {
    const base = ROSTER[0]
    const dup = hireRole(base.role)
    const squad = [base, dup, ROSTER[7]]
    const mission = MISSIONS[0]
    // Clear rows another test may have left, so only this world's sync is read.
    useMissionStore.getState().reset()
    expect(useMissionStore.getState().squad).toEqual([])
    const world = createWorld(mission, squad, headlessDeploy(mission, squad))
    world.tick(0.05)
    const rows = useMissionStore.getState().squad
    expect(rows).toHaveLength(3)
    // Rows expose the active name only; map it back through the pinned literals.
    const idByName = new Map(ROLES.map((r) => [KITS[r].active, IDS[r].active]))
    expect(rows.map((r) => idByName.get(r.abilityName))).toEqual([
      IDS.assault.active,
      IDS.assault.active,
      IDS.medic.active,
    ])
    expect(rows.map((r) => r.codename)).toEqual([base.codename, dup.codename, ROSTER[7].codename])
    for (const row of rows) {
      const unit = world.unit(row.unitId)
      expect(unit?.operative).toBeDefined()
      expect(ids(operativeKit(unit?.operative as OperativeDef))).toEqual(
        IDS[(unit?.operative as OperativeDef).role],
      )
    }
  })
})
