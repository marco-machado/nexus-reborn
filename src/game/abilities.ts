// CONTRACT FILE. Per-role ability data: every role carries one active ability
// and one always-on passive. The simulation (world.ts), the HUD ability bar,
// the minimap reveal rules and the team screen dossier all read this table, so
// a balance edit is a one-line change here and nowhere else.
//
// Field semantics, so magnitudes stay comparable across roles:
// - cooldown: seconds between activations. The tech passive scales it.
// - duration: seconds the effect runs. 0 is an instant effect. For the frag
//   charge it is the fuse; for deadeye it is the armed window.
// - range: meters from the operative a target is looked for in. 0 when the
//   ability is self- or squad-centered.
// - radius: meters of area the effect covers. 0 when the effect is not areal.
// - magnitude: the one balance number the effect scales by; a multiplier for
//   rate/damage/speed effects, flat HP for heals and blasts.
import type { AgentRole } from './types'

export interface ActiveAbilityDef {
  id: string
  name: string
  description: string
  cooldown: number
  duration: number
  range: number
  radius: number
  magnitude: number
}

export interface PassiveAbilityDef {
  id: string
  name: string
  description: string
  radius: number
  magnitude: number
}

export interface RoleKit {
  active: ActiveAbilityDef
  passive: PassiveAbilityDef
}

// Medic passive regeneration stops at this fraction of max HP.
export const MEDIC_REGEN_CAP = 0.5
// Seconds a suppression mark outlives the last sweep pass over an enemy.
export const SUPPRESS_LINGER = 0.3

export const ROLE_ABILITIES: Record<AgentRole, RoleKit> = {
  assault: {
    active: {
      id: 'overdrive',
      name: 'OVERDRIVE',
      description: 'Combat stims flood the servos: fire delay is halved for 6 seconds.',
      cooldown: 30,
      duration: 6,
      range: 0,
      radius: 0,
      magnitude: 0.5,
    },
    passive: {
      id: 'combat-drills',
      name: 'COMBAT DRILLS',
      description: 'Weapon handling under fire: +10% weapon damage on both slots.',
      radius: 0,
      magnitude: 1.1,
    },
  },
  recon: {
    active: {
      id: 'pulse-scan',
      name: 'PULSE SCAN',
      description: 'Paints the grid: every hostile and its sight cone shows on the tactical map for 8 seconds.',
      cooldown: 35,
      duration: 8,
      range: 0,
      radius: 0,
      magnitude: 0,
    },
    passive: {
      id: 'sensor-mesh',
      name: 'SENSOR MESH',
      description: 'Hostiles within 16 meters are marked on the tactical map, calm or not.',
      radius: 16,
      magnitude: 0,
    },
  },
  infiltrator: {
    active: {
      id: 'ghost-veil',
      name: 'GHOST VEIL',
      description: 'Optical baffling: hostiles cannot gain sight of this operative for 6 seconds. They still hear.',
      cooldown: 35,
      duration: 6,
      range: 0,
      radius: 0,
      magnitude: 0,
    },
    passive: {
      id: 'low-profile',
      name: 'LOW PROFILE',
      description: 'Hostile vision certainty builds 25% slower against this operative.',
      radius: 0,
      magnitude: 0.75,
    },
  },
  demolitions: {
    active: {
      id: 'frag-charge',
      name: 'FRAG CHARGE',
      description: 'Throws a charge under the nearest hostile within 10 meters. After 1 second it deals 60 damage to every body within 3 meters.',
      cooldown: 40,
      duration: 1,
      range: 10,
      radius: 3,
      magnitude: 60,
    },
    passive: {
      id: 'blast-plating',
      name: 'BLAST PLATING',
      description: 'Hardened frame: takes 15% less damage.',
      radius: 0,
      magnitude: 0.85,
    },
  },
  sniper: {
    active: {
      id: 'deadeye',
      name: 'DEADEYE',
      description: 'The next shot within 10 seconds cannot miss and deals double damage.',
      cooldown: 30,
      duration: 10,
      range: 0,
      radius: 0,
      magnitude: 2,
    },
    passive: {
      id: 'match-optics',
      name: 'MATCH OPTICS',
      description: 'Tuned optics: +15% weapon range on both slots.',
      radius: 0,
      magnitude: 1.15,
    },
  },
  tech: {
    active: {
      id: 'em-burst',
      name: 'EM BURST',
      description: 'Hostiles within 8 meters drop to suspicious, lose their target and cannot fire for 4 seconds.',
      cooldown: 35,
      duration: 4,
      range: 0,
      radius: 8,
      magnitude: 0,
    },
    passive: {
      id: 'ops-uplink',
      name: 'OPS UPLINK',
      description: 'Squad-wide ability cooldowns run 15% faster while this operative lives.',
      radius: 0,
      magnitude: 0.85,
    },
  },
  support: {
    active: {
      id: 'suppression-sweep',
      name: 'SUPPRESSION SWEEP',
      description: 'For 6 seconds, hostiles within 12 meters and line of sight move at half speed.',
      cooldown: 30,
      duration: 6,
      range: 0,
      radius: 12,
      magnitude: 0.5,
    },
    passive: {
      id: 'ammo-discipline',
      name: 'AMMO DISCIPLINE',
      description: 'Operatives within 6 meters reload 20% faster.',
      radius: 6,
      magnitude: 0.8,
    },
  },
  medic: {
    active: {
      id: 'field-stim',
      name: 'FIELD STIM',
      description: 'Heals the most wounded living operative within 8 meters by 40 HP.',
      cooldown: 25,
      duration: 0,
      range: 8,
      radius: 0,
      magnitude: 40,
    },
    passive: {
      id: 'field-triage',
      name: 'FIELD TRIAGE',
      description: 'Living operatives within 6 meters regenerate 1 HP per second, up to half their maximum.',
      radius: 6,
      magnitude: 1,
    },
  },
}
