import { describe, expect, it } from 'vitest'
import { placeGlobeLabels } from './globeLabels'

describe('projected globe labels', () => {
  it('avoids overlapping labels and city pins in dense views', () => {
    const markers = [
      { id: 'contract', x: 200, y: 130, width: 140, height: 32 },
      { id: 'paris', x: 206, y: 148, width: 92, height: 16 },
      { id: 'london', x: 194, y: 121, width: 64, height: 16 },
      { id: 'oslo', x: 220, y: 93, width: 42, height: 16 },
    ]
    const placed = placeGlobeLabels(markers, 420, 280)
    expect(placed.has('contract')).toBe(true)
    const boxes = [...placed.values()]
    const overlap = (a: typeof boxes[number], b: typeof boxes[number]) =>
      a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
    for (let i = 0; i < boxes.length; i++) {
      const box = boxes[i]
      expect(box.x).toBeGreaterThanOrEqual(12)
      expect(box.x + box.width).toBeLessThanOrEqual(408)
      expect(box.y).toBeGreaterThanOrEqual(44)
      expect(box.y + box.height).toBeLessThanOrEqual(226)
      for (const other of boxes.slice(i + 1)) expect(overlap(box, other)).toBe(false)
      for (const pin of markers) expect(overlap(box, { x: pin.x - 9, y: pin.y - 9, width: 18, height: 18 })).toBe(false)
    }
  })

  it('hides a label when no readable placement fits instead of moving its location', () => {
    const marker = { id: 'crowded', x: 40, y: 60, width: 160, height: 30 }
    expect(placeGlobeLabels([marker], 100, 100).size).toBe(0)
    expect(marker).toEqual({ id: 'crowded', x: 40, y: 60, width: 160, height: 30 })
  })
})
