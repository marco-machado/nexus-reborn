// CONTRACT FILE. Static game data: weapons, enemy archetypes, operative
// roster, missions.
import type { EnemyArchetype, MissionDef, OperativeDef, WeaponDef, WeaponId } from './types'

// Campaign state owns the live values. These are only new-operation seeds.
export const INTEL_LEVEL = 1
export const INTEL_PROGRESS = 25
// The unbuilt strategy screens stay locked at every intel level for now.
export const NAV_LOCK = 'SUBSYSTEM OFFLINE'

export const WEAPONS: Record<WeaponId, WeaponDef> = {
  assault: {
    id: 'assault',
    name: 'RFC-27 ASSAULT',
    damage: 11,
    range: 16,
    cooldown: 0.16,
    magazine: 30,
    reload: 1.7,
    spread: 0.045,
    tracer: '#ffd28a',
    massKg: 4.2,
  },
  smg: {
    id: 'smg',
    name: 'K-9 RATTLER SMG',
    damage: 7,
    range: 12,
    cooldown: 0.09,
    magazine: 40,
    reload: 1.9,
    spread: 0.08,
    tracer: '#ffb36b',
    massKg: 3.1,
  },
  pistol: {
    id: 'pistol',
    name: 'S-18 PISTOL',
    damage: 10,
    range: 11,
    cooldown: 0.45,
    magazine: 12,
    reload: 1.2,
    spread: 0.03,
    tracer: '#d8e6ff',
    massKg: 1.2,
  },
  longrifle: {
    id: 'longrifle',
    name: 'VK-88 LONGRIFLE',
    damage: 46,
    range: 26,
    cooldown: 1.6,
    magazine: 5,
    reload: 2.6,
    spread: 0.008,
    tracer: '#9be8ff',
    massKg: 6.8,
  },
  shotgun: {
    id: 'shotgun',
    name: 'M6 BREACHER',
    damage: 26,
    range: 8,
    cooldown: 0.9,
    magazine: 6,
    reload: 2.2,
    spread: 0.12,
    tracer: '#ffc79a',
    massKg: 4.9,
  },
}

// Enemy archetype stats. `hp` is the base before the mission health
// multiplier and any per-spawn override. `dmgTakenMul` scales incoming
// damage; `minRange` makes a build back off targets that close inside it.
// The citygen assigns archetypes; world.ts applies these numbers.
export interface EnemyArchetypeDef {
  hp: number
  speed: number
  dmgTakenMul: number
  minRange?: number
}

export const ENEMY_ARCHETYPES: Record<EnemyArchetype, EnemyArchetypeDef> = {
  trooper: { hp: 60, speed: 4.2, dmgTakenMul: 1 },
  heavy: { hp: 100, speed: 3.2, dmgTakenMul: 0.85 },
  marksman: { hp: 70, speed: 4.0, dmgTakenMul: 1, minRange: 8 },
  officer: { hp: 70, speed: 4.4, dmgTakenMul: 1 },
}

// Seconds between an officer entering combat and the radio call that puts
// nearby guards on the squad's last seen position. Killing the officer first
// cancels the call.
export const OFFICER_RADIO_DELAY = 4
// How far the call carries from the officer. Bounded so the whole map does
// not converge on one firefight; guards past it stay on their beats.
export const OFFICER_RADIO_R = 22
// How long a called guard holds the investigation with no fresh stimuli.
// Sized to walk the full radio radius: the default investigate window is
// shorter than the trip from the outer ring, and guards would peel off
// mid-convergence.
export const OFFICER_RADIO_HOLD = 8

// How far one shot carries, in meters. Derived from the round the weapon
// fires, so the longrifle is heard across the plaza and the pistol only down
// the block. Enemies hear through walls; sound gives a bearing, not a target.
export function weaponNoise(w: WeaponDef): number {
  return 6 + w.range * 0.6 + w.damage * 0.35
}

export const ROSTER: OperativeDef[] = [
  { id: 'op1', name: 'D. TORRES', codename: 'MARA', role: 'assault', maxHp: 124, speed: 4.6, weapon: 'assault', sidearm: 'pistol', accent: '#f0b445', status: 'READY', bio: 'Frontline combat. Breach and clear.' },
  { id: 'op2', name: 'L. FERNANDEZ', codename: 'GHOST', role: 'recon', maxHp: 110, speed: 5.2, weapon: 'smg', sidearm: 'pistol', accent: '#7ef0d4', status: 'READY', bio: 'Intel gathering. Long range ops.' },
  { id: 'op3', name: 'K. PARK', codename: 'DART', role: 'infiltrator', maxHp: 98, speed: 5.6, weapon: 'smg', sidearm: 'pistol', accent: '#9be8ff', status: 'READY', bio: 'Silent entry. Close quarters.' },
  { id: 'op4', name: 'M. IVANOVA', codename: 'TORQ', role: 'demolitions', maxHp: 132, speed: 4.2, weapon: 'shotgun', sidearm: 'pistol', accent: '#ff9a6b', status: 'READY', bio: 'Heavy ordnance. Area denial.' },
  { id: 'op5', name: 'A. OKAFOR', codename: 'RAVEN', role: 'sniper', maxHp: 92, speed: 4.4, weapon: 'longrifle', sidearm: 'pistol', accent: '#e04b3c', status: 'INJURED', bio: 'Precision engagement. Overwatch.' },
  { id: 'op6', name: 'J. SATO', codename: 'SLATE', role: 'tech', maxHp: 104, speed: 4.8, weapon: 'smg', sidearm: 'pistol', accent: '#b9a7ff', status: 'READY', bio: 'Systems intrusion. Drone control.' },
  { id: 'op7', name: 'R. VOLKOV', codename: 'VEX', role: 'support', maxHp: 118, speed: 4.4, weapon: 'assault', sidearm: 'pistol', accent: '#8fd6a2', status: 'READY', bio: 'Suppression. Squad logistics.' },
  { id: 'op8', name: 'N. DIALLO', codename: 'KESTREL', role: 'medic', maxHp: 100, speed: 5.0, weapon: 'pistol', sidearm: 'pistol', accent: '#f2e6c9', status: 'READY', bio: 'Field trauma. Stim protocols.' },
]

export const DEFAULT_SQUAD = ['op1', 'op2', 'op3', 'op4']

export const MISSIONS: MissionDef[] = [
  {
    id: 'm01',
    codename: 'GLASS VEIL',
    city: 'NEW CARTHAGE',
    district: 'DISTRICT 07',
    sector: 'eu',
    type: 'SEIZURE',
    client: 'SABLE ENTERPRISES',
    threat: 'SEVERE',
    reward: 85000,
    etaDays: 2,
    weather: 'heavy',
    variants: [
      { archetype: 'checkpoint', seed: 20870514 },
      { archetype: 'checkpoint', seed: 20870515 },
    ],
    seed: 20870514,
    briefing: [
      'CorpSec has locked down District 07 behind an ID checkpoint on the tram line.',
      'Sable Enterprises wants the district opened for an asset transfer at 23:00.',
      'Insert on the south perimeter, push north through the market blocks.',
      'The checkpoint garrison answers to Omnicorp. Expect armed response.',
    ],
    notes: [
      'HEAVY RAIN. VISIBILITY REDUCED.',
      'CIVILIAN DENSITY MODERATE. COLLATERAL TOLERANCE LOW.',
      'EXTRACTION WINDOW OPENS WHEN THE GARRISON FALLS.',
    ],
    objectives: [
      { id: 'ob1', label: 'REACH THE CHECKPOINT GATE', kind: 'reach-zone' },
      { id: 'ob2', label: 'ELIMINATE THE CORPSEC GARRISON', kind: 'eliminate-tag', tag: 'garrison' },
      { id: 'ob3', label: 'EXTRACT THE SQUAD', kind: 'extract' },
    ],
    intelReq: 1,
    mapPos: { x: 48, y: 30 },
  },
  {
    id: 'm02',
    codename: 'HOLLOW CROWN',
    city: 'SHINGANG',
    district: 'DISTRICT 21',
    sector: 'as',
    type: 'EXTRACTION',
    client: 'HELIX CORP',
    threat: 'HIGH',
    reward: 62000,
    etaDays: 4,
    weather: 'light',
    variants: [
      { archetype: 'compound', seed: 20870602 },
      { archetype: 'compound', seed: 20870601 },
    ],
    seed: 20870601,
    briefing: [
      'A Helix neurochem architect sits in a CorpSec detention compound in District 21.',
      'CorpSec intends to transfer the asset before the next maglev window.',
      'Breach the compound through the gate or the side wall, override the cell block locks.',
      'Walk the asset to the extraction pad alive. Helix pays nothing for a body.',
    ],
    notes: [
      'LIGHT RAIN. GUARD SIGHT MILDLY REDUCED.',
      'CIVILIAN DENSITY LOW. COLLATERAL TOLERANCE MODERATE.',
      'THE ASSET IS FRAGILE. KEEP IT OUT OF THE CROSSFIRE.',
      'THE COMPOUND GARRISON CAN BE BYPASSED. ENGAGEMENT IS OPTIONAL.',
      'THE DETENTION SERVER STARTS ITS WIPE WHEN THE GATE FALLS. 90 SECONDS.',
    ],
    objectives: [
      { id: 'hc1', label: 'REACH THE COMPOUND GATE', kind: 'reach-zone', landmark: 'gate' },
      {
        id: 'hc-opt',
        label: 'PULL THE DETENTION SERVER',
        kind: 'interact',
        landmark: 'server',
        durationSec: 4,
        optional: true,
        bonusReward: 9000,
        failSec: 90,
      },
      {
        id: 'hc2',
        label: 'OVERRIDE THE CELL BLOCK LOCKS',
        kind: 'interact',
        landmark: 'console',
        durationSec: 5,
      },
      { id: 'hc3', label: 'EXTRACT THE HELIX ASSET', kind: 'escort', landmark: 'extraction' },
      { id: 'hc4', label: 'EXTRACT THE SQUAD', kind: 'extract' },
    ],
    intelReq: 2,
    mapPos: { x: 74, y: 38 },
  },
  {
    id: 'm03',
    codename: 'RUST HAVEN',
    city: 'DETROIT SPRAWL',
    district: 'DISTRICT 03',
    sector: 'na',
    type: 'SABOTAGE',
    client: 'STRATOS INDUSTRIES',
    threat: 'MODERATE',
    reward: 41000,
    etaDays: 3,
    weather: 'none',
    variants: [
      { archetype: 'industrial', seed: 20870618 },
      { archetype: 'industrial', seed: 20870619 },
    ],
    seed: 20870618,
    briefing: [
      'Stratos has located an Omnicorp relay yard feeding the Detroit Sprawl security grid.',
      'Three fuel relays sit in a fenced yard behind two gates in District 03.',
      'Drop the relays, then hold the yard while the burn takes the grid down.',
      'CorpSec will push a response wave through the gates. Withdraw once the burn holds.',
    ],
    notes: [
      'CLEAR NIGHT. GUARDS SEE AND HEAR AT FULL RANGE.',
      'CIVILIAN DENSITY SPARSE. INDUSTRIAL BAND MOSTLY EMPTY.',
      'DEMOLITION CELLS ARE THE FAST TOOL. GUNFIRE WORKS, SLOWLY.',
      'THE YARD GUARD CAN BE BYPASSED ON THE WAY IN.',
    ],
    objectives: [
      { id: 'rh1', label: 'REACH THE RELAY YARD', kind: 'reach-zone', landmark: 'yard-a' },
      {
        id: 'rh-opt',
        label: 'DROP THE BACKUP TRANSFORMER',
        kind: 'destroy',
        tag: 'transformer',
        optional: true,
        bonusReward: 6000,
      },
      { id: 'rh2', label: 'DESTROY THE THREE FUEL RELAYS', kind: 'destroy', tag: 'relay' },
      {
        id: 'rh3',
        label: 'HOLD THE YARD FOR THE BURN',
        kind: 'defend',
        landmark: 'target',
        durationSec: 45,
        wave: {
          count: 5,
          weapons: ['smg', 'assault', 'smg', 'smg', 'assault'],
          entry: ['waveEntry-a', 'waveEntry-b'],
        },
      },
      { id: 'rh4', label: 'EXTRACT THE SQUAD', kind: 'extract' },
    ],
    intelReq: 2,
    mapPos: { x: 22, y: 34 },
  },
]

export function missionById(id: string): MissionDef {
  const m = MISSIONS.find((m) => m.id === id)
  if (!m) throw new Error('unknown mission ' + id)
  return m
}

export function operativeById(id: string): OperativeDef {
  const o = ROSTER.find((o) => o.id === id)
  if (!o) throw new Error('unknown operative ' + id)
  return o
}
