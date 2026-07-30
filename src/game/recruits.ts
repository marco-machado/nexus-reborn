// CONTRACT FILE. Recruitment market: procedural candidate operatives, hire
// pricing, and the roster cap. Candidates roll from an explicit rng cursor
// (mulberryStep), and the campaign store serializes the cursor the same way
// worldStore serializes the event rng, so a reload continues the exact
// candidate sequence.
import { mulberryStep } from './rng'
import { ROSTER } from './data'
import type { AgentRole, OperativeDef, WeaponId } from './types'

export const ROSTER_CAP = 8
export const CANDIDATE_POOL = 3
// One fresh candidate every 24 world hours, on the strategic clock.
export const CANDIDATE_REFRESH_SEC = 24 * 3600
export const HIRE_MIN_COST = 16000
export const HIRE_MAX_COST = 34000
export const INITIAL_RECRUIT_RNG = 0x52435254

export interface Candidate extends OperativeDef {
  cost: number
}

// The authored roster stays the source of role kits and stat envelopes:
// candidates carry a role's authored primary weapon and roll HP and speed
// inside the authored min/max.
const ROLES: AgentRole[] = ROSTER.map((o) => o.role)
const ROLE_WEAPON: Record<AgentRole, WeaponId> = Object.fromEntries(
  ROSTER.map((o) => [o.role, o.weapon]),
) as Record<AgentRole, WeaponId>
const ROLE_BIO: Record<AgentRole, string> = Object.fromEntries(
  ROSTER.map((o) => [o.role, o.bio]),
) as Record<AgentRole, string>
const HP_MIN = Math.min(...ROSTER.map((o) => o.maxHp))
const HP_MAX = Math.max(...ROSTER.map((o) => o.maxHp))
const SPEED_MIN = Math.min(...ROSTER.map((o) => o.speed))
const SPEED_MAX = Math.max(...ROSTER.map((o) => o.speed))

// None of these collide with the authored eight codenames.
const CODENAMES = [
  'ONYX', 'HALLOW', 'CINDER', 'LYNX', 'STATIC', 'WIDOW', 'FATHOM', 'IRIS',
  'JACKAL', 'NOMAD', 'PYRE', 'QUARTZ', 'RELAY', 'SABLE', 'TALON', 'UMBRA',
  'VIGIL', 'WRAITH', 'ZENITH', 'CIPHER', 'DRIFT', 'EMBER',
]
const SURNAMES = [
  'OKONKWO', 'REYES', 'TANAKA', 'KOWALSKI', 'ADEYEMI', 'DA SILVA', 'PETROV',
  'OSEI', 'LINDQVIST', 'MBEKI', 'CHAVEZ', 'ITO', 'DUBOIS', 'ROSSI', 'KIM',
  'SANTOS', 'WEBER', 'IONESCU', 'HAYAT', 'NAKAGAWA', 'ABARA', 'MORENO',
]
const INITIALS = 'ABCDEFGHIJKLMNOPRSTVWYZ'
const ACCENTS = ROSTER.map((o) => o.accent)

interface RngCursor {
  state: number
}

function next(rng: RngCursor): number {
  const [value, nextState] = mulberryStep(rng.state)
  rng.state = nextState
  return value
}

function pick<T>(items: readonly T[], rng: RngCursor): T {
  return items[Math.floor(next(rng) * items.length) % items.length]
}

// Better bodies cost more. Quality is the candidate's position inside the
// authored HP and speed envelopes; the fee lands on a 500 CR grid between
// HIRE_MIN_COST and HIRE_MAX_COST.
export function hireCost(maxHp: number, speed: number): number {
  const hpQ = HP_MAX > HP_MIN ? (maxHp - HP_MIN) / (HP_MAX - HP_MIN) : 0
  const speedQ = SPEED_MAX > SPEED_MIN ? (speed - SPEED_MIN) / (SPEED_MAX - SPEED_MIN) : 0
  const quality = Math.min(1, Math.max(0, (hpQ + speedQ) / 2))
  const raw = HIRE_MIN_COST + quality * (HIRE_MAX_COST - HIRE_MIN_COST)
  return Math.min(HIRE_MAX_COST, Math.round(raw / 500) * 500)
}

export interface RolledCandidate {
  candidate: Candidate
  state: number
}

// One candidate from the cursor, returning the advanced cursor. Every field
// is a deterministic function of the incoming state.
export function rollCandidate(state: number): RolledCandidate {
  const rng: RngCursor = { state }
  const role = pick(ROLES, rng)
  const name = pick(INITIALS.split(''), rng) + '. ' + pick(SURNAMES, rng)
  const codename = pick(CODENAMES, rng)
  const maxHp = Math.round(HP_MIN + next(rng) * (HP_MAX - HP_MIN))
  const speed = Math.round((SPEED_MIN + next(rng) * (SPEED_MAX - SPEED_MIN)) * 10) / 10
  const accent = pick(ACCENTS, rng)
  const id = 'rc' + Math.floor(next(rng) * 0xffffffff).toString(16).padStart(8, '0')
  return {
    candidate: {
      id,
      name,
      codename,
      role,
      maxHp,
      speed,
      weapon: ROLE_WEAPON[role],
      sidearm: 'pistol',
      accent,
      status: 'READY',
      bio: ROLE_BIO[role],
      cost: hireCost(maxHp, speed),
    },
    state: rng.state,
  }
}

// Signing a candidate drops the market fields; the rest is a roster operative.
export function candidateToOperative(candidate: Candidate): OperativeDef {
  const operative = { ...candidate } as Partial<Candidate>
  delete operative.cost
  return operative as OperativeDef
}
