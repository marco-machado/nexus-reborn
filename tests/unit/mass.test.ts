import { describe, expect, it } from 'vitest'
import { HEAVY_MASS_KG, LIGHT_MASS_KG, MASS_LIMIT_KG, massTier } from '../../src/game/mass'

describe('mass tier boundaries', () => {
  it('treats the light line as light and the next kilogram as standard', () => {
    expect(massTier(LIGHT_MASS_KG)).toBe('light')
    expect(massTier(LIGHT_MASS_KG + 1)).toBe('standard')
  })

  it('treats the heavy line as standard and the next kilogram as heavy', () => {
    expect(massTier(HEAVY_MASS_KG)).toBe('standard')
    expect(massTier(HEAVY_MASS_KG + 1)).toBe('heavy')
  })

  it('keeps the deploy refuse line at 400 kg', () => {
    expect(MASS_LIMIT_KG).toBe(400)
    expect(massTier(MASS_LIMIT_KG)).toBe('heavy')
  })
})
