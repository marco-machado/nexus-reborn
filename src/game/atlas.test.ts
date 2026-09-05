import { describe, it, expect } from 'vitest'
import type { CorpId } from './atlas'
import {
  CORPS,
  HOLDERS,
  KEY_ORDER,
  SECTORS,
  SECTOR_IDS,
  OPEN_SECTORS,
  sectorDef,
  TERRITORIES,
  CITIES,
  CITIES_BY_SECTOR,
  cityById,
  sectorCorp,
  SCAN_W,
  SCAN_H,
  yOfLat,
  graticuleY,
  cityScanPos,
  LAT_LINES,
  LON_LINES,
  LIGHTS,
  LIGHTS_BY_SECTOR,
  ARCS,
  SECTOR_VIEW,
  SECTOR_COORD,
} from './atlas'

function parsePts(s: string): Array<[number, number]> {
  return s.split(' ').map((p) => {
    const [x, y] = p.split(',')
    return [Number(x), Number(y)]
  })
}

describe('corporations', () => {
  it('keys the record by each corp id and colors it with a hex', () => {
    for (const [id, corp] of Object.entries(CORPS)) {
      expect(corp.id).toBe(id)
      expect(corp.name.length).toBeGreaterThan(0)
      expect(corp.color).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })

  it('lists holders and key order from the corp table', () => {
    for (const id of HOLDERS) expect(CORPS[id]).toBeDefined()
    expect(HOLDERS).not.toContain('contested')
    expect(HOLDERS).not.toContain('unknown')
    expect([...KEY_ORDER].sort()).toEqual(Object.keys(CORPS).sort())
  })
})

describe('sectors', () => {
  it('lists each sector once and resolves it through sectorDef', () => {
    expect(new Set(SECTOR_IDS).size).toBe(SECTORS.length)
    for (const s of SECTORS) expect(sectorDef(s.id)).toBe(s)
  })

  it('opens exactly the unlocked sectors', () => {
    expect(OPEN_SECTORS).toEqual(SECTORS.filter((s) => !s.locked).map((s) => s.id))
    expect(OPEN_SECTORS).not.toContain('an')
  })

  it('keeps the numbers in range', () => {
    for (const s of SECTORS) {
      expect(s.control).toBeGreaterThanOrEqual(0)
      expect(s.control).toBeLessThanOrEqual(100)
      expect(s.unrest).toBeGreaterThanOrEqual(0)
      expect(s.unrest).toBeLessThanOrEqual(100)
      expect(s.weight).toBeGreaterThanOrEqual(0)
      expect(s.forcesBase).toBeGreaterThanOrEqual(0)
      expect(s.yieldBase).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('territories', () => {
  it('references only listed sectors, or null for unsurveyed land', () => {
    for (const t of TERRITORIES) {
      if (t.sector !== null) expect(SECTOR_IDS).toContain(t.sector)
    }
  })

  it('counts Greenland with North America so Unknown is only Antarctica', () => {
    const greenland = TERRITORIES.find((t) => t.id === 'gl')
    expect(greenland?.sector).toBe('na')
    const unknownLand = TERRITORIES.filter((t) => t.sector === 'an')
    expect(unknownLand.length).toBeGreaterThanOrEqual(1)
    expect(TERRITORIES.some((t) => t.sector === null)).toBe(false)
  })

  it('draws each polygon from at least three in-Scan points', () => {
    for (const t of TERRITORIES) {
      const pts = parsePts(t.pts)
      expect(pts.length).toBeGreaterThanOrEqual(3)
      for (const [x, y] of pts) {
        expect(Number.isFinite(x)).toBe(true)
        expect(Number.isFinite(y)).toBe(true)
        expect(x).toBeGreaterThanOrEqual(0)
        expect(x).toBeLessThanOrEqual(SCAN_W)
        expect(y).toBeGreaterThanOrEqual(0)
        expect(y).toBeLessThanOrEqual(SCAN_H)
      }
    }
  })
})

describe('cities', () => {
  it('has unique ids, valid sectors, holder corps, and in-Scan coordinates', () => {
    expect(new Set(CITIES.map((c) => c.id)).size).toBe(CITIES.length)
    for (const c of CITIES) {
      expect(SECTOR_IDS).toContain(c.sector)
      expect(HOLDERS).toContain(c.corp)
      expect(c.x).toBeGreaterThanOrEqual(0)
      expect(c.x).toBeLessThanOrEqual(SCAN_W)
      expect(c.y).toBeGreaterThanOrEqual(0)
      expect(c.y).toBeLessThanOrEqual(SCAN_H)
    }
  })

  it('resolves every city through cityById', () => {
    for (const c of CITIES) expect(cityById(c.id)).toBe(c)
    expect(cityById('nb').name).toBe('NEW BOSTON')
  })

  it('converts city Scan pixels to percent for contract pins', () => {
    const dt = cityById('dt')
    expect(cityScanPos('dt')).toEqual({
      x: (dt.x / SCAN_W) * 100,
      y: (dt.y / SCAN_H) * 100,
    })
  })

  it('groups CITIES_BY_SECTOR without losing anyone', () => {
    let total = 0
    for (const [sector, cities] of Object.entries(CITIES_BY_SECTOR)) {
      total += cities.length
      for (const c of cities) expect(c.sector).toBe(sector)
    }
    expect(total).toBe(CITIES.length)
  })
})

describe('sectorCorp', () => {
  it('names the corp holding most cities', () => {
    // na: nexus 2 (nb, pc) vs stratos 1 (dt).
    expect(sectorCorp('na', {})).toBe('nexus')
    // oc: stratos 2 (sy, pr) vs nexus 1 (ak).
    expect(sectorCorp('oc', {})).toBe('stratos')
  })

  it('reads a tie as contested', () => {
    // sa: one city each for nexus, stratos, omni.
    expect(sectorCorp('sa', {})).toBe('contested')
  })

  it('reads a sector with no cities as unknown', () => {
    expect(sectorCorp('an', {})).toBe('unknown')
  })

  it('honors ownership overrides over the default corp', () => {
    expect(sectorCorp('na', { nb: 'stratos' })).toBe('stratos')
    const flipAll: Record<string, CorpId> = { sy: 'helix', pr: 'helix', ak: 'helix' }
    expect(sectorCorp('oc', flipAll)).toBe('helix')
  })
})

describe('Scan geometry', () => {
  it('anchors the graticule: lat 85 at y 0, one pixel per 0.28 degrees', () => {
    expect(yOfLat(85)).toBe(0)
    expect(yOfLat(85 - 0.28)).toBeCloseTo(1, 10)
  })

  it('includes a southern graticule line on Antarctica', () => {
    expect(LAT_LINES).toContain(-60)
  })

  it('keeps every graticule line on the Scan', () => {
    for (const lat of LAT_LINES) {
      const y = graticuleY(lat)
      expect(y).toBeGreaterThanOrEqual(0)
      expect(y).toBeLessThanOrEqual(SCAN_H)
    }
    for (const x of LON_LINES) {
      expect(x).toBeGreaterThan(0)
      expect(x).toBeLessThan(SCAN_W)
    }
  })
})

describe('city lights', () => {
  it('scatters lights inside the Scan with sane radii and sector refs', () => {
    expect(LIGHTS.length).toBeGreaterThan(0)
    for (const l of LIGHTS) {
      expect(l.x).toBeGreaterThanOrEqual(0)
      expect(l.x).toBeLessThanOrEqual(SCAN_W)
      expect(l.y).toBeGreaterThanOrEqual(0)
      expect(l.y).toBeLessThanOrEqual(SCAN_H)
      expect(l.r).toBeGreaterThan(0)
      expect(l.r).toBeLessThan(1.5)
      if (l.sector !== null) expect(SECTOR_IDS).toContain(l.sector)
    }
  })

  it('groups every light by sector', () => {
    const total = Object.values(LIGHTS_BY_SECTOR).reduce((sum, ls) => sum + ls.length, 0)
    expect(total).toBe(LIGHTS.length)
  })
})

describe('traffic arcs', () => {
  it('builds one quadratic path per link', () => {
    expect(ARCS.length).toBe(14)
    for (const arc of ARCS) {
      expect(arc.d).toMatch(/^M-?[\d.]+,-?[\d.]+ Q-?[\d.]+,-?[\d.]+ -?[\d.]+,-?[\d.]+$/)
      expect(typeof arc.hot).toBe('boolean')
    }
    expect(ARCS.some((a) => a.hot)).toBe(true)
  })
})

describe('sector views', () => {
  it('gives every sector a viewBox at the inset aspect', () => {
    expect(Object.keys(SECTOR_VIEW).sort()).toEqual([...SECTOR_IDS].sort())
    for (const id of SECTOR_IDS) {
      const parts = SECTOR_VIEW[id].split(' ').map(Number)
      expect(parts).toHaveLength(4)
      expect(parts.every((n) => Number.isFinite(n))).toBe(true)
      const [, , w, h] = parts
      expect(w).toBeGreaterThan(0)
      expect(h).toBeGreaterThan(0)
      expect(w / h).toBeCloseTo(2.5, 2)
    }
  })

  it('prints a coordinate stamp for every sector', () => {
    expect(Object.keys(SECTOR_COORD).sort()).toEqual([...SECTOR_IDS].sort())
    for (const id of SECTOR_IDS) {
      expect(SECTOR_COORD[id]).toMatch(/^\d+\.\d{2}[NS] \d+\.\d{2}[EW]$/)
    }
  })
})
