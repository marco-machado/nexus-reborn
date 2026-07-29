// CONTRACT FILE. Static game data: weapons, operative roster, missions.
import type { MissionDef, OperativeDef, WeaponDef, WeaponId } from './types'

// Campaign state owns the live values. These are only new-operation seeds.
export const INTEL_LEVEL = 1
export const INTEL_PROGRESS = 25
export const INTEL_GATE = 'REQUIRES INTEL LVL 2'

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
  },
}

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
    chance: 78,
    etaDays: 2,
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
    chance: 64,
    etaDays: 4,
    seed: 20870601,
    briefing: [
      'A Helix neurochem architect is trapped inside a Shingang transit control annex.',
      'CorpSec intends to transfer the asset before the next maglev window.',
      'Cross the district cordon, break the annex garrison, and escort the asset route open.',
      'The current field protocol uses the checkpoint as the extraction handoff.',
    ],
    notes: [
      'PLACEHOLDER EXTRACTION PROTOCOL // FULL ASSET ESCORT ARRIVES IN MILESTONE 2.',
      'CIVILIAN DENSITY HIGH. FIRE DISCIPLINE ADVISED.',
      'EXTRACTION WINDOW OPENS WHEN THE ANNEX GARRISON FALLS.',
    ],
    objectives: [
      { id: 'hc1', label: 'REACH THE TRANSIT CONTROL ANNEX', kind: 'reach-zone' },
      { id: 'hc2', label: 'ELIMINATE THE TRANSFER DETAIL', kind: 'eliminate-tag', tag: 'garrison' },
      { id: 'hc3', label: 'SECURE THE EXTRACTION CORRIDOR', kind: 'extract' },
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
    chance: 82,
    etaDays: 3,
    seed: 20870618,
    briefing: [
      'Stratos has located an Omnicorp relay hub feeding the Detroit Sprawl security grid.',
      'The relay sits behind a fortified maintenance checkpoint in District 03.',
      'Enter through the south industrial band and collapse the on-site response team.',
      'Field demolition telemetry will be simulated through the checkpoint breach protocol.',
    ],
    notes: [
      'PLACEHOLDER SABOTAGE PROTOCOL // DEVICE PLACEMENT ARRIVES IN MILESTONE 2.',
      'INDUSTRIAL INTERFERENCE REDUCES SENSOR RELIABILITY.',
      'WITHDRAW TO THE INSERTION ZONE AFTER THE RELAY GUARD IS NEUTRALIZED.',
    ],
    objectives: [
      { id: 'rh1', label: 'REACH THE RELAY SERVICE GATE', kind: 'reach-zone' },
      { id: 'rh2', label: 'NEUTRALIZE THE RELAY GUARD', kind: 'eliminate-tag', tag: 'garrison' },
      { id: 'rh3', label: 'EXTRACT BEFORE GRID RECOVERY', kind: 'extract' },
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
