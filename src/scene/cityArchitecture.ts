// Render-only architecture. Dimensions stay inside the simulation's existing
// building envelopes; these parts never enter the walk grid or pick surface.
import type { BuildingData, CityData, RoadRect } from '../game/types'

export type ArchitectureFamily = BuildingData['kind'] | 'wall' | 'checkpoint'
export type PartMaterial = 'facade' | 'trim' | 'metal' | 'recess' | 'signal' | 'sign'
export interface ArchitecturePart {
  owner: number
  material: PartMaterial
  x: number
  y: number
  z: number
  w: number
  h: number
  d: number
  side?: 0 | 1 | 2 | 3
}
export interface ArchitectureOwner {
  family: ArchitectureFamily
  bounds: [number, number, number, number, number, number]
  parts: ArchitecturePart[]
}

// Side convention matches citygen: +z, +x, -z, -x. Stable ties keep seeds
// repeatable; existing neon already identifies a street-facing elevation.
export function streetSide(b: BuildingData, roads: readonly RoadRect[]): 0 | 1 | 2 | 3 {
  if (b.neon) return b.neon.side
  let best = Infinity
  let side: 0 | 1 | 2 | 3 = 0
  const points = [[b.x + b.w / 2, b.z + b.d], [b.x + b.w, b.z + b.d / 2],
    [b.x + b.w / 2, b.z], [b.x, b.z + b.d / 2]]
  for (let i = 0; i < points.length; i++) {
    const [x, z] = points[i]
    for (const r of roads) {
      const dx = Math.max(r.x0 - x, 0, x - r.x1)
      const dz = Math.max(r.z0 - z, 0, z - r.z1)
      const dist = dx * dx + dz * dz
      if (dist < best) { best = dist; side = i as 0 | 1 | 2 | 3 }
    }
  }
  return side
}

export function architectureFamily(b: BuildingData): ArchitectureFamily {
  return b.kind === 'industrial' && Math.min(b.w, b.d) <= 1 && b.h <= 3 ? 'wall' : b.kind
}

export function buildArchitectureLayout(city: Pick<CityData, 'buildings' | 'roadRects' | 'props' | 'archetype'>): ArchitectureOwner[] {
  const owners = city.buildings.map((b, owner): ArchitectureOwner => {
    const family = architectureFamily(b)
    const parts: ArchitecturePart[] = []
    // Coordinates passed to box are local, measured from the footprint corner.
    const box = (material: PartMaterial, x: number, y: number, z: number, w: number, h: number, d: number): void => {
      parts.push({ owner, material, x: b.x + x, y, z: b.z + z, w, h, d })
    }
    const cx = b.w / 2
    const cz = b.d / 2
    if (family === 'wall') {
      box('facade', cx, b.h / 2, cz, b.w, b.h, b.d)
      box('trim', cx, b.h - 0.1, cz, b.w, 0.2, b.d)
      return { family, bounds: [b.x, 0, b.z, b.x + b.w, b.h, b.z + b.d], parts }
    }

    const roof = b.h - 0.75
    let inset = 0
    box('trim', cx, 0.16, cz, b.w, 0.32, b.d)
    if (family === 'tower') {
      // A broad podium supports two receding masses; the base remains solid
      // across its full collision footprint, including recessed door panels.
      const podium = Math.min(5.8, b.h * 0.3)
      const shoulder = b.h * 0.73
      inset = Math.min(0.8, Math.min(b.w, b.d) * 0.14)
      box('facade', cx, podium / 2, cz, b.w - 0.32, podium, b.d - 0.32)
      box('facade', cx, (podium + shoulder) / 2, cz, b.w - inset, shoulder - podium, b.d - inset)
      box('facade', cx, (shoulder + roof) / 2, cz, b.w - inset * 2, roof - shoulder, b.d - inset * 2)
      box('trim', cx, podium - 0.12, cz, b.w, 0.24, b.d)
      box('trim', cx, shoulder - 0.12, cz, b.w - inset, 0.24, b.d - inset)
    } else {
      box('facade', cx, roof / 2, cz, b.w - 0.32, roof, b.d - 0.32)
    }

    const rw = b.w - inset * 2
    const rd = b.d - inset * 2
    // Recessed dark roof deck and four real parapet edges, all below b.h.
    box('recess', cx, roof + 0.03, cz, rw - 0.3, 0.06, rd - 0.3)
    box('trim', inset + 0.12, roof + 0.24, cz, 0.24, 0.48, rd)
    box('trim', b.w - inset - 0.12, roof + 0.24, cz, 0.24, 0.48, rd)
    box('trim', cx, roof + 0.24, inset + 0.12, rw - 0.48, 0.48, 0.24)
    box('trim', cx, roof + 0.24, b.d - inset - 0.12, rw - 0.48, 0.48, 0.24)

    // Roof machinery sits in the well, never above the original height bound.
    const hvacW = Math.min(1.6, rw * 0.32)
    const hvacD = Math.min(2.4, rd * 0.42)
    const offset = (b.tint - 0.5) * Math.min(1, rw - hvacW - 0.8)
    box('metal', cx + offset, roof + 0.34, cz, hvacW, 0.62, hvacD)
    for (let i = 0; i < 4; i++) {
      box('recess', cx + offset, roof + 0.663, cz - hvacD * 0.3 + i * hvacD * 0.2, hvacW * 0.76, 0.025, 0.11)
    }

    const side = streetSide(b, city.roadRects)
    const faceW = side % 2 === 0 ? b.w : b.d
    const signW = Math.min(faceW - 0.6, family === 'block' ? 4 : 3)
    // A short tower's podium ledge can sit below the usual shopfront sign
    // height; keep the whole backing below that opaque overhang too.
    const signCeiling = family === 'tower' ? Math.min(5.8, b.h * 0.3) - 0.24 : roof
    const signY = Math.min(3.65, roof - 0.5, signCeiling - 0.435 - 0.05)
    // Front-mounted parts attach to the broad tower podium. Its upper masses
    // recede, so continuing these shafts to the roof would leave them floating.
    const facadeHeight = family === 'tower' ? Math.min(5.8, b.h * 0.3) : roof
    // Face-local x/y/depth transformed inward from the selected elevation.
    const face = (material: PartMaterial, u: number, y: number, width: number, height: number, depth: number, sink = 0): void => {
      const v = sink + depth / 2
      if (side === 0) box(material, u, y, b.d - v, width, height, depth)
      else if (side === 1) box(material, b.w - v, y, b.d - u, depth, height, width)
      else if (side === 2) box(material, b.w - u, y, v, width, height, depth)
      else box(material, v, y, u, depth, height, width)
    }
    // Main solid body is recessed only at surface depth; dark panels cannot
    // expose the ground or suggest a shortcut through a blocked building.
    const doorW = Math.min(family === 'industrial' ? 3 : 1.5, faceW - 1)
    // Short service sheds leave less space below the sign frame. Scale the
    // entire entrance together so its lintel/light cannot cover the lettering.
    const entryScale = Math.min(1, (signY - 0.435 - 0.05) / 2.9875)
    const entry = (material: PartMaterial, u: number, y: number, width: number, height: number, depth: number, sink = 0): void => {
      face(material, u, y * entryScale, width, height * entryScale, depth, sink)
    }
    entry('recess', faceW / 2, 1.28, doorW, 2.56, 0.022, 0.1)
    entry('trim', faceW / 2 - doorW / 2 - 0.1, 1.4, 0.2, 2.8, 0.22)
    entry('trim', faceW / 2 + doorW / 2 + 0.1, 1.4, 0.2, 2.8, 0.22)
    entry('metal', faceW / 2, 2.8, doorW + 0.4, 0.22, 0.32)
    entry('signal', faceW / 2, 2.96, Math.min(doorW, 1.8), 0.055, 0.06)
    for (let i = 0; i < (family === 'industrial' ? 6 : 3); i++) {
      entry('metal', faceW / 2, 0.45 + i * 0.32, doorW - 0.18, 0.06, 0.04, 0.07)
    }
    // Structural bays have readable width at the tactical camera distance.
    const bays = Math.max(2, Math.floor(faceW / (family === 'slab' ? 2.5 : 3.4)))
    const entranceHalf = Math.max(doorW + 0.4, signW + 0.12) / 2
    for (let i = 0; i <= bays; i++) {
      const u = 0.15 + (faceW - 0.3) * i / bays
      // Bay rhythm continues above the shopfront, but a central column must
      // never pass in front of the doorway or erase letters on its sign.
      const bottom = Math.abs(u - faceW / 2) < entranceHalf + 0.14 ? signY + 0.6 : 0
      const height = facadeHeight - bottom
      if (height > 0.05) face('trim', u, bottom + height / 2, 0.28, height, 0.2)
    }
    if (family === 'slab') {
      for (let y = 3.1; y < roof; y += 3) face('trim', faceW / 2, y, faceW, 0.18, 0.26)
    }
    // Service conduit and junction housings use a second material, not glow.
    face('metal', faceW - 0.18, facadeHeight * 0.55, 0.12, facadeHeight * 0.8, 0.18)
    const junctionY = Math.min(1.3, signY - 0.435 - 0.05 - 0.35)
    face('metal', faceW - 0.55, junctionY, 0.5, 0.7, 0.24)
    if (family === 'industrial') {
      for (let z = 0.7; z < rd - 0.5; z += 1.1) box('metal', cx, roof + 0.1, inset + z, rw - 0.6, 0.12, 0.12)
    }
    // Leave the lettering in front of its backing while keeping both inside
    // the original footprint. A flush backing would hide the inset plane.
    face('metal', faceW / 2, signY, signW + 0.12, 0.87, 0.18, 0.02)
    const last = parts[parts.length - 1]
    parts.push({ ...last, material: 'sign', w: side % 2 === 0 ? signW : 0.01,
      d: side % 2 === 0 ? 0.01 : signW, h: 0.75, side,
      x: side === 1 ? b.x + b.w - 0.006 : side === 3 ? b.x + 0.006 : last.x,
      z: side === 0 ? b.z + b.d - 0.006 : side === 2 ? b.z + 0.006 : last.z })
    return { family, bounds: [b.x, 0, b.z, b.x + b.w, b.h, b.z + b.d], parts }
  })

  const pillars = city.props.filter((p) => p.kind === 'pillar')
  if (city.archetype === 'checkpoint' && pillars.length >= 2) {
    const x0 = Math.min(pillars[0].x, pillars[1].x) - 0.4
    const x1 = Math.max(pillars[0].x, pillars[1].x) + 0.4
    const z = (pillars[0].z + pillars[1].z) / 2
    const owner = owners.length
    const parts: ArchitecturePart[] = []
    const add = (material: PartMaterial, x: number, y: number, zz: number, w: number, h: number, d: number): void => {
      parts.push({owner, material, x, y, z: zz, w, h, d})
    }
    const x = (x0 + x1) / 2
    const w = x1 - x0
    add('metal', x, 5.25, z, w, 1.5, 0.55)
    add('trim', x, 6.08, z, w, 0.16, 0.65)
    add('trim', x0 + 0.16, 5.3, z, 0.32, 1.6, 0.65)
    add('trim', x1 - 0.16, 5.3, z, 0.32, 1.6, 0.65)
    add('signal', x, 4.55, z + 0.29, w - 0.7, 0.06, 0.06)
    parts.push({owner, material:'sign', x, y:5.36, z:z + 0.281, w:w - 0.7, h:1.15, d:0.01, side:0})
    owners.push({family:'checkpoint', bounds:[x0,4.45,z - 0.34,x1,6.17,z + 0.34], parts})
  }
  return owners
}
