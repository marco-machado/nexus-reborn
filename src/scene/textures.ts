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

  // Road bands, slightly lighter wet asphalt. Widths match the generator:
  // horizontal streets 4 cells, secondary verticals 3, the avenue 5.
  const paintBand = (x0: number, z0: number, x1: number, z1: number): void => {
    ctx.fillStyle = '#374453'
    ctx.fillRect(x0 * s, z0 * s, (x1 - x0) * s, (z1 - z0) * s)
    rCtx.fillStyle = 'rgb(105,105,105)'
    rCtx.fillRect(x0 * s, z0 * s, (x1 - x0) * s, (z1 - z0) * s)
  }
  for (const cz of city.roadsH) paintBand(2, cz - 2, 94, cz + 2)
  for (const cx of city.roadsV) {
    if (cx === 48) paintBand(46, 8, 51, 94)
    else paintBand(cx - 1, city.roadsH.length > 0 ? city.roadsH[0] - 2 : 24, cx + 2, 94)
  }
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

  // Dashed lane markings along road centerlines.
  ctx.strokeStyle = 'rgba(88,96,104,0.4)'
  ctx.lineWidth = 3
  ctx.setLineDash([14, 26])
  ctx.beginPath()
  for (const cz of city.roadsH) {
    ctx.moveTo(2 * s, cz * s)
    ctx.lineTo(94 * s, cz * s)
  }
  for (const cx of city.roadsV) {
    ctx.moveTo((cx + 0.5) * s, 8 * s)
    ctx.lineTo((cx + 0.5) * s, 94 * s)
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

export interface FacadeMaps {
  map: THREE.CanvasTexture
  emissiveMap: THREE.CanvasTexture
}

// Window-grid facade, three variants: 0 dense tower glass, 1 mid-rise, 2 wide
// industrial. The top-left 28x28 px corner stays windowless: box top and
// bottom face UVs are remapped there so roofs render flat and dark.
export function makeFacadeMaps(variant: number): FacadeMaps {
  const w = 256
  const h = 512
  const [canvas, ctx] = makeCanvas(w, h)
  const [eCanvas, eCtx] = makeCanvas(w, h)
  const rnd = prng(0xfacade + variant * 7919)

  const base = variant === 0 ? '#303c4b' : variant === 1 ? '#2e3945' : '#333b45'
  ctx.fillStyle = base
  ctx.fillRect(0, 0, w, h)
  eCtx.fillStyle = '#000000'
  eCtx.fillRect(0, 0, w, h)

  // Faint horizontal floor seams.
  ctx.fillStyle = 'rgba(0,0,0,0.35)'
  const seam = variant === 2 ? 44 : 26
  for (let y = seam; y < h; y += seam) ctx.fillRect(0, y, w, 2)

  const winW = variant === 0 ? 10 : variant === 1 ? 16 : 26
  const winH = variant === 0 ? 13 : variant === 1 ? 12 : 10
  const gapX = variant === 0 ? 7 : variant === 1 ? 9 : 12
  const gapY = variant === 0 ? 9 : variant === 1 ? 12 : 22
  const litChance = variant === 0 ? 0.1 : variant === 1 ? 0.12 : 0.07

  for (let y = 10; y < h - 46; y += winH + gapY) {
    for (let x = 8; x < w - winW - 4; x += winW + gapX) {
      if (x < 30 && y < 30) continue
      const lit = rnd() < litChance
      if (lit) {
        const roll = rnd()
        const col = roll < 0.66 ? '#ffca7a' : roll < 0.88 ? '#9fd8ff' : '#7ef0d4'
        const dim = 0.55 + rnd() * 0.45
        ctx.fillStyle = col
        ctx.globalAlpha = dim
        ctx.fillRect(x, y, winW, winH)
        eCtx.fillStyle = col
        eCtx.globalAlpha = dim
        eCtx.fillRect(x, y, winW, winH)
        ctx.globalAlpha = 1
        eCtx.globalAlpha = 1
      } else {
        ctx.fillStyle = rnd() < 0.7 ? '#1f2833' : '#182028'
        ctx.fillRect(x, y, winW, winH)
      }
    }
  }

  // Dark street-level band.
  ctx.fillStyle = '#1c232d'
  ctx.fillRect(0, h - 42, w, 42)

  // Windowless roof patch, sampled by the remapped top-face UVs.
  ctx.fillStyle = '#28303b'
  ctx.fillRect(0, 0, 28, 28)
  eCtx.fillStyle = '#000000'
  eCtx.fillRect(0, 0, 28, 28)

  const map = new THREE.CanvasTexture(canvas)
  const emissiveMap = new THREE.CanvasTexture(eCanvas)
  emissiveMap.colorSpace = THREE.SRGBColorSpace
  return { map, emissiveMap }
}

// Unit box whose top and bottom faces sample the dark roof patch of the
// facade textures. Face order in BoxGeometry: +x -x +y -y +z -z, 4 uvs each.
export function makeBuildingGeometry(): THREE.BoxGeometry {
  const geom = new THREE.BoxGeometry(1, 1, 1)
  const uv = geom.attributes.uv as THREE.BufferAttribute
  for (let i = 8; i < 16; i++) {
    uv.setXY(i, 0.02 + (i % 2) * 0.06, 0.955 + Math.floor((i % 4) / 2) * 0.03)
  }
  uv.needsUpdate = true
  return geom
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

// White exclamation mark on transparent background, tinted by the material.
export function makeAlertTexture(): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(64, 64)
  ctx.clearRect(0, 0, 64, 64)
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 52px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('!', 32, 34)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}
