// Display layout for World Network plate markers. mapPos stays the derived
// city + jitter; this only decides where the pin is drawn and which side the
// label hangs off, so two open contracts do not share a point and a name
// cannot cover a HUD chip or run off the plate.
//
// Sizes are fitted to the 1280×720 plate (~646×336). The chips are a
// conservative cover of ORBITAL SCAN, the focused-sector caption, NETWORK
// THREAT, and the CONTROL KEY. Overlays live on the wrap; chips still
// reserve the corners when the well is exactly the plate aspect.

export type LabelSide = 'below' | 'above' | 'left' | 'right'

export interface PlateMark {
  id: string
  codename: string
  mapPos: { x: number; y: number }
  locked: boolean
  authored: boolean
}

export interface PlateMarkLayout {
  id: string
  pin: { x: number; y: number }
  side: LabelSide
}

interface Rect {
  x: number
  y: number
  w: number
  h: number
}

interface Pt {
  x: number
  y: number
}

const REF_W = 646
const REF_H = 336
const PIN_GAP = 28
const MAX_NUDGE = 64
const LABEL_GAP = 10
const EDGE = 4

const SIDES: LabelSide[] = ['below', 'above', 'right', 'left']

const CHIPS: Rect[] = [
  { x: 0, y: 0, w: 24, h: 14 },
  { x: 32, y: 0, w: 36, h: 10 },
  { x: 0, y: 86, w: 24, h: 14 },
  { x: 68, y: 64, w: 32, h: 36 },
].map(pctRect)

function pctRect(r: Rect): Rect {
  return { x: (r.x / 100) * REF_W, y: (r.y / 100) * REF_H, w: (r.w / 100) * REF_W, h: (r.h / 100) * REF_H }
}

function toPx(p: Pt): Pt {
  return { x: (p.x / 100) * REF_W, y: (p.y / 100) * REF_H }
}

function toPct(p: Pt): Pt {
  return { x: (p.x / REF_W) * 100, y: (p.y / REF_H) * 100 }
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v
}

function overlapArea(a: Rect, b: Rect): number {
  const x = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x))
  const y = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y))
  return x * y
}

function outsideArea(r: Rect): number {
  const ix = Math.max(0, Math.min(r.x + r.w, REF_W - EDGE) - Math.max(r.x, EDGE))
  const iy = Math.max(0, Math.min(r.y + r.h, REF_H - EDGE) - Math.max(r.y, EDGE))
  return r.w * r.h - ix * iy
}

function labelSize(codename: string, locked: boolean): { w: number; h: number } {
  return { w: 12 + (locked ? 12 : 0) + codename.length * 7.2, h: 18 }
}

function labelRect(pin: Pt, side: LabelSide, size: { w: number; h: number }): Rect {
  const { w, h } = size
  if (side === 'below') return { x: pin.x - w / 2, y: pin.y + LABEL_GAP, w, h }
  if (side === 'above') return { x: pin.x - w / 2, y: pin.y - LABEL_GAP - h, w, h }
  if (side === 'right') return { x: pin.x + LABEL_GAP, y: pin.y - h / 2, w, h }
  return { x: pin.x - LABEL_GAP - w, y: pin.y - h / 2, w, h }
}

function pinRect(pin: Pt): Rect {
  return { x: pin.x - 7, y: pin.y - 7, w: 14, h: 14 }
}

function signFrom(id: string): Pt {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 33 + id.charCodeAt(i)) >>> 0
  const ang = (h % 8) * (Math.PI / 4)
  return { x: Math.cos(ang), y: Math.sin(ang) }
}

function nudge(start: Pt, placed: Pt[], id: string): Pt {
  let p = { ...start }
  for (let iter = 0; iter < 8; iter++) {
    let px = 0
    let py = 0
    let hits = 0
    for (const q of placed) {
      const dx = p.x - q.x
      const dy = p.y - q.y
      const d = Math.hypot(dx, dy)
      if (d >= PIN_GAP) continue
      hits++
      const dir = d < 0.5 ? signFrom(id) : { x: dx / d, y: dy / d }
      const need = PIN_GAP - d + 0.5
      px += dir.x * need
      py += dir.y * need
    }
    if (hits === 0) break
    p = { x: p.x + px, y: p.y + py }
  }
  const ox = p.x - start.x
  const oy = p.y - start.y
  const od = Math.hypot(ox, oy)
  if (od > MAX_NUDGE) {
    p = { x: start.x + (ox / od) * MAX_NUDGE, y: start.y + (oy / od) * MAX_NUDGE }
  }
  return {
    x: clamp(p.x, 16, REF_W - 16),
    y: clamp(p.y, 20, REF_H - 20),
  }
}

function scoreLabel(box: Rect, others: Rect[], pins: Rect[]): number {
  let s = outsideArea(box) * 50
  for (const c of CHIPS) s += overlapArea(box, c) * 30
  for (const o of others) s += overlapArea(box, o) * 20
  for (const p of pins) s += overlapArea(box, p) * 10
  return s
}

// Authored contracts stay on the plate even when intel-gated. Generated
// offers only appear once they can be opened, so locked market names do not
// crowd the live job.
export function visiblePlateMarks(marks: readonly PlateMark[]): PlateMark[] {
  return marks.filter((m) => m.authored || !m.locked)
}

export function layoutPlateMarks(marks: readonly PlateMark[]): PlateMarkLayout[] {
  const authored = marks.filter((m) => m.authored)
  const generated = marks.filter((m) => !m.authored)
  const order = [...authored, ...generated]

  const pins = new Map<string, Pt>()
  const placed: Pt[] = []
  for (const m of order) {
    const start = toPx(m.mapPos)
    const pin = m.authored ? start : nudge(start, placed, m.id)
    pins.set(m.id, pin)
    placed.push(pin)
  }

  const pinBoxes = [...pins.values()].map(pinRect)
  const labels = new Map<string, LabelSide>()
  const labelBoxes: Rect[] = []
  for (const m of order) {
    const pin = pins.get(m.id)!
    const size = labelSize(m.codename, m.locked)
    let best: LabelSide = 'below'
    let bestScore = Infinity
    for (let i = 0; i < SIDES.length; i++) {
      const side = SIDES[i]
      const box = labelRect(pin, side, size)
      const s = scoreLabel(box, labelBoxes, pinBoxes) + i
      if (s < bestScore) {
        bestScore = s
        best = side
      }
    }
    labels.set(m.id, best)
    labelBoxes.push(labelRect(pin, best, size))
  }

  return marks.map((m) => ({
    id: m.id,
    pin: toPct(pins.get(m.id)!),
    side: labels.get(m.id)!,
  }))
}
