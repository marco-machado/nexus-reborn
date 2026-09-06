// Shared architectural tiles. UVs measure one repeat per six world meters;
// windows and structural bays therefore retain their scale on every building.
import * as THREE from 'three/webgpu'
import { mulberry32 } from '../game/rng'
import {
  AMBER, AMBER_HOT, ARMOR_MID, ART_BG_INSET, BG, BG_PANEL_SOLID,
  GUN_IRON, INK, INK_DIM, INK_FAINT,
} from '../ui/tokens'

export type ArchitectureKind = 'tower' | 'block' | 'slab' | 'industrial' | 'wall'

export interface ArchitectureMaps {
  map: THREE.CanvasTexture
  emissiveMap: THREE.CanvasTexture
  roughnessMap: THREE.CanvasTexture
}

const TILE = 512
const BAY = TILE / 5
const FLOOR = TILE / 2
const SEEDS: Record<ArchitectureKind, number> = {
  tower: 0x1a7e, block: 0xb10c, slab: 0x51ab, industrial: 0x1d057, wall: 0x7a11,
}

function canvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const element = document.createElement('canvas')
  element.width = width
  element.height = height
  const context = element.getContext('2d')
  if (!context) throw new Error('Architectural materials require a 2D canvas')
  return [element, context]
}

function rect(
  context: CanvasRenderingContext2D, color: string,
  x: number, y: number, width: number, height: number, opacity = 1,
): void {
  context.fillStyle = color
  context.globalAlpha = opacity
  context.fillRect(x, y, width, height)
  context.globalAlpha = 1
}

// Roughness is data, painted as neutral white/black, never as palette colors.
function roughness(
  context: CanvasRenderingContext2D, value: number,
  x: number, y: number, width: number, height: number,
): void {
  rect(context, '#ffffff', x, y, width, height)
  rect(context, '#000000', x, y, width, height, 1 - value)
}

function configureTile(image: HTMLCanvasElement, emissive = false): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(image)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.anisotropy = 4
  // As in textures.ts, albedo stays linear for this WebGPU canvas path.
  // Roughness is also linear data; only the light mask uses sRGB decoding.
  if (emissive) texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

export function makeArchitectureMaps(kind: ArchitectureKind): ArchitectureMaps {
  const [albedo, paint] = canvas(TILE, TILE)
  const [emission, light] = canvas(TILE, TILE)
  const [surface, rough] = canvas(TILE, TILE)
  // Each tile owns its RNG; constructing materials cannot advance the mission.
  const random = mulberry32(SEEDS[kind])

  rect(paint, kind === 'tower' ? INK_FAINT : INK_DIM, 0, 0, TILE, TILE)
  rect(paint, '#000000', 0, 0, TILE, TILE, kind === 'tower' ? 0.06 : 0.26)
  rect(light, '#000000', 0, 0, TILE, TILE)
  roughness(rough, kind === 'tower' ? 0.72 : 0.91, 0, 0, TILE, TILE)

  if (kind === 'industrial' || kind === 'wall') {
    // Ribbed sheet metal and shutter profiles use broad highlights backed by
    // dark recesses, so the material still reads after tactical-camera mipmaps.
    const ribWidth = kind === 'wall' ? 32 : 16
    for (let x = 0; x < TILE; x += ribWidth) {
      rect(paint, BG_PANEL_SOLID, x, 0, 3, TILE, 0.55)
      rect(paint, GUN_IRON, x + 3, 0, 3, TILE, 0.34)
    }
    for (const y of [0, 246, 498]) {
      rect(paint, BG_PANEL_SOLID, 0, y, TILE, 14)
      rect(paint, INK_DIM, 0, y, TILE, 3)
    }
    if (kind === 'industrial') {
      // High clerestory glazing; a blank service shutter stays visually solid.
      for (let bay = 0; bay < 5; bay++) {
        const x = bay * BAY + 12
        rect(paint, BG, x - 4, 49, BAY - 16, 81)
        rect(paint, INK_FAINT, x, 53, BAY - 24, 70)
        roughness(rough, 0.34, x, 53, BAY - 24, 70)
        rect(paint, GUN_IRON, x + 5, 58, BAY - 34, 3, 0.46)
        rect(paint, BG_PANEL_SOLID, x + BAY / 2 - 16, 53, 4, 70)
      }
      rect(paint, BG, 62, 266, 287, 218)
      rect(paint, ARMOR_MID[0], 68, 272, 275, 206)
      for (let y = 278; y < 473; y += 14) {
        rect(paint, BG_PANEL_SOLID, 68, y, 275, 4)
        rect(paint, INK_DIM, 68, y + 4, 275, 2, 0.55)
      }
      rect(paint, GUN_IRON, 64, 266, 4, 216, 0.55)
      rect(paint, INK_FAINT, 371, 302, 107, 110)
      for (let y = 310; y < 405; y += 10) {
        rect(paint, BG_PANEL_SOLID, 378, y, 93, 5)
        rect(paint, GUN_IRON, 378, y + 5, 93, 1, 0.48)
      }
      paint.font = 'bold 30px monospace'
      paint.fillStyle = INK
      paint.globalAlpha = 0.62
      paint.fillText('07', 383, 459)
      paint.globalAlpha = 1
      rect(paint, AMBER, 382, 471, 70, 5, 0.54)
    } else {
      // No windows or doorway shapes on low fences or compound walls.
      for (let x = 0; x < TILE; x += 128) {
        rect(paint, BG_PANEL_SOLID, x, 0, 10, TILE)
        rect(paint, INK_DIM, x + 10, 0, 4, TILE)
        rect(paint, AMBER, x + 29, 261, 54, 9, 0.6)
      }
    }
  } else {
    for (let floor = 0; floor < 2; floor++) {
      const y = floor * FLOOR
      const tower = kind === 'tower'
      const slab = kind === 'slab'
      // Wide spandrels and proud sill edges visually ground each floor.
      rect(paint, tower ? ARMOR_MID[0] : INK_FAINT, 0, y, TILE, tower ? 40 : 58)
      rect(paint, BG_PANEL_SOLID, 0, y + (tower ? 33 : 48), TILE, 9)
      rect(paint, GUN_IRON, 0, y + 4, TILE, 3, 0.38)
      for (let bay = 0; bay < 5; bay++) {
        const x = bay * BAY
        const inset = tower ? 12 : slab ? 9 : 18
        const width = BAY - inset * 2
        const top = y + (tower ? 52 : 68)
        const height = tower ? 174 : slab ? 119 : 145
        rect(paint, BG, x + inset - 5, top - 5, width + 10, height + 10)
        rect(paint, ART_BG_INSET, x + inset, top, width, height)
        roughness(rough, tower ? 0.25 : 0.39, x + inset, top, width, height)

        const lit = random() < (tower ? 0.19 : 0.14)
        if (lit) {
          const warm = random() < 0.8 ? AMBER_HOT : INK
          const brightness = 0.38 + random() * 0.29
          rect(paint, warm, x + inset + 3, top + 3, width - 6, height - 6, brightness)
          rect(light, warm, x + inset + 3, top + 3, width - 6, height - 6, brightness * 0.62)
          // Blinds and mullions break the source into small practical lights.
          for (let blind = top + 12; blind < top + height - 6; blind += 27) {
            rect(paint, BG_PANEL_SOLID, x + inset, blind, width, 7, 0.68)
            rect(light, '#000000', x + inset, blind, width, 7)
          }
        } else {
          // Reflected glass stays quiet; the structural frame carries contrast.
          rect(paint, INK_DIM, x + inset + 3, top + 3, width - 6, height * 0.22, 0.25)
          rect(paint, '#ffffff', x + inset + 5, top + 6, width - 10, 2, 0.09)
        }
        const center = x + BAY / 2
        rect(paint, BG_PANEL_SOLID, center - 2, top, 4, height)
        rect(light, '#000000', center - 2, top, 4, height)
        rect(paint, GUN_IRON, x + inset - 4, top + height + 1, width + 8, 4, 0.56)

        if (tower) {
          // Continuous metal fins, aligned across texture repeats.
          rect(paint, BG_PANEL_SOLID, x, y, 9, FLOOR)
          rect(paint, INK_DIM, x + 9, y, 5, FLOOR)
          rect(paint, GUN_IRON, x + 9, y, 2, FLOOR, 0.53)
        } else {
          rect(paint, '#000000', x, y + 58, 4, FLOOR - 58, 0.39)
          rect(paint, INK, x + 4, y + 58, 2, FLOOR - 58, 0.12)
          if (slab) {
            rect(paint, BG_PANEL_SOLID, x + 8, y + 207, BAY - 16, 20)
            for (let vent = x + 12; vent < x + BAY - 12; vent += 9) {
              rect(paint, INK_DIM, vent, y + 210, 3, 14)
            }
          }
        }
      }
      if (slab) {
        rect(paint, BG_PANEL_SOLID, 0, y + 238, TILE, 12)
        rect(paint, GUN_IRON, 0, y + 236, TILE, 3, 0.46)
      }
    }
  }

  // Localized weathering adds concrete grain and rain streaks without noisy
  // silhouette detail or extra textures. This is stable across every mount.
  for (let i = 0; i < 850; i++) {
    const x = random() * TILE
    const y = random() * TILE
    const bright = random() > 0.73
    rect(paint, bright ? INK : '#000000', x, y, 1 + random() * 4, 1 + random() * 2, bright ? 0.12 : 0.07)
  }
  for (let i = 0; i < 22; i++) {
    const x = random() * TILE
    const y = random() * TILE
    rect(paint, BG, x, y, 2 + random() * 5, 20 + random() * 65, 0.1)
  }

  return {
    map: configureTile(albedo),
    emissiveMap: configureTile(emission, true),
    roughnessMap: configureTile(surface),
  }
}

// Shared diegetic sign art; the near-black panel emits negligibly when this
// texture also serves as a light mask. Geometry supplies its frame and depth.
export function makeArchitectureSign(text: string, subtext: string, largeTitle = false): THREE.CanvasTexture {
  const [image, context] = canvas(1024, 256)
  rect(context, BG, 0, 0, 1024, 256)
  rect(context, INK_FAINT, 14, 14, 996, 228)
  rect(context, BG, 18, 18, 988, 220)
  rect(context, AMBER, 40, 47, 10, 156)
  rect(context, AMBER, 974, 47, 10, 156)
  context.textAlign = 'center'
  context.textBaseline = 'alphabetic'
  let size = largeTitle ? 148 : 94
  context.font = `900 ${size}px Arial, sans-serif`
  while (context.measureText(text).width > 850 && size > 30) {
    size -= 2
    context.font = `900 ${size}px Arial, sans-serif`
  }
  context.fillStyle = INK
  context.fillText(text, 512, largeTitle ? 143 : 128)
  rect(context, INK_FAINT, 88, largeTitle ? 166 : 151, 848, 2)
  context.font = 'bold 32px monospace'
  context.fillStyle = AMBER_HOT
  context.fillText(subtext, 512, largeTitle ? 216 : 204, 842)
  const texture = new THREE.CanvasTexture(image)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}
