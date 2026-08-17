import { describe, expect, it } from 'vitest'
import { cityById } from './atlas'
import { cityIdByName, nextCityHolder } from './ownership'

describe('cityIdByName', () => {
  it('resolves authored mission cities and rejects unknown names', () => {
    expect(cityIdByName('NEW CARTHAGE')).toBe('nc')
    expect(cityIdByName('SHINGANG')).toBe('sg')
    expect(cityIdByName('DETROIT SPRAWL')).toBe('dt')
    expect(cityIdByName('NO SUCH CITY')).toBeNull()
  })
})

describe('nextCityHolder', () => {
  it('a win always names Nexus, a loss of a foreign city is a no-op', () => {
    expect(nextCityHolder('nc', 'helix', true)).toBe('nexus')
    expect(nextCityHolder('nc', 'helix', false)).toBe('helix')
    expect(nextCityHolder('dt', 'stratos', true)).toBe('nexus')
  })

  it('a loss of a Nexus-held city returns the atlas default holder', () => {
    expect(cityById('nc').corp).toBe('helix')
    expect(nextCityHolder('nc', 'nexus', false)).toBe('helix')
    expect(nextCityHolder('dt', 'nexus', false)).toBe('stratos')
  })

  it('a Nexus-authored city lost by Nexus falls to the first rival holder', () => {
    expect(cityById('nb').corp).toBe('nexus')
    expect(nextCityHolder('nb', 'nexus', false)).toBe('stratos')
  })
})
