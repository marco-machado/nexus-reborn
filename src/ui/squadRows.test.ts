// Squad card render gate (squadRows.ts): a fresh row with the same values
// skips the render; any changed value, selection or portrait input renders.
import { describe, expect, it } from 'vitest'
import { sameRowValues, sameSquadRow } from './squadRows'
import type { SquadRowProps } from './squadRows'
import type { SquadMemberUi } from '../state/missionStore'

const row = (over: Partial<SquadMemberUi> = {}): SquadMemberUi => ({
  unitId: 'a1',
  slot: 1,
  name: 'Ada Vey',
  codename: 'WREN',
  accent: '#3fe0d0',
  hp: 90,
  maxHp: 124,
  magazine: 20,
  magazineSize: 30,
  reloading: false,
  swapping: false,
  weaponName: 'AR-7',
  activeSlot: 'primary',
  stowedName: 'P9',
  stowedMagazine: 12,
  stowedMagazineSize: 12,
  holdGround: false,
  holdFire: false,
  abilityName: 'Overdrive',
  abilityCooldownRemaining: 0,
  abilityCooldownDuration: 20,
  abilityActiveRemaining: 0,
  abilityActiveDuration: 6,
  dead: false,
  ...over,
})

const setSelected = (): void => {}
const selected: string[] = []
const props = (over: Partial<SquadRowProps> = {}): SquadRowProps => ({
  r: row(),
  op: { id: 'op-wren', codename: 'WREN', accent: '#3fe0d0' },
  isSel: false,
  isActive: false,
  selected,
  setSelected,
  ...over,
})

describe('sameRowValues', () => {
  it('treats a fresh row with equal values as the same', () => {
    expect(sameRowValues(row(), row())).toBe(true)
  })

  it.each<[keyof SquadMemberUi, SquadMemberUi[keyof SquadMemberUi]]>([
    ['hp', 89],
    ['magazine', 19],
    ['reloading', true],
    ['swapping', true],
    ['activeSlot', 'sidearm'],
    ['holdGround', true],
    ['holdFire', true],
    ['abilityCooldownRemaining', 3.2],
    ['dead', true],
  ])('sees a change in %s', (k, v) => {
    expect(sameRowValues(row(), row({ [k]: v }))).toBe(false)
  })
})

describe('sameSquadRow', () => {
  it('skips the render for a fresh push with the same values and a fresh fallback op', () => {
    expect(sameSquadRow(props(), props({ r: row(), op: { id: 'op-wren', codename: 'WREN', accent: '#3fe0d0' } }))).toBe(true)
  })

  it('renders on selection, active card, selection list or portrait input change', () => {
    expect(sameSquadRow(props(), props({ isSel: true }))).toBe(false)
    expect(sameSquadRow(props(), props({ isActive: true }))).toBe(false)
    expect(sameSquadRow(props(), props({ selected: ['a1'] }))).toBe(false)
    expect(sameSquadRow(props(), props({ op: { id: 'op-wren', codename: 'WREN', accent: '#ff0000' } }))).toBe(false)
    expect(sameSquadRow(props(), props({ r: row({ hp: 10 }) }))).toBe(false)
  })
})
