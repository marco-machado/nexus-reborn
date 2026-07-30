import { describe, it, expect } from 'vitest'
import { BINDINGS, BINDING_GROUPS, bindingFor, codeOf } from './bindings'

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
