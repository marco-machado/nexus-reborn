// Procedural CanvasTexture builders for the city renderer. All colors echo the
// UI palette: near-black ground, teal puddles, warm amber lamps, cool windows.
import * as THREE from 'three/webgpu'
import type { CityData } from '../game/types'

function prng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')
  if (!ctx) throw new Error('2d context unavailable')
  return [c, ctx]
}

export interface GroundMaps {
  map: THREE.CanvasTexture
  roughnessMap: THREE.CanvasTexture
}

// Ground albedo plus a matching roughness map. With the ground plane rotated
// x=-PI/2 and centered at (size/2, 0, size/2), canvas x maps to world x and
// canvas y maps to world z directly (flipY stays true).
export function makeGroundMaps(city: CityData): GroundMaps {
  const px = 2048
  const s = px / city.size
  const [canvas, ctx] = makeCanvas(px, px)
  const [rCanvas, rCtx] = makeCanvas(px, px)
  const rnd = prng(0x5eed)

  ctx.fillStyle = '#242e39'
  ctx.fillRect(0, 0, px, px)
  rCtx.fillStyle = 'rgb(165,165,165)'
  rCtx.fillRect(0, 0, px, px)

  // Walkable cells (alleys, lots) as dark concrete.
  ctx.fillStyle = '#2c3844'
  rCtx.fillStyle = 'rgb(130,130,130)'
  for (let z = 0; z < city.size; z++) {
    for (let x = 0; x < city.size; x++) {
      if (city.walk[z * city.size + x] !== 1) continue
      ctx.fillRect(x * s, z * s, s + 1, s + 1)
      rCtx.fillRect(x * s, z * s, s + 1, s + 1)
    }
  }

  // Road bands, slightly lighter wet asphalt, straight off the generator spans.
  const paintBand = (x0: number, z0: number, x1: number, z1: number): void => {
    ctx.fillStyle = '#374453'
    ctx.fillRect(x0 * s, z0 * s, (x1 - x0) * s, (z1 - z0) * s)
    rCtx.fillStyle = 'rgb(105,105,105)'
    rCtx.fillRect(x0 * s, z0 * s, (x1 - x0) * s, (z1 - z0) * s)
  }
  for (const r of city.roadRects) paintBand(r.x0, r.z0, r.x1, r.z1)
  // Plaza apron around the checkpoint.
  const cp = city.checkpoint
  paintBand(cp.x - 7, cp.z - 6, cp.x + 7, cp.z + 6)

  // Asphalt noise.
  for (let i = 0; i < 5200; i++) {
    const nx = rnd() * px
    const nz = rnd() * px
    const w = 1 + rnd() * 3
    const l = rnd() * 0.12
    ctx.fillStyle = rnd() < 0.5 ? `rgba(255,255,255,${(l * 0.35).toFixed(3)})` : `rgba(0,0,0,${l.toFixed(3)})`
    ctx.fillRect(nx, nz, w, w)
  }

  // Sidewalk edge lines where walkable meets unwalkable.
  ctx.strokeStyle = 'rgba(64,86,102,0.9)'
  ctx.lineWidth = 2
  ctx.beginPath()
  for (let z = 1; z < city.size - 1; z++) {
    for (let x = 1; x < city.size - 1; x++) {
      if (city.walk[z * city.size + x] !== 1) continue
      if (city.walk[z * city.size + x - 1] === 0) {
        ctx.moveTo(x * s, z * s)
        ctx.lineTo(x * s, (z + 1) * s)
      }
      if (city.walk[z * city.size + x + 1] === 0) {
        ctx.moveTo((x + 1) * s, z * s)
        ctx.lineTo((x + 1) * s, (z + 1) * s)
      }
      if (city.walk[(z - 1) * city.size + x] === 0) {
        ctx.moveTo(x * s, z * s)
        ctx.lineTo((x + 1) * s, z * s)
      }
      if (city.walk[(z + 1) * city.size + x] === 0) {
        ctx.moveTo(x * s, (z + 1) * s)
        ctx.lineTo((x + 1) * s, (z + 1) * s)
      }
    }
  }
  ctx.stroke()

  // Dashed lane markings down the middle of every band, along its long axis.
  ctx.strokeStyle = 'rgba(88,96,104,0.4)'
  ctx.lineWidth = 3
  ctx.setLineDash([14, 26])
  ctx.beginPath()
  for (const r of city.roadRects) {
    if (r.x1 - r.x0 >= r.z1 - r.z0) {
      const cz = ((r.z0 + r.z1) / 2) * s
      ctx.moveTo(r.x0 * s, cz)
      ctx.lineTo(r.x1 * s, cz)
    } else {
      const cx = ((r.x0 + r.x1) / 2) * s
      ctx.moveTo(cx, r.z0 * s)
      ctx.lineTo(cx, r.z1 * s)
    }
  }
  ctx.stroke()
  ctx.setLineDash([])

  // Teal-tinted puddles, glossier in the roughness map.
  for (let i = 0; i < 130; i++) {
    const nx = rnd() * px
    const nz = rnd() * px
    const rw = 12 + rnd() * 56
    const rh = rw * (0.35 + rnd() * 0.4)
    const a = 0.16 + rnd() * 0.3
    ctx.fillStyle = `rgba(22,48,58,${a.toFixed(3)})`
    ctx.beginPath()
    ctx.ellipse(nx, nz, rw, rh, rnd() * Math.PI, 0, Math.PI * 2)
    ctx.fill()
    rCtx.fillStyle = 'rgba(18,18,18,0.85)'
    rCtx.beginPath()
    rCtx.ellipse(nx, nz, rw, rh, 0, 0, Math.PI * 2)
    rCtx.fill()
  }

  // Albedo canvases stay in the default linear color space: the r185 WebGPU
  // backend decodes srgb canvas textures twice, crushing mid tones to black.
  const map = new THREE.CanvasTexture(canvas)
  map.anisotropy = 4
  const roughnessMap = new THREE.CanvasTexture(rCanvas)
  roughnessMap.anisotropy = 4
  return { map, roughnessMap }
}

// Soft radial gradient disc for pooled lamp light and similar glows.
export function makeGlowTexture(): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(128, 128)
  const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 62)
  g.addColorStop(0, 'rgba(255,255,255,0.85)')
  g.addColorStop(0.4, 'rgba(255,255,255,0.28)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 128, 128)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

// Squad slot plaque: dark chip with a teal border and slot number, shown
// billboarded above each agent by the unit renderer.
export function makeSlotTexture(slot: number): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(64, 64)
  ctx.clearRect(0, 0, 64, 64)
  ctx.fillStyle = 'rgba(7,16,18,0.9)'
  ctx.strokeStyle = '#7ef0d4'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.roundRect(5, 5, 54, 54, 10)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = '#7ef0d4'
  ctx.font = 'bold 36px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(String(slot), 32, 34)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

// White glyph on transparent background, tinted by the material. '!' marks a
// guard in combat, '?' one that is still working out what it saw.
export function makeAlertTexture(glyph = '!'): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(64, 64)
  ctx.clearRect(0, 0, 64, 64)
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 52px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(glyph, 32, 34)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}
