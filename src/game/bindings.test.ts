import { afterEach, describe, it, expect } from 'vitest'
import {
  BINDINGS,
  BINDING_GROUPS,
  applyOverrides,
  bindingFor,
  codeOf,
  defaultCodes,
  keyLabel,
  remappable,
  sanitizeOverrides,
} from './bindings'

function fakeKey(code: string, key: string): KeyboardEvent {
  return { code, key } as unknown as KeyboardEvent
}

describe('BINDINGS table', () => {
  it('has a unique id per action', () => {
    const ids = BINDINGS.map((b) => b.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('claims every key code exactly once', () => {
    const codes = BINDINGS.flatMap((b) => b.codes)
    expect(new Set(codes).size).toBe(codes.length)
  })

  it('prints a label and at least one key per row, in a known group', () => {
    const groups = new Set(BINDING_GROUPS.map((g) => g.group))
    for (const b of BINDINGS) {
      expect(b.label.length).toBeGreaterThan(0)
      expect(b.keys.length).toBeGreaterThan(0)
      expect(b.keys.every((k) => k.length > 0)).toBe(true)
      expect(groups.has(b.group)).toBe(true)
    }
  })

  it('lists every used group once, with a title', () => {
    const listed = BINDING_GROUPS.map((g) => g.group)
    expect(new Set(listed).size).toBe(listed.length)
    const used = new Set(BINDINGS.map((b) => b.group))
    expect(new Set(listed)).toEqual(used)
    expect(BINDING_GROUPS.every((g) => g.title.length > 0)).toBe(true)
  })
})

describe('bindingFor', () => {
  it('resolves every declared code back to its own action', () => {
    for (const b of BINDINGS) {
      for (const code of b.codes) {
        expect(bindingFor(code)?.id).toBe(b.id)
      }
    }
  })

  it('resolves every keyboard action through at least one code', () => {
    const keyboardRows = BINDINGS.filter((b) => b.codes.length > 0)
    expect(keyboardRows.length).toBeGreaterThan(0)
    for (const b of keyboardRows) {
      expect(b.codes.some((code) => bindingFor(code) === b)).toBe(true)
    }
  })

  it('maps the shared keys the handlers depend on', () => {
    expect(bindingFor('Space')?.id).toBe('pause')
    expect(bindingFor('Escape')?.id).toBe('pause')
    expect(bindingFor('Digit1')?.id).toBe('selectSlot')
    expect(bindingFor('Numpad4')?.id).toBe('selectSlot')
    expect(bindingFor('Backquote')?.id).toBe('selectAll')
    expect(bindingFor('KeyQ')?.id).toBe('useAbility')
    expect(bindingFor('KeyE')?.id).toBe('useMed')
    expect(bindingFor('KeyM')?.id).toBe('useMed')
    expect(bindingFor('KeyR')?.id).toBe('useCell')
  })

  it('returns undefined for an unclaimed code', () => {
    expect(bindingFor('KeyZ')).toBeUndefined()
    expect(bindingFor('')).toBeUndefined()
  })
})

describe('codeOf', () => {
  it('prefers the physical code when the event carries one', () => {
    expect(codeOf(fakeKey('KeyW', 'z'))).toBe('KeyW')
    expect(codeOf(fakeKey('Numpad0', '0'))).toBe('Numpad0')
  })

  it('spells letter and digit codes from the character', () => {
    expect(codeOf(fakeKey('', 'a'))).toBe('KeyA')
    expect(codeOf(fakeKey('', 'H'))).toBe('KeyH')
    expect(codeOf(fakeKey('', '5'))).toBe('Digit5')
  })

  it('passes named keys through and maps the special characters', () => {
    expect(codeOf(fakeKey('', 'Escape'))).toBe('Escape')
    expect(codeOf(fakeKey('', 'Backspace'))).toBe('Backspace')
    expect(codeOf(fakeKey('', ' '))).toBe('Space')
    expect(codeOf(fakeKey('', '`'))).toBe('Backquote')
    expect(codeOf(fakeKey('', '~'))).toBe('Backquote')
    expect(codeOf(fakeKey('', '='))).toBe('Equal')
    expect(codeOf(fakeKey('', '+'))).toBe('Equal')
    expect(codeOf(fakeKey('', '-'))).toBe('Minus')
    expect(codeOf(fakeKey('', '_'))).toBe('Minus')
  })

  it('returns an empty string for a character it cannot spell', () => {
    expect(codeOf(fakeKey('', '@'))).toBe('')
    expect(codeOf(fakeKey('', '!'))).toBe('')
  })
})

describe('overrides', () => {
  afterEach(() => {
    applyOverrides({})
  })

  it('keeps pause, selectSlot and the mouse rows out of remapping', () => {
    for (const b of BINDINGS) {
      if (b.id === 'pause' || b.id === 'selectSlot' || b.codes.length === 0) {
        expect(remappable(b)).toBe(false)
      } else {
        expect(remappable(b)).toBe(true)
      }
    }
  })

  it('applies an override to the lookup and the printed keys', () => {
    applyOverrides({ holdGround: ['KeyJ'] })
    expect(bindingFor('KeyJ')?.id).toBe('holdGround')
    expect(bindingFor('KeyH')).toBeUndefined()
    const row = BINDINGS.find((b) => b.id === 'holdGround')
    expect(row?.codes).toEqual(['KeyJ'])
    expect(row?.keys).toEqual(['J'])
  })

  it('resets to the authored defaults, per action and globally', () => {
    applyOverrides({ holdGround: ['KeyJ'], stop: ['KeyT'] })
    // Per action: dropping one override keeps the other.
    applyOverrides({ stop: ['KeyT'] })
    expect(bindingFor('KeyH')?.id).toBe('holdGround')
    expect(bindingFor('KeyT')?.id).toBe('stop')
    // Global reset restores every default code and key.
    applyOverrides({})
    for (const b of BINDINGS) {
      expect(b.codes).toEqual(defaultCodes(b.id))
      for (const code of b.codes) expect(bindingFor(code)?.id).toBe(b.id)
    }
  })

  it('rejects overrides on fixed actions and reserved codes', () => {
    expect(sanitizeOverrides({ pause: ['KeyP'] })).toEqual({})
    expect(sanitizeOverrides({ selectSlot: ['KeyT'] })).toEqual({})
    // Space and Escape belong to pause forever; the digits to selectSlot.
    expect(sanitizeOverrides({ holdGround: ['Space'] })).toEqual({})
    expect(sanitizeOverrides({ holdGround: ['Digit1'] })).toEqual({})
  })

  it('rejects an override that collides with a live default', () => {
    // KeyH still belongs to holdGround, so stop cannot take it.
    expect(sanitizeOverrides({ stop: ['KeyH'] })).toEqual({})
    // Once holdGround moves away, KeyH is free.
    expect(sanitizeOverrides({ holdGround: ['KeyJ'], stop: ['KeyH'] })).toEqual({
      holdGround: ['KeyJ'],
      stop: ['KeyH'],
    })
  })

  it('rejects the later claim when two overrides collide', () => {
    const clean = sanitizeOverrides({ stop: ['KeyT'], holdGround: ['KeyT'] })
    expect(clean).toEqual({ stop: ['KeyT'] })
  })

  it('drops malformed entries and keeps the good ones', () => {
    const clean = sanitizeOverrides({
      holdGround: ['KeyJ'],
      holdFire: [],
      swapWeapon: 'KeyZ',
      useAbility: [7],
      unknown: ['KeyL'],
    })
    expect(clean).toEqual({ holdGround: ['KeyJ'] })
    expect(sanitizeOverrides(null)).toEqual({})
    expect(sanitizeOverrides([['stop', ['KeyT']]])).toEqual({})
  })

  it('prints readable labels for captured codes', () => {
    expect(keyLabel('KeyJ')).toBe('J')
    expect(keyLabel('Digit7')).toBe('7')
    expect(keyLabel('Numpad5')).toBe('Num 5')
    expect(keyLabel('ArrowUp')).toBe('Up')
    expect(keyLabel('Backquote')).toBe('`')
    expect(keyLabel('F13')).toBe('F13')
  })
})
