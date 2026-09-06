import { describe, expect, it } from 'vitest'
import { MISSIONS } from '../game/data'
import type { BuildingData, CityData, DistrictArchetype, RoadRect } from '../game/types'
import { generateCity } from '../world/citygen'
import { AMBER } from '../ui/tokens'
import { architectureFamily, buildArchitectureLayout, streetSide } from './cityArchitecture'
import type { ArchitectureOwner, ArchitecturePart } from './cityArchitecture'

const EPSILON = 1e-8
const TEST_BUILDING: BuildingData = { x: 10, z: 20, w: 12, d: 8, h: 20, kind: 'block', tint: 0.45 }

function fixture(buildings: BuildingData[]): Pick<CityData, 'buildings' | 'roadRects' | 'props' | 'archetype'> {
  return { buildings, roadRects: [], props: [], archetype: 'compound' }
}

function expectInside(part: ArchitecturePart, owner: ArchitectureOwner): void {
  const [minX, minY, minZ, maxX, maxY, maxZ] = owner.bounds
  const label = `${owner.family} owner ${part.owner} ${part.material} ${JSON.stringify(part)}`
  expect([part.x, part.y, part.z, part.w, part.h, part.d].every(Number.isFinite), label).toBe(true)
  expect(Math.min(part.w, part.h, part.d), label).toBeGreaterThan(0)
  expect(part.x - part.w / 2, label).toBeGreaterThanOrEqual(minX - EPSILON)
  expect(part.x + part.w / 2, label).toBeLessThanOrEqual(maxX + EPSILON)
  expect(part.y - part.h / 2, label).toBeGreaterThanOrEqual(minY - EPSILON)
  expect(part.y + part.h / 2, label).toBeLessThanOrEqual(maxY + EPSILON)
  expect(part.z - part.d / 2, label).toBeGreaterThanOrEqual(minZ - EPSILON)
  expect(part.z + part.d / 2, label).toBeLessThanOrEqual(maxZ + EPSILON)
}

function frontCoordinate(part: ArchitecturePart, side: 0 | 1 | 2 | 3): number {
  if (side === 0) return part.z + part.d / 2
  if (side === 1) return part.x + part.w / 2
  if (side === 2) return -part.z + part.d / 2
  return -part.x + part.w / 2
}

function expectSignClear(owner: ArchitectureOwner): void {
  const sign = owner.parts.find((part) => part.material === 'sign')
  if (!sign) return
  const side = sign.side!
  const signPlane = side === 0 ? sign.z : side === 1 ? sign.x : side === 2 ? -sign.z : -sign.x
  const signU = side % 2 === 0 ? sign.x : sign.z
  const signWidth = side % 2 === 0 ? sign.w : sign.d
  const obstructing = owner.parts.filter((part) => {
    if (part.material === 'sign' || frontCoordinate(part, side) <= signPlane + EPSILON) return false
    const u = side % 2 === 0 ? part.x : part.z
    const width = side % 2 === 0 ? part.w : part.d
    return Math.abs(u - signU) < (width + signWidth) / 2 - EPSILON
      && Math.abs(part.y - sign.y) < (part.h + sign.h) / 2 - EPSILON
  })
  expect(obstructing, `${owner.family} side ${side} sign obstruction`).toEqual([])
}

function assertLayout(city: CityData): void {
  const owners = buildArchitectureLayout(city)
  expect(owners.length).toBeGreaterThanOrEqual(city.buildings.length)
  owners.forEach((owner, index) => {
    expect(owner.parts.length).toBeGreaterThan(0)
    if (index < city.buildings.length) {
      const b = city.buildings[index]
      expect(owner.bounds).toEqual([b.x, 0, b.z, b.x + b.w, b.h, b.z + b.d])
      // The full collision footprint remains physically solid at street level,
      // including the surface behind decorative entrance recesses.
      expect(owner.parts.some((p) => p.y - p.h / 2 <= EPSILON
        && Math.abs(p.w - b.w) <= EPSILON && Math.abs(p.d - b.d) <= EPSILON)).toBe(true)
    }
    for (const part of owner.parts) {
      expect(part.owner).toBe(index)
      expectInside(part, owner)
    }
    expectSignClear(owner)
  })
}

describe('building architecture', () => {
  for (const mission of MISSIONS) {
    for (const variant of mission.variants) {
      it(`keeps every part inside its owner for ${mission.codename}, seed ${variant.seed}`, () => {
        assertLayout(generateCity(mission, variant))
      })
    }
  }

  it.each<DistrictArchetype>(['checkpoint', 'compound', 'industrial'])(
    'preserves bounds and ownership across diverse %s seeds', (archetype) => {
      for (const seed of [0, 1, 7, 12345, 0x7fffffff, 0xffffffff]) {
        assertLayout(generateCity(MISSIONS[0], { archetype, seed }))
      }
    },
  )

  it('is repeatable, insensitive to other material/layout creation, and leaves city data intact', () => {
    const city = generateCity(MISSIONS[0])
    const before = structuredClone(city)
    const first = buildArchitectureLayout(city)
    buildArchitectureLayout(generateCity(MISSIONS[2]))
    expect(buildArchitectureLayout(city)).toEqual(first)
    expect(city).toEqual(before)
  })

  it('gives towers successively recessed upper masses with a broad street podium', () => {
    const owner = buildArchitectureLayout(fixture([{ ...TEST_BUILDING, kind: 'tower' }]))[0]
    const masses = owner.parts.filter((part) => part.material === 'facade').sort((a, b) => a.y - b.y)
    expect(masses.length).toBeGreaterThanOrEqual(3)
    for (let index = 1; index < masses.length; index++) {
      expect(masses[index].w).toBeLessThan(masses[index - 1].w)
      expect(masses[index].d).toBeLessThan(masses[index - 1].d)
    }
    expect(masses[0].y - masses[0].h / 2).toBeCloseTo(0)
  })

  it.each([0, 1, 2, 3] as const)('anchors front tower decorations to the podium on side %s', (side) => {
    for (const h of [10, 14, 20]) {
      const b: BuildingData = { ...TEST_BUILDING, kind: 'tower', h, neon: { side, color: AMBER, h: 0.3 } }
      const owner = buildArchitectureLayout(fixture([b]))[0]
      expectSignClear(owner)
      const podium = owner.parts.filter((part) => part.material === 'facade').sort((a, b) => a.y - b.y)[0]
      const podiumTop = podium.y + podium.h / 2
      const boundary = side === 0 ? b.z + b.d : side === 1 ? b.x + b.w : side === 2 ? -b.z : -b.x
      const decorations = owner.parts.filter((part) => part.material !== 'facade' && frontCoordinate(part, side) > boundary - 0.1)
      expect(decorations.length).toBeGreaterThan(0)
      for (const part of decorations) {
        expect(part.y + part.h / 2, `floating ${part.material} on tower side ${side}`).toBeLessThanOrEqual(podiumTop + EPSILON)
      }
    }
  })

  it('distinguishes slab floor ledges and industrial loading/roof equipment from commercial blocks', () => {
    const kinds = ['block', 'slab', 'industrial'] as const
    const [block, slab, industrial] = kinds.map((kind) => buildArchitectureLayout(fixture([{ ...TEST_BUILDING, kind }]))[0])
    const ledges = (owner: ArchitectureOwner): ArchitecturePart[] => owner.parts.filter((part) =>
      part.material === 'trim' && part.w >= TEST_BUILDING.w - EPSILON
      && part.d < 0.5 && part.h < 0.3 && part.y > 3 && part.y < 15)
    expect(ledges(slab).length).toBeGreaterThanOrEqual(3)
    expect(ledges(block)).toHaveLength(0)
    const roofRibs = (owner: ArchitectureOwner): ArchitecturePart[] => owner.parts.filter((part) =>
      part.material === 'metal' && part.w > TEST_BUILDING.w / 2 && part.d < 0.3 && part.y > 19)
    expect(roofRibs(industrial).length).toBeGreaterThanOrEqual(3)
    expect(roofRibs(block)).toHaveLength(0)
    const entrance = (owner: ArchitectureOwner): ArchitecturePart | undefined => owner.parts.find((part) =>
      part.material === 'recess' && part.y < 2 && part.h > 2)
    expect(entrance(industrial)?.w).toBeGreaterThan(entrance(block)!.w)
  })

  it.each([0, 1, 2, 3] as const)('fits entrance, trim, and sign geometry on street side %s', (side) => {
    // Small authored records huts exercise the tighter face bounds.
    const b: BuildingData = { ...TEST_BUILDING, w: 5, d: 3, h: 6, neon: { side, color: AMBER, h: 0.3 } }
    const owner = buildArchitectureLayout(fixture([b]))[0]
    for (const part of owner.parts) expectInside(part, owner)
    const sign = owner.parts.find((part) => part.material === 'sign')!
    expect(sign.side).toBe(side)
    const backing = owner.parts.find((part) => part.material === 'metal' && part.y === sign.y && part.h > sign.h)!
    expect(backing).toBeDefined()
    // Signs remain inside the footprint but must sit in front of their opaque
    // backing. Reversing this order silently erases every building's lettering.
    if (side === 0) expect(sign.z).toBeGreaterThan(backing.z + backing.d / 2)
    if (side === 1) expect(sign.x).toBeGreaterThan(backing.x + backing.w / 2)
    if (side === 2) expect(sign.z).toBeLessThan(backing.z - backing.d / 2)
    if (side === 3) expect(sign.x).toBeLessThan(backing.x - backing.w / 2)
    if (side === 0) expect(sign.z).toBeGreaterThan(b.z + b.d - 0.02)
    if (side === 1) expect(sign.x).toBeGreaterThan(b.x + b.w - 0.02)
    if (side === 2) expect(sign.z).toBeLessThan(b.z + 0.02)
    if (side === 3) expect(sign.x).toBeLessThan(b.x + 0.02)
    const door = owner.parts.find((part) => part.material === 'recess' && part.y < 2 && part.h > 2)!
    const slats = owner.parts.filter((part) => part.material === 'metal' && part.y < 2 && part.h < 0.1)
    expect(slats.length).toBeGreaterThan(0)
    for (const slat of slats) {
      expect(frontCoordinate(slat, side)).toBeGreaterThan(frontCoordinate(door, side) + 0.02)
    }
  })

  it.each([3, 4, 6, 20])('keeps entry parts and central columns below/above the sign on a %sm building', (h) => {
    // Eight meters produces a center bay that previously crossed both the
    // doorway and sign; the short cases expose lintel/sign collisions too.
    const b: BuildingData = { ...TEST_BUILDING, kind: 'industrial', w: 8, h }
    const owner = buildArchitectureLayout(fixture([b]))[0]
    for (const part of owner.parts) expectInside(part, owner)
    const sign = owner.parts.find((part) => part.material === 'sign')!
    const backing = owner.parts.find((part) => part.material === 'metal' && part.y === sign.y && part.h > sign.h)!
    const signBottom = backing.y - backing.h / 2
    const door = owner.parts.find((part) => part.material === 'recess' && part.y < 2)!
    const light = owner.parts.find((part) => part.material === 'signal')!
    const lintel = owner.parts.find((part) => part.material === 'metal' && Math.abs(part.d - 0.32) < EPSILON)!
    expect(door.y + door.h / 2).toBeLessThan(signBottom - 0.04)
    expect(light.y + light.h / 2).toBeLessThan(signBottom - 0.04)
    expect(lintel.y + lintel.h / 2).toBeLessThan(signBottom - 0.04)
    if (h >= 6) expect(door.h).toBe(2.56)
    const centralColumns = owner.parts.filter((part) => part.material === 'trim'
      && Math.abs(part.w - 0.28) < EPSILON && part.d <= 0.2 + EPSILON
      && Math.abs(part.x - sign.x) < sign.w / 2 + part.w / 2)
    if (h >= 6) expect(centralColumns.length).toBeGreaterThan(0)
    for (const column of centralColumns) {
      expect(column.y - column.h / 2).toBeGreaterThan(backing.y + backing.h / 2 + 0.1)
    }
  })

  it.each([0, 1, 2, 3] as const)('keeps lettering unobstructed on narrow and short elevations facing side %s', (side) => {
    for (const h of [3, 4, 6, 20]) {
      for (const [w, d] of [[3, 5], [5, 3]]) {
        const b: BuildingData = { ...TEST_BUILDING, kind: 'industrial', w, d, h, neon: { side, color: AMBER, h: 0.3 } }
        const owner = buildArchitectureLayout(fixture([b]))[0]
        for (const part of owner.parts) expectInside(part, owner)
        expectSignClear(owner)
      }
    }
  })
})

describe('street-facing elevations', () => {
  const cardinalRoads: RoadRect[] = [
    { x0: 0, z0: 31, x1: 35, z1: 36 },
    { x0: 25, z0: 10, x1: 30, z1: 40 },
    { x0: 0, z0: 12, x1: 35, z1: 17 },
    { x0: 2, z0: 10, x1: 7, z1: 40 },
  ]
  it.each([0, 1, 2, 3] as const)('faces the nearest road on side %s', (side) => {
    expect(streetSide(TEST_BUILDING, [cardinalRoads[side]])).toBe(side)
  })

  it('chooses the nearest elevation instead of the first road supplied', () => {
    const distant = { x0: 60, z0: 10, x1: 70, z1: 40 }
    expect(streetSide(TEST_BUILDING, [distant, cardinalRoads[0]])).toBe(0)
  })

  it('uses a stable side for road ties and missing roads', () => {
    expect(streetSide(TEST_BUILDING, [])).toBe(0)
    expect(streetSide(TEST_BUILDING, [cardinalRoads[2], cardinalRoads[3]])).toBe(2)
    expect(streetSide(TEST_BUILDING, [cardinalRoads[3], cardinalRoads[2]])).toBe(2)
  })

  it.each([0, 1, 2, 3] as const)('keeps authored neon on side %s ahead of the road fallback', (side) => {
    const b = { ...TEST_BUILDING, neon: { side, color: AMBER, h: 0.3 } }
    expect(streetSide(b, [cardinalRoads[(side + 2) % 4]])).toBe(side)
  })
})

describe('walls and overhead checkpoint dressing', () => {
  it('recognizes low thin industrial entries without misclassifying actual factories', () => {
    for (const [w, d] of [[1, 20], [20, 1], [0.7, 4]]) {
      expect(architectureFamily({ ...TEST_BUILDING, kind: 'industrial', w, d, h: 3 })).toBe('wall')
    }
    expect(architectureFamily({ ...TEST_BUILDING, kind: 'industrial', w: 3, d: 8, h: 4 })).toBe('industrial')
    expect(architectureFamily({ ...TEST_BUILDING, kind: 'block', w: 1, h: 3 })).toBe('block')
  })

  it('keeps breach openings clear and omits doors, equipment, and signs from wall stubs', () => {
    const walls: BuildingData[] = [
      { x: 10, z: 20, w: 8, d: 1, h: 3, kind: 'industrial', tint: 0.2 },
      { x: 20, z: 20, w: 6, d: 1, h: 3, kind: 'industrial', tint: 0.8 },
    ]
    const owners = buildArchitectureLayout(fixture(walls))
    expect(owners).toHaveLength(2)
    for (const owner of owners) {
      expect(owner.family).toBe('wall')
      for (const part of owner.parts) {
        expect(['facade', 'trim']).toContain(part.material)
        expectInside(part, owner)
        expect(part.x + part.w / 2 <= 18 + EPSILON || part.x - part.w / 2 >= 20 - EPSILON).toBe(true)
      }
    }
  })

  it('spans checkpoint pillars above 4.45m and assigns all overhead parts a separate owner', () => {
    const city = generateCity(MISSIONS[0])
    const owners = buildArchitectureLayout(city)
    const checkpoint = owners.filter((owner) => owner.family === 'checkpoint')
    expect(checkpoint).toHaveLength(1)
    const owner = checkpoint[0]
    expect(owner.parts.some((part) => part.material === 'sign')).toBe(true)
    expect(owner.bounds[1]).toBe(4.45)
    for (const part of owner.parts) {
      expect(part.owner).toBe(city.buildings.length)
      expect(part.y - part.h / 2).toBeGreaterThanOrEqual(4.45)
      expectInside(part, owner)
    }
    const pillars = city.props.filter((prop) => prop.kind === 'pillar')
    expect(owner.bounds[0]).toBeLessThan(Math.min(...pillars.map((p) => p.x)))
    expect(owner.bounds[3]).toBeGreaterThan(Math.max(...pillars.map((p) => p.x)))
  })

  it('adds no elevated structure to other archetypes or incomplete checkpoint pillars', () => {
    for (const mission of MISSIONS.slice(1)) {
      expect(buildArchitectureLayout(generateCity(mission)).some((owner) => owner.family === 'checkpoint')).toBe(false)
    }
    const city = { ...fixture([]), archetype: 'checkpoint' as const }
    expect(buildArchitectureLayout(city)).toHaveLength(0)
    city.props.push({ x: 20, z: 20, kind: 'pillar', rot: 0, blocking: true })
    expect(buildArchitectureLayout(city)).toHaveLength(0)
  })
})
