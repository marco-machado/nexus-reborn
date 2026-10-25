// BUG-0010 / IF-039 AC-1: "GIVEN any Brief WHEN it prints THEN ... contract
// notes say `EVERY CIVILIAN HIT IS BILLED.`". Authored missions print their
// own notes; generated contracts print DENSITY_NOTE[archetype].
import { describe, expect, it } from 'vitest'
import { DENSITY_NOTE } from './contracts'
import { MISSIONS } from './data'

const BILLED = 'EVERY CIVILIAN HIT IS BILLED.'

describe('Brief contract notes carry the billing sentence', () => {
  it.each(MISSIONS.map((m) => [m.id, m.notes] as const))(
    'authored mission %s notes contain it',
    (_id, notes) => {
      expect(notes.some((n) => n.includes(BILLED))).toBe(true)
    },
  )

  it.each(Object.entries(DENSITY_NOTE))('DENSITY_NOTE.%s contains it', (_k, note) => {
    expect(note).toContain(BILLED)
  })
})
